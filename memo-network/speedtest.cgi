#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use Fcntl qw(:flock);

my $CACHE_FILE = '/var/tmp/memonetwork-speedtest-v5.json';
my $HISTORY_FILE = '/var/tmp/memonetwork-speedtest-v5-history.json';
my $LOCK_FILE = '/tmp/memonetwork-speedtest-v5.lock';
my $MAX_HISTORY = 90;
my $PREFERRED_SERVER_ID = '26922';
my $PREFERRED_SERVER_LABEL = 'toob Ltd / London / United Kingdom';

sub json_reply {
    my ($payload, $status) = @_;
    $status ||= '200 OK';
    print "Status: $status\r\n" unless $status eq '200 OK';
    print "Content-Type: application/json; charset=UTF-8\r\n";
    print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
    print "Pragma: no-cache\r\n\r\n";
    print encode_json($payload);
    exit 0;
}

sub post_allowed {
    return (($ENV{'REQUEST_METHOD'} || '') eq 'POST' && ($ENV{'HTTP_X_REQUESTED_WITH'} || '') eq 'MemoNetwork');
}

sub read_json_file {
    my ($path) = @_;
    return undef unless -f $path;
    open my $fh, '<', $path or return undef;
    local $/;
    my $raw = <$fh> // '';
    close $fh;
    return undef unless $raw =~ /\S/;
    my $data = eval { decode_json($raw) };
    return $@ ? undef : $data;
}

sub write_json_file {
    my ($path, $data) = @_;
    my $tmp = "$path.$$";
    open my $fh, '>', $tmp or return 0;
    print {$fh} encode_json($data);
    close $fh or return 0;
    return rename($tmp, $path) ? 1 : 0;
}

sub read_cache {
    my $data = read_json_file($CACHE_FILE);
    return ref($data) eq 'HASH' ? $data : undef;
}

sub write_cache {
    my ($data) = @_;
    return write_json_file($CACHE_FILE, $data);
}

sub valid_history_item {
    my ($item) = @_;
    return 0 unless ref($item) eq 'HASH';
    return 0 unless ($item->{tested_at} || 0) =~ /^\d+$/;
    return 0 unless 0 + ($item->{download_mbps} || 0) > 0;
    return 0 unless 0 + ($item->{upload_mbps} || 0) > 0;
    return 1;
}

sub read_history {
    my $data = read_json_file($HISTORY_FILE);
    my @items = ref($data) eq 'ARRAY' ? grep { valid_history_item($_) } @$data : ();
    @items = sort { ($a->{tested_at} || 0) <=> ($b->{tested_at} || 0) } @items;
    splice(@items, 0, @items - $MAX_HISTORY) if @items > $MAX_HISTORY;
    return @items;
}

sub history_for_response {
    my @items = read_history();
    my $current = read_cache();
    if (valid_history_item($current)) {
        my $stamp = 0 + ($current->{tested_at} || 0);
        push @items, $current unless grep { 0 + ($_->{tested_at} || 0) == $stamp } @items;
    }
    @items = sort { ($a->{tested_at} || 0) <=> ($b->{tested_at} || 0) } @items;
    splice(@items, 0, @items - $MAX_HISTORY) if @items > $MAX_HISTORY;
    return @items;
}

sub append_history {
    my ($result) = @_;
    my @items = read_history();
    my $stamp = 0 + ($result->{tested_at} || 0);
    @items = grep { 0 + ($_->{tested_at} || 0) != $stamp } @items;
    push @items, $result;
    @items = sort { ($a->{tested_at} || 0) <=> ($b->{tested_at} || 0) } @items;
    splice(@items, 0, @items - $MAX_HISTORY) if @items > $MAX_HISTORY;
    write_json_file($HISTORY_FILE, \@items);
    return @items;
}

sub backend {
    return ('speedtest-cli', '/usr/bin/speedtest-cli') if -x '/usr/bin/speedtest-cli';
    return ('speedtest-cli', '/usr/local/bin/speedtest-cli') if -x '/usr/local/bin/speedtest-cli';
    return ('ookla', '/usr/bin/speedtest') if -x '/usr/bin/speedtest';
    return ('ookla', '/usr/local/bin/speedtest') if -x '/usr/local/bin/speedtest';
    return ('', '');
}

sub text_value {
    my ($value) = @_;
    return '' unless defined $value;
    $value = "$value";
    $value =~ s/^\s+|\s+$//g;
    return $value;
}

sub run_capture {
    my ($limit, @command) = @_;
    my $output = '';
    my $pid = open my $fh, '-|', @command;
    return ('', 127) unless defined $pid;
    while (my $line = <$fh>) {
        $output .= $line;
        last if length($output) > $limit;
    }
    close $fh;
    return ($output, $? >> 8);
}

