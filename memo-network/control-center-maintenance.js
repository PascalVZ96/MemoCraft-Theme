(() => {
  if (window.MemoNetworkV5Maintenance) return;

  const endpoint = '/memo-network/maintenance.cgi';
  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.dataset.memoWebminLang || document.documentElement.lang || 'en').toLowerCase().slice(0,2);
  const dict = {
    nl:{title:'Maintenance Mode',eyebrow:'Gepland onderhoud',subtitle:'Onderdruk aandachtbadges tijdens bewust serveronderhoud. De ruwe status blijft zichtbaar en er worden geen services aangepast.',inactive:'Niet actief',active:'Onderhoud actief',start:'Onderhoud starten',stop:'Onderhoud stoppen',reason:'Reden',reasonPlaceholder:'Bijv. Ubuntu updates en herstart',duration:'Duur',until:'Tot',remaining:'Resterend',startedBy:'Gestart door',confirmStop:'Maintenance Mode nu stoppen?',error:'Maintenance Mode kon niet worden bijgewerkt',planned:'Gepland onderhoud',banner:'Gepland onderhoud actief',bannerSub:'Alarmbadges zijn tijdelijk onderdrukt; statusmetingen blijven doorlopen.',minutes:'min',hour:'uur',hours:'uur',expired:'Verlopen',starting:'Starten…',stopping:'Stoppen…',presets:['30 min','1 uur','2 uur','4 uur'],safe:'Maintenance Mode verandert geen Docker-, AMP-, MinIO-, WireGuard- of firewallinstellingen.'},
    de:{title:'Maintenance Mode',eyebrow:'Geplante Wartung',subtitle:'Hinweis-Badges während geplanter Serverarbeiten unterdrücken. Rohstatus bleibt sichtbar und Dienste werden nicht verändert.',inactive:'Nicht aktiv',active:'Wartung aktiv',start:'Wartung starten',stop:'Wartung beenden',reason:'Grund',reasonPlaceholder:'Z. B. Ubuntu-Updates und Neustart',duration:'Dauer',until:'Bis',remaining:'Verbleibend',startedBy:'Gestartet von',confirmStop:'Maintenance Mode jetzt beenden?',error:'Maintenance Mode konnte nicht aktualisiert werden',planned:'Geplante Wartung',banner:'Geplante Wartung aktiv',bannerSub:'Alarm-Badges sind vorübergehend unterdrückt; Statusmessungen laufen weiter.',minutes:'Min.',hour:'Std.',hours:'Std.',expired:'Abgelaufen',starting:'Startet…',stopping:'Beendet…',presets:['30 Min.','1 Std.','2 Std.','4 Std.'],safe:'Maintenance Mode verändert keine Docker-, AMP-, MinIO-, WireGuard- oder Firewall-Einstellungen.'},
    en:{title:'Maintenance Mode',eyebrow:'Planned maintenance',subtitle:'Suppress attention badges during planned server work. Raw status remains visible and no services are changed.',inactive:'Inactive',active:'Maintenance active',start:'Start maintenance',stop:'Stop maintenance',reason:'Reason',reasonPlaceholder:'For example Ubuntu updates and reboot',duration:'Duration',until:'Until',remaining:'Remaining',startedBy:'Started by',confirmStop:'Stop Maintenance Mode now?',error:'Maintenance Mode could not be updated',planned:'Planned maintenance',banner:'Planned maintenance active',bannerSub:'Alert badges are temporarily suppressed; status measurements continue.',minutes:'min',hour:'hr',hours:'hr',expired:'Expired',starting:'Starting…',stopping:'Stopping…',presets:['30 min','1 hr','2 hr','4 hr'],safe:'Maintenance Mode does not change Docker, AMP, MinIO, WireGuard or firewall settings.'}
  };
  const t = key => dict[lang]?.[key] ?? dict.en[key] ?? key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const state = {data:null,busy:false,error:''};

  const style = document.createElement('style');
  style.textContent = `
    .memo-maint-pill{display:inline-flex;align-items:center;gap:5px;border:1px solid #a16207;background:#2a2110;color:#fde68a;padding:8px 11px;border-radius:999px;font-size:11px;font-weight:800}.memo-maint-pill[hidden]{display:none!important}
    .memo-maint-banner{margin-top:12px;padding:11px 13px;border:1px solid #8a6c22;border-radius:12px;background:linear-gradient(135deg,#2a2411,#151a22);color:#fde68a}.memo-maint-banner[hidden]{display:none!important}.memo-maint-banner strong{display:block;font-size:12px}.memo-maint-banner span{display:block;margin-top:3px;color:#d6c78f;font-size:10px}
    .memo-maint-panel{margin-bottom:14px;padding:15px;border:1px solid #31506f;border-radius:15px;background:linear-gradient(145deg,#122136,#0d1928)}.memo-maint-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.memo-maint-head small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-maint-head h3{margin:3px 0 0;font-size:17px}.memo-maint-head p{margin:5px 0 0;max-width:760px;color:#8ea6c2;font-size:11px}.memo-maint-status{padding:6px 9px;border:1px solid #42566f;border-radius:999px;color:#a8bed5;font-size:9px;font-weight:850;white-space:nowrap}.memo-maint-status.active{border-color:#a16207;background:#2a2110;color:#fde68a}
    .memo-maint-grid{display:grid;grid-template-columns:minmax(180px,1fr) minmax(170px,.7fr) auto;gap:9px;margin-top:12px;align-items:end}.memo-maint-field label{display:block;margin-bottom:5px;color:#7895b6;font-size:8px;font-weight:850;text-transform:uppercase}.memo-maint-field input,.memo-maint-field select{width:100%;box-sizing:border-box;border:1px solid #31506f;border-radius:9px;background:#091625;color:#e7f2ff;padding:9px 10px;font:inherit}.memo-maint-button{appearance:none;border:1px solid #315776;border-radius:9px;background:#10233a;color:#c9e8ff;padding:9px 11px;font-weight:850;cursor:pointer;white-space:nowrap}.memo-maint-button:hover{border-color:#60a5fa;background:#133052}.memo-maint-button.stop{border-color:#8a6c22;background:#2a2110;color:#fde68a}.memo-maint-button:disabled{opacity:.55;cursor:wait}.memo-maint-info{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px}.memo-maint-info>div{padding:10px;border:1px solid #263d59;border-radius:10px;background:#0b1726}.memo-maint-info small{display:block;color:#7895b6;font-size:8px;text-transform:uppercase;font-weight:850}.memo-maint-info strong{display:block;margin-top:4px;font-size:11px}.memo-maint-safe{margin-top:10px;color:#7895b6;font-size:9px}.memo-maint-error{margin-top:10px;padding:9px 10px;border:1px solid #7f3a49;border-radius:9px;background:#2a1520;color:#fecdd3;font-size:9px}
    html.memo-maintenance-active .memo-op-navcount,html.memo-maintenance-active .memo-inc-badge{display:none!important}html.memo-maintenance-active #incidents .memo-inc-card:not(.recovered){border-style:dashed}
    @media(max-width:760px){.memo-maint-grid{grid-template-columns:1fr}.memo-maint-info{grid-template-columns:1fr}.memo-maint-head{flex-direction:column}}
  `;
  document.head.appendChild(style);

  const formatTime = epoch => epoch ? new Date(Number(epoch)*1000).toLocaleString([], {dateStyle:'short',timeStyle:'short'}) : '—';
  const remaining = seconds => {
    let s = Math.max(0, Number(seconds||0));
    const h = Math.floor(s/3600); s -= h*3600;
    const m = Math.max(1, Math.ceil(s/60));
    if (h) return `${h} ${h===1?t('hour'):t('hours')} ${m} ${t('minutes')}`;
    return `${m} ${t('minutes')}`;
  };

  function ensureTopPill(){
    const host=document.querySelector('.topright'); if(!host) return null;
    let pill=document.getElementById('memo-maint-pill');
    if(!pill){pill=document.createElement('span');pill.id='memo-maint-pill';pill.className='memo-maint-pill';host.prepend(pill);}
    return pill;
  }

  function ensureBanner(){
    const overview=document.getElementById('overview'); if(!overview) return null;
    let banner=document.getElementById('memo-maint-banner');
    if(!banner){
      banner=document.createElement('div');banner.id='memo-maint-banner';banner.className='memo-maint-banner';
      const first=overview.firstElementChild; if(first) first.insertAdjacentElement('afterend',banner); else overview.prepend(banner);
    }
    return banner;
  }

  function ensurePanel(){
    const view=document.getElementById('incidents'); if(!view) return null;
    let panel=document.getElementById('memo-maint-panel');
    if(!panel){panel=document.createElement('section');panel.id='memo-maint-panel';panel.className='memo-maint-panel';view.prepend(panel);}
    return panel;
  }

  function render(){
    const d=state.data||{active:false,remaining_seconds:0};
    const active=!!d.active;
    document.documentElement.classList.toggle('memo-maintenance-active',active);

    const pill=ensureTopPill();
    if(pill){pill.hidden=!active;pill.textContent=`🛠 ${t('active')}`;}
    const banner=ensureBanner();
    if(banner){banner.hidden=!active;banner.innerHTML=`<strong>🛠 ${esc(t('banner'))}</strong><span>${esc(d.reason||t('planned'))} · ${esc(t('until'))} ${esc(formatTime(d.until))}<br>${esc(t('bannerSub'))}</span>`;}

    const panel=ensurePanel(); if(!panel) return;
    panel.innerHTML=`<div class="memo-maint-head"><div><small>${esc(t('eyebrow'))}</small><h3>${esc(t('title'))}</h3><p>${esc(t('subtitle'))}</p></div><span class="memo-maint-status ${active?'active':''}">${esc(active?t('active'):t('inactive'))}</span></div>
      ${active?`<div class="memo-maint-info"><div><small>${esc(t('reason'))}</small><strong>${esc(d.reason||t('planned'))}</strong></div><div><small>${esc(t('until'))}</small><strong>${esc(formatTime(d.until))}</strong></div><div><small>${esc(t('remaining'))}</small><strong>${esc(remaining(d.remaining_seconds))}</strong></div></div><div class="memo-maint-grid" style="grid-template-columns:1fr auto"><div class="memo-maint-safe">${esc(t('safe'))}${d.started_by?` · ${esc(t('startedBy'))}: ${esc(d.started_by)}`:''}</div><button class="memo-maint-button stop" id="memo-maint-stop" type="button" ${state.busy?'disabled':''}>${esc(state.busy?t('stopping'):t('stop'))}</button></div>`:
      `<div class="memo-maint-grid"><div class="memo-maint-field"><label>${esc(t('reason'))}</label><input id="memo-maint-reason" maxlength="160" placeholder="${esc(t('reasonPlaceholder'))}"></div><div class="memo-maint-field"><label>${esc(t('duration'))}</label><select id="memo-maint-duration"><option value="30">${esc(t('presets')[0])}</option><option value="60" selected>${esc(t('presets')[1])}</option><option value="120">${esc(t('presets')[2])}</option><option value="240">${esc(t('presets')[3])}</option></select></div><button class="memo-maint-button" id="memo-maint-start" type="button" ${state.busy?'disabled':''}>${esc(state.busy?t('starting'):t('start'))}</button></div><div class="memo-maint-safe">${esc(t('safe'))}</div>`}
      ${state.error?`<div class="memo-maint-error">${esc(state.error)}</div>`:''}`;

    panel.querySelector('#memo-maint-start')?.addEventListener('click',start);
    panel.querySelector('#memo-maint-stop')?.addEventListener('click',stop);
  }

  async function request(action, params={}){
    const qs=new URLSearchParams({action,...params,_:String(Date.now())});
    const response=await fetch(`${endpoint}?${qs}`,{method:'POST',credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'MemoNetwork'}});
    const data=await response.json().catch(()=>({}));
    if(!response.ok||data.ok===false) throw new Error(data.error||`HTTP ${response.status}`);
    return data;
  }

  async function start(){
    const panel=ensurePanel();
    const minutes=panel?.querySelector('#memo-maint-duration')?.value||'60';
    const reason=panel?.querySelector('#memo-maint-reason')?.value||'';
    state.busy=true;state.error='';render();
    try{state.data=await request('start',{minutes,reason});}
    catch(error){state.error=error?.message||t('error');}
    state.busy=false;render();
  }

  async function stop(){
    if(!window.confirm(t('confirmStop'))) return;
    state.busy=true;state.error='';render();
    try{state.data=await request('stop');}
    catch(error){state.error=error?.message||t('error');}
    state.busy=false;render();
  }

  async function load(){
    try{
      const response=await fetch(`${endpoint}?_=${Date.now()}`,{credentials:'same-origin',cache:'no-store'});
      if(!response.ok) throw new Error(`HTTP ${response.status}`);
      state.data=await response.json();state.error='';
    }catch(error){state.error=error?.message||t('error');}
    render();
  }

  const shell=document.querySelector('.shell');
  if(shell){
    const observer=new MutationObserver(()=>{
      if(document.getElementById('incidents') && !document.getElementById('memo-maint-panel')) render();
    });
    observer.observe(shell,{childList:true,subtree:true});
  }

  load();
  setInterval(load,60000);
  setInterval(()=>{if(state.data?.active){state.data.remaining_seconds=Math.max(0,Number(state.data.remaining_seconds||0)-30);render();}},30000);

  window.MemoNetworkV5Maintenance={refresh:load,state:()=>state.data};
})();
