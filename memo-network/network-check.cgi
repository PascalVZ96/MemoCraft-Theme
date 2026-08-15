#!/usr/bin/perl
use strict;
use warnings;
use JSON::PP;
use Fcntl qw(:flock);

my $CACHE_FILE = '/var/tmp/memonetwork-network-check-v5.json';
my $LOCK_FILE = '/tmp/memonetwork-network-check-v5.lock';

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

sub post_allowed {
    return (($ENV{'REQUEST_METHOD'} || '') eq 'POST' && ($ENV{'HTTP_X_REQUESTED_WITH'} || '') eq 'MemoNetwork');
}

sub text_value {
    my ($value) = @_;
    return '' unless defined $value;
    $value = "$value";
    $value =~ s/^\s+|\s+$//g;
    return $value;
}

sub read_cache {
    return undef unless -f $CACHE_FILE;
    open my $fh, '<', $CACHE_FILE or return undef;
    local $/;
    my $raw = <$fh> // '';
    close $fh;
    return undef unless $raw =~ /\S/;
    my $data = eval { decode_json($raw) };
    return $@ ? undef : $data;
}

sub write_cache {
    my ($data) = @_;
    my $tmp = "$CACHE_FILE.$$";
    open my $fh, '>', $tmp or return 0;
    print {$fh} encode_json($data);
    close $fh or return 0;
    return rename($tmp, $CACHE_FILE) ? 1 : 0;
}

sub binary {
    for my $path (@_) {
        return $path if -x $path;
    }
    return '';
}

sub run_capture {
    my ($limit, @cmd) = @_;
    my $output = '';
    my $pid = open my $fh, '-|', @cmd;
    return ('', 127) unless defined $pid;
    while (my $line = <$fh>) {
        $output .= $line;
        last if length($output) > $limit;
    }
    close $fh;
    return ($output, $? >> 8);
}

sub route_info {
    my $ip = binary('/usr/sbin/ip', '/usr/bin/ip', '/bin/ip');
    return { interface => '', gateway => '', source => '' } unless $ip;
    my ($out, $exit) = run_capture(8192, $ip, '-4', 'route', 'show', 'default');
    return { interface => '', gateway => '', source => '' } if $exit != 0;
    my ($line) = grep { /\S/ } split /\n/, $out;
    $line //= '';
    my ($gateway) = $line =~ /\bvia\s+([0-9.]+)/;
    my ($interface) = $line =~ /\bdev\s+([A-Za-z0-9_.:-]+)/;
    my ($source) = $line =~ /\bsrc\s+([0-9.]+)/;
    return {
        interface => text_value($interface),
        gateway => text_value($gateway),
        source => text_value($source),
    };
}

sub nameservers {
    my @items;
    if (open my $fh, '<', '/etc/resolv.conf') {
        while (<$fh>) {
            if (/^\s*nameserver\s+([^\s#]+)/) {
                my $value = text_value($1);
                push @items, $value if length($value) && @items < 4;
            }
        }
        close $fh;
    }
    return @items;
}

sub ping_target {
    my ($target) = @_;
    my $ping = binary('/usr/bin/ping', '/bin/ping');
    return { available => JSON::PP::false, ok => JSON::PP::false, latency_ms => JSON::PP::null, packet_loss_percent => JSON::PP::null } unless $ping;

    my ($out, $exit) = run_capture(32768, $ping, '-n', '-c', '4', '-W', '2', $target);
    my ($loss) = $out =~ /(\d+(?:\.\d+)?)%\s+packet loss/;
    my ($avg) = $out =~ /=\s*[0-9.]+\/([0-9.]+)\/[0-9.]+\/[0-9.]+\s*ms/;
    my $ok = ($exit == 0 && defined($loss) && $loss < 100) ? JSON::PP::true : JSON::PP::false;
    return {
        available => JSON::PP::true,
        ok => $ok,
        latency_ms => defined($avg) ? sprintf('%.2f', $avg) + 0 : JSON::PP::null,
        packet_loss_percent => defined($loss) ? sprintf('%.1f', $loss) + 0 : JSON::PP::null,
    };
}

sub dns_test {
    my $getent = binary('/usr/bin/getent', '/bin/getent');
    return { available => JSON::PP::false, ok => JSON::PP::false, address => '' } unless $getent;
    my ($out, $exit) = run_capture(16384, $getent, 'ahostsv4', 'example.com');
    my ($address) = $out =~ /^([0-9.]+)\s/m;
    return {
        available => JSON::PP::true,
        ok => ($exit == 0 && $address) ? JSON::PP::true : JSON::PP::false,
        address => text_value($address),
    };
}

sub current_status {
    my $route = route_info();
    my @dns = nameservers();
    return {
        route => $route,
        nameservers => \@dns,
        result => (read_cache() // JSON::PP::null),
    };
}

my $method = $ENV{'REQUEST_METHOD'} || 'GET';
if ($method eq 'GET') {
    my $status = current_status();
    json_reply({ ok => JSON::PP::true, %$status });
}

json_reply({ ok => JSON::PP::false, error => 'Ongeldige netwerkcontrole-aanvraag' }, '403 Forbidden') unless post_allowed();

open my $lock, '>', $LOCK_FILE or json_reply({ ok => JSON::PP::false, error => 'Netwerkcontrole-lock kon niet worden geopend' }, '500 Internal Server Error');
json_reply({ ok => JSON::PP::false, error => 'Er draait al een netwerkcontrole' }, '409 Conflict') unless flock($lock, LOCK_EX | LOCK_NB);

my $result;
my $error = '';
{
    local $SIG{ALRM} = sub { die "Netwerkcontrole duurde te lang\n" };
    eval {
        alarm 20;
        my $route = route_info();
        my @dns = nameservers();
        my $internet = ping_target('1.1.1.1');
        my $dns_test = dns_test();
        my $gateway_test = ($route->{gateway} && $route->{gateway} =~ /^\d{1,3}(?:\.\d{1,3}){3}$/)
            ? ping_target($route->{gateway})
            : { available => JSON::PP::false, ok => JSON::PP::false, latency_ms => JSON::PP::null, packet_loss_percent => JSON::PP::null };

        my $score = 0;
        $score += 15 if $route->{interface} && $route->{gateway};
        $score += 20 if $gateway_test->{ok};
        $score += 40 if $internet->{ok};
        $score += 25 if $dns_test->{ok};

        $result = {
            score => $score,
            route_ok => ($route->{interface} && $route->{gateway}) ? JSON::PP::true : JSON::PP::false,
            interface => $route->{interface},
            gateway => $route->{gateway},
            source_ip => $route->{source},
            gateway_test => $gateway_test,
            internet => $internet,
            dns => $dns_test,
            nameservers => \@dns,
            tested_at => time,
        };
        write_cache($result);
        alarm 0;
    };
    if ($@) {
        $error = text_value($@);
        alarm 0;
    }
}

json_reply({ ok => JSON::PP::false, error => ($error || 'Netwerkcontrole mislukt') }, '500 Internal Server Error') if $error || ref($result) ne 'HASH';
json_reply({ ok => JSON::PP::true, result => $result });
