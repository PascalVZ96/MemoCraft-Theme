#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use File::Path qw(make_path);

my $STATE_DIR = '/var/lib/memonetwork';
my $CONFIG_FILE = "$STATE_DIR/auto-defense.json";
my $STATE_FILE = "$STATE_DIR/auto-defense-state.json";
my $SCANNER = '/usr/share/webmin/memo-network/security-scan.pl';
my $SERVICE_FILE = '/etc/systemd/system/memonetwork-defense.service';
my $TIMER_FILE = '/etc/systemd/system/memonetwork-defense.timer';
my $THRESHOLD = 5;
my $WINDOW_MINUTES = 10;
my $BLOCK_MINUTES = 60;

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

sub query_value {
    my ($name) = @_;
    my $query = $ENV{'QUERY_STRING'} || '';
    return '' unless $query =~ /(?:^|&)\Q$name\E=([^&]*)(?:&|$)/;
    my $value = $1;
    $value =~ tr/+/ /;
    $value =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
    return $value;
}

sub read_json {
    my ($path, $fallback) = @_;
    return $fallback unless -f $path;
    open my $fh, '<', $path or return $fallback;
    local $/;
    my $raw = <$fh> // '';
    close $fh;
    my $data = eval { decode_json($raw) };
    return $@ ? $fallback : $data;
}

sub write_json {
    my ($path, $data) = @_;
    make_path($STATE_DIR, { mode => 0700 }) unless -d $STATE_DIR;
    my $tmp = "$path.$$";
    open my $fh, '>', $tmp or return 0;
    chmod 0600, $tmp;
    print {$fh} encode_json($data);
    close $fh or return 0;
    return rename($tmp, $path) ? 1 : 0;
}

sub valid_ipv4 {
    my ($ip) = @_;
    return 0 unless defined $ip && $ip =~ /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    return 0 if grep { $_ > 255 } ($1, $2, $3, $4);
    return 1;
}

sub public_ipv4 {
    my ($ip) = @_;
    return 0 unless valid_ipv4($ip);
    my @o = split /\./, $ip;
    return 0 if $o[0] == 0 || $o[0] == 10 || $o[0] == 127;
    return 0 if $o[0] == 169 && $o[1] == 254;
    return 0 if $o[0] == 172 && $o[1] >= 16 && $o[1] <= 31;
    return 0 if $o[0] == 192 && $o[1] == 168;
    return 0 if $o[0] == 100 && $o[1] >= 64 && $o[1] <= 127;
    return 0 if $o[0] >= 224;
    return 1;
}

sub run_quiet {
    my (@cmd) = @_;
    my $pid = fork();
    return 0 unless defined $pid;
    if ($pid == 0) {
        open STDOUT, '>', '/dev/null';
        open STDERR, '>', '/dev/null';
        exec @cmd;
        exit 127;
    }
    waitpid($pid, 0);
    return (($? >> 8) == 0);
}

sub install_timer {
    return 0 unless -x '/bin/systemctl' || -x '/usr/bin/systemctl';
    return 0 unless -x $SCANNER;
    my $service = <<EOF;
[Unit]
Description=MemoNetwork Auto Defense scanner
After=network-online.target

[Service]
Type=oneshot
ExecStart=$SCANNER
EOF
    my $timer = <<'EOF';
[Unit]
Description=MemoNetwork Auto Defense every 5 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
AccuracySec=30s
RandomizedDelaySec=15s
Persistent=false
Unit=memonetwork-defense.service

[Install]
WantedBy=timers.target
EOF
    open my $sf, '>', $SERVICE_FILE or return 0;
    print {$sf} $service;
    close $sf or return 0;
    chmod 0644, $SERVICE_FILE;
    open my $tf, '>', $TIMER_FILE or return 0;
    print {$tf} $timer;
    close $tf or return 0;
    chmod 0644, $TIMER_FILE;
    my $systemctl = -x '/bin/systemctl' ? '/bin/systemctl' : '/usr/bin/systemctl';
    return 0 unless run_quiet($systemctl, 'daemon-reload');
    return run_quiet($systemctl, 'enable', '--now', 'memonetwork-defense.timer');
}

sub stop_timer {
    return 1 unless -f $TIMER_FILE;
    my $systemctl = -x '/bin/systemctl' ? '/bin/systemctl' : -x '/usr/bin/systemctl' ? '/usr/bin/systemctl' : '';
    return 1 unless $systemctl;
    return run_quiet($systemctl, 'disable', '--now', 'memonetwork-defense.timer');
}

