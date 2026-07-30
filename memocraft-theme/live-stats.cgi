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

my ($idle1, $total1) = read_cpu();
select undef, undef, undef, 0.20;
my ($idle2, $total2) = read_cpu();
my $delta_total = $total2 - $total1;
my $delta_idle = $idle2 - $idle1;
my $cpu = $delta_total > 0 ? 100 * (1 - ($delta_idle / $delta_total)) : 0;
$cpu = 0 if $cpu < 0;
$cpu = 100 if $cpu > 100;

my ($ram_used_kib, $ram_total_kib) = read_memory();
my $payload = {
    cpu_percent => sprintf('%.1f', $cpu) + 0,
    ram_used_gib => sprintf('%.2f', $ram_used_kib / 1048576) + 0,
    ram_total_gib => sprintf('%.2f', $ram_total_kib / 1048576) + 0,
    timestamp => time,
};

print "Content-Type: application/json\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json($payload);
