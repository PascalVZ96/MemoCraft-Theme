#!/usr/bin/perl
use strict;
use warnings;
use POSIX qw(setsid);
use JSON::PP;

sub first_line {
    my ($path) = @_;
    open my $fh, '<', $path or return '';
    my $line = <$fh> // '';
    close $fh;
    chomp $line;
    return $line;
}

sub urldecode {
    my ($value) = @_;
    $value //= '';
    $value =~ tr/+/ /;
    $value =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
    return $value;
}

sub query_params {
    my %params;
    for my $pair (split /&/, ($ENV{'QUERY_STRING'} || '')) {
        my ($key, $value) = split /=/, $pair, 2;
        next unless defined $key;
        $params{urldecode($key)} = urldecode($value // '');
    }
    return %params;
}

sub json_reply {
    my ($payload, $status) = @_;
    $status ||= '200 OK';
    print "Status: $status\r\n" unless $status eq '200 OK';
    print "Content-Type: application/json; charset=UTF-8\r\n";
    print "Cache-Control: no-store\r\n\r\n";
    print encode_json($payload);
    exit 0;
}

sub dashboard_post_allowed {
    return (($ENV{'REQUEST_METHOD'} || '') eq 'POST' && ($ENV{'HTTP_X_REQUESTED_WITH'} || '') eq 'MemoNetwork');
}

my %query = query_params();
my $action = $query{'action'} || '';

if ($action eq 'reboot' && ($ENV{'REQUEST_METHOD'} || '') eq 'POST') {
    json_reply({ ok => JSON::PP::false, error => 'Ongeldige dashboardaanvraag' }, '403 Forbidden') unless dashboard_post_allowed();

    my $pid = fork();
    if (!defined $pid) {
        json_reply({ ok => JSON::PP::false, error => 'Herstart kon niet worden ingepland' }, '500 Internal Server Error');
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

    json_reply({ ok => JSON::PP::true, message => 'Herstart ingepland' });
}

if ($action eq 'docker' && ($ENV{'REQUEST_METHOD'} || '') eq 'POST') {
    json_reply({ ok => JSON::PP::false, error => 'Ongeldige dashboardaanvraag' }, '403 Forbidden') unless dashboard_post_allowed();

    my $operation = $query{'operation'} || '';
    my $container = $query{'container'} || '';
    my %allowed = map { $_ => 1 } qw(start stop restart);

    json_reply({ ok => JSON::PP::false, error => 'Ongeldige Docker-actie' }, '400 Bad Request') unless $allowed{$operation};
    json_reply({ ok => JSON::PP::false, error => 'Ongeldige containernaam' }, '400 Bad Request')
        unless $container =~ /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;

    my $docker = -x '/usr/bin/docker' ? '/usr/bin/docker' : -x '/bin/docker' ? '/bin/docker' : '';
    json_reply({ ok => JSON::PP::false, error => 'Docker is niet beschikbaar' }, '503 Service Unavailable') unless $docker;

    my $output = '';
    my $pid = open my $fh, '-|', $docker, $operation, $container;
    json_reply({ ok => JSON::PP::false, error => 'Docker-opdracht kon niet worden gestart' }, '500 Internal Server Error') unless defined $pid;
    while (<$fh>) {
        $output .= $_;
        last if length($output) > 4096;
    }
    close $fh;
    my $exit = $? >> 8;
    $output =~ s/^\s+|\s+$//g;

    if ($exit != 0) {
        json_reply({ ok => JSON::PP::false, error => ($output || "Docker gaf foutcode $exit") }, '500 Internal Server Error');
    }

    json_reply({
        ok => JSON::PP::true,
        operation => $operation,
        container => $container,
        message => ($output || "Docker $operation uitgevoerd"),
    });
}

sub html_escape {
    my ($value) = @_;
    $value //= '';
    $value =~ s/&/&amp;/g;
    $value =~ s/</&lt;/g;
    $value =~ s/>/&gt;/g;
    $value =~ s/"/&quot;/g;
    return $value;
}

sub update_count {
    my @lines = grep { /^Inst\s/ } `LC_ALL=C apt-get -s -o Debug::NoLocking=1 upgrade 2>/dev/null`;
    return scalar @lines;
}

sub human_uptime {
    my $seconds = 0 + (split /\s+/, first_line('/proc/uptime'))[0];
    my $days = int($seconds / 86400);
    $seconds %= 86400;
    my $hours = int($seconds / 3600);
    $seconds %= 3600;
    my $minutes = int($seconds / 60);
    return $days > 0 ? "$days dagen, $hours uur, $minutes minuten" : "$hours uur, $minutes minuten";
}

my $hostname = `hostname 2>/dev/null`; chomp $hostname;
my $kernel = `uname -srmo 2>/dev/null`; chomp $kernel;
my $os = '';
if (open my $fh, '<', '/etc/os-release') {
    while (<$fh>) {
        if (/^PRETTY_NAME="?(.*?)"?\s*$/) {
            $os = $1;
            last;
        }
    }
    close $fh;
}
my $cpu = '';
my $cores = 0;
if (open my $fh, '<', '/proc/cpuinfo') {
    while (<$fh>) {
        $cpu = $1 if !$cpu && /^model name\s*:\s*(.+)$/;
        $cores++ if /^processor\s*:/;
    }
    close $fh;
}
my $uptime = human_uptime();
my $processes = `ps -e --no-headers 2>/dev/null | wc -l`; chomp $processes;
my $updates = update_count();
my $reboot = -e '/var/run/reboot-required' ? 'Ja' : 'Nee';
my $backup_mount = `findmnt -T /mnt/backups -n -o TARGET,SOURCE 2>/dev/null`; chomp $backup_mount;
my ($backup_target, $backup_source) = split /\s+/, $backup_mount, 2;
my $backup_ok = defined($backup_target) && $backup_target eq '/mnt/backups' ? 'Gemount' : 'Niet gemount';

for ($hostname, $kernel, $os, $cpu, $uptime, $processes, $updates, $reboot, $backup_ok, $backup_source) {
    $_ = html_escape($_ // '');
}

print "Content-Type: text/html; charset=UTF-8\r\n\r\n";
print <<'HTML_HEAD';
<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>MemoNetwork Systeeminformatie</title>
<style>
:root{--bg:#08111c;--panel:#142033;--border:#2a3d57;--text:#f7f9ff;--muted:#8fa5bf;--blue:#38bdf8;--green:#34d399}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px Arial,sans-serif;padding:24px}.wrap{max-width:1180px;margin:auto}.head,.grid>div{background:linear-gradient(145deg,#17253a,#121e2e);border:1px solid var(--border);border-radius:14px}.head{padding:20px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:16px}.head h1{margin:0;font-size:24px}.head a{color:#8fd3ff;text-decoration:none}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.grid>div{padding:16px;min-width:0}.k{color:var(--muted);font-size:10px;text-transform:uppercase;font-weight:800;letter-spacing:.05em}.v{margin-top:8px;font-size:15px;font-weight:700;overflow-wrap:anywhere}.ok{color:#86efac}.actions{margin-top:16px;display:flex;gap:8px;flex-wrap:wrap}.actions a{display:inline-block;padding:9px 12px;border-radius:8px;border:1px solid #315d8a;background:#10213a;color:#9bd0ff;text-decoration:none;font-weight:700;font-size:12px}@media(max-width:850px){.grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){body{padding:12px}.head{align-items:flex-start;flex-direction:column}.grid{grid-template-columns:1fr}}
</style></head><body><div class="wrap"><div class="head"><h1>MemoNetwork Systeeminformatie</h1><a href="/right.cgi">← Terug naar dashboard</a></div><div class="grid">
HTML_HEAD
print "<div><div class=\"k\">Hostnaam</div><div class=\"v\">$hostname</div></div>\n";
print "<div><div class=\"k\">Besturingssysteem</div><div class=\"v\">$os</div></div>\n";
print "<div><div class=\"k\">Kernel</div><div class=\"v\">$kernel</div></div>\n";
print "<div><div class=\"k\">Processor</div><div class=\"v\">$cpu ($cores cores)</div></div>\n";
print "<div><div class=\"k\">Uptime</div><div class=\"v\">$uptime</div></div>\n";
print "<div><div class=\"k\">Processen</div><div class=\"v\">$processes</div></div>\n";
print "<div><div class=\"k\">Updates beschikbaar</div><div class=\"v\">$updates</div></div>\n";
print "<div><div class=\"k\">Herstart vereist</div><div class=\"v\">$reboot</div></div>\n";
print "<div><div class=\"k\">Backup HDD</div><div class=\"v\">$backup_ok" . ($backup_source ? " · $backup_source" : '') . "</div></div>\n";
print "</div><div class=\"actions\"><a href=\"/mount/index.cgi\">Schijven beheren</a><a href=\"/package-updates/index.cgi\">Updates openen</a><a href=\"/memo-network/processes.cgi\">Processen bekijken</a></div></div></body></html>\n";
