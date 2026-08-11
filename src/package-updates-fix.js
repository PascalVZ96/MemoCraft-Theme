(() => {
  const path = String(window.location.pathname || '');
  if (!path.includes('/package-updates/')) return;

  const dark = '#111a27';
  const panel = '#162235';
  const selected = '#173d2d';
  const text = '#e5edf7';
  const muted = '#b8c7da';
  const blue = '#7dc4ff';

  const rgb = value => {
    const match = String(value || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return match ? match.slice(1, 4).map(Number) : null;
  };
  const isLight = value => { const c = rgb(value); return c && ((c[0]*299+c[1]*587+c[2]*114)/1000)>180; };
  const isBrightGreen = value => { const c=rgb(value); return c&&c[1]>180&&c[1]>c[0]*1.15&&c[1]>c[2]*1.05; };
  const force = (element, property, value) => element.style.setProperty(property,value,'important');
  const repaint = () => {
    document.documentElement.style.setProperty('color-scheme','dark','important');
    force(document.body,'background','#0a111b'); force(document.body,'color',text);
    document.querySelectorAll('table, tbody, thead, tfoot, tr, td, th, div, form').forEach(element => {
      const background=getComputedStyle(element).backgroundColor;
      if(isBrightGreen(background)){force(element,'background',selected);force(element,'background-color',selected);force(element,'color','#ecfdf5');}
      else if(isLight(background)){const header=element.tagName==='TH'||element.closest('thead');force(element,'background',header?panel:dark);force(element,'background-color',header?panel:dark);force(element,'color',text);}
    });
    document.querySelectorAll('td, th, label, b, strong, span, font').forEach(element => {
      const style=getComputedStyle(element); if(isLight(style.backgroundColor)||isLight(getComputedStyle(element.parentElement||element).backgroundColor))force(element,'color',text); else if(style.color==='rgb(238, 238, 238)'||style.color==='rgb(221, 221, 221)')force(element,'color',muted);
    });
    document.querySelectorAll('a').forEach(element=>force(element,'color',blue));
    document.querySelectorAll('input[type="text"], input[type="search"], select, textarea').forEach(element=>{force(element,'background','#0b1523');force(element,'color','#f8fafc');force(element,'border-color','#3a4d68');});
  };
  repaint(); document.addEventListener('DOMContentLoaded',repaint,{once:true});
  new MutationObserver(repaint).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','bgcolor','class']});
})();

(() => {
  const API='/memo-network/live-stats.cgi?v=3.5&_=';
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function install(){
    const services=document.querySelector('.services'); const admin=document.querySelector('details.admin');
    if(!services||!admin||$('mn-system-overview'))return false;
    const style=document.createElement('style');
    style.textContent=`.service.clickable{cursor:pointer;transition:transform .16s,border-color .16s,background .16s}.service.clickable:hover{transform:translateY(-2px);border-color:#3b82f6;background:linear-gradient(145deg,#1a2b43,#142033)}.service.clickable:after{content:'Details bekijken';position:absolute;right:16px;bottom:13px;color:#7dc4ff;font-size:11px}.mn-detail,.mn-system{border:1px solid var(--border);background:linear-gradient(145deg,var(--panel2),var(--panel));border-radius:16px;margin:14px 0;padding:18px}.mn-detail{display:none}.mn-detail.show{display:block}.mn-detail-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.mn-detail-head h3,.mn-system h2{margin:0;font-size:17px}.mn-close{border:1px solid #3a4d68;background:#172337;color:#fff;border-radius:8px;padding:7px 11px;cursor:pointer}.mn-list{display:grid;gap:8px}.mn-row{display:grid;grid-template-columns:minmax(170px,1fr) 2fr auto;gap:12px;align-items:center;padding:11px 13px;background:#0e1928;border:1px solid #263a54;border-radius:10px}.mn-row strong{font-size:13px}.mn-row span{color:var(--muted);font-size:12px}.mn-state{font-weight:800}.mn-state.ok{color:#86efac}.mn-state.off{color:#fca5a5}.mn-system-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-top:14px}.mn-system-card{padding:14px;background:#0e1928;border:1px solid #263a54;border-radius:11px}.mn-system-card small{display:block;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.07em}.mn-system-card strong{display:block;margin-top:7px;font-size:14px;overflow-wrap:anywhere}.mn-system-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}.mn-system-actions a{padding:9px 12px;border-radius:9px;background:#162a46;border:1px solid #315d8a;color:#9bd0ff!important;text-decoration:none!important}@media(max-width:1000px){.mn-system-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:620px){.mn-system-grid{grid-template-columns:1fr}.mn-row{grid-template-columns:1fr}.mn-row .mn-state{justify-self:start}}`;
    document.head.appendChild(style);
    services.querySelectorAll('.service').forEach(card=>card.classList.add('clickable'));
    const dockerCard=services.querySelector('.service:nth-child(1)'); const ampCard=services.querySelector('.service:nth-child(2)');
    if(dockerCard)dockerCard.dataset.detail='docker'; if(ampCard)ampCard.dataset.detail='amp';
    const detail=document.createElement('section'); detail.id='mn-service-detail'; detail.className='mn-detail'; detail.innerHTML='<div class="mn-detail-head"><h3 id="mn-detail-title">Service-details</h3><button class="mn-close" type="button">Sluiten</button></div><div class="mn-list" id="mn-detail-list"></div>';
    services.insertAdjacentElement('afterend',detail); detail.querySelector('.mn-close').addEventListener('click',()=>detail.classList.remove('show'));
    const system=document.createElement('section'); system.id='mn-system-overview'; system.className='mn-system';
    system.innerHTML='<h2>Systeemoverzicht</h2><div class="mn-system-grid"><div class="mn-system-card"><small>Hostnaam</small><strong id="mn-hostname">--</strong></div><div class="mn-system-card"><small>Besturingssysteem</small><strong id="mn-os">--</strong></div><div class="mn-system-card"><small>Processor</small><strong id="mn-cpu-name">--</strong></div><div class="mn-system-card"><small>Kernel</small><strong id="mn-kernel">--</strong></div><div class="mn-system-card"><small>Temperatuur</small><strong id="mn-temperature">--</strong></div><div class="mn-system-card"><small>Processen</small><strong id="mn-processes">--</strong></div><div class="mn-system-card"><small>Systeemtijd</small><strong id="mn-time">--</strong></div><div class="mn-system-card"><small>Pakketstatus</small><strong id="mn-packages">--</strong></div></div><div class="mn-system-actions"><a href="/mount/index.cgi">Harddiskgebruik</a><a href="/net/index.cgi">Netwerkinterfaces</a><a href="/memo-network/processes.cgi">Actieve processen</a><a href="/webminlog/search.cgi">Recente Webmin-acties</a></div>';
    admin.insertAdjacentElement('beforebegin',system);
    let latest=null;
    function showDetail(type){if(!latest)return;const data=latest[type]||{};const items=Array.isArray(data.items)?data.items:[];$('mn-detail-title').textContent=type==='docker'?'Docker-containers':'AMP-instances';$('mn-detail-list').innerHTML=items.length?items.map(item=>{const online=!!item.running;const middle=type==='docker'?esc(item.image||item.status||''):'AMP instance';return `<div class="mn-row"><strong>${esc(item.name)}</strong><span>${middle}</span><span class="mn-state ${online?'ok':'off'}">${online?'Actief':'Gestopt'}</span></div>`;}).join(''):'<div class="mn-row"><strong>Geen onderdelen gevonden</strong><span>De service heeft geen detailgegevens teruggegeven.</span><span></span></div>';detail.classList.add('show');detail.scrollIntoView({behavior:'smooth',block:'nearest'});}
    services.addEventListener('click',event=>{const card=event.target.closest('.service[data-detail]');if(card)showDetail(card.dataset.detail);});
    async function refreshExtra(){try{const response=await fetch(API+Date.now(),{credentials:'same-origin',cache:'no-store'});if(!response.ok)return;latest=await response.json();const s=latest.system||{};$('mn-hostname').textContent=s.hostname||'--';$('mn-os').textContent=s.os||'--';$('mn-cpu-name').textContent=s.cpu||'--';$('mn-kernel').textContent=s.kernel||'--';$('mn-temperature').textContent=s.temperature_c==null?'Niet beschikbaar':s.temperature_c+'°C';$('mn-processes').textContent=s.processes??'--';$('mn-time').textContent=new Date().toLocaleString('nl-NL');const updates=Number(latest.updates_available||0);$('mn-packages').textContent=updates?updates+' update'+(updates===1?'':'s')+' beschikbaar':'Alles bijgewerkt';}catch(_){}}
    refreshExtra();setInterval(refreshExtra,5000);return true;
  }
  if(!install()){const observer=new MutationObserver(()=>{if(install())observer.disconnect();});observer.observe(document.documentElement,{childList:true,subtree:true});}
})();

(() => {
  const path = String(window.location.pathname || '');
  if (path !== '/right.cgi' && !path.endsWith('/memocraft-theme/memo-dashboard.cgi')) return;

  const cookieLanguage = () => {
    const match = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
    return match ? match[1].toLowerCase() : '';
  };

  const parentLanguage = () => {
    try {
      const text = String(parent.document?.body?.innerText || '').toLowerCase();
      if (text.includes('abmelden') || text.includes('module aktualisieren') || text.includes('systeminformationen')) return 'de';
      if (text.includes('uitloggen') || text.includes('ververs modules') || text.includes('systeeminformatie')) return 'nl';
      if (text.includes('logout') || text.includes('refresh modules') || text.includes('system information')) return 'en';
    } catch (_error) {}
    return '';
  };

  const language = cookieLanguage() || parentLanguage() || 'en';
  if (language === 'nl') return;
  const de = language === 'de';

  const exact = de ? {
    'Nu verversen':'Jetzt aktualisieren','Systeeminfo':'Systeminfo','AMP openen':'AMP öffnen','Schijven':'Datenträger','Herstartbeheer':'Neustartverwaltung','Inzichten':'Einblicke','Gezond':'Gesund','Alle bewaakte onderdelen zijn in orde':'Alle überwachten Komponenten sind in Ordnung','Services online':'Dienste online','Hoogste belasting':'Höchste Auslastung','Actieve meldingen':'Aktive Meldungen','API reactietijd':'API-Reaktionszeit','Geheugen':'Arbeitsspeicher','Opslag':'Speicher','Actuele belasting':'Aktuelle Auslastung','Totaal geheugen':'Gesamtspeicher','Server online':'Server online','Netwerkverkeer':'Netzwerkverkehr','Besturingssysteem':'Betriebssystem','Temperatuur':'Temperatur','Processen':'Prozesse','Laatste update':'Letzte Aktualisierung','Services':'Dienste','Klik op een service voor live details en beheer':'Klicke auf einen Dienst für Live-Details und Verwaltung','Online':'Online','Details':'Details','Per gemount bestandssysteem':'Pro eingehängtem Dateisystem','Systeembeheer en Webmin-functies':'Systemverwaltung und Webmin-Funktionen','Systeeminformatie':'Systeminformationen','Serverstatus bekijken':'Serverstatus anzeigen','Mounts en vrije ruimte':'Mounts und freier Speicher','Netwerkinterfaces':'Netzwerkschnittstellen','IP en netwerkconfiguratie':'IP- und Netzwerkkonfiguration','Actieve processen':'Aktive Prozesse','Processen bekijken':'Prozesse anzeigen','Pakketupdates':'Paketupdates','Updates installeren':'Updates installieren','Webmin-logboek':'Webmin-Protokoll','Recente acties':'Letzte Aktionen','Opstarten en afsluiten':'Starten und Herunterfahren','Services en reboot':'Dienste und Neustart','Dashboard configureren':'Dashboard konfigurieren','Klassieke onderdelen':'Klassische Komponenten','Service-details':'Dienst-Details','Sluiten':'Schließen','Status':'Status','Actief':'Aktiv','Totaal':'Gesamt','Systeemoverzicht':'Systemübersicht','Hostnaam':'Hostname','Systeemtijd':'Systemzeit','Pakketstatus':'Paketstatus','Harddiskgebruik':'Festplattennutzung','Recente Webmin-acties':'Letzte Webmin-Aktionen','Niet beschikbaar':'Nicht verfügbar','Alles bijgewerkt':'Alles aktuell','Geen onderdelen gevonden':'Keine Einträge gefunden','De service heeft geen detailgegevens teruggegeven.':'Der Dienst hat keine Detaildaten zurückgegeben.','Gestopt':'Gestoppt','Testversie':'Testversion','Versie controleren…':'Version wird geprüft…','Laatste versie':'Neueste Version','Update beschikbaar:':'Update verfügbar:','Versiecontrole niet beschikbaar':'Versionsprüfung nicht verfügbar'
  } : {
    'Nu verversen':'Refresh now','Systeeminfo':'System info','AMP openen':'Open AMP','Schijven':'Disks','Herstartbeheer':'Restart management','Inzichten':'Insights','Gezond':'Healthy','Alle bewaakte onderdelen zijn in orde':'All monitored components are healthy','Services online':'Services online','Hoogste belasting':'Highest load','Actieve meldingen':'Active alerts','API reactietijd':'API response time','Geheugen':'Memory','Opslag':'Storage','Actuele belasting':'Current load','Totaal geheugen':'Total memory','Server online':'Server online','Netwerkverkeer':'Network traffic','Besturingssysteem':'Operating system','Temperatuur':'Temperature','Processen':'Processes','Laatste update':'Last update','Services':'Services','Klik op een service voor live details en beheer':'Click a service for live details and management','Online':'Online','Details':'Details','Per gemount bestandssysteem':'Per mounted filesystem','Systeembeheer en Webmin-functies':'System management and Webmin functions','Systeeminformatie':'System information','Serverstatus bekijken':'View server status','Mounts en vrije ruimte':'Mounts and free space','Netwerkinterfaces':'Network interfaces','IP en netwerkconfiguratie':'IP and network configuration','Actieve processen':'Active processes','Processen bekijken':'View processes','Pakketupdates':'Package updates','Updates installeren':'Install updates','Webmin-logboek':'Webmin log','Recente acties':'Recent actions','Opstarten en afsluiten':'Boot and shutdown','Services en reboot':'Services and restart','Dashboard configureren':'Configure dashboard','Klassieke onderdelen':'Classic components','Service-details':'Service details','Sluiten':'Close','Status':'Status','Actief':'Active','Totaal':'Total','Systeemoverzicht':'System overview','Hostnaam':'Hostname','Systeemtijd':'System time','Pakketstatus':'Package status','Harddiskgebruik':'Disk usage','Recente Webmin-acties':'Recent Webmin actions','Niet beschikbaar':'Unavailable','Alles bijgewerkt':'Everything up to date','Geen onderdelen gevonden':'No items found','De service heeft geen detailgegevens teruggegeven.':'The service returned no detail data.','Gestopt':'Stopped','Testversie':'Test version','Versie controleren…':'Checking version…','Laatste versie':'Latest version','Update beschikbaar:':'Update available:','Versiecontrole niet beschikbaar':'Version check unavailable'
  };

  const dynamic = value => {
    const s = String(value || '').trim();
    let m;
    if ((m=s.match(/^Automatisch:\s*(\d+(?:\.\d+)?) sec$/))) return de ? `Automatisch: ${m[1]} Sek.` : `Automatic: ${m[1]} sec`;
    if ((m=s.match(/^(\d+) cores · actuele belasting$/))) return de ? `${m[1]} Kerne · aktuelle Auslastung` : `${m[1]} cores · current load`;
    if ((m=s.match(/^([0-9.]+ GiB) totaal · ([0-9.]+)%$/))) return de ? `${m[1]} gesamt · ${m[2]}%` : `${m[1]} total · ${m[2]}%`;
    if ((m=s.match(/^(.+) totaal · (.+) vrij$/))) return de ? `${m[1]} gesamt · ${m[2]} frei` : `${m[1]} total · ${m[2]} free`;
    if ((m=s.match(/^(.+) gebruikt · (.+) vrij · (.+) totaal$/))) return de ? `${m[1]} belegt · ${m[2]} frei · ${m[3]} gesamt` : `${m[1]} used · ${m[2]} free · ${m[3]} total`;
    if ((m=s.match(/^([0-9.]+)% gebruikt$/))) return de ? `${m[1]}% belegt` : `${m[1]}% used`;
    if ((m=s.match(/^(\d+) dag(?:en)?, (\d+) uur, (\d+) min$/))) return de ? `${m[1]} Tag${Number(m[1])===1?'':'e'}, ${m[2]} Std., ${m[3]} Min.` : `${m[1]} day${Number(m[1])===1?'':'s'}, ${m[2]} hr, ${m[3]} min`;
    if ((m=s.match(/^(\d+) uur, (\d+) min$/))) return de ? `${m[1]} Std., ${m[2]} Min.` : `${m[1]} hr, ${m[2]} min`;
    if ((m=s.match(/^(\d+) peers? · (\d+) uur geleden$/))) return de ? `${m[1]} Peers · vor ${m[2]} Std.` : `${m[1]} peers · ${m[2]} hr ago`;
    if ((m=s.match(/^(\d+) peer(?:s)? · (\d+) min geleden$/))) return de ? `${m[1]} Peer${Number(m[1])===1?'':'s'} · vor ${m[2]} Min.` : `${m[1]} peer${Number(m[1])===1?'':'s'} · ${m[2]} min ago`;
    if ((m=s.match(/^(\d+) actief van (\d+) containers$/))) return de ? `${m[1]} aktiv von ${m[2]} Containern` : `${m[1]} active of ${m[2]} containers`;
    if ((m=s.match(/^(\d+) actief van (\d+) instances$/))) return de ? `${m[1]} aktiv von ${m[2]} Instanzen` : `${m[1]} active of ${m[2]} instances`;
    if ((m=s.match(/^Testversie · main v(.+)$/))) return de ? `Testversion · main v${m[1]}` : `Test version · main v${m[1]}`;
    return exact[s] || s;
  };

  const translateNode = node => {
    const raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    const trimmed = raw.trim();
    const translated = dynamic(trimmed);
    if (translated === trimmed) return;
    const lead = raw.match(/^\s*/)?.[0] || '';
    const tail = raw.match(/\s*$/)?.[0] || '';
    node.nodeValue = lead + translated + tail;
  };

  const translateTree = root => {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes=[];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      const parent=node.parentElement;
      if (!parent || /^(SCRIPT|STYLE|PRE|CODE|TEXTAREA)$/i.test(parent.tagName)) return;
      translateNode(node);
    });
  };

  const run = () => {
    document.documentElement.lang = language;
    translateTree(document.body);
    try {
      const badge=document.querySelector('.brandline .ver'); if (badge) badge.textContent='Dashboard v4.6 RC5';
      const rc=document.querySelector('[data-memo-rc="1"]'); if (rc) rc.textContent=`RC5 · ${language.toUpperCase()}`;
      const sidebar=parent.frames?.[0]?.document;
      const footerVersion=sidebar?.querySelector('#memo-version-footer .memo-version'); if (footerVersion) footerVersion.textContent='v4.6.0-rc5';
    } catch (_error) {}
  };

  document.addEventListener('DOMContentLoaded',run,{once:true});
  run();
  const observer=new MutationObserver(()=>run());
  observer.observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  setInterval(run,1200);
})();