sub scheduler_status {
    my $systemctl = -x '/usr/bin/systemctl' ? '/usr/bin/systemctl' : -x '/bin/systemctl' ? '/bin/systemctl' : '';
    my @unit_paths = (
        '/etc/systemd/system/memonetwork-speedtest.timer',
        '/usr/lib/systemd/system/memonetwork-speedtest.timer',
        '/lib/systemd/system/memonetwork-speedtest.timer',
    );
    my ($unit_path) = grep { -f $_ } @unit_paths;
    my $schedule = '';
    if ($unit_path && open my $fh, '<', $unit_path) {
        while (<$fh>) {
            if (/^\s*OnCalendar\s*=\s*(.+?)\s*$/) {
                $schedule = text_value($1);
                last;
            }
        }
        close $fh;
    }

    return {
        detected => $unit_path ? JSON::PP::true : JSON::PP::false,
        active => JSON::PP::false,
        enabled => JSON::PP::false,
        schedule => $schedule,
        next_run => '',
    } unless $systemctl;

    my ($active_out, $active_exit) = run_capture(2048, $systemctl, 'is-active', 'memonetwork-speedtest.timer');
    my ($enabled_out, $enabled_exit) = run_capture(2048, $systemctl, 'is-enabled', 'memonetwork-speedtest.timer');
    my ($next_out, $next_exit) = run_capture(4096, $systemctl, 'show', 'memonetwork-speedtest.timer', '--property=NextElapseUSecRealtime', '--value');
    my $detected = $unit_path || $active_exit == 0 || $enabled_exit == 0;

    return {
        detected => $detected ? JSON::PP::true : JSON::PP::false,
        active => $active_exit == 0 && text_value($active_out) eq 'active' ? JSON::PP::true : JSON::PP::false,
        enabled => $enabled_exit == 0 && text_value($enabled_out) eq 'enabled' ? JSON::PP::true : JSON::PP::false,
        schedule => $schedule,
        next_run => $next_exit == 0 ? text_value($next_out) : '',
    };
}

sub speedtest_cli_result {
    my ($data, $source) = @_;
    die "Ongeldig speedtest-cli resultaat\n" unless ref($data) eq 'HASH';
    my $download = 0 + ($data->{download} || 0);
    my $upload = 0 + ($data->{upload} || 0);
    my $ping = 0 + ($data->{ping} || 0);
    die "Speedtest gaf geen geldige snelheden terug\n" if $download <= 0 || $upload <= 0;

    my $server = ref($data->{server}) eq 'HASH' ? $data->{server} : {};
    my $client = ref($data->{client}) eq 'HASH' ? $data->{client} : {};
    my @server_parts = grep { length($_) } map { text_value($_) } ($server->{sponsor}, $server->{name}, $server->{country});

    return {
        download_mbps => sprintf('%.2f', $download / 1_000_000) + 0,
        upload_mbps => sprintf('%.2f', $upload / 1_000_000) + 0,
        ping_ms => sprintf('%.2f', $ping) + 0,
        server => join(' / ', @server_parts),
        provider => text_value($client->{isp}),
        external_ip => text_value($client->{ip}),
        backend => 'speedtest-cli',
        source => $source,
        tested_at => time,
    };
}

sub ookla_result {
    my ($data, $source) = @_;
    die "Ongeldig Ookla speedtest resultaat\n" unless ref($data) eq 'HASH';
    my $download = ref($data->{download}) eq 'HASH' ? 0 + ($data->{download}->{bandwidth} || 0) : 0;
    my $upload = ref($data->{upload}) eq 'HASH' ? 0 + ($data->{upload}->{bandwidth} || 0) : 0;
    my $ping = ref($data->{ping}) eq 'HASH' ? 0 + ($data->{ping}->{latency} || 0) : 0;
    die "Speedtest gaf geen geldige snelheden terug\n" if $download <= 0 || $upload <= 0;

    my $server = ref($data->{server}) eq 'HASH' ? $data->{server} : {};
    my $interface = ref($data->{interface}) eq 'HASH' ? $data->{interface} : {};
    my @server_parts = grep { length($_) } map { text_value($_) } ($server->{name}, $server->{location}, $server->{country});

    return {
        download_mbps => sprintf('%.2f', ($download * 8) / 1_000_000) + 0,
        upload_mbps => sprintf('%.2f', ($upload * 8) / 1_000_000) + 0,
        ping_ms => sprintf('%.2f', $ping) + 0,
        server => join(' / ', @server_parts),
        provider => text_value($data->{isp}),
        external_ip => text_value($interface->{externalIp}),
        backend => 'ookla',
        source => $source,
        tested_at => time,
    };
}

