#!/usr/bin/perl
use strict;
use warnings;

my @rows = `ps -eo pid,user,%cpu,%mem,comm --sort=-%cpu 2>/dev/null | head -n 101`;
print "Content-Type: text/html; charset=UTF-8\r\n\r\n";
print <<'HTML';
<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Actieve processen</title>
<style>body{margin:0;background:#0a111b;color:#f7f9ff;font:14px Arial,sans-serif;padding:24px}.wrap{max-width:1200px;margin:auto}.head,.panel{background:#142033;border:1px solid #2a3d57;border-radius:14px}.head{padding:22px;margin-bottom:16px}.panel{overflow:auto}table{width:100%;border-collapse:collapse}th,td{padding:11px 14px;border-bottom:1px solid #24364d;text-align:left}th{color:#8fa5bf;text-transform:uppercase;font-size:12px}tr:hover{background:#17263b}a{color:#7dc4ff}</style></head><body><div class="wrap"><div class="head"><h1>Actieve processen</h1><a href="/right.cgi">← Terug naar dashboard</a></div><div class="panel"><table><thead><tr><th>PID</th><th>Gebruiker</th><th>CPU</th><th>Geheugen</th><th>Proces</th></tr></thead><tbody>
HTML
shift @rows;
for my $line (@rows) {
    next unless $line =~ /^\s*(\d+)\s+(\S+)\s+([\d.]+)\s+([\d.]+)\s+(.+?)\s*$/;
    my ($pid,$user,$cpu,$mem,$cmd)=($1,$2,$3,$4,$5);
    for ($user,$cmd) { s/&/&amp;/g; s/</&lt;/g; s/>/&gt;/g; }
    print "<tr><td>$pid</td><td>$user</td><td>$cpu%</td><td>$mem%</td><td>$cmd</td></tr>\n";
}
print <<'HTML';
</tbody></table></div></div></body></html>
HTML
