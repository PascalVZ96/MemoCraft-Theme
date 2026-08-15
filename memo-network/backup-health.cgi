#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use Fcntl qw(:flock);
use File::Path qw(make_path);

my $BACKUP_PATH = '/mnt/backups';
my $STATE_DIR = '/var/lib/memonetwork';
my $CACHE_FILE = "$STATE_DIR/backup-health.json";
my $LOCK_FILE = '/run/lock/memonetwork-backup-scan.lock';
my $SCAN_TIMEOUT = 15;
my $MAX_FILES = 1_000_000;
my $RECENT_LIMIT = 10;

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

sub command_output {
    my (@cmd) = @_;
    my $pid = open my $fh, '-|', @cmd;
    return ('', 127) unless defined $pid;
    local $/;
    my $out = <$fh> // '';
    close $fh;
    return ($out, $? >> 8);
}

sub mount_info {
    my %info = (
        path => $BACKUP_PATH,
        exists => -d $BACKUP_PATH ? JSON::PP::true : JSON::PP::false,
        mounted => JSON::PP::false,
        separate_filesystem => JSON::PP::false,
        source => '',
        fstype => '',
        target => '',
        total_bytes => 0,
        used_bytes => 0,
        available_bytes => 0,
        used_percent => 0,
    );
    return \%info unless -d $BACKUP_PATH;

    my $findmnt = -x '/usr/bin/findmnt' ? '/usr/bin/findmnt' : -x '/bin/findmnt' ? '/bin/findmnt' : '';
    if ($findmnt) {
        my ($out, $exit) = command_output($findmnt, '-T', $BACKUP_PATH, '-n', '-o', 'SOURCE,FSTYPE,TARGET');
        if ($exit == 0 && $out =~ /^(.+?)\s+(\S+)\s+(\S+)\s*$/m) {
            $info{source} = $1;
            $info{fstype} = $2;
            $info{target} = $3;
            $info{mounted} = JSON::PP::true;
            $info{separate_filesystem} = ($info{target} eq $BACKUP_PATH) ? JSON::PP::true : JSON::PP::false;
        }
    }

    my $df = -x '/usr/bin/df' ? '/usr/bin/df' : -x '/bin/df' ? '/bin/df' : '';
    if ($df) {
        my ($out, $exit) = command_output($df, '-B1', '-P', $BACKUP_PATH);
        if ($exit == 0) {
            my @lines = grep { /\S/ } split /\n/, $out;
            if (@lines >= 2) {
                my @f = split /\s+/, $lines[-1];
                if (@f >= 6) {
                    $info{total_bytes} = 0 + ($f[-5] || 0);
                    $info{used_bytes} = 0 + ($f[-4] || 0);
                    $info{available_bytes} = 0 + ($f[-3] || 0);
                    my $pct = $f[-2] || '0%';
                    $pct =~ s/%//g;
                    $info{used_percent} = 0 + $pct;
                }
            }
        }
    }
    return \%info;
}

sub minio_info {
    my %result = (available => JSON::PP::false, running => JSON::PP::false, container => '', image => '', status => '', storage_source => '', storage_destination => '');
    my $docker = -x '/usr/bin/docker' ? '/usr/bin/docker' : -x '/bin/docker' ? '/bin/docker' : '';
    return \%result unless $docker;

    my ($out, $exit) = command_output($docker, 'ps', '-a', '--format', '{{.Names}}\t{{.Image}}\t{{.State}}\t{{.Status}}');
    return \%result unless $exit == 0;
    for my $line (split /\n/, $out) {
        my ($name, $image, $state, $status) = split /\t/, $line, 4;
        next unless (($name || '') =~ /minio/i || ($image || '') =~ /minio/i);
        $result{available} = JSON::PP::true;
        $result{running} = (($state || '') eq 'running') ? JSON::PP::true : JSON::PP::false;
        $result{container} = $name || '';
        $result{image} = $image || '';
        $result{status} = $status || $state || '';

        my ($mounts, $inspect_exit) = command_output($docker, 'inspect', '--format', '{{json .Mounts}}', $name);
        if ($inspect_exit == 0 && $mounts =~ /\S/) {
            my $data = eval { decode_json($mounts) };
            if (!$@ && ref($data) eq 'ARRAY') {
                for my $m (@$data) {
                    next unless ref($m) eq 'HASH';
                    my $src = $m->{Source} || '';
                    my $dst = $m->{Destination} || '';
                    if ($src =~ m{^\Q$BACKUP_PATH\E(?:/|$)} || $dst eq '/data') {
                        $result{storage_source} = $src;
                        $result{storage_destination} = $dst;
                        last;
                    }
                }
            }
        }
        last;
    }
    return \%result;
}

