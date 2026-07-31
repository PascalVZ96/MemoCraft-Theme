#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;

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
        if ($line =~ /^([A-Za-z_()]+):\s+(\d+)/) {
            $m{$1} = 0 + $2;
        }
    }
    close $fh;
    my $total = $m{'MemTotal'} // 0;
    my $available = $m{'MemAvailable'} // (($m{'MemFree'} // 0) + ($m{'Buffers'} // 0) + ($m{'Cached'} // 0));
    my $used = $total - $available;
    $used = 0 if $used < 0;
    return ($used, $total);
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
    open my $fh, '<', '/proc/loadavg' or die "Cannot read /proc/loadavg: $!";
    my $line = <$fh> // '';
    close $fh;
    my ($one, $five, $fifteen) = split /\s+/, $line;
    return (0 + ($one // 0), 0 + ($five // 0), 0 + ($fifteen // 0));
}

my ($idle1, $total1) = read_cpu();
my ($rx1, $tx1) = read_network();
my $sample_seconds = 0.25;
select undef, undef, undef, $sample_seconds;
my ($idle2, $total2) = read_cpu();
my ($rx2, $tx2) = read_network();

my $delta_total = $total2 - $total1;
my $delta_idle = $idle2 - $idle1;
my $cpu = $delta_total > 0 ? 100 * (1 - ($delta_idle / $delta_total)) : 0;
$cpu = 0 if $cpu < 0;
$cpu = 100 if $cpu > 100;

my ($ram_used_kib, $ram_total_kib) = read_memory();
my ($load1, $load5, $load15) = read_load();
my $rx_kib_s = ($rx2 - $rx1) / 1024 / $sample_seconds;
my $tx_kib_s = ($tx2 - $tx1) / 1024 / $sample_seconds;
$rx_kib_s = 0 if $rx_kib_s < 0;
$tx_kib_s = 0 if $tx_kib_s < 0;

my $payload = {
    cpu_percent => sprintf('%.1f', $cpu) + 0,
    ram_used_gib => sprintf('%.2f', $ram_used_kib / 1048576) + 0,
    ram_total_gib => sprintf('%.2f', $ram_total_kib / 1048576) + 0,
    network_rx_kib_s => sprintf('%.1f', $rx_kib_s) + 0,
    network_tx_kib_s => sprintf('%.1f', $tx_kib_s) + 0,
    load_1 => sprintf('%.2f', $load1) + 0,
    load_5 => sprintf('%.2f', $load5) + 0,
    load_15 => sprintf('%.2f', $load15) + 0,
    timestamp => time,
};

print "Content-Type: application/json\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json($payload);
