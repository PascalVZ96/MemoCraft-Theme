#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use Fcntl qw(:flock);

my $CACHE_FILE = '/var/tmp/memonetwork-speedtest-v5.json';
my $LOCK_FILE = '/tmp/memonetwork-speedtest-v5.lock';

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

sub read_cache {
    return undef unless -f $CACHE_FILE;
    open my $fh, '<', $CACHE_FILE or return undef;
    local $/;
    my $raw = <$fh> // '';
    close $fh;
    return undef unless $raw =~ /\S/;
    my $data = eval { decode_json($raw) };
    return $@ ? undef : $data;
}

sub write_cache {
    my ($data) = @_;
    my $tmp = "$CACHE_FILE.$$";
    open my $fh, '>', $tmp or return 0;
    print {$fh} encode_json($data);
    close $fh or return 0;
    return rename($tmp, $CACHE_FILE) ? 1 : 0;
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

sub speedtest_cli_result {
    my ($data) = @_;
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
        server => join(' · ', @server_parts),
        provider => text_value($client->{isp}),
        external_ip => text_value($client->{ip}),
        backend => 'speedtest-cli',
        tested_at => time,
    };
}

sub ookla_result {
    my ($data) = @_;
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
        server => join(' · ', @server_parts),
        provider => text_value($data->{isp}),
        external_ip => text_value($interface->{externalIp}),
        backend => 'ookla',
        tested_at => time,
    };
}

my ($backend, $binary) = backend();
my $method = $ENV{'REQUEST_METHOD'} || 'GET';

if ($method eq 'GET') {
    json_reply({
        ok => JSON::PP::true,
        available => ($binary ? JSON::PP::true : JSON::PP::false),
        backend => $backend,
        result => (read_cache() // JSON::PP::null),
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
    ? ($binary, '--json', '--secure')
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

$error = "Speedtest eindigde met foutcode $exit\n" if !$error && $exit != 0;
json_reply({ ok => JSON::PP::false, error => text_value($error) }, '500 Internal Server Error') if $error;

my $raw = eval { decode_json($output) };
json_reply({ ok => JSON::PP::false, error => 'Speedtest-resultaat kon niet worden gelezen' }, '500 Internal Server Error') if $@ || ref($raw) ne 'HASH';

my $result = eval { $backend eq 'speedtest-cli' ? speedtest_cli_result($raw) : ookla_result($raw) };
json_reply({ ok => JSON::PP::false, error => text_value($@ || 'Ongeldig speedtest-resultaat') }, '500 Internal Server Error') if $@ || ref($result) ne 'HASH';

write_cache($result);
json_reply({ ok => JSON::PP::true, available => JSON::PP::true, backend => $backend, result => $result });
