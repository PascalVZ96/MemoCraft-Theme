#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use File::Path qw(make_path);

my $STATE_DIR = '/var/lib/memonetwork';
my $EVENT_FILE = "$STATE_DIR/activity.json";
my $OBS_FILE = "$STATE_DIR/activity-observer.json";
my $REL_STATE_FILE = "$STATE_DIR/reliability-state.json";
my %PERIODS = (
    '24h' => 86400,
    '7d'  => 7 * 86400,
    '30d' => 30 * 86400,
);
my @SERVICES = qw(docker amp minio wireguard);

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

sub event_time {
    my ($event) = @_;
    return 0 unless ref($event) eq 'HASH';
    return 0 + ($event->{time} || 0);
}

sub overlap_seconds {
    my ($from, $to, $intervals) = @_;
    return 0 if $to <= $from;
    my $sum = 0;
    for my $item (@$intervals) {
        next unless ref($item) eq 'ARRAY' && @$item >= 2;
        my ($a, $b) = @$item;
        next if $b <= $from || $a >= $to;
        my $left = $a > $from ? $a : $from;
        my $right = $b < $to ? $b : $to;
        $sum += $right - $left if $right > $left;
    }
    return $sum;
}

sub observation_start {
    my ($events, $now) = @_;
    my $state = read_json($REL_STATE_FILE, {});
    $state = {} unless ref($state) eq 'HASH';
    my $first = 0 + ($state->{first_observed_at} || 0);
    return $first if $first > 0 && $first <= $now;

    my @times = sort { $a <=> $b } grep { $_ > 0 && $_ <= $now } map { event_time($_) } @$events;
    $first = @times ? $times[0] : $now;
    $state->{first_observed_at} = $first;
    $state->{created_at} ||= $now;
    $state->{updated_at} = $now;
    write_json($REL_STATE_FILE, $state);
    return $first;
}

sub maintenance_intervals {
    my ($events, $start, $now) = @_;
    my @ordered = sort { event_time($a) <=> event_time($b) } grep {
        ref($_) eq 'HASH' && ($_->{kind} || '') =~ /^maintenance_(?:started|stopped|expired)$/
    } @$events;
    my @intervals;
    my $open;
    for my $event (@ordered) {
        my $kind = $event->{kind} || '';
        my $time = event_time($event);
        next unless $time > 0;
        if ($kind eq 'maintenance_started') {
            $open = $time;
            next;
        }
        if (defined $open && $time >= $open) {
            push @intervals, [$open, $time];
            undef $open;
        }
    }
    push @intervals, [$open, $now] if defined $open && $open < $now;

    my @clipped;
    for my $item (@intervals) {
        my ($a, $b) = @$item;
        next if $b <= $start || $a >= $now;
        $a = $start if $a < $start;
        $b = $now if $b > $now;
        push @clipped, [$a, $b] if $b > $a;
    }
    return \@clipped;
}

sub service_stats {
    my ($service, $events, $observer, $start, $now, $maintenance) = @_;
    my $known = exists $observer->{$service};
    return {
        service => $service,
        known => JSON::PP::false,
        current_online => JSON::PP::false,
        uptime_percent => JSON::PP::null,
        downtime_seconds => 0,
        changes => 0,
    } unless $known;

    my $state = $observer->{$service} ? 1 : 0;
    my @changes = sort { event_time($b) <=> event_time($a) } grep {
        ref($_) eq 'HASH'
            && ($_->{subject} || '') eq $service
            && ($_->{kind} || '') =~ /^service_(?:online|offline)$/
            && event_time($_) >= $start
            && event_time($_) <= $now
    } @$events;

    my $maintenance_seconds = overlap_seconds($start, $now, $maintenance);
    my $effective_total = ($now - $start) - $maintenance_seconds;
    $effective_total = 1 if $effective_total < 1;
    my $up_seconds = 0;
    my $cursor = $now;

    for my $event (@changes) {
        my $time = event_time($event);
        next if $time > $cursor || $time < $start;
        my $segment = ($cursor - $time) - overlap_seconds($time, $cursor, $maintenance);
        $segment = 0 if $segment < 0;
        $up_seconds += $segment if $state;
        my $after = ($event->{kind} || '') eq 'service_online' ? 1 : 0;
        $state = $after ? 0 : 1;
        $cursor = $time;
    }

    if ($cursor > $start) {
        my $segment = ($cursor - $start) - overlap_seconds($start, $cursor, $maintenance);
        $segment = 0 if $segment < 0;
        $up_seconds += $segment if $state;
    }

    $up_seconds = $effective_total if $up_seconds > $effective_total;
    my $down_seconds = $effective_total - $up_seconds;
    $down_seconds = 0 if $down_seconds < 0;
    my $uptime = ($up_seconds / $effective_total) * 100;

    return {
        service => $service,
        known => JSON::PP::true,
        current_online => $observer->{$service} ? JSON::PP::true : JSON::PP::false,
        uptime_percent => sprintf('%.3f', $uptime) + 0,
        uptime_seconds => int($up_seconds),
        downtime_seconds => int($down_seconds),
        changes => scalar(@changes),
    };
}

