#!/usr/bin/perl
use strict;
use warnings;

sub first_line {
    my ($path)=@_;
    open my $fh,'<',$path or return '';
    my $line=<$fh>//'';
    close $fh;
    chomp $line;
    return $line;
}

my $hostname = `hostname 2>/dev/null`; chomp $hostname;
my $kernel = `uname -srmo 2>/dev/null`; chomp $kernel;
my $os = first_line('/etc/os-release');
if (open my $fh,'<','/etc/os-release') {
    while (<$fh>) { if (/^PRETTY_NAME="?(.*?)"?$/) { $os=$1; last; } }
    close $fh;
}
my $cpu = '';
if (open my $fh,'<','/proc/cpuinfo') {
    while (<$fh>) { if (/^model name\s*:\s*(.+)$/) { $cpu=$1; last; } }
    close $fh;
}
my $uptime = first_line('/proc/uptime');
$uptime = int(($uptime||0)/86400).' dagen';
my $processes = `ps -e --no-headers 2>/dev/null | wc -l`; chomp $processes;
my $updates = `apt list --upgradable 2>/dev/null | tail -n +2 | wc -l`; chomp $updates;
my $reboot = -e '/var/run/reboot-required' ? 'Ja' : 'Nee';

print "Content-Type: text/html; charset=UTF-8\r\n\r\n";
print <<HTML;
<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>Systeeminformatie</title>
<style>body{margin:0;background:#0a111b;color:#f7f9ff;font:14px Arial,sans-serif;padding:24px}.wrap{max-width:1100px;margin:auto}.head,.grid>div{background:#142033;border:1px solid #2a3d57;border-radius:14px}.head{padding:22px;margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.grid>div{padding:18px}.k{color:#8fa5bf;font-size:12px;text-transform:uppercase}.v{margin-top:8px;font-size:17px;font-weight:700}a{color:#7dc4ff}@media(max-width:700px){.grid{grid-template-columns:1fr}}</style></head><body><div class="wrap"><div class="head"><h1>MemoNetwork Systeeminformatie</h1><a href="/right.cgi">← Terug naar dashboard</a></div><div class="grid">
<div><div class="k">Hostnaam</div><div class="v">$hostname</div></div>
<div><div class="k">Besturingssysteem</div><div class="v">$os</div></div>
<div><div class="k">Kernel</div><div class="v">$kernel</div></div>
<div><div class="k">Processor</div><div class="v">$cpu</div></div>
<div><div class="k">Uptime</div><div class="v">$uptime</div></div>
<div><div class="k">Processen</div><div class="v">$processes</div></div>
<div><div class="k">Updates beschikbaar</div><div class="v">$updates</div></div>
<div><div class="k">Herstart vereist</div><div class="v">$reboot</div></div>
</div></div></body></html>
HTML
