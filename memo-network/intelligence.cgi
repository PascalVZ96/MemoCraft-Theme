#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use File::Path qw(make_path);
use Fcntl qw(:flock);

my $STATE_DIR = '/var/lib/memonetwork';
my $HISTORY_FILE = "$STATE_DIR/intelligence-history.json";
my $NOTIFY_FILE = "$STATE_DIR/intelligence-notifications.json";
my $LOCK_FILE = '/run/lock/memonetwork-intelligence.lock';
my $RETENTION = 30 * 86400;
my $MAX_HISTORY = 3000;
my $MAX_NOTIFICATIONS = 250;
my $MIN_SAMPLE_GAP = 10 * 60;

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

sub clean_text {
    my ($value, $limit) = @_;
    $value = '' unless defined $value;
    $value =~ s/[\x00-\x1f\x7f]/ /g;
    $value =~ s/\s+/ /g;
    $value =~ s/^\s+|\s+$//g;
    $value = substr($value, 0, $limit) if length($value) > $limit;
    return $value;
}

sub num_value {
    my ($name) = @_;
    my $v = query_value($name);
    return undef unless defined($v) && $v =~ /^-?\d+(?:\.\d+)?$/;
    return 0 + $v;
}

sub bool_value {
    my ($name) = @_;
    my $v = query_value($name);
    return undef unless defined $v && length $v;
    return 1 if $v =~ /^(?:1|true|yes)$/i;
    return 0 if $v =~ /^(?:0|false|no)$/i;
    return undef;
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
    make_path($STATE_DIR, {mode => 0700}) unless -d $STATE_DIR;
    my $tmp = "$path.$$";
    open my $fh, '>', $tmp or return 0;
    chmod 0600, $tmp;
    print {$fh} encode_json($data);
    close $fh or return 0;
    return rename($tmp, $path) ? 1 : 0;
}

sub lock_state {
    make_path('/run/lock') unless -d '/run/lock';
    open my $fh, '>', $LOCK_FILE or json_reply({ok=>JSON::PP::false,error=>'Intelligence-lock kon niet worden geopend'}, '500 Internal Server Error');
    flock($fh, LOCK_EX) or json_reply({ok=>JSON::PP::false,error=>'Intelligence-lock kon niet worden verkregen'}, '500 Internal Server Error');
    return $fh;
}

sub normalize_history {
    my ($items) = @_;
    my $cutoff = time - $RETENTION;
    my @rows = ref($items) eq 'ARRAY' ? grep { ref($_) eq 'HASH' && 0 + ($_->{time} || 0) >= $cutoff } @$items : ();
    @rows = sort { 0 + ($a->{time} || 0) <=> 0 + ($b->{time} || 0) } @rows;
    splice(@rows, 0, @rows - $MAX_HISTORY) if @rows > $MAX_HISTORY;
    return \@rows;
}

sub normalize_notifications {
    my ($items) = @_;
    my $cutoff = time - $RETENTION;
    my @rows = ref($items) eq 'ARRAY' ? grep { ref($_) eq 'HASH' && 0 + ($_->{time} || 0) >= $cutoff } @$items : ();
    @rows = sort { 0 + ($b->{time} || 0) <=> 0 + ($a->{time} || 0) } @rows;
    splice(@rows, $MAX_NOTIFICATIONS) if @rows > $MAX_NOTIFICATIONS;
    return \@rows;
}

sub severity_rank {
    my ($value) = @_;
    return 0 if ($value || '') eq 'critical';
    return 1 if ($value || '') eq 'warning';
    return 2;
}

sub upsert_notification {
    my ($items, %args) = @_;
    my $key = clean_text($args{key}, 100);
    return unless length $key;
    my $now = time;
    my ($existing) = grep { ($_->{key} || '') eq $key } @$items;
    if ($existing) {
        my $reactivated = !$existing->{active};
        my $changed = ($existing->{severity} || '') ne ($args{severity} || '') || ($existing->{detail} || '') ne ($args{detail} || '');
        $existing->{active} = JSON::PP::true;
        $existing->{last_seen} = $now;
        $existing->{severity} = clean_text($args{severity} || 'info', 16);
        $existing->{title} = clean_text($args{title}, 140);
        $existing->{detail} = clean_text($args{detail}, 360);
        $existing->{source} = clean_text($args{source} || 'intelligence', 48);
        $existing->{type} = clean_text($args{type} || 'status', 32);
        $existing->{read} = JSON::PP::false if $reactivated || $changed;
        delete $existing->{resolved_at};
        return;
    }
    push @$items, {
        id => join('-', $now, int(rand(1_000_000)), $$),
        key => $key,
        time => $now,
        last_seen => $now,
        active => JSON::PP::true,
        read => JSON::PP::false,
        severity => clean_text($args{severity} || 'info', 16),
        title => clean_text($args{title}, 140),
        detail => clean_text($args{detail}, 360),
        source => clean_text($args{source} || 'intelligence', 48),
        type => clean_text($args{type} || 'status', 32),
    };
}

