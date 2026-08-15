#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use File::Spec;

my $MODULE_DIR = '/usr/share/webmin/memo-network';
my $STATE_DIR = '/var/lib/memonetwork';

sub reply_json {
    my ($payload) = @_;
    print "Content-Type: application/json; charset=UTF-8\r\n";
    print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
    print "Pragma: no-cache\r\n\r\n";
    print encode_json($payload);
    exit 0;
}

sub command_exists {
    my ($name) = @_;
    return system("command -v '$name' >/dev/null 2>&1") == 0 ? JSON::PP::true : JSON::PP::false;
}

sub check {
    my ($items, %args) = @_;
    push @$items, {
        id => $args{id} || '',
        label => $args{label} || '',
        status => $args{status} || 'warn',
        detail => $args{detail} || '',
        critical => $args{critical} ? JSON::PP::true : JSON::PP::false,
    };
}

my @checks;

check(\@checks,
    id=>'module-dir', label=>'MemoNetwork modulemap', critical=>1,
    status=>(-d $MODULE_DIR ? 'pass' : 'fail'),
    detail=>(-d $MODULE_DIR ? $MODULE_DIR : 'Modulemap ontbreekt')
);

my @cgi = qw(
    live-stats.cgi backup-health.cgi security.cgi network-check.cgi speedtest.cgi
    reliability.cgi maintenance.cgi activity.cgi intelligence.cgi readiness.cgi
);
my @missing_cgi;
my @not_exec;
for my $name (@cgi) {
    my $path = File::Spec->catfile($MODULE_DIR, $name);
    push @missing_cgi, $name unless -f $path;
    push @not_exec, $name if -f $path && !-x $path;
}
check(\@checks,
    id=>'cgi-files', label=>'Backendbestanden', critical=>1,
    status=>(@missing_cgi ? 'fail' : 'pass'),
    detail=>(@missing_cgi ? 'Ontbreekt: '.join(', ', @missing_cgi) : scalar(@cgi).' CGI-backends aanwezig')
);
check(\@checks,
    id=>'cgi-exec', label=>'CGI uitvoerbaar', critical=>1,
    status=>(@not_exec ? 'fail' : 'pass'),
    detail=>(@not_exec ? 'Niet uitvoerbaar: '.join(', ', @not_exec) : 'Alle gecontroleerde CGI-bestanden zijn uitvoerbaar')
);

my @js = qw(
    control-center-operations.js control-center-incidents.js control-center-maintenance.js
    control-center-activity.js control-center-reliability.js control-center-healthscore.js
    control-center-intelligence.js control-center-readiness.js control-center-services.js
    control-center-container-monitor.js control-center-diagnostics.js control-center-logcenter.js
    control-center-log-explain.js control-center-security.js control-center-infrastructure.js
    control-center-backups.js control-center-speedtest.js control-center-networkcheck.js
);
my @missing_js;
for my $name (@js) {
    push @missing_js, $name unless -f File::Spec->catfile($MODULE_DIR, $name);
}
check(\@checks,
    id=>'runtime-files', label=>'v5 runtimes', critical=>1,
    status=>(@missing_js ? 'fail' : 'pass'),
    detail=>(@missing_js ? 'Ontbreekt: '.join(', ', @missing_js) : scalar(@js).' runtimebestanden aanwezig')
);

if (-d $STATE_DIR) {
    check(\@checks,
        id=>'state-dir', label=>'Server-side statusopslag', critical=>1,
        status=>(-r $STATE_DIR && -w $STATE_DIR ? 'pass' : 'fail'),
        detail=>(-r $STATE_DIR && -w $STATE_DIR ? "$STATE_DIR leesbaar en schrijfbaar" : "$STATE_DIR heeft onvoldoende rechten")
    );
} else {
    check(\@checks,
        id=>'state-dir', label=>'Server-side statusopslag', critical=>1,
        status=>'fail', detail=>"$STATE_DIR ontbreekt"
    );
}

for my $command (qw(perl findmnt docker wg systemctl)) {
    my $exists = command_exists($command);
    check(\@checks,
        id=>"cmd-$command", label=>"Commando: $command", critical=>($command eq 'perl' || $command eq 'findmnt'),
        status=>($exists ? 'pass' : (($command eq 'perl' || $command eq 'findmnt') ? 'fail' : 'warn')),
        detail=>($exists ? 'Beschikbaar' : 'Niet gevonden')
    );
}

my $mount_target = `findmnt -T /mnt/backups -n -o TARGET 2>/dev/null`;
chomp $mount_target;
check(\@checks,
    id=>'backup-mount', label=>'Backup-HDD mount', critical=>0,
    status=>($mount_target eq '/mnt/backups' ? 'pass' : 'warn'),
    detail=>($mount_target eq '/mnt/backups' ? '/mnt/backups is een eigen mountpoint' : 'Backupmount verdient controle')
);

my @state_files = qw(activity.json activity-observer.json intelligence-history.json intelligence-notifications.json maintenance.json);
my @bad_state;
for my $name (@state_files) {
    my $path = File::Spec->catfile($STATE_DIR, $name);
    next unless -e $path;
    push @bad_state, $name unless -r $path && -w $path;
}
check(\@checks,
    id=>'state-files', label=>'Statusbestanden', critical=>0,
    status=>(@bad_state ? 'warn' : 'pass'),
    detail=>(@bad_state ? 'Rechten controleren: '.join(', ', @bad_state) : 'Bestaande statusbestanden hebben bruikbare rechten')
);

my $fail = scalar grep { ($_->{status} || '') eq 'fail' } @checks;
my $warn = scalar grep { ($_->{status} || '') eq 'warn' } @checks;
my $critical_fail = scalar grep { ($_->{critical} && ($_->{status} || '') eq 'fail') } @checks;
my $pass = scalar grep { ($_->{status} || '') eq 'pass' } @checks;
my $ready_for_rc = $critical_fail == 0 ? JSON::PP::true : JSON::PP::false;
my $ready_for_stable = ($fail == 0 && $warn == 0) ? JSON::PP::true : JSON::PP::false;

reply_json({
    ok => JSON::PP::true,
    version => '5.0.0-rc1',
    release_stage => 'rc',
    generated_at => time,
    ready_for_rc => $ready_for_rc,
    ready_for_stable => $ready_for_stable,
    summary => {pass=>$pass, warn=>$warn, fail=>$fail, critical_fail=>$critical_fail, total=>scalar(@checks)},
    checks => \@checks,
});