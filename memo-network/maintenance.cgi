#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use File::Path qw(make_path);

my $STATE_DIR = '/var/lib/memonetwork';
my $STATE_FILE = "$STATE_DIR/maintenance.json";
my $MAX_DURATION = 24 * 60;

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

sub read_state {
    return {} unless -f $STATE_FILE;
    open my $fh, '<', $STATE_FILE or return {};
    local $/;
    my $raw = <$fh> // '';
    close $fh;
    my $data = eval { decode_json($raw) };
    return $@ || ref($data) ne 'HASH' ? {} : $data;
}

sub write_state {
    my ($data) = @_;
    make_path($STATE_DIR, { mode => 0700 }) unless -d $STATE_DIR;
    my $tmp = "$STATE_FILE.$$";
    open my $fh, '>', $tmp or return 0;
    chmod 0600, $tmp;
    print {$fh} encode_json($data);
    close $fh or return 0;
    return rename($tmp, $STATE_FILE) ? 1 : 0;
}

sub status_payload {
    my $state = read_state();
    my $now = time;
    my $until = 0 + ($state->{until} || 0);
    my $active = ($state->{active} && $until > $now) ? 1 : 0;

    if (!$active && $state->{active}) {
        $state->{active} = JSON::PP::false;
        $state->{expired_at} = $now;
        write_state($state);
    }

    return {
        ok => JSON::PP::true,
        active => $active ? JSON::PP::true : JSON::PP::false,
        started_at => 0 + ($state->{started_at} || 0),
        until => $active ? $until : 0,
        remaining_seconds => $active ? ($until - $now) : 0,
        reason => clean_text($state->{reason} || '', 160),
        started_by => clean_text($state->{started_by} || '', 80),
        expired_at => 0 + ($state->{expired_at} || 0),
        stopped_at => 0 + ($state->{stopped_at} || 0),
        max_duration_minutes => $MAX_DURATION,
        generated_at => $now,
    };
}

my $method = $ENV{'REQUEST_METHOD'} || 'GET';
if ($method eq 'GET') {
    json_reply(status_payload());
}

json_reply({ ok => JSON::PP::false, error => 'Ongeldige onderhoudsaanvraag' }, '403 Forbidden') unless post_allowed();
my $action = query_value('action');

if ($action eq 'start') {
    my $minutes = query_value('minutes');
    json_reply({ ok => JSON::PP::false, error => 'Ongeldige onderhoudsduur' }, '400 Bad Request') unless $minutes =~ /^\d+$/;
    $minutes = 0 + $minutes;
    json_reply({ ok => JSON::PP::false, error => 'Onderhoudsduur moet tussen 5 minuten en 24 uur liggen' }, '400 Bad Request') if $minutes < 5 || $minutes > $MAX_DURATION;

    my $now = time;
    my $reason = clean_text(query_value('reason'), 160);
    $reason = 'Gepland onderhoud' unless length $reason;
    my $user = clean_text($ENV{'REMOTE_USER'} || '', 80);
    my $state = {
        active => JSON::PP::true,
        started_at => $now,
        until => $now + ($minutes * 60),
        reason => $reason,
        started_by => $user,
        stopped_at => 0,
        expired_at => 0,
    };
    write_state($state) or json_reply({ ok => JSON::PP::false, error => 'Onderhoudsstatus kon niet worden opgeslagen' }, '500 Internal Server Error');
    json_reply(status_payload());
}

if ($action eq 'stop') {
    my $state = read_state();
    $state->{active} = JSON::PP::false;
    $state->{until} = 0;
    $state->{stopped_at} = time;
    write_state($state) or json_reply({ ok => JSON::PP::false, error => 'Onderhoudsstatus kon niet worden gestopt' }, '500 Internal Server Error');
    json_reply(status_payload());
}

json_reply({ ok => JSON::PP::false, error => 'Onbekende onderhoudsactie' }, '400 Bad Request');
