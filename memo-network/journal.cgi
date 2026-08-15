#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;

my $MAX_LINES = 240;
my $MAX_OUTPUT = 2_000_000;

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

sub text_value {
    my ($value) = @_;
    return '' unless defined $value;
    $value = "$value";
    $value =~ s/[\x00-\x08\x0B\x0C\x0E-\x1F]//g;
    $value =~ s/^\s+|\s+$//g;
    return $value;
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

json_reply({ ok => JSON::PP::false, error => 'Alleen GET is toegestaan' }, '405 Method Not Allowed')
    unless (($ENV{'REQUEST_METHOD'} || 'GET') eq 'GET');

my $journalctl = -x '/usr/bin/journalctl' ? '/usr/bin/journalctl' : -x '/bin/journalctl' ? '/bin/journalctl' : '';
json_reply({ ok => JSON::PP::true, available => JSON::PP::false, items => [], units => [], error => 'journalctl niet gevonden' }) unless $journalctl;

my $period = query_value('period') || '1h';
my %period_args = (
    '1h'  => ['--since', '1 hour ago'],
    '6h'  => ['--since', '6 hours ago'],
    '24h' => ['--since', '24 hours ago'],
    'boot' => ['-b'],
);
json_reply({ ok => JSON::PP::false, error => 'Ongeldige logperiode' }, '400 Bad Request') unless exists $period_args{$period};

my @command = (
    $journalctl,
    '--no-pager',
    '--output=json',
    '--lines=' . $MAX_LINES,
    @{$period_args{$period}},
);

my $pid = open my $fh, '-|', @command;
json_reply({ ok => JSON::PP::false, error => 'Systeemlogboek kon niet worden gestart' }, '500 Internal Server Error') unless defined $pid;

my @items;
my %units;
my $total_bytes = 0;
my $parse_errors = 0;
while (my $line = <$fh>) {
    $total_bytes += length($line);
    last if $total_bytes > $MAX_OUTPUT;
    next unless $line =~ /\S/;
    my $row = eval { decode_json($line) };
    if ($@ || ref($row) ne 'HASH') {
        $parse_errors++;
        next;
    }

    my $message = text_value($row->{MESSAGE});
    next unless length $message;
    $message = substr($message, 0, 4096) if length($message) > 4096;

    my $unit = text_value($row->{_SYSTEMD_UNIT});
    my $source = $unit || text_value($row->{SYSLOG_IDENTIFIER}) || text_value($row->{_COMM}) || 'system';
    $units{$source} = 1 if length $source;

    my $priority = text_value($row->{PRIORITY});
    $priority = '6' unless $priority =~ /^[0-7]$/;
    my $stamp = text_value($row->{__REALTIME_TIMESTAMP});
    my $epoch = $stamp =~ /^\d+$/ ? int($stamp / 1_000_000) : time;

    push @items, {
        timestamp => $epoch,
        priority => 0 + $priority,
        unit => $unit,
        source => $source,
        pid => text_value($row->{_PID}),
        message => $message,
    };
}
close $fh;
my $exit = $? >> 8;
json_reply({ ok => JSON::PP::false, error => "journalctl eindigde met foutcode $exit" }, '500 Internal Server Error') if $exit != 0;

my %counts = (critical => 0, error => 0, warning => 0, total => scalar @items);
for my $item (@items) {
    my $p = 0 + ($item->{priority} // 6);
    $counts{critical}++ if $p <= 2;
    $counts{error}++ if $p <= 3;
    $counts{warning}++ if $p <= 4;
}

my @unit_list = sort { lc($a) cmp lc($b) } keys %units;
json_reply({
    ok => JSON::PP::true,
    available => JSON::PP::true,
    period => $period,
    generated_at => time,
    items => \@items,
    units => \@unit_list,
    counts => \%counts,
    parse_errors => $parse_errors,
    truncated => $total_bytes > $MAX_OUTPUT ? JSON::PP::true : JSON::PP::false,
});
