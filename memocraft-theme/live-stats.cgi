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

sub read_disk {
    open my $fh, '<', '/proc/diskstats' or return (0, 0);
    my ($reads, $writes) = (0, 0);
    while (my $line = <$fh>) {
        my @v = split /\s+/, $line;
        next unless @v >= 14;
        my $name = $v[2] // '';
        next unless $name =~ /^(?:sd[a-z]+|nvme\d+n\d+|vd[a-z]+)$/;
        $reads += $v[5] // 0;
        $writes += $v[9] // 0;
    }
    close $fh;
    return ($reads * 512, $writes * 512);
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

my ($idle1, $total1) = read_cpu();
my ($rx1, $tx1) = read_network();
my ($rd1, $wr1) = read_disk();
my $sample = 0.30;
select undef, undef, undef, $sample;
my ($idle2, $total2) = read_cpu();
my ($rx2, $tx2) = read_network();
my ($rd2, $wr2) = read_disk();

my $delta_total = $total2 - $total1;
my $delta_idle = $idle2 - $idle1;
my $cpu = $delta_total > 0 ? 100 * (1 - ($delta_idle / $delta_total)) : 0;
$cpu = 0 if $cpu < 0;
$cpu = 100 if $cpu > 100;

my ($ram_used, $ram_total) = read_memory();
my ($load1, $load5, $load15) = read_load();
my $rx = ($rx2 - $rx1) / 1024 / $sample;
my $tx = ($tx2 - $tx1) / 1024 / $sample;
my $read_kib = ($rd2 - $rd1) / 1024 / $sample;
my $write_kib = ($wr2 - $wr1) / 1024 / $sample;
$_ = 0 if $_ < 0 for ($rx, $tx, $read_kib, $write_kib);

my $payload = {
    cpu_percent => sprintf('%.1f', $cpu) + 0,
    ram_used_gib => sprintf('%.2f', $ram_used / 1048576) + 0,
    ram_total_gib => sprintf('%.2f', $ram_total / 1048576) + 0,
    network_rx_kib_s => sprintf('%.1f', $rx) + 0,
    network_tx_kib_s => sprintf('%.1f', $tx) + 0,
    disk_read_kib_s => sprintf('%.1f', $read_kib) + 0,
    disk_write_kib_s => sprintf('%.1f', $write_kib) + 0,
    load_1 => sprintf('%.2f', $load1) + 0,
    load_5 => sprintf('%.2f', $load5) + 0,
    load_15 => sprintf('%.2f', $load15) + 0,
    services => {
        docker => process_running('dockerd'),
        amp => process_running('ampinstmgr|AMP_Linux'),
        minio => process_running('minio'),
        wireguard => (-e '/sys/class/net/wg0' ? JSON::PP::true : JSON::PP::false),
    },
    timestamp => time,
};

print "Content-Type: application/json\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json($payload);
