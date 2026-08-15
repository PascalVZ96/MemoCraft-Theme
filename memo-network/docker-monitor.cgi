#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;

sub json_reply {
    my ($payload, $status) = @_;
    $status ||= '200 OK';
    print "Status: $status\r\n" unless $status eq '200 OK';
    print "Content-Type: application/json; charset=UTF-8\r\n";
    print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
    print "Pragma: no-cache\r\n\r\n";
    print encode_json($payload);
    exit 0;
}

sub text_value {
    my ($value) = @_;
    return '' unless defined $value;
    $value = "$value";
    $value =~ s/^\s+|\s+$//g;
    return $value;
}

sub url_decode {
    my ($value) = @_;
    $value //= '';
    $value =~ tr/+/ /;
    $value =~ s/%([0-9A-Fa-f]{2})/chr(hex($1))/eg;
    return $value;
}

sub query_value {
    my ($name) = @_;
    my $query = $ENV{'QUERY_STRING'} || '';
    for my $part (split /&/, $query) {
        my ($key, $value) = split /=/, $part, 2;
        next unless url_decode($key) eq $name;
        return url_decode($value);
    }
    return '';
}

sub run_stdout {
    my ($limit, @command) = @_;
    my $output = '';
    my $pid = open my $fh, '-|', @command;
    return ('', 127) unless defined $pid;
    while (my $line = <$fh>) {
        if (length($output) < $limit) {
            my $remaining = $limit - length($output);
            $output .= substr($line, 0, $remaining);
        }
    }
    close $fh;
    return ($output, $? >> 8);
}

sub run_combined {
    my ($limit, @command) = @_;
    pipe(my $reader, my $writer) or return ('', 127);
    my $pid = fork();
    return ('', 127) unless defined $pid;

    if ($pid == 0) {
        close $reader;
        open STDOUT, '>&', $writer or exit 127;
        open STDERR, '>&', $writer or exit 127;
        close $writer;
        exec {$command[0]} @command;
        exit 127;
    }

    close $writer;
    my $output = '';
    while (1) {
        my $read = sysread($reader, my $buffer, 8192);
        last unless defined($read) && $read > 0;
        if (length($output) < $limit) {
            my $remaining = $limit - length($output);
            $output .= substr($buffer, 0, $remaining);
        }
    }
    close $reader;
    waitpid($pid, 0);
    return ($output, $? >> 8);
}

sub port_rows {
    my ($inspect) = @_;
    my $ports = ref($inspect->{NetworkSettings}) eq 'HASH' && ref($inspect->{NetworkSettings}->{Ports}) eq 'HASH'
        ? $inspect->{NetworkSettings}->{Ports}
        : {};
    my @rows;
    for my $container_port (sort keys %$ports) {
        my $bindings = $ports->{$container_port};
        if (ref($bindings) eq 'ARRAY' && @$bindings) {
            for my $binding (@$bindings) {
                next unless ref($binding) eq 'HASH';
                my $host_ip = text_value($binding->{HostIp}) || '0.0.0.0';
                my $host_port = text_value($binding->{HostPort});
                push @rows, "$container_port -> $host_ip:$host_port" if $host_port;
            }
        } else {
            push @rows, $container_port;
        }
    }
    return @rows;
}

my $method = $ENV{'REQUEST_METHOD'} || 'GET';
json_reply({ ok => JSON::PP::false, error => 'Alleen GET is toegestaan' }, '405 Method Not Allowed') unless $method eq 'GET';

my $container = query_value('container');
json_reply({ ok => JSON::PP::false, error => 'Ongeldige containernaam' }, '400 Bad Request')
    unless $container =~ /^[A-Za-z0-9][A-Za-z0-9_.-]{0,127}$/;

my $docker = -x '/usr/bin/docker' ? '/usr/bin/docker' : -x '/bin/docker' ? '/bin/docker' : '';
json_reply({ ok => JSON::PP::false, error => 'Docker is niet beschikbaar' }, '503 Service Unavailable') unless $docker;

