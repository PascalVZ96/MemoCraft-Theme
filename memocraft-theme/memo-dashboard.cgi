#!/usr/bin/perl
use strict;
use warnings;
no warnings 'redefine';
no warnings 'uninitialized';
use JSON::PP;
require "gray-theme/gray-theme-lib.pl";
require "gray-theme/theme.pl";
&ReadParse();
&load_theme_library();
our %in;

sub read_cpu {
    open my $fh, '<', '/proc/stat' or return (0, 0);
    my $line = <$fh> // '';
    close $fh;
    my @v = split /\s+/, $line;
    shift @v if @v && $v[0] eq 'cpu';
    my $idle = ($v[3] // 0) + ($v[4] // 0);
    my $total = 0;
    $total += $_ for @v;
    return ($idle, $total);
}

sub read_memory {
    open my $fh, '<', '/proc/meminfo' or return (0, 0);
    my %m;
    while (my $line = <$fh>) {
        $m{$1} = 0 + $2 if $line =~ /^([A-Za-z_()]+):\s+(\d+)/;
    }
    close $fh;
    my $total = $m{'MemTotal'} // 0;
    my $available = $m{'MemAvailable'} // (($m{'MemFree'} // 0) + ($m{'Buffers'} // 0) + ($m{'Cached'} // 0));
    my $used = $total - $available;
    return ($used > 0 ? $used : 0, $total);
}

sub read_network {
    open my $fh, '<', '/proc/net/dev' or return (0, 0);
    my ($rx, $tx) = (0, 0);
    while (my $line = <$fh>) {
        next unless $line =~ /^\s*([^:]+):\s*(.*)$/;
        my ($iface, $rest) = ($1, $2);
        $iface =~ s/^\s+|\s+$//g;
        next if $iface eq 'lo';
        my @v = split /\s+/, $rest;
        $rx += $v[0] // 0;
        $tx += $v[8] // 0;
    }
    close $fh;
    return ($rx, $tx);
}

sub read_load {
    open my $fh, '<', '/proc/loadavg' or return (0, 0, 0);
    my $line = <$fh> // '';
    close $fh;
    my ($one, $five, $fifteen) = split /\s+/, $line;
    return (0 + ($one // 0), 0 + ($five // 0), 0 + ($fifteen // 0));
}

sub process_running {
    my ($pattern) = @_;
    return system("pgrep -f '$pattern' >/dev/null 2>&1") == 0 ? JSON::PP::true : JSON::PP::false;
}

sub output_stats {
    my ($idle1, $total1) = read_cpu();
    my ($rx1, $tx1) = read_network();
    my $sample = 0.30;
    select undef, undef, undef, $sample;
    my ($idle2, $total2) = read_cpu();
    my ($rx2, $tx2) = read_network();

    my $delta_total = $total2 - $total1;
    my $delta_idle = $idle2 - $idle1;
    my $cpu = $delta_total > 0 ? 100 * (1 - ($delta_idle / $delta_total)) : 0;
    $cpu = 0 if $cpu < 0;
    $cpu = 100 if $cpu > 100;

    my ($ram_used, $ram_total) = read_memory();
    my ($load1, $load5, $load15) = read_load();
    my $rx = ($rx2 - $rx1) / 1024 / $sample;
    my $tx = ($tx2 - $tx1) / 1024 / $sample;
    $rx = 0 if $rx < 0;
    $tx = 0 if $tx < 0;

    my $payload = {
        cpu_percent => sprintf('%.1f', $cpu) + 0,
        ram_used_gib => sprintf('%.2f', $ram_used / 1048576) + 0,
        ram_total_gib => sprintf('%.2f', $ram_total / 1048576) + 0,
        network_rx_kib_s => sprintf('%.1f', $rx) + 0,
        network_tx_kib_s => sprintf('%.1f', $tx) + 0,
        load_1 => sprintf('%.2f', $load1) + 0,
        load_5 => sprintf('%.2f', $load5) + 0,
        load_15 => sprintf('%.2f', $load15) + 0,
        services => {
            docker => process_running('dockerd'),
            amp => process_running('ampinstmgr|AMP_Linux'),
            minio => process_running('minio'),
            wireguard => (-e '/sys/class/net/wg0' ? JSON::PP::true : JSON::PP::false),
        },
        timestamp => time,
    };

    print "Content-Type: application/json\r\n";
    print "Cache-Control: no-store, no-cache, must-revalidate\r\n";
    print "Pragma: no-cache\r\n\r\n";
    print encode_json($payload);
    exit;
}

output_stats() if $in{'memo_stats'};

&popup_header("MemoNetwork Dashboard");
print <<'HTML';
<style>
:root{--mn-bg:#0b111b;--mn-card:#131e2e;--mn-card2:#172438;--mn-border:#2a3b53;--mn-text:#f5f8ff;--mn-muted:#8ca0ba;--mn-blue:#38bdf8;--mn-purple:#a78bfa;--mn-green:#34d399;--mn-orange:#f59e0b}
html,body{background:var(--mn-bg)!important;color:var(--mn-text)!important}.mn-wrap{max-width:1600px;margin:0 auto;padding:20px}.mn-head{display:flex;justify-content:space-between;align-items:center;padding:24px;border:1px solid var(--mn-border);border-radius:16px;background:linear-gradient(145deg,#162236,#101827);margin-bottom:16px}.mn-head h1{margin:0;font-size:28px;color:#fff}.mn-head p{margin:7px 0 0;color:var(--mn-muted)}.mn-badge{padding:9px 13px;border:1px solid #315783;border-radius:999px;color:#7dc4ff;background:#10213a}.mn-grid4,.mn-grid2,.mn-services{display:grid;gap:14px;margin-bottom:14px}.mn-grid4{grid-template-columns:repeat(4,minmax(0,1fr))}.mn-grid2{grid-template-columns:2fr 1fr}.mn-services{grid-template-columns:repeat(4,minmax(0,1fr))}.mn-card{position:relative;min-height:130px;padding:18px;border:1px solid var(--mn-border);border-radius:15px;background:linear-gradient(145deg,var(--mn-card2),var(--mn-card));overflow:hidden}.mn-label{display:flex;justify-content:space-between;align-items:center;color:#b8c7da;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.mn-value{display:block;margin-top:16px;color:#fff;font-size:29px;font-weight:800}.mn-sub{display:block;margin-top:6px;color:var(--mn-muted);font-size:12px}.mn-meter{position:absolute;left:18px;right:18px;bottom:14px;height:6px;border-radius:999px;background:#0a1220;overflow:hidden}.mn-meter i{display:block;height:100%;width:0;border-radius:999px;transition:width .35s ease}.cpu i{background:linear-gradient(90deg,#38bdf8,#3b82f6)}.ram i{background:linear-gradient(90deg,#8b5cf6,#c084fc)}.disk i{background:linear-gradient(90deg,#22c55e,#2dd4bf)}.mn-network-values{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:15px}.mn-network-values span{display:block;color:var(--mn-muted);font-size:12px}.mn-network-values strong{display:block;margin-top:5px;font-size:25px}.mn-chart{position:absolute;left:18px;right:18px;bottom:12px;height:42px}.mn-chart svg{width:100%;height:100%;overflow:visible}.mn-line{fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.rx{stroke:var(--mn-blue)}.tx{stroke:var(--mn-purple)}.load{stroke:var(--mn-orange)}.mn-load-main{font-size:38px;font-weight:800;margin-top:10px}.mn-load-sub{display:flex;gap:14px;color:var(--mn-muted);font-size:12px}.mn-service{min-height:95px}.mn-service-name{font-weight:800}.mn-status{display:flex;align-items:center;gap:8px;margin-top:20px;color:#cbd7e7}.mn-dot{width:9px;height:9px;border-radius:50%;background:#64748b;box-shadow:0 0 0 4px rgba(100,116,139,.12)}.mn-dot.ok{background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,.12),0 0 10px rgba(34,197,94,.45)}.mn-dot.off{background:#ef4444;box-shadow:0 0 0 4px rgba(239,68,68,.12)}.mn-section-title{margin:22px 2px 10px;font-size:17px}.mn-live{color:#86efac;font-size:11px;font-weight:700}.mn-live:before{content:"";display:inline-block;width:7px;height:7px;margin-right:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 9px #22c55e}
@media(max-width:1100px){.mn-grid4,.mn-services{grid-template-columns:repeat(2,1fr)}.mn-grid2{grid-template-columns:1fr}}@media(max-width:650px){.mn-wrap{padding:12px}.mn-grid4,.mn-services{grid-template-columns:1fr}.mn-head{align-items:flex-start}.mn-badge{display:none}}
</style>
<div class="mn-wrap">
 <div class="mn-head"><div><h1>MemoNetwork Dashboard v2</h1><p>Live serverstatus en services</p></div><div class="mn-badge">Webmin 2.653</div></div>
 <div class="mn-grid4">
  <div class="mn-card cpu"><div class="mn-label">CPU <span class="mn-live">Live</span></div><strong class="mn-value" id="mn-cpu">--</strong><span class="mn-sub">Actuele belasting</span><div class="mn-meter"><i id="mn-cpu-bar"></i></div></div>
  <div class="mn-card ram"><div class="mn-label">Geheugen <span class="mn-live">Live</span></div><strong class="mn-value" id="mn-ram">--</strong><span class="mn-sub" id="mn-ram-total">Totaal geheugen</span><div class="mn-meter"><i id="mn-ram-bar"></i></div></div>
  <div class="mn-card disk"><div class="mn-label">Opslag</div><strong class="mn-value">1.85 TiB</strong><span class="mn-sub">4.47 TiB totaal</span><div class="mn-meter"><i style="width:41%"></i></div></div>
  <div class="mn-card"><div class="mn-label">Uptime</div><strong class="mn-value">18 dagen</strong><span class="mn-sub">Server online</span></div>
 </div>
 <div class="mn-grid2">
  <div class="mn-card"><div class="mn-label">Netwerkverkeer <span class="mn-live">Live</span></div><div class="mn-network-values"><div><span>Download</span><strong id="mn-rx">--</strong></div><div><span>Upload</span><strong id="mn-tx">--</strong></div></div><div class="mn-chart" id="mn-network-chart"></div></div>
  <div class="mn-card"><div class="mn-label">Load average <span>1 / 5 / 15 min</span></div><div class="mn-load-main" id="mn-load1">--</div><div class="mn-load-sub"><span id="mn-load5">5 min: --</span><span id="mn-load15">15 min: --</span></div><div class="mn-chart" id="mn-load-chart"></div></div>
 </div>
 <h2 class="mn-section-title">Services</h2>
 <div class="mn-services">
  <div class="mn-card mn-service"><div class="mn-service-name">Docker</div><div class="mn-status"><span class="mn-dot" id="mn-docker-dot"></span><span id="mn-docker">Controleren…</span></div></div>
  <div class="mn-card mn-service"><div class="mn-service-name">AMP</div><div class="mn-status"><span class="mn-dot" id="mn-amp-dot"></span><span id="mn-amp">Controleren…</span></div></div>
  <div class="mn-card mn-service"><div class="mn-service-name">MinIO</div><div class="mn-status"><span class="mn-dot" id="mn-minio-dot"></span><span id="mn-minio">Controleren…</span></div></div>
  <div class="mn-card mn-service"><div class="mn-service-name">WireGuard</div><div class="mn-status"><span class="mn-dot" id="mn-wireguard-dot"></span><span id="mn-wireguard">Controleren…</span></div></div>
 </div>
</div>
<script>
(function(){
 const hist={rx:[],tx:[],load:[]},limit=40;
 function push(a,v){a.push(Math.max(0,Number(v)||0));if(a.length>limit)a.shift()}
 function rate(v){v=Number(v)||0;return v>=1024?(v/1024).toFixed(v>=10240?0:1)+' MiB/s':v.toFixed(v>=100?0:1)+' KiB/s'}
 function path(a,max){if(!a.length)return'';max=max||Math.max(...a,1);return'M '+a.map((v,i)=>{const x=a.length>1?i*100/(a.length-1):0,y=40-Math.min(1,v/max)*38;return x.toFixed(2)+' '+y.toFixed(2)}).join(' L ')}
 function chart(id,series){const el=document.getElementById(id);if(!el)return;el.innerHTML='<svg viewBox="0 0 100 40" preserveAspectRatio="none">'+series.map(s=>'<path class="mn-line '+s.c+'" d="'+path(s.a,s.m)+'"></path>').join('')+'</svg>'}
 function setService(name,value){const text=document.getElementById('mn-'+name),dot=document.getElementById('mn-'+name+'-dot');if(!text||!dot)return;text.textContent=value?'Online':'Offline';dot.classList.toggle('ok',!!value);dot.classList.toggle('off',!value)}
 function update(){fetch('/right.cgi?memo_stats=1&_='+Date.now(),{credentials:'same-origin',cache:'no-store'}).then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(d=>{
  const cpu=Number(d.cpu_percent)||0,ru=Number(d.ram_used_gib)||0,rt=Number(d.ram_total_gib)||0,rx=Number(d.network_rx_kib_s)||0,tx=Number(d.network_tx_kib_s)||0,l1=Number(d.load_1)||0;
  document.getElementById('mn-cpu').textContent=cpu.toFixed(1).replace('.0','')+'%';document.getElementById('mn-cpu-bar').style.width=Math.min(100,cpu)+'%';
  document.getElementById('mn-ram').textContent=ru.toFixed(2)+' GiB';document.getElementById('mn-ram-total').textContent=rt.toFixed(2)+' GiB totaal';document.getElementById('mn-ram-bar').style.width=(rt?ru/rt*100:0)+'%';
  document.getElementById('mn-rx').textContent=rate(rx);document.getElementById('mn-tx').textContent=rate(tx);document.getElementById('mn-load1').textContent=l1.toFixed(2);document.getElementById('mn-load5').textContent='5 min: '+Number(d.load_5||0).toFixed(2);document.getElementById('mn-load15').textContent='15 min: '+Number(d.load_15||0).toFixed(2);
  push(hist.rx,rx);push(hist.tx,tx);push(hist.load,l1);const nm=Math.max(...hist.rx,...hist.tx,1);chart('mn-network-chart',[{a:hist.rx,m:nm,c:'rx'},{a:hist.tx,m:nm,c:'tx'}]);chart('mn-load-chart',[{a:hist.load,m:Math.max(...hist.load,1),c:'load'}]);
  const s=d.services||{};setService('docker',s.docker);setService('amp',s.amp);setService('minio',s.minio);setService('wireguard',s.wireguard);
 }).catch(()=>{});}
 update();setInterval(update,2000);
})();
</script>
HTML
&popup_footer();
