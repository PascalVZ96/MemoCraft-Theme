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
    while (<$fh>) {
        $cores++ if /^processor\s*:/;
    }
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
    return undef if $require_exact_mount && (!defined($target) || $target ne $path);

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
    return (0, 0, [], undef) if system('command -v docker >/dev/null 2>&1') != 0;
    my @items;
    my $minio_container;
    for my $line (`docker ps -a --format '{{.ID}}\t{{.Names}}\t{{.Image}}\t{{.State}}\t{{.Status}}\t{{.Ports}}' 2>/dev/null`) {
        chomp $line;
        my ($id, $name, $image, $state, $status, $ports) = split /\t/, $line, 6;
        next unless $name;
        my $is_running = (($state || '') eq 'running' || ($status || '') =~ /^Up\b/) ? 1 : 0;
        my $is_minio = (($name || '') =~ /minio/i || ($image || '') =~ /minio/i) ? 1 : 0;
        $minio_container = $name if $is_minio && !defined $minio_container;
        push @items, {
            id => ($id || ''),
            name => $name,
            image => ($image || ''),
            state => ($state || ''),
            status => ($status || ''),
            ports => ($ports || ''),
            running => ($is_running ? JSON::PP::true : JSON::PP::false),
            minio => ($is_minio ? JSON::PP::true : JSON::PP::false),
        };
    }
    my $running = scalar grep { $_->{running} } @items;
    return ($running, scalar(@items), \@items, $minio_container);
}

