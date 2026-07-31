#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use File::Basename qw(basename);

sub read_cpu {
    open my $fh, '<', '/proc/stat' or die "Cannot read /proc/stat: $!";
    my $line = <$fh> // '';
    close $fh;
    my @v = split /\s+/, $line;
    shift @v if @v && $v[0] eq 'cpu';
    my $idle = ($v[3] // 0) + ($v[4] // 0);
    my $total = 0;
    $total += $_ for @v;
    return ($idle, $total);
}

sub read_memory {
    open my $fh, '<', '/proc/meminfo' or die "Cannot read /proc/meminfo: $!";
    my %m;
    while (my $line = <$fh>) {
        $m{$1} = 0 + $2 if $line =~ /^([A-Za-z_()]+):\s+(\d+)/;
    }
    close $fh;
    my $total = $m{'MemTotal'} // 0;
    my $available = $m{'MemAvailable'} // (($m{'MemFree'} // 0) + ($m{'Buffers'} // 0) + ($m{'Cached'} // 0));
    my $used = $total - $available;
    return ($used > 0 ? $used : 0, $total);
}

sub read_network {
    open my $fh, '<', '/proc/net/dev' or die "Cannot read /proc/net/dev: $!";
    my ($rx, $tx) = (0, 0);
    while (my $line = <$fh>) {
        next unless $line =~ /^\s*([^:]+):\s*(.*)$/;
        my ($iface, $rest) = ($1, $2);
        $iface =~ s/^\s+|\s+$//g;
        next if $iface eq 'lo';
        my @v = split /\s+/, $rest;
        $rx += $v[0] // 0;
        $tx += $v[8] // 0;
    }
    close $fh;
    return ($rx, $tx);
}

sub read_load {
    open my $fh, '<', '/proc/loadavg' or return (0, 0, 0);
    my $line = <$fh> // '';
    close $fh;
    my ($one, $five, $fifteen) = split /\s+/, $line;
    return (0 + ($one // 0), 0 + ($five // 0), 0 + ($fifteen // 0));
}

sub process_running {
    my ($pattern) = @_;
    return system("pgrep -f '$pattern' >/dev/null 2>&1") == 0 ? JSON::PP::true : JSON::PP::false;
}

sub command_count {
    my ($command) = @_;
    my $output = `$command 2>/dev/null`;
    return scalar grep { length $_ } split /\n/, $output;
}

sub docker_details {
    return (0, 0) if system('command -v docker >/dev/null 2>&1') != 0;
    my $running = command_count('docker ps -q');
    my $total = command_count('docker ps -aq');
    return ($running, $total);
}

sub amp_details {
    my @dirs = grep { -d $_ } glob('/home/amp/.ampdata/instances/*');
    my $total = scalar @dirs;
    my $running = 0;

    for my $dir (@dirs) {
        my $name = basename($dir);
        next unless $name =~ /^[A-Za-z0-9_.-]+$/;
        $running++ if system("pgrep -f '(?:^|/)$name(?:/|\\s|$)' >/dev/null 2>&1") == 0;
    }

    return ($running, $total);
}

my ($idle1, $total1) = read_cpu();
my ($rx1, $tx1) = read_network();
my $sample = 0.30;
select undef, undef, undef, $sample;
my ($idle2, $total2) = read_cpu();
my ($rx2, $tx2) = read_network();

my $delta_total = $total2 - $total1;
my $delta_idle = $idle2 - $idle1;
my $cpu = $delta_total > 0 ? 100 * (1 - ($delta_idle / $delta_total)) : 0;
$cpu = 0 if $cpu < 0;
$cpu = 100 if $cpu > 100;

my ($ram_used, $ram_total) = read_memory();
my ($load1, $load5, $load15) = read_load();
my ($docker_running, $docker_total) = docker_details();
my ($amp_running, $amp_total) = amp_details();
my $rx = ($rx2 - $rx1) / 1024 / $sample;
my $tx = ($tx2 - $tx1) / 1024 / $sample;
$rx = 0 if $rx < 0;
$tx = 0 if $tx < 0;

my $payload = {
    cpu_percent => sprintf('%.1f', $cpu) + 0,
    ram_used_gib => sprintf('%.2f', $ram_used / 1048576) + 0,
    ram_total_gib => sprintf('%.2f', $ram_total / 1048576) + 0,
    network_rx_kib_s => sprintf('%.1f', $rx) + 0,
    network_tx_kib_s => sprintf('%.1f', $tx) + 0,
    load_1 => sprintf('%.2f', $load1) + 0,
    load_5 => sprintf('%.2f', $load5) + 0,
    load_15 => sprintf('%.2f', $load15) + 0,
    services => {
        docker => process_running('dockerd'),
        amp => process_running('ampinstmgr|AMP_Linux'),
        minio => process_running('minio'),
        wireguard => (-e '/sys/class/net/wg0' ? JSON::PP::true : JSON::PP::false),
    },
    docker => {
        running => $docker_running,
        total => $docker_total,
    },
    amp => {
        running => $amp_running,
        total => $amp_total,
    },
    timestamp => time,
};

print "Content-Type: application/json\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json($payload);
