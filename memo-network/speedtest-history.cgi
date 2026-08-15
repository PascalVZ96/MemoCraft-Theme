#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use Fcntl qw(:flock);

my $CACHE_FILE = '/var/tmp/memonetwork-speedtest-v5.json';
my $HISTORY_FILE = '/var/tmp/memonetwork-speedtest-v5-history.json';
my $LOCK_FILE = '/tmp/memonetwork-speedtest-v5.lock';
my $MAX_HISTORY = 90;

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

sub read_json_file {
    my ($path) = @_;
    return undef unless -f $path;
    open my $fh, '<', $path or return undef;
    local $/;
    my $raw = <$fh> // '';
    close $fh;
    return undef unless $raw =~ /\S/;
    my $data = eval { decode_json($raw) };
    return $@ ? undef : $data;
}

sub write_json_file {
    my ($path, $data) = @_;
    my $tmp = "$path.$$";
    open my $fh, '>', $tmp or return 0;
    print {$fh} encode_json($data);
    close $fh or return 0;
    return rename($tmp, $path) ? 1 : 0;
}

sub valid_history_item {
    my ($item) = @_;
    return 0 unless ref($item) eq 'HASH';
    return 0 unless ($item->{tested_at} || 0) =~ /^\d+$/;
    return 0 unless 0 + ($item->{download_mbps} || 0) > 0;
    return 0 unless 0 + ($item->{upload_mbps} || 0) > 0;
    return 1;
}

sub read_history {
    my $data = read_json_file($HISTORY_FILE);
    my @items = ref($data) eq 'ARRAY' ? grep { valid_history_item($_) } @$data : ();
    @items = sort { ($a->{tested_at} || 0) <=> ($b->{tested_at} || 0) } @items;
    splice(@items, 0, @items - $MAX_HISTORY) if @items > $MAX_HISTORY;
    return @items;
}

sub sync_cache {
    my (@items) = @_;
    if (@items) {
        write_json_file($CACHE_FILE, $items[-1]);
    } else {
        unlink $CACHE_FILE if -f $CACHE_FILE;
    }
}

json_reply({ ok => JSON::PP::false, error => 'Ongeldige geschiedenisaanvraag' }, '403 Forbidden') unless post_allowed();

my $query = $ENV{'QUERY_STRING'} || '';
my ($operation) = $query =~ /(?:^|&)operation=(delete|clear)(?:&|$)/;
json_reply({ ok => JSON::PP::false, error => 'Ongeldige geschiedenisactie' }, '400 Bad Request') unless $operation;

open my $lock, '>', $LOCK_FILE or json_reply({ ok => JSON::PP::false, error => 'Speedtest-lock kon niet worden geopend' }, '500 Internal Server Error');
json_reply({ ok => JSON::PP::false, error => 'Speedtest of geschiedenisbeheer is momenteel bezig' }, '409 Conflict') unless flock($lock, LOCK_EX | LOCK_NB);

my @history = read_history();

if ($operation eq 'delete') {
    my ($tested_at) = $query =~ /(?:^|&)tested_at=(\d{9,12})(?:&|$)/;
    json_reply({ ok => JSON::PP::false, error => 'Ongeldig meettijdstip' }, '400 Bad Request') unless $tested_at;

    my $before = scalar @history;
    @history = grep { 0 + ($_->{tested_at} || 0) != 0 + $tested_at } @history;
    json_reply({ ok => JSON::PP::false, error => 'Meting niet gevonden' }, '404 Not Found') if scalar(@history) == $before;

    write_json_file($HISTORY_FILE, \@history)
        or json_reply({ ok => JSON::PP::false, error => 'Geschiedenis kon niet worden opgeslagen' }, '500 Internal Server Error');

    my $cache = read_json_file($CACHE_FILE);
    if (ref($cache) eq 'HASH' && 0 + ($cache->{tested_at} || 0) == 0 + $tested_at) {
        sync_cache(@history);
    }

    json_reply({ ok => JSON::PP::true, deleted => 0 + $tested_at, history => \@history });
}

my ($confirm) = $query =~ /(?:^|&)confirm=([A-Za-z]+)(?:&|$)/;
json_reply({ ok => JSON::PP::false, error => 'Bevestiging ontbreekt' }, '400 Bad Request') unless ($confirm || '') eq 'all';

write_json_file($HISTORY_FILE, [])
    or json_reply({ ok => JSON::PP::false, error => 'Geschiedenis kon niet worden geleegd' }, '500 Internal Server Error');
unlink $CACHE_FILE if -f $CACHE_FILE;
json_reply({ ok => JSON::PP::true, cleared => JSON::PP::true, history => [] });