sub config_value {
    my ($dir, @keys) = @_;
    for my $file ("$dir/AMPConfig.conf", "$dir/AMPConfig.json", "$dir/AMPConfig.kvp") {
        next unless -f $file;
        open my $fh, '<', $file or next;
        while (my $line = <$fh>) {
            for my $key (@keys) {
                if ($line =~ /^\s*\Q$key\E\s*(?:=|:)\s*[\"']?([^\"',\r\n]+)[\"']?/) {
                    my $value = $1;
                    $value =~ s/^\s+|\s+$//g;
                    close $fh;
                    return $value;
                }
            }
        }
        close $fh;
    }
    return '';
}

sub amp_stats {
    my @dirs = grep { -d $_ && basename($_) !~ /^ADS/i } glob('/home/amp/.ampdata/instances/*');
    my $processes = process_list();
    my @items;
    for my $dir (@dirs) {
        my $name = basename($dir);
        my $active = index($processes, $dir) >= 0;
        $active ||= $processes =~ /(?:^|[\s\/])\Q$name\E(?:[\s\/]|$)/m;
        my $module = config_value($dir, 'Module', 'ModuleName', 'Application.Module');
        my $port = config_value($dir, 'Webserver.Port', 'WebserverPort', 'Port');
        $port = '' unless $port =~ /^\d{1,5}$/;
        push @items, {
            name => $name,
            path => $dir,
            module => $module,
            port => $port,
            running => ($active ? JSON::PP::true : JSON::PP::false),
        };
    }
    my $running = scalar grep { $_->{running} } @items;
    return ($running, scalar(@items), \@items);
}

sub wireguard_stats {
    return {
        interface => 'wg0',
        available => JSON::PP::false,
        peers => 0,
        latest_handshake_age_seconds => JSON::PP::null,
        items => [],
    } unless -e '/sys/class/net/wg0';

    my @items;
    my $latest = 0;
    if (system('command -v wg >/dev/null 2>&1') == 0) {
        my @lines = `wg show wg0 dump 2>/dev/null`;
        shift @lines if @lines;
        for my $line (@lines) {
            chomp $line;
            my ($public_key, undef, $endpoint, $allowed_ips, $handshake, $rx, $tx, $keepalive) = split /\t/, $line, 8;
            next unless $public_key;
            $handshake = 0 unless defined($handshake) && $handshake =~ /^\d+$/;
            $latest = $handshake if $handshake > $latest;
            my $age = $handshake > 0 ? time - $handshake : undef;
            push @items, {
                public_key => $public_key,
                endpoint => ($endpoint || ''),
                allowed_ips => ($allowed_ips || ''),
                latest_handshake => 0 + $handshake,
                handshake_age_seconds => defined($age) ? 0 + $age : JSON::PP::null,
                rx_bytes => 0 + ($rx || 0),
                tx_bytes => 0 + ($tx || 0),
                keepalive_seconds => 0 + ($keepalive || 0),
            };
        }
    }
    my $age = $latest > 0 ? time - $latest : undef;
    return {
        interface => 'wg0',
        available => JSON::PP::true,
        peers => scalar(@items),
        latest_handshake_age_seconds => defined($age) ? 0 + $age : JSON::PP::null,
        items => \@items,
    };
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
    my $cache = '/tmp/memonetwork-update-count-v4';
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

sub add_alert {
    my ($alerts, $severity, $code, $title, $message, $link, $link_label) = @_;
    push @$alerts, {
        severity => $severity,
        code => $code,
        title => $title,
        message => $message,
        link => ($link || ''),
        link_label => ($link_label || ''),
    };
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
my ($docker_running, $docker_total, $docker_items, $minio_container) = docker_stats();
my ($amp_running, $amp_total, $amp_items) = amp_stats();
my $wg = wireguard_stats();
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

my $minio_process = running($process_list, qr/(?:^|\/)minio(?:\s|$)/);
my $minio_docker_running = JSON::PP::false;
my ($minio_id, $minio_status, $minio_ports) = ('', '', '');
if (defined $minio_container) {
    for my $item (@$docker_items) {
        next unless $item->{name} eq $minio_container;
        $minio_id = $item->{id} || '';
        $minio_status = $item->{status} || '';
        $minio_ports = $item->{ports} || '';
        $minio_docker_running = JSON::PP::true if $item->{running};
        last;
    }
}
my $minio_online = ($minio_process || $minio_docker_running) ? JSON::PP::true : JSON::PP::false;
my $docker_online = running($process_list, qr/(?:^|\/)dockerd(?:\s|$)/);
my $amp_online = $amp_total > 0 ? JSON::PP::true : JSON::PP::false;
my $wireguard_online = $wg->{available};

my $ram_percent = $ram_total > 0 ? ($ram_used / $ram_total) * 100 : 0;
my $highest_disk = 0;
for my $disk (@disks) {
    $highest_disk = $disk->{used_percent} if ($disk->{used_percent} || 0) > $highest_disk;
}

my @alerts;
add_alert(\@alerts, 'critical', 'backup_mount', 'Backup HDD niet gemount', '/mnt/backups staat niet op een apart bestandssysteem. Backups kunnen op de systeemschijf terechtkomen.', '/mount/index.cgi', 'Schijven controleren') unless defined $backup_disk;
add_alert(\@alerts, 'warning', 'reboot', 'Herstart vereist', 'Ubuntu meldt dat een herstart nodig is om wijzigingen volledig toe te passen.', '/init/index.cgi', 'Herstartbeheer') if $reboot_required;
add_alert(\@alerts, 'info', 'updates', "$updates pakketupdate" . ($updates == 1 ? '' : 's') . ' beschikbaar', 'Er zijn systeem- of beveiligingsupdates beschikbaar.', '/package-updates/index.cgi', 'Updates openen') if $updates > 0;
add_alert(\@alerts, 'critical', 'cpu', 'CPU-belasting zeer hoog', sprintf('De actuele CPU-belasting is %.1f%%.', $cpu), '/memo-network/processes.cgi', 'Processen bekijken') if $cpu >= 90;
add_alert(\@alerts, 'warning', 'ram', 'Geheugengebruik hoog', sprintf('Het geheugengebruik is %.1f%%.', $ram_percent), '/memo-network/system-info.cgi', 'Systeeminfo') if $ram_percent >= 90;
add_alert(\@alerts, 'warning', 'disk', 'Opslag bijna vol', sprintf('Een bestandssysteem is %.1f%% gevuld.', $highest_disk), '/mount/index.cgi', 'Schijven bekijken') if $highest_disk >= 90;
add_alert(\@alerts, 'warning', 'temperature', 'Temperatuur verhoogd', "De gemeten temperatuur is ${temp}°C.", '/memo-network/system-info.cgi', 'Systeeminfo') if defined($temp) && $temp >= 80;
add_alert(\@alerts, 'warning', 'docker_offline', 'Docker offline', 'De Docker-service is niet actief.', '/memo-network/processes.cgi', 'Processen bekijken') unless $docker_online;
add_alert(\@alerts, 'warning', 'amp_offline', 'AMP niet gedetecteerd', 'Er zijn geen actieve AMP-instances gedetecteerd.', 'https://amp.memocraft.nl', 'AMP openen') unless $amp_online;
add_alert(\@alerts, 'warning', 'minio_offline', 'MinIO offline', 'De S3-opslagservice is niet actief.', '/memo-network/processes.cgi', 'Processen bekijken') unless $minio_online;
add_alert(\@alerts, 'warning', 'wireguard_offline', 'WireGuard offline', 'De wg0-interface is niet beschikbaar.', '/net/index.cgi', 'Netwerk bekijken') unless $wireguard_online;

my $payload = {
    api_version => 4.1,
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
    alerts => \@alerts,
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
        backup_device => defined($backup_disk) ? ($backup_disk->{device} || '') : '',
    },
    services => {
        docker => $docker_online,
        amp => $amp_online,
        minio => $minio_online,
        wireguard => $wireguard_online,
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
    minio => {
        running => $minio_online,
        container => defined($minio_container) ? $minio_container : '',
        container_id => $minio_id,
        status => $minio_status,
        ports => $minio_ports,
        mode => defined($minio_container) ? 'docker' : ($minio_process ? 'process' : 'unknown'),
    },
    wireguard => $wg,
    timestamp => time,
};

print "Content-Type: application/json\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json($payload);