sub status_payload {
    my $config = read_json($CONFIG_FILE, {});
    $config = {} unless ref($config) eq 'HASH';
    my $mode = $config->{mode} || 'off';
    $mode = 'off' unless $mode =~ /^(?:off|detect|auto)$/;
    my $state = read_json($STATE_FILE, {});
    $state = {} unless ref($state) eq 'HASH';
    my $now = time;
    my @blocks = grep { ref($_) eq 'HASH' && ($_->{expires_at} || 0) > $now } @{ref($state->{blocks}) eq 'ARRAY' ? $state->{blocks} : []};
    my @events = grep { ref($_) eq 'HASH' } @{ref($state->{events}) eq 'ARRAY' ? $state->{events} : []};
    @events = reverse @events;
    splice(@events, 50) if @events > 50;
    my $detections24h = scalar grep { ($_->{time} || 0) >= $now - 86400 && ($_->{action} || '') =~ /^(?:detected|blocked)$/ } @events;

    my $systemctl = -x '/bin/systemctl' ? '/bin/systemctl' : -x '/usr/bin/systemctl' ? '/usr/bin/systemctl' : '';
    my ($active, $enabled) = (JSON::PP::false, JSON::PP::false);
    if ($systemctl) {
        $active = run_quiet($systemctl, 'is-active', '--quiet', 'memonetwork-defense.timer') ? JSON::PP::true : JSON::PP::false;
        $enabled = run_quiet($systemctl, 'is-enabled', '--quiet', 'memonetwork-defense.timer') ? JSON::PP::true : JSON::PP::false;
    }

    return {
        ok => JSON::PP::true,
        mode => $mode,
        threshold => $THRESHOLD,
        window_minutes => $WINDOW_MINUTES,
        block_minutes => $BLOCK_MINUTES,
        blocks => \@blocks,
        events => \@events,
        detections_24h => $detections24h,
        last_scan => 0 + ($state->{last_scan} || 0),
        last_error => $state->{last_error} || '',
        timer => { active => $active, enabled => $enabled, interval_minutes => 5 },
        engine => {
            journalctl => (-x '/usr/bin/journalctl' || -x '/bin/journalctl') ? JSON::PP::true : JSON::PP::false,
            nft => (-x '/usr/sbin/nft' || -x '/usr/bin/nft') ? JSON::PP::true : JSON::PP::false,
            scanner => -x $SCANNER ? JSON::PP::true : JSON::PP::false,
        },
        allowlist => ref($config->{allowlist}) eq 'ARRAY' ? $config->{allowlist} : [],
        protection => 'ssh_ipv4_bruteforce',
    };
}

my $method = $ENV{'REQUEST_METHOD'} || 'GET';
if ($method eq 'GET') {
    json_reply(status_payload());
}
json_reply({ ok => JSON::PP::false, error => 'Ongeldige beheeractie' }, '403 Forbidden') unless post_allowed();

my $action = query_value('action');
if ($action eq 'mode') {
    my $mode = query_value('mode');
    json_reply({ ok => JSON::PP::false, error => 'Ongeldige beveiligingsmodus' }, '400 Bad Request') unless $mode =~ /^(?:off|detect|auto)$/;
    if ($mode eq 'auto' && !(-x '/usr/sbin/nft' || -x '/usr/bin/nft')) {
        json_reply({ ok => JSON::PP::false, error => 'nft is niet beschikbaar; automatisch blokkeren kan niet worden ingeschakeld' }, '409 Conflict');
    }
    my $config = read_json($CONFIG_FILE, {});
    $config = {} unless ref($config) eq 'HASH';
    $config->{mode} = $mode;
    $config->{threshold} = $THRESHOLD;
    $config->{window_minutes} = $WINDOW_MINUTES;
    $config->{block_minutes} = $BLOCK_MINUTES;
    $config->{allowlist} = [] unless ref($config->{allowlist}) eq 'ARRAY';
    my $remote = $ENV{'REMOTE_ADDR'} || '';
    if ($mode eq 'auto' && public_ipv4($remote) && !grep { $_ eq $remote } @{$config->{allowlist}}) {
        push @{$config->{allowlist}}, $remote;
    }
    write_json($CONFIG_FILE, $config)
        or json_reply({ ok => JSON::PP::false, error => 'Beveiligingsinstellingen konden niet worden opgeslagen' }, '500 Internal Server Error');
    my $timer_ok = $mode eq 'off' ? stop_timer() : install_timer();
    json_reply({ ok => JSON::PP::false, error => 'Systemd-planning kon niet worden aangepast' }, '500 Internal Server Error') unless $timer_ok;
    run_quiet($SCANNER) if $mode ne 'off';
    json_reply(status_payload());
}

if ($action eq 'scan') {
    json_reply({ ok => JSON::PP::false, error => 'Auto Defense scanner ontbreekt' }, '500 Internal Server Error') unless -x $SCANNER;
    json_reply({ ok => JSON::PP::false, error => 'Scan kon niet worden uitgevoerd' }, '500 Internal Server Error') unless run_quiet($SCANNER);
    json_reply(status_payload());
}

if ($action eq 'unblock') {
    my $ip = query_value('ip');
    json_reply({ ok => JSON::PP::false, error => 'Ongeldig IP-adres' }, '400 Bad Request') unless valid_ipv4($ip);
    json_reply({ ok => JSON::PP::false, error => 'IP kon niet worden gedeblokkeerd' }, '500 Internal Server Error') unless run_quiet($SCANNER, '--unblock', $ip);
    json_reply(status_payload());
}

json_reply({ ok => JSON::PP::false, error => 'Onbekende beveiligingsactie' }, '400 Bad Request');
