#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;

my $INSTALLED_VERSION = '5.0.3';
my $RELEASE_DATE = '16-08-2026';
my $REMOTE_URL = 'https://raw.githubusercontent.com/PascalVZ96/MemoCraft-Theme/main/version.json';

sub reply_json {
    my ($payload) = @_;
    print "Content-Type: application/json; charset=UTF-8\r\n";
    print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
    print "Pragma: no-cache\r\n\r\n";
    print encode_json($payload);
    exit 0;
}

sub capture {
    my (@command) = @_;
    my $output = '';
    my $pid = open my $fh, '-|', @command;
    return ('', 127) unless defined $pid;
    while (my $line = <$fh>) {
        $output .= $line;
        last if length($output) > 131072;
    }
    close $fh;
    return ($output, $? >> 8);
}

my ($raw, $exit) = ('', 127);
if (-x '/usr/bin/curl') {
    ($raw, $exit) = capture('/usr/bin/curl', '-fsSL', '--connect-timeout', '3', '--max-time', '6', $REMOTE_URL);
}
elsif (-x '/usr/bin/wget') {
    ($raw, $exit) = capture('/usr/bin/wget', '-qO-', '--timeout=6', $REMOTE_URL);
}

my $remote = $exit == 0 && $raw =~ /\S/ ? eval { decode_json($raw) } : undef;
my $latest = ref($remote) eq 'HASH' ? ($remote->{version} || '') : '';

reply_json({
    ok => JSON::PP::true,
    version => ($latest || $INSTALLED_VERSION),
    installed_version => $INSTALLED_VERSION,
    released => $RELEASE_DATE,
    remote_available => $latest ? JSON::PP::true : JSON::PP::false,
    source => $latest ? 'github-server-side' : 'installed-fallback',
});
