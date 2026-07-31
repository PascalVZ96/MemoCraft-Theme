#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use File::Basename qw(basename);

sub slurp_first {
    my ($path) = @_;
    open my $fh, '<', $path or return '';
    my $line = <$fh> // '';
    close $fh;
    return $line;
}

sub cpu_sample {
    my @v = split /\s+/, slurp_first('/proc/stat');
    shift @v if @v && $v[0] eq 'cpu';
    my $idle = ($v[3] // 0) + ($v[4] // 0);
    my $total = 0;
    $total += $_ for @v;
    return ($idle, $total);
}

sub memory_stats {
    open my $fh, '<', '/proc/meminfo' or return (0, 0);
    my %m;
    while (<$fh>) { $m{$1} = 0 + $2 if /^([A-Za-z_()]+):\s+(\d+)/ }
    close $fh;
    my $total = $m{MemTotal} // 0;
    my $available = $m{MemAvailable} // (($m{MemFree}//0)+($m{Buffers}//0)+($m{Cached}//0));
    return ($total > $available ? $total-$available : 0, $total);
}

sub network_sample {
    open my $fh, '<', '/proc/net/dev' or return (0, 0);
    my ($rx,$tx)=(0,0);
    while (<$fh>) {
        next unless /^\s*([^:]+):\s*(.*)$/;
        my ($iface,$rest)=($1,$2); $iface =~ s/^\s+|\s+$//g;
        next if $iface eq 'lo';
        my @v=split /\s+/, $rest;
        $rx += $v[0] // 0; $tx += $v[8] // 0;
    }
    close $fh;
    return ($rx,$tx);
}

sub load_stats {
    my ($one,$five,$fifteen)=split /\s+/, slurp_first('/proc/loadavg');
    return (0+($one//0),0+($five//0),0+($fifteen//0));
}

sub running {
    my ($pattern)=@_;
    return system("pgrep -f '$pattern' >/dev/null 2>&1") == 0 ? JSON::PP::true : JSON::PP::false;
}

sub line_count {
    my ($command)=@_;
    my @lines = grep { /\S/ } `$command 2>/dev/null`;
    return scalar @lines;
}

sub docker_stats {
    return (0,0) if system('command -v docker >/dev/null 2>&1') != 0;
    return (
        line_count('docker ps --format "{{.ID}}"'),
        line_count('docker ps -a --format "{{.ID}}"')
    );
}

sub amp_stats {
    my @dirs = grep {
        -d $_ && basename($_) !~ /^ADS/i
    } glob('/home/amp/.ampdata/instances/*');

    my $total = scalar @dirs;
    return (0, 0) unless $total;

    my $processes = `ps -eo args= 2>/dev/null`;
    my $running = 0;

    for my $dir (@dirs) {
        my $name = basename($dir);
        my $active = index($processes, $dir) >= 0;
        $active ||= $processes =~ /(?:^|[\s\/])\Q$name\E(?:[\s\/]|$)/m;
        $running++ if $active;
    }

    return ($running, $total);
}

sub update_count {
    my $cache = '/tmp/memonetwork-update-count';
    if (-e $cache && time - (stat($cache))[9] < 60) {
        my $value = slurp_first($cache);
        return 0 + $value if $value =~ /^\d+/;
    }
    my $count = line_count("apt list --upgradable 2>/dev/null | tail -n +2");
    if (open my $fh, '>', $cache) { print {$fh} "$count\n"; close $fh; }
    return $count;
}

my ($idle1,$total1)=cpu_sample();
my ($rx1,$tx1)=network_sample();
my $sample=0.30;
select undef,undef,undef,$sample;
my ($idle2,$total2)=cpu_sample();
my ($rx2,$tx2)=network_sample();
my $delta=$total2-$total1;
my $cpu=$delta>0 ? 100*(1-(($idle2-$idle1)/$delta)) : 0;
$cpu=0 if $cpu<0; $cpu=100 if $cpu>100;
my ($ram_used,$ram_total)=memory_stats();
my ($load1,$load5,$load15)=load_stats();
my ($docker_running,$docker_total)=docker_stats();
my ($amp_running,$amp_total)=amp_stats();
my $rx=($rx2-$rx1)/1024/$sample; my $tx=($tx2-$tx1)/1024/$sample;
$rx=0 if $rx<0; $tx=0 if $tx<0;
my $updates = update_count();
my $reboot_required = -e '/var/run/reboot-required' ? JSON::PP::true : JSON::PP::false;

my $payload={
    api_version => 3.4,
    cpu_percent => sprintf('%.1f',$cpu)+0,
    ram_used_gib => sprintf('%.2f',$ram_used/1048576)+0,
    ram_total_gib => sprintf('%.2f',$ram_total/1048576)+0,
    network_rx_kib_s => sprintf('%.1f',$rx)+0,
    network_tx_kib_s => sprintf('%.1f',$tx)+0,
    load_1 => sprintf('%.2f',$load1)+0,
    load_5 => sprintf('%.2f',$load5)+0,
    load_15 => sprintf('%.2f',$load15)+0,
    updates_available => $updates,
    reboot_required => $reboot_required,
    services => {
        docker => running('dockerd'),
        amp => ($amp_total > 0 ? JSON::PP::true : JSON::PP::false),
        minio => running('(?:^|/)minio(?:\s|$)'),
        wireguard => (-e '/sys/class/net/wg0' ? JSON::PP::true : JSON::PP::false),
    },
    docker => { running=>$docker_running, total=>$docker_total },
    amp => { running=>$amp_running, total=>$amp_total },
    timestamp => time,
};

print "Content-Type: application/json\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json($payload);
