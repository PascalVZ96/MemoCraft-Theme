#!/usr/bin/perl
use strict;
use warnings;
use POSIX qw(setsid);

print "Content-Type: application/json; charset=UTF-8\r\n";
print "Cache-Control: no-store\r\n\r\n";

if (($ENV{'REQUEST_METHOD'} || '') ne 'POST') {
    print '{"ok":false,"error":"POST required"}';
    exit 0;
}

my $pid = fork();
if (!defined $pid) {
    print '{"ok":false,"error":"Could not start reboot"}';
    exit 0;
}

if ($pid == 0) {
    setsid();
    open STDIN,  '<', '/dev/null';
    open STDOUT, '>', '/dev/null';
    open STDERR, '>', '/dev/null';
    sleep 2;

    if (-x '/usr/bin/systemctl') {
        exec '/usr/bin/systemctl', 'reboot';
    }
    elsif (-x '/bin/systemctl') {
        exec '/bin/systemctl', 'reboot';
    }
    elsif (-x '/sbin/reboot') {
        exec '/sbin/reboot';
    }
    exit 1;
}

print '{"ok":true,"message":"Reboot scheduled"}';