sub resolve_missing {
    my ($items, $current) = @_;
    my $now = time;
    for my $item (@$items) {
        next unless $item->{active};
        next unless ($item->{source} || '') eq 'intelligence';
        my $key = $item->{key} || '';
        next if $current->{$key};
        $item->{active} = JSON::PP::false;
        $item->{resolved_at} = $now;
    }
}

sub average {
    my (@values) = grep { defined $_ } @_;
    return undef unless @values;
    my $sum = 0; $sum += $_ for @values;
    return $sum / @values;
}

sub metric_rows {
    my ($history, $metric, $since) = @_;
    return grep { 0 + ($_->{time} || 0) >= $since && defined $_->{$metric} } @$history;
}

sub metric_slope_per_day {
    my ($history, $metric, $since) = @_;
    my @rows = metric_rows($history, $metric, $since);
    return undef if @rows < 4;
    my $first_t = 0 + ($rows[0]->{time} || 0);
    my $last_t = 0 + ($rows[-1]->{time} || 0);
    return undef if $last_t - $first_t < 2 * 3600;
    my ($sx,$sy,$sxy,$sxx,$n) = (0,0,0,0,0);
    for my $row (@rows) {
        my $x = (0 + ($row->{time} || 0) - $first_t) / 86400;
        my $y = 0 + $row->{$metric};
        $sx += $x; $sy += $y; $sxy += $x*$y; $sxx += $x*$x; $n++;
    }
    my $den = $n*$sxx - $sx*$sx;
    return undef if abs($den) < 0.000001;
    return ($n*$sxy - $sx*$sy) / $den;
}

sub history_summary {
    my ($history) = @_;
    my $now = time;
    my @scores = metric_rows($history, 'score', $now - 24*3600);
    my $current = @scores ? 0 + $scores[-1]->{score} : undef;
    my $earliest = @scores ? 0 + $scores[0]->{score} : undef;
    my @values = map { 0 + $_->{score} } @scores;
    my $avg = average(@values);
    my ($min,$max);
    for my $v (@values) { $min = $v if !defined($min) || $v < $min; $max = $v if !defined($max) || $v > $max; }
    my $delta = defined($current) && defined($earliest) ? $current - $earliest : undef;
    my $first_time = @$history ? 0 + ($history->[0]->{time} || 0) : 0;
    my $observed = $first_time ? $now - $first_time : 0;
    $observed = $RETENTION if $observed > $RETENTION;
    my $direction = !defined($delta) ? 'unknown' : $delta >= 2 ? 'up' : $delta <= -2 ? 'down' : 'stable';
    return {
        points => scalar(@$history), observed_seconds => int($observed),
        current_score => defined($current) ? sprintf('%.1f',$current)+0 : JSON::PP::null,
        delta_24h => defined($delta) ? sprintf('%.1f',$delta)+0 : JSON::PP::null,
        average_24h => defined($avg) ? sprintf('%.1f',$avg)+0 : JSON::PP::null,
        min_24h => defined($min) ? sprintf('%.1f',$min)+0 : JSON::PP::null,
        max_24h => defined($max) ? sprintf('%.1f',$max)+0 : JSON::PP::null,
        direction => $direction,
    };
}

sub payload {
    my ($history, $notifications) = @_;
    $history = normalize_history($history);
    $notifications = normalize_notifications($notifications);
    my @active = grep { $_->{active} } @$notifications;
    my $unread = scalar grep { !$_->{read} } @active;
    my $critical = scalar grep { ($_->{severity} || '') eq 'critical' } @active;
    my $predictive = scalar grep { ($_->{type} || '') eq 'predictive' } @active;
    my @recent_history = @$history > 144 ? @$history[-144 .. -1] : @$history;
    return {
        ok => JSON::PP::true,
        generated_at => time,
        summary => { unread=>$unread, critical=>$critical, predictive=>$predictive, active=>scalar(@active) },
        trend => history_summary($history),
        history => \@recent_history,
        notifications => $notifications,
        retention_days => 30,
    };
}

my $method = $ENV{'REQUEST_METHOD'} || 'GET';
if ($method eq 'GET') {
    json_reply(payload(read_json($HISTORY_FILE, []), read_json($NOTIFY_FILE, [])));
}
json_reply({ok=>JSON::PP::false,error=>'Ongeldige aanvraag'}, '403 Forbidden') unless $method eq 'POST' && ($ENV{'HTTP_X_REQUESTED_WITH'} || '') eq 'MemoNetwork';