sub scan_backups {
    my ($mount) = @_;
    json_reply({ ok => JSON::PP::false, error => 'Backupmap bestaat niet' }, '409 Conflict') unless $mount->{exists};
    json_reply({ ok => JSON::PP::false, error => 'Backupmap is niet als apart bestandssysteem gemount' }, '409 Conflict') unless $mount->{separate_filesystem};

    make_path('/run/lock') unless -d '/run/lock';
    open my $lock, '>', $LOCK_FILE or json_reply({ ok => JSON::PP::false, error => 'Backupscan-lock kon niet worden geopend' }, '500 Internal Server Error');
    json_reply({ ok => JSON::PP::false, error => 'Er draait al een backupscan' }, '409 Conflict') unless flock($lock, LOCK_EX | LOCK_NB);

    my $find = -x '/usr/bin/find' ? '/usr/bin/find' : -x '/bin/find' ? '/bin/find' : '';
    my $timeout = -x '/usr/bin/timeout' ? '/usr/bin/timeout' : -x '/bin/timeout' ? '/bin/timeout' : '';
    json_reply({ ok => JSON::PP::false, error => 'find of timeout is niet beschikbaar' }, '500 Internal Server Error') unless $find && $timeout;

    local $ENV{LC_ALL} = 'C';
    my @cmd = ($timeout, "${SCAN_TIMEOUT}s", $find, $BACKUP_PATH, '-xdev', '-type', 'f', '-printf', '%T@\t%s\t%p\n');
    my $pid = open my $fh, '-|', @cmd;
    json_reply({ ok => JSON::PP::false, error => 'Backupscan kon niet worden gestart' }, '500 Internal Server Error') unless defined $pid;

    my $count = 0;
    my $bytes = 0;
    my @recent;
    my $capped = 0;
    while (my $line = <$fh>) {
        chomp $line;
        next unless $line =~ /^([0-9]+(?:\.[0-9]+)?)\t(\d+)\t(.+)$/;
        my ($mtime, $size, $path) = ($1 + 0, $2 + 0, $3);
        $count++;
        $bytes += $size;
        push @recent, { mtime => $mtime, size => $size, path => $path };
        @recent = sort { $b->{mtime} <=> $a->{mtime} } @recent;
        splice @recent, $RECENT_LIMIT if @recent > $RECENT_LIMIT;
        if ($count >= $MAX_FILES) { $capped = 1; last; }
    }
    close $fh;
    my $exit = $? >> 8;
    my $timed_out = ($exit == 124) ? 1 : 0;
    my $complete = (!$timed_out && !$capped && $exit == 0) ? 1 : 0;

    my $latest = @recent ? $recent[0] : undef;
    my $scan = {
        scanned_at => time,
        file_count => $count,
        total_bytes => $bytes,
        recent => \@recent,
        latest => $latest,
        complete => $complete ? JSON::PP::true : JSON::PP::false,
        timed_out => $timed_out ? JSON::PP::true : JSON::PP::false,
        capped => $capped ? JSON::PP::true : JSON::PP::false,
        timeout_seconds => $SCAN_TIMEOUT,
        max_files => $MAX_FILES,
    };
    write_json($CACHE_FILE, $scan);
    return $scan;
}

my $method = $ENV{'REQUEST_METHOD'} || 'GET';
my $mount = mount_info();
my $minio = minio_info();
my $scan = read_json($CACHE_FILE, {});
$scan = {} unless ref($scan) eq 'HASH';

if ($method eq 'POST') {
    json_reply({ ok => JSON::PP::false, error => 'Ongeldige dashboardaanvraag' }, '403 Forbidden') unless post_allowed();
    my $action = query_value('action');
    json_reply({ ok => JSON::PP::false, error => 'Ongeldige backupactie' }, '400 Bad Request') unless $action eq 'scan';
    $scan = scan_backups($mount);
} elsif ($method ne 'GET') {
    json_reply({ ok => JSON::PP::false, error => 'Alleen GET en POST zijn toegestaan' }, '405 Method Not Allowed');
}

my $latest_age = undef;
if (ref($scan->{latest}) eq 'HASH' && ($scan->{latest}{mtime} || 0) > 0) {
    $latest_age = time - $scan->{latest}{mtime};
    $latest_age = 0 if $latest_age < 0;
}

my $freshness = 'unknown';
if (defined $latest_age) {
    $freshness = $latest_age <= 86400 ? 'fresh' : $latest_age <= 259200 ? 'aging' : 'stale';
}

json_reply({
    ok => JSON::PP::true,
    generated_at => time,
    backup_path => $BACKUP_PATH,
    mount => $mount,
    minio => $minio,
    scan => $scan,
    latest_age_seconds => defined($latest_age) ? 0 + $latest_age : undef,
    freshness => $freshness,
});