sub incident_stats {
    my ($events, $start, $now) = @_;
    my @ordered = sort { event_time($a) <=> event_time($b) } grep {
        ref($_) eq 'HASH' && ($_->{kind} || '') =~ /^incident_(?:opened|recovered)$/
    } @$events;
    my %pending;
    my @durations;
    my %opened_counts;
    my $opened_in_period = 0;
    my $recovered_in_period = 0;

    for my $event (@ordered) {
        my $kind = $event->{kind} || '';
        my $id = $event->{subject} || 'unknown';
        my $time = event_time($event);
        next unless $time > 0 && $time <= $now;
        if ($kind eq 'incident_opened') {
            push @{$pending{$id}}, $time;
            if ($time >= $start) {
                $opened_in_period++;
                $opened_counts{$id}++;
            }
            next;
        }
        next unless ref($pending{$id}) eq 'ARRAY' && @{$pending{$id}};
        my $opened = shift @{$pending{$id}};
        if ($time >= $start && $time >= $opened) {
            push @durations, $time - $opened;
            $recovered_in_period++;
        }
    }

    my $active = 0;
    for my $id (keys %pending) {
        $active += scalar @{$pending{$id}} if ref($pending{$id}) eq 'ARRAY';
    }
    my $sum = 0;
    $sum += $_ for @durations;
    my $mttr = @durations ? int($sum / scalar(@durations)) : 0;
    my ($top_id, $top_count) = ('', 0);
    for my $id (keys %opened_counts) {
        if ($opened_counts{$id} > $top_count) {
            $top_id = $id;
            $top_count = $opened_counts{$id};
        }
    }
    my $critical = scalar grep {
        ref($_) eq 'HASH' && event_time($_) >= $start && event_time($_) <= $now && ($_->{severity} || '') eq 'critical'
    } @$events;

    return {
        opened => $opened_in_period,
        recovered => $recovered_in_period,
        active => $active,
        mttr_seconds => $mttr,
        critical_events => $critical,
        recurring => { id => $top_id, count => $top_count },
    };
}

my $method = $ENV{'REQUEST_METHOD'} || 'GET';
json_reply({ok=>JSON::PP::false,error=>'Alleen GET is toegestaan'}, '405 Method Not Allowed') unless $method eq 'GET';

my $period = query_value('period') || '7d';
json_reply({ok=>JSON::PP::false,error=>'Ongeldige periode'}, '400 Bad Request') unless exists $PERIODS{$period};

my $events = read_json($EVENT_FILE, []);
$events = [] unless ref($events) eq 'ARRAY';
my $observer = read_json($OBS_FILE, {});
$observer = {} unless ref($observer) eq 'HASH';
my $now = time;
my $requested_start = $now - $PERIODS{$period};
my $first_observed = observation_start($events, $now);
my $observed_start = $first_observed > $requested_start ? $first_observed : $requested_start;
my $coverage_seconds = $now - $observed_start;
$coverage_seconds = 0 if $coverage_seconds < 0;
$coverage_seconds = $PERIODS{$period} if $coverage_seconds > $PERIODS{$period};
my $coverage_percent = $PERIODS{$period} > 0 ? ($coverage_seconds / $PERIODS{$period}) * 100 : 0;
$coverage_percent = 100 if $coverage_percent > 100;
my $coverage_ready = $coverage_percent >= 95 ? 1 : 0;

my $maintenance = maintenance_intervals($events, $observed_start, $now);
my $maintenance_seconds = overlap_seconds($observed_start, $now, $maintenance);

my @services = map { service_stats($_, $events, $observer, $observed_start, $now, $maintenance) } @SERVICES;
my @known = grep { $_->{known} } @services;
my $avg_uptime = 0;
if (@known) {
    my $sum = 0;
    $sum += 0 + ($_->{uptime_percent} || 0) for @known;
    $avg_uptime = $sum / scalar(@known);
}
my $incident = incident_stats($events, $observed_start, $now);
my $target = 99.0;
my $target_met = $coverage_ready && @known && $avg_uptime >= $target ? JSON::PP::true : JSON::PP::false;
my $target_status = !$coverage_ready ? 'collecting' : ($avg_uptime >= $target ? 'met' : 'not_met');

json_reply({
    ok => JSON::PP::true,
    period => $period,
    period_seconds => $PERIODS{$period},
    generated_at => $now,
    requested_start => $requested_start,
    observation_started_at => $first_observed,
    observed_start => $observed_start,
    coverage_seconds => int($coverage_seconds),
    coverage_percent => sprintf('%.1f', $coverage_percent) + 0,
    coverage_ready => $coverage_ready ? JSON::PP::true : JSON::PP::false,
    maintenance_seconds => int($maintenance_seconds),
    maintenance_windows => scalar(@$maintenance),
    target_percent => $target,
    average_uptime_percent => @known ? sprintf('%.3f', $avg_uptime) + 0 : JSON::PP::null,
    target_met => $target_met,
    target_status => $target_status,
    services => \@services,
    incidents => $incident,
    event_count => scalar(grep { event_time($_) >= $observed_start && event_time($_) <= $now } @$events),
    source => 'activity-center',
    estimate => JSON::PP::true,
});