#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use Fcntl qw(:flock);
use File::Path qw(make_path);
use File::Temp qw(tempfile);

my $STATE_DIR = '/var/lib/memonetwork';
my $CONFIG_FILE = "$STATE_DIR/auto-defense.json";
my $STATE_FILE = "$STATE_DIR/auto-defense-state.json";
my $LOCK_FILE = '/run/lock/memonetwork-auto-defense.lock';
my $THRESHOLD = 5;
my $WINDOW_SECONDS = 600;
my $BLOCK_SECONDS = 3600;
my $MAX_EVENTS = 200;

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
    my @o = ($1, $2, $3, $4);
    return 0 if grep { $_ > 255 } @o;
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
    return 0 if $o[0] == 198 && ($o[1] == 18 || $o[1] == 19);
    return 0 if $o[0] == 192 && $o[1] == 0 && $o[2] == 2;
    return 0 if $o[0] == 198 && $o[1] == 51 && $o[2] == 100;
    return 0 if $o[0] == 203 && $o[1] == 0 && $o[2] == 113;
    return 1;
}

sub run_ok {
    my (@cmd) = @_;
    system(@cmd);
    return (($? >> 8) == 0);
}

sub nft_file {
    my ($content) = @_;
    my $nft = -x '/usr/sbin/nft' ? '/usr/sbin/nft' : -x '/usr/bin/nft' ? '/usr/bin/nft' : '';
    return 0 unless $nft;
    my ($fh, $path) = tempfile('memonetwork-defense-XXXX', DIR => '/tmp', UNLINK => 1);
    print {$fh} $content;
    close $fh;
    return run_ok($nft, '-f', $path);
}

sub ensure_nft_table {
    my $nft = -x '/usr/sbin/nft' ? '/usr/sbin/nft' : -x '/usr/bin/nft' ? '/usr/bin/nft' : '';
    return 0 unless $nft;
    system($nft, 'list', 'table', 'inet', 'memonetwork_defense');
    return 1 if (($? >> 8) == 0);
    my $rules = <<'NFT';
table inet memonetwork_defense {
  set blocked4 {
    type ipv4_addr
    flags timeout
  }
  chain input {
    type filter hook input priority -10; policy accept;
    ip saddr @blocked4 drop
  }
}
NFT
    return nft_file($rules);
}

sub block_ip {
    my ($ip) = @_;
    return 0 unless public_ipv4($ip) && ensure_nft_table();
    return nft_file("add element inet memonetwork_defense blocked4 { $ip timeout ${BLOCK_SECONDS}s }\n");
}

sub unblock_ip {
    my ($ip) = @_;
    return 0 unless valid_ipv4($ip);
    my $nft = -x '/usr/sbin/nft' ? '/usr/sbin/nft' : -x '/usr/bin/nft' ? '/usr/bin/nft' : '';
    return 0 unless $nft;
    system($nft, 'list', 'table', 'inet', 'memonetwork_defense');
    return 1 if (($? >> 8) != 0);
    return nft_file("delete element inet memonetwork_defense blocked4 { $ip }\n");
}

sub add_event {
    my ($state, $event) = @_;
    $state->{events} = [] unless ref($state->{events}) eq 'ARRAY';
    push @{$state->{events}}, $event;
    splice(@{$state->{events}}, 0, @{$state->{events}} - $MAX_EVENTS) if @{$state->{events}} > $MAX_EVENTS;
}

sub recently_recorded {
    my ($state, $ip, $action) = @_;
    my $cutoff = time - $WINDOW_SECONDS;
    for my $event (reverse @{ref($state->{events}) eq 'ARRAY' ? $state->{events} : []}) {
        last if ($event->{time} || 0) < $cutoff;
        return 1 if (($event->{ip} || '') eq $ip && ($event->{action} || '') eq $action);
    }
    return 0;
}

make_path('/run/lock') unless -d '/run/lock';
open my $lock, '>', $LOCK_FILE or exit 1;
exit 0 unless flock($lock, LOCK_EX | LOCK_NB);

my $config = read_json($CONFIG_FILE, {});
my $mode = $config->{mode} || 'off';
$mode = 'off' unless $mode =~ /^(?:off|detect|auto)$/;
my %allow = map { $_ => 1 } grep { valid_ipv4($_) } @{ref($config->{allowlist}) eq 'ARRAY' ? $config->{allowlist} : []};