my $lock = lock_state();
my $history = normalize_history(read_json($HISTORY_FILE, []));
my $notifications = normalize_notifications(read_json($NOTIFY_FILE, []));
my $action = query_value('action');

if ($action eq 'observe') {
    my $now = time;
    my %sample = (time => $now);
    for my $metric (qw(score source_coverage cpu ram disk backup_age network_score download upload ping reliability_coverage reliability_uptime)) {
        my $v = num_value($metric);
        $sample{$metric} = $v if defined $v;
    }
    my $last = @$history ? 0 + ($history->[-1]->{time} || 0) : 0;
    if (!$last || $now - $last >= $MIN_SAMPLE_GAP) {
        push @$history, \%sample;
        $history = normalize_history($history);
    }

    my %current;
    my $add = sub {
        my (%n) = @_;
        $current{$n{key}} = 1;
        upsert_notification($notifications, %n, source=>'intelligence');
    };

    my $score = $sample{score};
    if (defined $score && $score < 75) {
        $add->(key=>'health-critical',severity=>'critical',type=>'health',title=>'Health Score kritiek',detail=>sprintf('De actuele Health Score is %.0f/100.', $score));
    } elsif (defined $score && $score < 90) {
        $add->(key=>'health-attention',severity=>'warning',type=>'health',title=>'Health Score vraagt aandacht',detail=>sprintf('De actuele Health Score is %.0f/100.', $score));
    }

    my $offline = num_value('services_offline');
    if (defined($offline) && $offline > 0) {
        $add->(key=>'services-offline',severity=>$offline >= 2?'critical':'warning',type=>'status',title=>'Service niet beschikbaar',detail=>sprintf('%d bewaakte service(s) zijn momenteel offline.', $offline));
    }
    my $backup_problem = bool_value('backup_problem');
    if ($backup_problem) {
        $add->(key=>'backup-problem',severity=>'critical',type=>'status',title=>'Backupketen vraagt aandacht',detail=>'De backup-HDD, MinIO of backupversheid rapporteert een probleem.');
    }
    my $security_problem = bool_value('security_problem');
    if ($security_problem) {
        $add->(key=>'security-problem',severity=>'warning',type=>'status',title=>'Beveiliging vraagt aandacht',detail=>'Auto Defense of de security scanner rapporteert een aandachtspunt.');
    }
    my $incident_critical = num_value('incident_critical');
    my $incident_active = num_value('incident_active');
    if (defined($incident_critical) && $incident_critical > 0) {
        $add->(key=>'incident-critical',severity=>'critical',type=>'incident',title=>'Kritiek incident actief',detail=>sprintf('%d kritisch(e) incident(en) zijn momenteel actief.', $incident_critical));
    } elsif (defined($incident_active) && $incident_active > 0) {
        $add->(key=>'incident-active',severity=>'warning',type=>'incident',title=>'Incident actief',detail=>sprintf('%d incident(en) zijn momenteel actief.', $incident_active));
    }

    if (defined($sample{backup_age})) {
        if ($sample{backup_age} >= 60*3600) {
            $add->(key=>'predict-backup-stale',severity=>'critical',type=>'predictive',title=>'Backup dreigt verouderd te raken',detail=>sprintf('De nieuwste backup is inmiddels %.1f uur oud.', $sample{backup_age}/3600));
        } elsif ($sample{backup_age} >= 20*3600) {
            $add->(key=>'predict-backup-aging',severity=>'warning',type=>'predictive',title=>'Backup wordt ouder',detail=>sprintf('De nieuwste backup is %.1f uur oud en nadert de 24-uursgrens.', $sample{backup_age}/3600));
        }
    }

    my $ram_slope = metric_slope_per_day($history, 'ram', $now - 7*86400);
    if (defined($sample{ram}) && defined($ram_slope) && $ram_slope > 0.5 && $sample{ram} >= 65 && $sample{ram} < 90) {
        my $days = (90 - $sample{ram}) / $ram_slope;
        if ($days > 0 && $days <= 14) {
            $add->(key=>'predict-ram',severity=>'warning',type=>'predictive',title=>'RAM-gebruik loopt op',detail=>sprintf('Bij de huidige trend kan 90%% RAM binnen ongeveer %.1f dag(en) worden bereikt.', $days));
        }
    }

    my $disk_slope = metric_slope_per_day($history, 'disk', $now - 14*86400);
    if (defined($sample{disk}) && defined($disk_slope) && $disk_slope > 0.15 && $sample{disk} >= 65 && $sample{disk} < 90) {
        my $days = (90 - $sample{disk}) / $disk_slope;
        if ($days > 0 && $days <= 45) {
            $add->(key=>'predict-disk',severity=>'warning',type=>'predictive',title=>'Schijfgebruik loopt op',detail=>sprintf('Bij de huidige trend kan 90%% schijfgebruik binnen ongeveer %.1f dag(en) worden bereikt.', $days));
        }
    }

    my @network_rows = metric_rows($history, 'network_score', $now - 48*3600);
    if (defined($sample{network_score}) && @network_rows >= 4) {
        my @old = grep { 0 + ($_->{time}||0) < $now - 6*3600 } @network_rows;
        my $baseline = average(map { 0 + $_->{network_score} } @old);
        if (defined($baseline) && $baseline - $sample{network_score} >= 15) {
            $add->(key=>'predict-network',severity=>'warning',type=>'predictive',title=>'Netwerkkwaliteit verslechtert',detail=>sprintf('Netwerkscore %.0f/100 ligt duidelijk onder het recente gemiddelde van %.0f/100.', $sample{network_score}, $baseline));
        }
    }

    my @speed_rows = metric_rows($history, 'download', $now - 7*86400);
    if (defined($sample{download}) && @speed_rows >= 4) {
        my @old = grep { 0 + ($_->{time}||0) < $now - 2*3600 } @speed_rows;
        my $baseline = average(map { 0 + $_->{download} } @old);
        if (defined($baseline) && $baseline >= 50 && $sample{download} < $baseline * 0.70) {
            $add->(key=>'predict-speed',severity=>'warning',type=>'predictive',title=>'Internetsnelheid lager dan normaal',detail=>sprintf('Download %.1f Mbit/s tegenover recent gemiddeld %.1f Mbit/s.', $sample{download}, $baseline));
        }
    }

    my @score_rows = metric_rows($history, 'score', $now - 24*3600);
    if (defined($score) && @score_rows >= 3) {
        my $baseline = average(map { 0 + $_->{score} } @score_rows[0 .. $#score_rows-1]);
        if (defined($baseline) && $baseline - $score >= 10) {
            $add->(key=>'predict-health-drop',severity=>'warning',type=>'predictive',title=>'Health Score daalt',detail=>sprintf('De score is %.0f punten lager dan het recente gemiddelde.', $baseline - $score));
        }
    }

    resolve_missing($notifications, \%current);
    $notifications = normalize_notifications($notifications);
    write_json($HISTORY_FILE, $history) or json_reply({ok=>JSON::PP::false,error=>'Historie kon niet worden opgeslagen'}, '500 Internal Server Error');
    write_json($NOTIFY_FILE, $notifications) or json_reply({ok=>JSON::PP::false,error=>'Meldingen konden niet worden opgeslagen'}, '500 Internal Server Error');
    json_reply(payload($history, $notifications));
}

if ($action eq 'mark_read') {
    my $id = clean_text(query_value('id'), 100);
    for my $item (@$notifications) { $item->{read} = JSON::PP::true if ($item->{id} || '') eq $id; }
    write_json($NOTIFY_FILE, $notifications) or json_reply({ok=>JSON::PP::false,error=>'Melding kon niet worden bijgewerkt'}, '500 Internal Server Error');
    json_reply(payload($history, $notifications));
}

if ($action eq 'mark_all_read') {
    $_->{read} = JSON::PP::true for grep { $_->{active} } @$notifications;
    write_json($NOTIFY_FILE, $notifications) or json_reply({ok=>JSON::PP::false,error=>'Meldingen konden niet worden bijgewerkt'}, '500 Internal Server Error');
    json_reply(payload($history, $notifications));
}

if ($action eq 'dismiss') {
    my $id = clean_text(query_value('id'), 100);
    for my $item (@$notifications) {
        next unless ($item->{id} || '') eq $id;
        $item->{active} = JSON::PP::false;
        $item->{read} = JSON::PP::true;
        $item->{resolved_at} = time;
    }
    write_json($NOTIFY_FILE, $notifications) or json_reply({ok=>JSON::PP::false,error=>'Melding kon niet worden gesloten'}, '500 Internal Server Error');
    json_reply(payload($history, $notifications));
}

if ($action eq 'clear_resolved') {
    my @keep = grep { $_->{active} } @$notifications;
    $notifications = \@keep;
    write_json($NOTIFY_FILE, $notifications) or json_reply({ok=>JSON::PP::false,error=>'Opgeloste meldingen konden niet worden gewist'}, '500 Internal Server Error');
    json_reply(payload($history, $notifications));
}

json_reply({ok=>JSON::PP::false,error=>'Onbekende Intelligence-actie'}, '400 Bad Request');
