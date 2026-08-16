#!/usr/bin/perl
use strict;
use warnings;

my $source = '/usr/share/webmin/memocraft-theme/memo-dashboard.cgi';

sub error_page {
    my ($status, $message) = @_;
    print "Status: $status\r\n";
    print "Content-Type: text/html; charset=UTF-8\r\n";
    print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
    print "Pragma: no-cache\r\n\r\n";
    print "<!doctype html><html><head><meta charset=\"utf-8\"><title>MemoNetwork Legacy</title></head><body>";
    print "<h1>MemoNetwork Legacy Dashboard</h1><p>$message</p></body></html>";
    exit 0;
}

open my $fh, '<', $source or error_page('404 Not Found', 'Het legacy dashboardbestand ontbreekt.');
local $/;
my $code = <$fh>;
close $fh;

my ($body) = $code =~ /print\s+<<'HTML';\s*\n(.*?)\nHTML\s*\n/s;
error_page('500 Internal Server Error', 'De legacy dashboardweergave kon niet uit het bronbestand worden gelezen.') unless defined $body && length $body;

# Gebruik de huidige, gecontroleerde MemoNetwork-endpoints in plaats van oude
# Webmin- of right.cgi-routes. De legacy-pagina blijft daarmee alleen een
# weergavelaag bovenop de actuele v5-backends.
$body =~ s{/system-status/index\.cgi}{/memo-network/system-info.cgi}g;
$body =~ s{/sysinfo/index\.cgi}{/memo-network/system-info.cgi}g;
$body =~ s{/proc/index\.cgi}{/memo-network/processes.cgi}g;
$body =~ s{ target="_top"}{}g;
$body =~ s{fetch\('/right\.cgi\?memo_stats=1&_='\+Date\.now\(\)}{fetch('/memo-network/live-stats.cgi?_='+Date.now()}g;
$body =~ s{fetch\(\(window\.location\.pathname \|\| '/right\.cgi'\)\+'\?memo_stats=1&_='\+Date\.now\(\)}{fetch('/memo-network/live-stats.cgi?_='+Date.now()}g;

print "Content-Type: text/html; charset=UTF-8\r\n";
print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
print "Pragma: no-cache\r\n\r\n";
print <<'HEAD';
<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MemoNetwork Legacy Dashboard v4</title>
</head>
<body>
HEAD
print $body;
print <<'FOOT';
<script src="/memocraft-theme/dashboard-i18n.js"></script>
</body>
</html>
FOOT
