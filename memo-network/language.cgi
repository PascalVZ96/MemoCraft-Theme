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

my $cookie = $ENV{'HTTP_COOKIE'} || '';
my ($hint) = $cookie =~ /(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i;
$hint = lc($hint || '');

my $webmin_raw = defined($current_lang) && length($current_lang) ? $current_lang : '';
my $webmin_language = $webmin_raw =~ /^de(?:[_\.-]|$)/i ? 'de'
                    : $webmin_raw =~ /^nl(?:[_\.-]|$)/i ? 'nl'
                    : $webmin_raw =~ /^en(?:[_\.-]|$)/i ? 'en'
                    : '';

# WebminCore is authoritative. The memo_lang cookie is only a fallback when
# Webmin does not expose a supported language, so a stale browser hint can no
# longer temporarily switch the Control Center to another language.
my $language = $webmin_language || $hint || 'en';
my $source = $webmin_language ? 'webmin-core' : ($hint ? 'memo-cookie-fallback' : 'fallback');

print "Content-Type: application/json; charset=UTF-8\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print encode_json({
    language => $language,
    source => $source,
    webmin_language => ($webmin_raw || 'unknown'),
    supported => [qw(nl de en)],
});