my $state = read_json($STATE_FILE, {});
$state = {} unless ref($state) eq 'HASH';
$state->{blocks} = [] unless ref($state->{blocks}) eq 'ARRAY';
$state->{events} = [] unless ref($state->{events}) eq 'ARRAY';
my $now = time;
$state->{blocks} = [grep { ($_->{expires_at} || 0) > $now } @{$state->{blocks}}];

if (@ARGV >= 2 && $ARGV[0] eq '--unblock') {
    my $ip = $ARGV[1];
    exit 2 unless valid_ipv4($ip);
    my $ok = unblock_ip($ip);
    $state->{blocks} = [grep { ($_->{ip} || '') ne $ip } @{$state->{blocks}}];
    add_event($state, { time => $now, action => 'unblocked', ip => $ip, attempts => 0, reason => 'manual' });
    write_json($STATE_FILE, $state);
    exit($ok ? 0 : 3);
}

if ($mode eq 'off') {
    $state->{last_scan} = $now;
    $state->{last_mode} = $mode;
    write_json($STATE_FILE, $state);
    exit 0;
}

my $journalctl = -x '/usr/bin/journalctl' ? '/usr/bin/journalctl' : -x '/bin/journalctl' ? '/bin/journalctl' : '';
unless ($journalctl) {
    $state->{last_scan} = $now;
    $state->{last_mode} = $mode;
    $state->{last_error} = 'journalctl not found';
    write_json($STATE_FILE, $state);
    exit 4;
}

my @cmd = ($journalctl, '--no-pager', '--output=json', '--since', '10 minutes ago', '--lines=1500');
my $pid = open my $fh, '-|', @cmd;
unless (defined $pid) {
    $state->{last_error} = 'journalctl could not start';
    write_json($STATE_FILE, $state);
    exit 5;
}

my %count;
while (my $line = <$fh>) {
    next unless $line =~ /\S/;
    my $row = eval { decode_json($line) };
    next if $@ || ref($row) ne 'HASH';
    my $message = defined $row->{MESSAGE} ? "$row->{MESSAGE}" : '';
    my $source = lc(($row->{_SYSTEMD_UNIT} || '') . ' ' . ($row->{SYSLOG_IDENTIFIER} || '') . ' ' . ($row->{_COMM} || ''));
    next unless $source =~ /(?:ssh|sshd|pam)/ || $message =~ /(?:Failed password|Invalid user|authentication failure)/i;

    my $ip = '';
    if ($message =~ /Failed password for(?: invalid user)? .*? from (\d{1,3}(?:\.\d{1,3}){3})/i) { $ip = $1; }
    elsif ($message =~ /Invalid user .*? from (\d{1,3}(?:\.\d{1,3}){3})/i) { $ip = $1; }
    elsif ($message =~ /authentication failure;.*?rhost=(\d{1,3}(?:\.\d{1,3}){3})/i) { $ip = $1; }
    elsif ($message =~ /rhost=(\d{1,3}(?:\.\d{1,3}){3}).*authentication failure/i) { $ip = $1; }
    next unless public_ipv4($ip) && !$allow{$ip};
    $count{$ip}++;
}
close $fh;

my @detections;
for my $ip (sort keys %count) {
    my $attempts = $count{$ip};
    next if $attempts < $THRESHOLD;
    push @detections, { ip => $ip, attempts => $attempts };

    if ($mode eq 'detect') {
        unless (recently_recorded($state, $ip, 'detected')) {
            add_event($state, { time => $now, action => 'detected', ip => $ip, attempts => $attempts, reason => 'ssh_bruteforce' });
        }
        next;
    }

    my ($existing) = grep { ($_->{ip} || '') eq $ip && ($_->{expires_at} || 0) > $now } @{$state->{blocks}};
    next if $existing;

    if (block_ip($ip)) {
        push @{$state->{blocks}}, {
            ip => $ip,
            blocked_at => $now,
            expires_at => $now + $BLOCK_SECONDS,
            attempts => $attempts,
            reason => 'ssh_bruteforce',
        };
        add_event($state, { time => $now, action => 'blocked', ip => $ip, attempts => $attempts, reason => 'ssh_bruteforce' });
    } else {
        add_event($state, { time => $now, action => 'block_failed', ip => $ip, attempts => $attempts, reason => 'nft_error' });
    }
}

$state->{last_scan} = $now;
$state->{last_mode} = $mode;
$state->{last_error} = '';
$state->{last_detections} = \@detections;
write_json($STATE_FILE, $state);
exit 0;
