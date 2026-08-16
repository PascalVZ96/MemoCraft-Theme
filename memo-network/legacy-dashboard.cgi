#!/usr/bin/perl
use strict;
use warnings;

my $theme_dir = '/usr/share/webmin/memocraft-theme';
my $legacy = "$theme_dir/memo-dashboard.cgi";

unless (-f $legacy) {
    print "Status: 404 Not Found\r\n";
    print "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    print "Legacy MemoNetwork dashboard ontbreekt.\n";
    exit 0;
}

unless (chdir $theme_dir) {
    print "Status: 500 Internal Server Error\r\n";
    print "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
    print "Kan de MemoNetwork theme-map niet openen.\n";
    exit 0;
}

exec '/usr/bin/perl', $legacy;

print "Status: 500 Internal Server Error\r\n";
print "Content-Type: text/plain; charset=UTF-8\r\n\r\n";
print "Legacy MemoNetwork dashboard kon niet worden gestart.\n";
