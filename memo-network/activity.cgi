#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use File::Path qw(make_path);
use Fcntl qw(:flock);

my $STATE_DIR = '/var/lib/memonetwork';
my $EVENT_FILE = "$STATE_DIR/activity.json";
my $OBS_FILE = "$STATE_DIR/activity-observer.json";
my $LOCK_FILE = '/run/lock/memonetwork-activity.lock';
my $MAX_EVENTS = 500;
my $RETENTION = 90 * 86400;

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

sub clean_text {
    my ($value, $limit) = @_;
    $value = '' unless defined $value;
    $value =~ s/[\x00-\x1f\x7f]/ /g;
    $value =~ s/\s+/ /g;
    $value =~ s/^\s+|\s+$//g;
    $value = substr($value, 0, $limit) if length($value) > $limit;
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

sub lock_activity {
    make_path('/run/lock') unless -d '/run/lock';
    open my $fh, '>', $LOCK_FILE or json_reply({ok=>JSON::PP::false,error=>'Activity-lock kon niet worden geopend'}, '500 Internal Server Error');
    flock($fh, LOCK_EX) or json_reply({ok=>JSON::PP::false,error=>'Activity-lock kon niet worden verkregen'}, '500 Internal Server Error');
    return $fh;
}

sub normalize_events {
    my ($events) = @_;
    my $now = time;
    my @items = ref($events) eq 'ARRAY' ? grep { ref($_) eq 'HASH' && 0 + ($_->{time} || 0) >= $now - $RETENTION } @$events : ();
    @items = sort { 0 + ($b->{time} || 0) <=> 0 + ($a->{time} || 0) } @items;
    splice(@items, $MAX_EVENTS) if @items > $MAX_EVENTS;
    return \@items;
}

sub append_event {
    my ($events, $event) = @_;
    my $dedupe = clean_text($event->{dedupe} || '', 180);
    if (length $dedupe) {
        return 0 if grep { clean_text($_->{dedupe} || '', 180) eq $dedupe } @$events;
    }
    push @$events, $event;
    @$events = sort { 0 + ($b->{time} || 0) <=> 0 + ($a->{time} || 0) } @$events;
    splice(@$events, $MAX_EVENTS) if @$events > $MAX_EVENTS;
    return 1;
}

sub event_item {
    my (%args) = @_;
    my $when = 0 + ($args{time} || time);
    my $now = time;
    $when = $now if $when < 1 || $when > $now + 300;
    return {
        id => join('-', $when, int(rand(1_000_000)), $$),
        time => $when,
        kind => clean_text($args{kind} || 'note', 48),
        severity => clean_text($args{severity} || 'info', 16),
        subject => clean_text($args{subject} || '', 120),
        detail => clean_text($args{detail} || '', 320),
        dedupe => clean_text($args{dedupe} || '', 180),
        actor => clean_text($args{actor} || $ENV{'REMOTE_USER'} || 'MemoNetwork', 80),
        source => clean_text($args{source} || 'control-center', 64),
    };
}

sub bool_value {
    my ($value) = @_;
    return undef unless defined $value && length $value;
    return 1 if $value =~ /^(?:1|true|yes|online)$/i;
    return 0 if $value =~ /^(?:0|false|no|offline)$/i;
    return undef;
}

sub number_value {
    my ($value) = @_;
    return undef unless defined $value && $value =~ /^-?\d+(?:\.\d+)?$/;
    return 0 + $value;
}

sub save_events {
    my ($events) = @_;
    return write_json($EVENT_FILE, normalize_events($events));
}

sub current_payload {
    my $events = normalize_events(read_json($EVENT_FILE, []));
    my $now = time;
    my $last24 = scalar grep { 0 + ($_->{time} || 0) >= $now - 86400 } @$events;
    my $critical24 = scalar grep { 0 + ($_->{time} || 0) >= $now - 86400 && ($_->{severity} || '') eq 'critical' } @$events;
    my $changes24 = scalar grep { 0 + ($_->{time} || 0) >= $now - 86400 && ($_->{kind} || '') =~ /^(?:service_|maintenance_|security_mode|note)/ } @$events;
    return {
        ok => JSON::PP::true,
        generated_at => $now,
        events => $events,
        count => scalar(@$events),
        max_events => $MAX_EVENTS,
        retention_days => int($RETENTION / 86400),
        summary => { last_24h => $last24, critical_24h => $critical24, changes_24h => $changes24 },
    };
}

my $method = $ENV{'REQUEST_METHOD'} || 'GET';
if ($method eq 'GET') {
    json_reply(current_payload());
}
json_reply({ok=>JSON::PP::false,error=>'Ongeldige Activity Center-aanvraag'}, '403 Forbidden') unless post_allowed();

my $action = query_value('action');
my $lock = lock_activity();
my $events = normalize_events(read_json($EVENT_FILE, []));

if ($action eq 'record') {
    my %allowed = map { $_ => 1 } qw(
        maintenance_started maintenance_stopped maintenance_expired
        incident_opened incident_recovered
        service_online service_offline backup_mount_ok backup_mount_bad backup_scan
        network_check speedtest security_event security_mode note
    );
    my $kind = clean_text(query_value('kind'), 48);
    json_reply({ok=>JSON::PP::false,error=>'Ongeldig gebeurtenistype'}, '400 Bad Request') unless $allowed{$kind};
    my $severity = clean_text(query_value('severity'), 16);
    $severity = 'info' unless $severity =~ /^(?:info|warning|critical|success)$/;
    my $when = query_value('time');
    $when = ($when =~ /^\d+$/) ? 0 + $when : time;
    my $event = event_item(
        kind => $kind,
        severity => $severity,
        subject => query_value('subject'),
        detail => query_value('detail'),
        dedupe => query_value('dedupe'),
        time => $when,
        source => query_value('source') || 'control-center',
    );
    my $added = append_event($events, $event);
    save_events($events) or json_reply({ok=>JSON::PP::false,error=>'Gebeurtenis kon niet worden opgeslagen'}, '500 Internal Server Error');
    my $payload = current_payload();
    $payload->{added} = $added ? JSON::PP::true : JSON::PP::false;
    json_reply($payload);
}

if ($action eq 'note') {
    my $detail = clean_text(query_value('detail'), 320);
    json_reply({ok=>JSON::PP::false,error=>'Notitie is leeg'}, '400 Bad Request') unless length $detail;
    append_event($events, event_item(kind=>'note',severity=>'info',subject=>'Manual note',detail=>$detail,dedupe=>'',source=>'manual'));
    save_events($events) or json_reply({ok=>JSON::PP::false,error=>'Notitie kon niet worden opgeslagen'}, '500 Internal Server Error');
    json_reply(current_payload());
}

if ($action eq 'observe') {
    my $previous = read_json($OBS_FILE, {});
    $previous = {} unless ref($previous) eq 'HASH';
    my %current;

    for my $service (qw(docker amp minio wireguard)) {
        my $value = bool_value(query_value($service));
        next unless defined $value;
        $current{$service} = $value ? 1 : 0;
        if (exists $previous->{$service} && (0 + $previous->{$service}) != $current{$service}) {
            append_event($events, event_item(
                kind => $value ? 'service_online' : 'service_offline',
                severity => $value ? 'success' : 'warning',
                subject => $service,
                detail => '',
                dedupe => join(':','service',$service,$value,time),
                source => 'observer',
            ));
        }
    }

    my $mount = bool_value(query_value('backup_mount'));
    if (defined $mount) {
        $current{backup_mount} = $mount ? 1 : 0;
        if (exists $previous->{backup_mount} && (0 + $previous->{backup_mount}) != $current{backup_mount}) {
            append_event($events, event_item(
                kind => $mount ? 'backup_mount_ok' : 'backup_mount_bad',
                severity => $mount ? 'success' : 'critical', subject => '/mnt/backups', detail => '',
                dedupe => join(':','backup-mount',$mount,time), source => 'observer'
            ));
        }
    }

    my $backup_scan = number_value(query_value('backup_scan'));
    if (defined $backup_scan && $backup_scan > 0) {
        $current{backup_scan} = int($backup_scan);
        if ((!$previous->{backup_scan} || $backup_scan > 0 + $previous->{backup_scan})) {
            append_event($events, event_item(
                kind=>'backup_scan',severity=>'info',subject=>query_value('backup_freshness'),detail=>'',time=>int($backup_scan),
                dedupe=>'backup-scan:'.int($backup_scan),source=>'observer'
            ));
        }
    }

    my $security_mode = clean_text(query_value('security_mode'), 16);
    if ($security_mode =~ /^(?:off|detect|auto)$/) {
        $current{security_mode} = $security_mode;
        if (exists $previous->{security_mode} && ($previous->{security_mode} || '') ne $security_mode) {
            append_event($events, event_item(
                kind=>'security_mode',severity=>$security_mode eq 'off'?'warning':'info',subject=>$security_mode,detail=>'',
                dedupe=>join(':','security-mode',$security_mode,time),source=>'observer'
            ));
        }
    }

    my $network_time = number_value(query_value('network_time'));
    my $network_score = number_value(query_value('network_score'));
    if (defined $network_time && $network_time > 0) {
        $current{network_time} = int($network_time);
        if (!$previous->{network_time} || $network_time > 0 + $previous->{network_time}) {
            append_event($events, event_item(
                kind=>'network_check',severity=>(defined($network_score) && $network_score < 60)?'critical':(defined($network_score) && $network_score < 85)?'warning':'success',
                subject=>defined($network_score)?$network_score:'',detail=>'',time=>int($network_time),dedupe=>'network-check:'.int($network_time),source=>'observer'
            ));
        }
    }

    my $speed_time = number_value(query_value('speed_time'));
    if (defined $speed_time && $speed_time > 0) {
        $current{speed_time} = int($speed_time);
        if (!$previous->{speed_time} || $speed_time > 0 + $previous->{speed_time}) {
            my $down = number_value(query_value('speed_down'));
            my $up = number_value(query_value('speed_up'));
            my $ping = number_value(query_value('speed_ping'));
            my $detail = join('|', map { defined($_) ? $_ : '' } ($down,$up,$ping));
            append_event($events, event_item(
                kind=>'speedtest',severity=>(defined($ping) && $ping > 80)?'warning':'success',subject=>'',detail=>$detail,time=>int($speed_time),
                dedupe=>'speedtest:'.int($speed_time),source=>'observer'
            ));
        }
    }

    my %merged = (%$previous, %current);
    $merged{updated_at} = time;
    write_json($OBS_FILE, \%merged) or json_reply({ok=>JSON::PP::false,error=>'Observerstatus kon niet worden opgeslagen'}, '500 Internal Server Error');
    save_events($events) or json_reply({ok=>JSON::PP::false,error=>'Activiteit kon niet worden opgeslagen'}, '500 Internal Server Error');
    json_reply(current_payload());
}

if ($action eq 'clear') {
    save_events([]) or json_reply({ok=>JSON::PP::false,error=>'Activiteit kon niet worden gewist'}, '500 Internal Server Error');
    json_reply(current_payload());
}

json_reply({ok=>JSON::PP::false,error=>'Onbekende Activity Center-actie'}, '400 Bad Request');
