(() => {
  if (window.MemoNetworkV5Backups) return;
  const view = document.getElementById('infrastructure');
  if (!view) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl:{eyebrow:'Backupbewaking',title:'Backup Center',subtitle:'Controleer de backup-HDD, MinIO-opslag en de versheid van de nieuwste backupbestanden.',refresh:'Vernieuwen',scan:'Backupscan starten',scanning:'Backupscan bezig…',mount:'Backupmount',mounted:'Correct gemount',notMounted:'Niet correct gemount',free:'Vrije ruimte',minio:'MinIO',online:'Online',offline:'Offline',latest:'Laatste backup',never:'Nog niet gescand',fresh:'Actueel',aging:'Ouder dan 24 uur',stale:'Ouder dan 3 dagen',unknown:'Onbekend',scanStatus:'Laatste backupscan',complete:'Volledig',partial:'Deels gescand',files:'bestanden',scanned:'gescand',size:'Gescande data',recent:'Nieuwste gevonden bestanden',file:'Bestand',date:'Gewijzigd',fileSize:'Grootte',noFiles:'Geen backupbestanden gevonden',source:'Opslagbron',filesystem:'Bestandssysteem',used:'gebruikt',path:'Pad',scanHint:'De diepe bestandsscan draait alleen handmatig, zodat een grote backupschijf niet bij iedere dashboard-refresh wordt doorlopen.',timeout:'De scan bereikte de veiligheidslimiet. De nieuwste gevonden bestanden blijven bruikbaar, maar aantallen en totale grootte zijn gedeeltelijk.',failed:'Backupstatus kon niet worden geladen',scanFailed:'Backupscan mislukt'},
    de:{eyebrow:'Backup-Überwachung',title:'Backup Center',subtitle:'Backup-HDD, MinIO-Speicher und Aktualität der neuesten Backup-Dateien überwachen.',refresh:'Aktualisieren',scan:'Backup-Scan starten',scanning:'Backup-Scan läuft…',mount:'Backup-Mount',mounted:'Korrekt eingehängt',notMounted:'Nicht korrekt eingehängt',free:'Freier Speicher',minio:'MinIO',online:'Online',offline:'Offline',latest:'Letztes Backup',never:'Noch nicht gescannt',fresh:'Aktuell',aging:'Älter als 24 Stunden',stale:'Älter als 3 Tage',unknown:'Unbekannt',scanStatus:'Letzter Backup-Scan',complete:'Vollständig',partial:'Teilweise gescannt',files:'Dateien',scanned:'gescannt',size:'Gescannte Daten',recent:'Neueste gefundene Dateien',file:'Datei',date:'Geändert',fileSize:'Größe',noFiles:'Keine Backup-Dateien gefunden',source:'Speicherquelle',filesystem:'Dateisystem',used:'belegt',path:'Pfad',scanHint:'Der tiefe Dateiscan läuft nur manuell, damit ein großes Backup-Laufwerk nicht bei jeder Dashboard-Aktualisierung durchsucht wird.',timeout:'Der Scan erreichte die Sicherheitsgrenze. Die neuesten gefundenen Dateien sind nutzbar, Anzahl und Gesamtgröße können jedoch unvollständig sein.',failed:'Backup-Status konnte nicht geladen werden',scanFailed:'Backup-Scan fehlgeschlagen'},
    en:{eyebrow:'Backup monitoring',title:'Backup Center',subtitle:'Monitor the backup HDD, MinIO storage and freshness of the newest backup files.',refresh:'Refresh',scan:'Start backup scan',scanning:'Backup scan running…',mount:'Backup mount',mounted:'Mounted correctly',notMounted:'Not mounted correctly',free:'Free space',minio:'MinIO',online:'Online',offline:'Offline',latest:'Latest backup',never:'Not scanned yet',fresh:'Current',aging:'Older than 24 hours',stale:'Older than 3 days',unknown:'Unknown',scanStatus:'Latest backup scan',complete:'Complete',partial:'Partially scanned',files:'files',scanned:'scanned',size:'Scanned data',recent:'Newest files found',file:'File',date:'Modified',fileSize:'Size',noFiles:'No backup files found',source:'Storage source',filesystem:'Filesystem',used:'used',path:'Path',scanHint:'The deep file scan only runs manually so a large backup disk is not traversed on every dashboard refresh.',timeout:'The scan reached its safety limit. The newest files found remain useful, but counts and total size may be partial.',failed:'Backup status could not be loaded',scanFailed:'Backup scan failed'}
  };
  const t = k => dict[lang]?.[k] || dict.en[k] || k;
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const bytes = value => {
    let n = Number(value || 0); const units=['B','KiB','MiB','GiB','TiB']; let i=0;
    while(n >= 1024 && i < units.length-1){ n/=1024; i++; }
    return `${n.toFixed(i >= 3 ? 2 : i ? 1 : 0)} ${units[i]}`;
  };
  const ago = seconds => {
    const s = Number(seconds); if (!Number.isFinite(s)) return t('unknown');
    if (s < 3600) return `${Math.max(1,Math.round(s/60))} min`;
    if (s < 86400) return `${(s/3600).toFixed(1)} u`;
    return `${(s/86400).toFixed(1)} d`;
  };
  const stamp = epoch => {
    const d = new Date(Number(epoch || 0)*1000); return !epoch || Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  };

  const style=document.createElement('style');
  style.textContent=`
    .memo-backup{margin-top:12px;padding:15px;border:1px solid #2a4868;border-radius:15px;background:linear-gradient(145deg,#122136,#0d1928)}
    .memo-backup-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.memo-backup-head small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-backup-head h3{margin:3px 0 0;font-size:16px}.memo-backup-head p{margin:5px 0 0;color:#8ea6c2;font-size:11px}.memo-backup-actions{display:flex;gap:7px;flex-wrap:wrap}.memo-backup-btn{border:1px solid #315776;border-radius:9px;background:#10233a;color:#c9e8ff;padding:8px 10px;font-weight:800;cursor:pointer}.memo-backup-btn.primary{background:#1453c8;border-color:#377de6;color:white}.memo-backup-btn:disabled{opacity:.55;cursor:wait}
    .memo-backup-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.memo-backup-card{padding:11px;border:1px solid #263d59;border-radius:11px;background:#0b1726}.memo-backup-card small{display:block;color:#7895b6;font-size:8px;font-weight:850;text-transform:uppercase}.memo-backup-card strong{display:block;margin-top:5px;font-size:15px}.memo-backup-card span{display:block;margin-top:4px;color:#8ea6c2;font-size:9px}.memo-backup-card.ok strong{color:#86efac}.memo-backup-card.warn strong{color:#fde68a}.memo-backup-card.bad strong{color:#fca5a5}
    .memo-backup-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:9px}.memo-backup-kv{padding:10px;border:1px solid #223953;border-radius:10px;background:#091625;min-width:0}.memo-backup-kv small{display:block;color:#7895b6;font-size:8px;text-transform:uppercase;font-weight:800}.memo-backup-kv b{display:block;margin-top:4px;font-size:10px;overflow-wrap:anywhere}
    .memo-backup-note{margin-top:9px;color:#7895b6;font-size:9px}.memo-backup-note.warn{padding:9px;border:1px solid #725d28;border-radius:9px;background:#2a2312;color:#fde68a}.memo-backup-error{margin-top:10px;padding:10px;border:1px solid #7f3a49;border-radius:10px;background:#2a1520;color:#fecdd3;font-size:10px}
    .memo-backup-tablewrap{margin-top:10px;overflow:auto;border:1px solid #20354e;border-radius:11px}.memo-backup-table{width:100%;border-collapse:collapse;min-width:700px}.memo-backup-table th,.memo-backup-table td{padding:8px;border-top:1px solid #20354e;text-align:left;font-size:9px}.memo-backup-table th{border-top:0;background:#091625;color:#7895b6;text-transform:uppercase}.memo-backup-table td.path{color:#c9e8ff;overflow-wrap:anywhere}.memo-backup-empty{padding:20px;text-align:center;color:#7895b6}
    @media(max-width:950px){.memo-backup-grid,.memo-backup-meta{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.memo-backup-head{flex-direction:column}.memo-backup-grid,.memo-backup-meta{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  const state={data:null,busy:false,error:''};
  const infra=()=>document.getElementById('memo-v5-infrastructure');
  const classForFreshness=f=>f==='fresh'?'ok':f==='aging'?'warn':f==='stale'?'bad':'';
  const freshnessLabel=f=>f==='fresh'?t('fresh'):f==='aging'?t('aging'):f==='stale'?t('stale'):t('unknown');

  function rows(recent){
    if(!recent?.length) return `<tr><td colspan="3"><div class="memo-backup-empty">${esc(t('noFiles'))}</div></td></tr>`;
    return recent.slice(0,5).map(x=>`<tr><td class="path">${esc(String(x.path||'').replace(/^\/mnt\/backups\/?/,'')||'/')}</td><td>${esc(stamp(x.mtime))}</td><td>${esc(bytes(x.size))}</td></tr>`).join('');
  }

  function render(){
    const root=infra(); if(!root) return;
    let panel=root.querySelector('#memo-backup-center');
    if(!panel){panel=document.createElement('section');panel.id='memo-backup-center';panel.className='memo-backup';root.appendChild(panel);}
    const d=state.data||{}, m=d.mount||{}, minio=d.minio||{}, scan=d.scan||{};
    const mountOk=!!m.separate_filesystem;
    const used=Number(m.used_percent||0);
    const latestAge=d.latest_age_seconds;
    const recent=Array.isArray(scan.recent)?scan.recent:[];
    panel.innerHTML=`
      <div class="memo-backup-head"><div><small>${esc(t('eyebrow'))}</small><h3>${esc(t('title'))}</h3><p>${esc(t('subtitle'))}</p></div><div class="memo-backup-actions"><button class="memo-backup-btn" id="memo-backup-refresh" type="button" ${state.busy?'disabled':''}>↻ ${esc(t('refresh'))}</button><button class="memo-backup-btn primary" id="memo-backup-scan" type="button" ${state.busy||!mountOk?'disabled':''}>${esc(state.busy?t('scanning'):t('scan'))}</button></div></div>
      ${state.error?`<div class="memo-backup-error">${esc(state.error)}</div>`:''}
      <div class="memo-backup-grid">
        <div class="memo-backup-card ${mountOk?'ok':'bad'}"><small>${esc(t('mount'))}</small><strong>${esc(mountOk?t('mounted'):t('notMounted'))}</strong><span>${esc(m.source||m.target||'/mnt/backups')}</span></div>
        <div class="memo-backup-card ${used>=85?'warn':'ok'}"><small>${esc(t('free'))}</small><strong>${esc(bytes(m.available_bytes))}</strong><span>${used.toFixed(1)}% ${esc(t('used'))}</span></div>
        <div class="memo-backup-card ${minio.running?'ok':'bad'}"><small>${esc(t('minio'))}</small><strong>${esc(minio.running?t('online'):t('offline'))}</strong><span>${esc(minio.container||'—')}</span></div>
        <div class="memo-backup-card ${classForFreshness(d.freshness)}"><small>${esc(t('latest'))}</small><strong>${scan.latest?esc(freshnessLabel(d.freshness)):esc(t('never'))}</strong><span>${scan.latest?esc(`${ago(latestAge)} · ${stamp(scan.latest.mtime)}`):'—'}</span></div>
      </div>
      <div class="memo-backup-meta">
        <div class="memo-backup-kv"><small>${esc(t('scanStatus'))}</small><b>${scan.scanned_at?esc(scan.complete?t('complete'):t('partial')):esc(t('never'))}</b></div>
        <div class="memo-backup-kv"><small>${esc(t('scanned'))}</small><b>${Number(scan.file_count||0).toLocaleString()} ${esc(t('files'))}</b></div>
        <div class="memo-backup-kv"><small>${esc(t('size'))}</small><b>${esc(bytes(scan.total_bytes))}</b></div>
        <div class="memo-backup-kv"><small>${esc(t('source'))}</small><b>${esc(minio.storage_source||m.source||'—')}</b></div>
      </div>
      ${(scan.timed_out||scan.capped)?`<div class="memo-backup-note warn">${esc(t('timeout'))}</div>`:''}
      <div class="memo-backup-note">${esc(t('scanHint'))}</div>
      <div class="memo-backup-tablewrap"><table class="memo-backup-table"><thead><tr><th>${esc(t('file'))}</th><th>${esc(t('date'))}</th><th>${esc(t('fileSize'))}</th></tr></thead><tbody>${rows(recent)}</tbody></table></div>`;
    panel.querySelector('#memo-backup-refresh')?.addEventListener('click',()=>load(false));
    panel.querySelector('#memo-backup-scan')?.addEventListener('click',()=>load(true));
  }

  async function load(scan=false){
    if(state.busy)return; state.busy=true; state.error=''; render();
    try{
      const response=await fetch(`/memo-network/backup-health.cgi${scan?'?action=scan':''}${scan?'&':'?'}_=${Date.now()}`,{
        method:scan?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:scan?{'X-Requested-With':'MemoNetwork'}:{}
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok||!data.ok) throw new Error(data.error||`${scan?t('scanFailed'):t('failed')} · HTTP ${response.status}`);
      state.data=data;
    }catch(e){state.error=e?.message||String(e);}finally{state.busy=false;render();}
  }

  function ensure(){ if(!infra())return; render(); }
  const observer=new MutationObserver(()=>ensure()); observer.observe(view,{childList:true,subtree:true});
  ensure(); setTimeout(()=>load(false),500);
  setInterval(()=>{if(!state.busy&&view.classList.contains('active'))load(false);},60000);
  window.MemoNetworkV5Backups={refresh:()=>load(false),scan:()=>load(true)};
})();
