#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;

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
    my $running=line_count('docker ps --format "{{.ID}}"');
    my $total=line_count('docker ps -a --format "{{.ID}}"');
    return ($running,$total);
}

sub amp_stats {
    my $output = `sudo -n -u amp -H ampinstmgr -t 2>/dev/null`;
    $output = `su -s /bin/sh amp -c 'ampinstmgr -t' 2>/dev/null` unless $output =~ /Instance Name/;

    if ($output =~ /Instance Name/) {
        my ($running,$total)=(0,0);
        for my $line (split /\n/, $output) {
            next if $line =~ /Instance Name|^[\s─━═-]+$/;
            next unless $line =~ /[│|]/;

            my @columns = split /\s*[│|]\s*/, $line;
            next unless @columns >= 6;
            my $name = $columns[0] // '';
            $name =~ s/^\s+|\s+$//g;
            next unless length $name;

            my $up = $columns[-1] // '';
            $up =~ s/^\s+|\s+$//g;
            $total++;
            $running++ if $up =~ /^(?:✓|✔|Yes|Running|Up)$/i;
        }
        return ($running,$total) if $total;
    }

    my @dirs=grep {-d $_} glob('/home/amp/.ampdata/instances/*');
    my $total=scalar @dirs;
    return (0,$total);
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

my $payload={
    api_version => 3,
    cpu_percent => sprintf('%.1f',$cpu)+0,
    ram_used_gib => sprintf('%.2f',$ram_used/1048576)+0,
    ram_total_gib => sprintf('%.2f',$ram_total/1048576)+0,
    network_rx_kib_s => sprintf('%.1f',$rx)+0,
    network_tx_kib_s => sprintf('%.1f',$tx)+0,
    load_1 => sprintf('%.2f',$load1)+0,
    load_5 => sprintf('%.2f',$load5)+0,
    load_15 => sprintf('%.2f',$load15)+0,
    services => {
        docker => running('dockerd'),
        amp => running('ampinstmgr|AMP_Linux'),
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