sub server_preference {
    return {
        id => $PREFERRED_SERVER_ID,
        label => $PREFERRED_SERVER_LABEL,
        fallback => JSON::PP::false,
    };
}

my ($backend, $binary) = backend();
my $method = $ENV{'REQUEST_METHOD'} || 'GET';

if ($method eq 'GET') {
    my @history = history_for_response();
    json_reply({
        ok => JSON::PP::true,
        available => ($binary ? JSON::PP::true : JSON::PP::false),
        backend => $backend,
        result => (read_cache() // JSON::PP::null),
        history => \@history,
        history_limit => $MAX_HISTORY,
        scheduler => scheduler_status(),
        server_preference => server_preference(),
        install_command => 'sudo apt install speedtest-cli -y',
    });
}

json_reply({ ok => JSON::PP::false, error => 'Ongeldige speedtest-aanvraag' }, '403 Forbidden') unless post_allowed();
json_reply({
    ok => JSON::PP::false,
    error => 'Geen speedtest-client gevonden. Installeer speedtest-cli en probeer opnieuw.',
    install_command => 'sudo apt install speedtest-cli -y',
}, '503 Service Unavailable') unless $binary;

open my $lock, '>', $LOCK_FILE or json_reply({ ok => JSON::PP::false, error => 'Speedtest-lock kon niet worden geopend' }, '500 Internal Server Error');
json_reply({ ok => JSON::PP::false, error => 'Er draait al een speedtest' }, '409 Conflict') unless flock($lock, LOCK_EX | LOCK_NB);

my @command = $backend eq 'speedtest-cli'
    ? ($binary, '--server', $PREFERRED_SERVER_ID, '--json')
    : ($binary, '--accept-license', '--accept-gdpr', '-f', 'json');

my ($output, $exit, $pid) = ('', 1, undef);
my $error = '';
{
    local $SIG{ALRM} = sub { die "Speedtest duurde langer dan 90 seconden\n" };
    eval {
        alarm 90;
        $pid = open my $fh, '-|', @command;
        die "Speedtest kon niet worden gestart\n" unless defined $pid;
        while (my $line = <$fh>) {
            $output .= $line;
            die "Speedtest-uitvoer is onverwacht groot\n" if length($output) > 1_048_576;
        }
        close $fh;
        $exit = $? >> 8;
        alarm 0;
    };
    if ($@) {
        $error = $@;
        alarm 0;
        kill 'TERM', $pid if defined($pid) && $pid > 0;
    }
}

if (!$error && $exit != 0) {
    $error = $backend eq 'speedtest-cli'
        ? "Vaste speedtestserver $PREFERRED_SERVER_ID kon niet worden gebruikt (foutcode $exit)\n"
        : "Speedtest eindigde met foutcode $exit\n";
}
json_reply({ ok => JSON::PP::false, error => text_value($error) }, '500 Internal Server Error') if $error;

my $raw = eval { decode_json($output) };
json_reply({ ok => JSON::PP::false, error => 'Speedtest-resultaat kon niet worden gelezen' }, '500 Internal Server Error') if $@ || ref($raw) ne 'HASH';

if ($backend eq 'speedtest-cli') {
    my $server = ref($raw->{server}) eq 'HASH' ? $raw->{server} : {};
    my $actual_server_id = text_value($server->{id});
    json_reply({
        ok => JSON::PP::false,
        error => "Speedtest gebruikte onverwacht server $actual_server_id in plaats van vaste server $PREFERRED_SERVER_ID",
    }, '500 Internal Server Error') unless $actual_server_id eq $PREFERRED_SERVER_ID;
}

my $source = ($ENV{'QUERY_STRING'} || '') =~ /(?:^|&)_=/ ? 'manual' : 'scheduled';
my $result = eval { $backend eq 'speedtest-cli' ? speedtest_cli_result($raw, $source) : ookla_result($raw, $source) };
json_reply({ ok => JSON::PP::false, error => text_value($@ || 'Ongeldig speedtest-resultaat') }, '500 Internal Server Error') if $@ || ref($result) ne 'HASH';
$result->{server_mode} = $backend eq 'speedtest-cli' ? 'preferred' : 'automatic';
$result->{preferred_server_id} = $PREFERRED_SERVER_ID if $backend eq 'speedtest-cli';

write_cache($result);
my @history = append_history($result);
json_reply({
    ok => JSON::PP::true,
    available => JSON::PP::true,
    backend => $backend,
    result => $result,
    history => \@history,
    history_limit => $MAX_HISTORY,
    scheduler => scheduler_status(),
    server_preference => server_preference(),
});
