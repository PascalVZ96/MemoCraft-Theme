#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use lib '/usr/share/webmin';
use WebminCore;

our $no_acl_check;
our $current_lang;
$no_acl_check = 1;
&init_config();

my $raw = defined($current_lang) && length($current_lang) ? $current_lang : 'en';
my $language = $raw =~ /^de(?:[_\.-]|$)/i ? 'de'
             : $raw =~ /^nl(?:[_\.-]|$)/i ? 'nl'
             : 'en';

print "Content-Type: application/json; charset=UTF-8\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json({
    language => $language,
    webmin_language => $raw,
    supported => [qw(nl de en)],
});