my ($names_output, $names_exit) = run_stdout(131072, $docker, 'ps', '-a', '--format', '{{.Names}}');
json_reply({ ok => JSON::PP::false, error => 'Docker-containers konden niet worden gelezen' }, '500 Internal Server Error') if $names_exit != 0;
my %containers = map { text_value($_) => 1 } grep { /\S/ } split /\n/, $names_output;
json_reply({ ok => JSON::PP::false, error => 'Container niet gevonden' }, '404 Not Found') unless $containers{$container};

my ($inspect_output, $inspect_exit) = run_stdout(1_048_576, $docker, 'inspect', $container);
json_reply({ ok => JSON::PP::false, error => 'Containerdetails konden niet worden gelezen' }, '500 Internal Server Error') if $inspect_exit != 0;
my $inspect_data = eval { decode_json($inspect_output) };
json_reply({ ok => JSON::PP::false, error => 'Ongeldige Docker inspect-respons' }, '500 Internal Server Error')
    if $@ || ref($inspect_data) ne 'ARRAY' || ref($inspect_data->[0]) ne 'HASH';
my $inspect = $inspect_data->[0];

my $state = ref($inspect->{State}) eq 'HASH' ? $inspect->{State} : {};
my $config = ref($inspect->{Config}) eq 'HASH' ? $inspect->{Config} : {};
my $health = ref($state->{Health}) eq 'HASH' ? text_value($state->{Health}->{Status}) : '';
my $running = $state->{Running} ? JSON::PP::true : JSON::PP::false;
my @ports = port_rows($inspect);

my $stats = JSON::PP::null;
if ($state->{Running}) {
    my ($stats_output, $stats_exit) = run_stdout(131072, $docker, 'stats', '--no-stream', '--format', '{{json .}}', $container);
    if ($stats_exit == 0 && $stats_output =~ /\S/) {
        my ($line) = grep { /\S/ } split /\n/, $stats_output;
        my $parsed = eval { decode_json($line || '') };
        $stats = $parsed if !$@ && ref($parsed) eq 'HASH';
    }
}

my @processes;
if ($state->{Running}) {
    my ($top_output, $top_exit) = run_stdout(131072, $docker, 'top', $container, '-eo', 'pid,pcpu,pmem,comm');
    if ($top_exit == 0) {
        my @lines = grep { /\S/ } split /\n/, $top_output;
        shift @lines if @lines;
        for my $line (@lines) {
            last if @processes >= 20;
            $line =~ s/^\s+|\s+$//g;
            my ($pid, $cpu, $memory, $command) = split /\s+/, $line, 4;
            next unless defined $command;
            push @processes, {
                pid => text_value($pid),
                cpu => text_value($cpu),
                memory => text_value($memory),
                command => text_value($command),
            };
        }
    }
}

my ($logs_output, $logs_exit) = run_combined(262144, $docker, 'logs', '--timestamps', '--tail', '120', $container);
my @logs = grep { length($_) } map { my $line = $_; $line =~ s/\r$//; $line } split /\n/, $logs_output;
splice(@logs, 0, @logs - 120) if @logs > 120;

json_reply({
    ok => JSON::PP::true,
    container => {
        name => $container,
        id => text_value($inspect->{Id}),
        image => text_value($config->{Image}),
        status => text_value($state->{Status}),
        running => $running,
        health => $health,
        started_at => text_value($state->{StartedAt}),
        finished_at => text_value($state->{FinishedAt}),
        exit_code => 0 + ($state->{ExitCode} || 0),
        error => text_value($state->{Error}),
        restart_count => 0 + ($inspect->{RestartCount} || 0),
        created => text_value($inspect->{Created}),
        ports => \@ports,
    },
    stats => $stats,
    processes => \@processes,
    logs => \@logs,
    logs_available => $logs_exit == 0 ? JSON::PP::true : JSON::PP::false,
    refreshed_at => time,
});
