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
    chomp $line;
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

sub cpu_cores {
    open my $fh, '<', '/proc/cpuinfo' or return 0;
    my $cores = 0;
    $cores++ while grep { /^processor\s*:/ } <$fh>;
    close $fh;
    return $cores;
}

sub memory_stats {
    open my $fh, '<', '/proc/meminfo' or return (0, 0);
    my %m;
    while (<$fh>) {
        $m{$1} = 0 + $2 if /^([A-Za-z_()]+):\s+(\d+)/;
    }
    close $fh;
    my $total = $m{MemTotal} // 0;
    my $available = $m{MemAvailable} // (($m{MemFree} // 0) + ($m{Buffers} // 0) + ($m{Cached} // 0));
    return ($total > $available ? $total - $available : 0, $total);
}

sub network_sample {
    open my $fh, '<', '/proc/net/dev' or return (0, 0);
    my ($rx, $tx) = (0, 0);
    while (<$fh>) {
        next unless /^\s*([^:]+):\s*(.*)$/;
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

sub load_stats {
    my ($one, $five, $fifteen) = split /\s+/, slurp_first('/proc/loadavg');
    return (0 + ($one // 0), 0 + ($five // 0), 0 + ($fifteen // 0));
}

sub process_list {
    my $output = `ps -eo args= 2>/dev/null`;
    return $output // '';
}

sub running {
    my ($processes, $pattern) = @_;
    return $processes =~ /$pattern/m ? JSON::PP::true : JSON::PP::false;
}

sub line_count {
    my ($command) = @_;
    my @lines = grep { /\S/ } `$command 2>/dev/null`;
    return scalar @lines;
}

sub disk_stats {
    my ($path, $require_exact_mount) = @_;
    return undef unless -d $path;

    my $mount = `findmnt -T '$path' -n -o SOURCE,TARGET,FSTYPE 2>/dev/null`;
    chomp $mount;
    my ($source, $target, $fstype) = split /\s+/, $mount, 3;

    # /mnt/backups must be a real, separate mount. If findmnt resolves it to /
    # then the backup disk is not mounted and we must not report the root SSD
    # a second time as if it were the backup HDD.
    if ($require_exact_mount) {
        return undef unless defined($target) && $target eq $path;
    }

    my $line = `df -Pk '$path' 2>/dev/null | tail -n 1`;
    chomp $line;
    my @v = split /\s+/, $line;
    return undef unless @v >= 6 && $v[1] =~ /^\d+$/;

    my ($total_kib, $used_kib, $available_kib) = @v[1, 2, 3];
    my $percent = $total_kib > 0 ? ($used_kib / $total_kib) * 100 : 0;

    return {
        path => $path,
        device => ($source // $v[0] // ''),
        mountpoint => ($target // $path),
        fstype => ($fstype // ''),
        total_gib => sprintf('%.2f', $total_kib / 1048576) + 0,
        used_gib => sprintf('%.2f', $used_kib / 1048576) + 0,
        available_gib => sprintf('%.2f', $available_kib / 1048576) + 0,
        used_percent => sprintf('%.1f', $percent) + 0,
    };
}

sub docker_stats {
    return (0, 0, []) if system('command -v docker >/dev/null 2>&1') != 0;
    my @items;
    for my $line (`docker ps -a --format '{{.Names}}\t{{.Status}}\t{{.Image}}' 2>/dev/null`) {
        chomp $line;
        my ($name, $status, $image) = split /\t/, $line, 3;
        next unless $name;
        push @items, {
            name => $name,
            status => ($status || ''),
            image => ($image || ''),
            running => (($status || '') =~ /^Up\b/ ? JSON::PP::true : JSON::PP::false),
        };
    }
    my $running = scalar grep { $_->{running} } @items;
    return ($running, scalar(@items), \@items);
}

sub amp_stats {
    my @dirs = grep { -d $_ && basename($_) !~ /^ADS/i } glob('/home/amp/.ampdata/instances/*');
    my $processes = process_list();
    my @items;
    for my $dir (@dirs) {
        my $name = basename($dir);
        my $active = index($processes, $dir) >= 0;
        $active ||= $processes =~ /(?:^|[\s\/])\Q$name\E(?:[\s\/]|$)/m;
        push @items, {
            name => $name,
            running => ($active ? JSON::PP::true : JSON::PP::false),
        };
    }
    my $running = scalar grep { $_->{running} } @items;
    return ($running, scalar(@items), \@items);
}

sub os_name {
    open my $fh, '<', '/etc/os-release' or return '';
    while (<$fh>) {
        if (/^PRETTY_NAME="?(.*?)"?\s*$/) {
            close $fh;
            return $1;
        }
    }
    close $fh;
    return '';
}

sub cpu_name {
    open my $fh, '<', '/proc/cpuinfo' or return '';
    while (<$fh>) {
        if (/^model name\s*:\s*(.+)$/) {
            close $fh;
            return $1;
        }
    }
    close $fh;
    return '';
}

sub temperature {
    for my $file (glob('/sys/class/thermal/thermal_zone*/temp')) {
        my $v = slurp_first($file);
        return sprintf('%.0f', $v / 1000) + 0 if $v =~ /^\d+$/ && $v > 0;
    }
    return undef;
}

sub update_count {
    my $cache = '/tmp/memonetwork-update-count-v2';
    if (-e $cache && time - (stat($cache))[9] < 60) {
        my $value = slurp_first($cache);
        return 0 + $value if $value =~ /^\d+$/;
    }

    my $count = line_count("LC_ALL=C apt-get -s -o Debug::NoLocking=1 upgrade | grep '^Inst '");
    if (open my $fh, '>', $cache) {
        print {$fh} "$count\n";
        close $fh;
    }
    return $count;
}

my ($idle1, $total1) = cpu_sample();
my ($rx1, $tx1) = network_sample();
my $sample = 0.30;
select undef, undef, undef, $sample;
my ($idle2, $total2) = cpu_sample();
my ($rx2, $tx2) = network_sample();

my $delta = $total2 - $total1;
my $cpu = $delta > 0 ? 100 * (1 - (($idle2 - $idle1) / $delta)) : 0;
$cpu = 0 if $cpu < 0;
$cpu = 100 if $cpu > 100;

my ($ram_used, $ram_total) = memory_stats();
my ($load1, $load5, $load15) = load_stats();
my ($docker_running, $docker_total, $docker_items) = docker_stats();
my ($amp_running, $amp_total, $amp_items) = amp_stats();
my $process_list = process_list();
my $rx = ($rx2 - $rx1) / 1024 / $sample;
my $tx = ($tx2 - $tx1) / 1024 / $sample;
$rx = 0 if $rx < 0;
$tx = 0 if $tx < 0;

my $updates = update_count();
my $reboot_required = -e '/var/run/reboot-required' ? JSON::PP::true : JSON::PP::false;
my $uptime_seconds = 0 + (split /\s+/, slurp_first('/proc/uptime'))[0];
my $processes = line_count('ps -e --no-headers');
my $temp = temperature();
my $root_disk = disk_stats('/', 0);
my $backup_disk = disk_stats('/mnt/backups', 1);
my @disks = grep { defined $_ } ($root_disk, $backup_disk);

my $payload = {
    api_version => 3.8,
    cpu_percent => sprintf('%.1f', $cpu) + 0,
    ram_used_gib => sprintf('%.2f', $ram_used / 1048576) + 0,
    ram_total_gib => sprintf('%.2f', $ram_total / 1048576) + 0,
    network_rx_kib_s => sprintf('%.1f', $rx) + 0,
    network_tx_kib_s => sprintf('%.1f', $tx) + 0,
    load_1 => sprintf('%.2f', $load1) + 0,
    load_5 => sprintf('%.2f', $load5) + 0,
    load_15 => sprintf('%.2f', $load15) + 0,
    updates_available => $updates,
    reboot_required => $reboot_required,
    system => {
        hostname => slurp_first('/etc/hostname'),
        os => os_name(),
        kernel => slurp_first('/proc/sys/kernel/osrelease'),
        cpu => cpu_name(),
        cpu_cores => cpu_cores(),
        uptime_seconds => $uptime_seconds,
        processes => $processes,
        temperature_c => defined($temp) ? $temp : JSON::PP::null,
    },
    storage => {
        backup_path => '/mnt/backups',
        backup_mount_ok => (defined($backup_disk) ? JSON::PP::true : JSON::PP::false),
    },
    services => {
        docker => running($process_list, qr/(?:^|\/)dockerd(?:\s|$)/),
        amp => ($amp_total > 0 ? JSON::PP::true : JSON::PP::false),
        minio => running($process_list, qr/(?:^|\/)minio(?:\s|$)/),
        wireguard => (-e '/sys/class/net/wg0' ? JSON::PP::true : JSON::PP::false),
    },
    disks => \@disks,
    docker => {
        running => $docker_running,
        total => $docker_total,
        items => $docker_items,
    },
    amp => {
        running => $amp_running,
        total => $amp_total,
        items => $amp_items,
    },
    timestamp => time,
};

print "Content-Type: application/json\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json($payload);
