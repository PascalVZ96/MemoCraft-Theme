(() => {
  const path = String(window.location.pathname || '');
  if (!path.includes('/package-updates/')) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : 'nl';
  const t = {
    nl: {
      ready:'Klaar om te installeren', readySub:'Controleer de pakketwijzigingen hieronder en start daarna de installatie.',
      preparing:'Update voorbereiden…', installing:'Pakketupdate wordt geïnstalleerd',
      installingSub:'Laat deze pagina open. APT/dpkg kan soms even geen nieuwe uitvoer tonen; de installatie loopt dan gewoon door.',
      checking:'Pakketstatus controleren…', waiting:'Wachten op nieuwe uitvoer van het pakketbeheer…',
      finished:'Update afgerond', finishedSub:'De pakketstatus is vernieuwd en de installatie is afgerond.',
      back:'Terug naar pakketupdates'
    },
    de: {
      ready:'Bereit zur Installation', readySub:'Prüfe die Paketänderungen unten und starte anschließend die Installation.',
      preparing:'Update wird vorbereitet…', installing:'Paketupdate wird installiert',
      installingSub:'Diese Seite geöffnet lassen. APT/dpkg kann kurz keine neue Ausgabe zeigen; die Installation läuft trotzdem weiter.',
      checking:'Paketstatus wird geprüft…', waiting:'Warten auf neue Ausgabe der Paketverwaltung…',
      finished:'Update abgeschlossen', finishedSub:'Der Paketstatus wurde aktualisiert und die Installation ist abgeschlossen.',
      back:'Zurück zu Paketupdates'
    },
    en: {
      ready:'Ready to install', readySub:'Review the package changes below and then start the installation.',
      preparing:'Preparing update…', installing:'Package update is being installed',
      installingSub:'Keep this page open. APT/dpkg can be quiet for a while; the installation will keep running.',
      checking:'Checking package status…', waiting:'Waiting for new package-manager output…',
      finished:'Update completed', finishedSub:'Package status has been refreshed and the installation completed.',
      back:'Back to package updates'
    }
  }[lang];

  const style = document.createElement('style');
  style.id = 'mn-package-updates-v5-style';
  style.textContent = `
    body.mn-package-updates-v5{background:#08121f!important;color:#f8fbff!important}
    body.mn-package-updates-v5 a{color:#67c5ff!important}
    body.mn-package-updates-v5 .header{background:transparent!important;border:0!important;margin-bottom:8px!important}
    body.mn-package-updates-v5 .header td{background:transparent!important;border:0!important;color:#eef6ff!important}
    body.mn-package-updates-v5 #headln2c font{font-family:Inter,Arial,sans-serif!important;font-size:24px!important;font-weight:800!important;color:#f8fbff!important}

    /* Webmin tabs: behoud de werking, vervang alleen de oude image/corner-look. */
    body.mn-package-updates-v5 table.ui_tabs{width:auto!important;margin:8px 0 0!important;border:0!important;border-collapse:separate!important;border-spacing:7px 0!important;background:transparent!important}
    body.mn-package-updates-v5 table.ui_tabs>tbody>tr:first-child{display:none!important}
    body.mn-package-updates-v5 table.ui_tabs>tbody>tr:nth-child(2)>td[bgcolor]{display:none!important}
    body.mn-package-updates-v5 table.ui_tabs td.ui_tab{padding:0!important;background:transparent!important;border:0!important}
    body.mn-package-updates-v5 table.ui_tabs td.ui_tab>table{border:0!important;background:transparent!important;border-collapse:collapse!important}
    body.mn-package-updates-v5 table.ui_tabs td.ui_tab td{background:transparent!important;border:0!important;padding:0!important}
    body.mn-package-updates-v5 table.ui_tabs td.ui_tab td:not([nowrap]){display:none!important}
    body.mn-package-updates-v5 table.ui_tabs td.ui_tab td[nowrap]{display:block!important;padding:9px 14px!important;border:1px solid #31506f!important;border-bottom:0!important;border-radius:9px 9px 0 0!important;background:#101d2d!important;color:#9fb7d2!important;line-height:18px!important}
    body.mn-package-updates-v5 table.ui_tabs td.ui_tab td.tabSelected[nowrap]{background:#17345a!important;border-color:#3b82f6!important;color:#fff!important}
    body.mn-package-updates-v5 table.ui_tabs td.ui_tab td[nowrap] a{color:#a8c9e9!important;text-decoration:none!important}
    body.mn-package-updates-v5 table.ui_tabs td.ui_tab td.tabSelected[nowrap] a,body.mn-package-updates-v5 table.ui_tabs td.ui_tab td.tabSelected[nowrap] b{color:#fff!important}
    body.mn-package-updates-v5 table.ui_tabs img{display:none!important}

    /* Groot tabpaneel: alle oude bgcolor-spacers expliciet neutraliseren. */
    body.mn-package-updates-v5 table.ui_tabs_box{width:100%!important;margin:0 0 16px!important;border:1px solid #28415f!important;border-radius:0 14px 14px 14px!important;border-collapse:separate!important;border-spacing:0!important;background:#0e1928!important;overflow:hidden!important}
    body.mn-package-updates-v5 table.ui_tabs_box>tbody>tr:first-child{display:none!important}
    body.mn-package-updates-v5 table.ui_tabs_box>tbody>tr>td{background:#0e1928!important;border:0!important;color:#eef6ff!important}
    body.mn-package-updates-v5 .ui_tabs_start{padding:16px!important;background:#0e1928!important;color:#eef6ff!important}
    body.mn-package-updates-v5 .ui_tabs_start>p:first-child{margin-top:0!important}

    /* Webmin gebruikt layout-tabellen. Deze mogen geen witte panelen meer veroorzaken. */
    body.mn-package-updates-v5 .ui_tabs_start table.wrapper,
    body.mn-package-updates-v5 .ui_tabs_start table.shrinkwrapper,
    body.mn-package-updates-v5 .ui_tabs_start table.wrapper>tbody>tr>td,
    body.mn-package-updates-v5 .ui_tabs_start table.shrinkwrapper>tbody>tr>td{background:transparent!important;border:0!important;box-shadow:none!important}

    /* Zoek/filterblok. */
    body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table{width:100%!important;border:1px solid #28415f!important;border-radius:12px!important;border-collapse:separate!important;border-spacing:0!important;background:#101d2d!important;overflow:hidden!important}
    body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table td{background:#101d2d!important;color:#eef6ff!important;border:0!important;padding:10px 12px!important;vertical-align:middle!important}
    body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table tr+tr td{border-top:1px solid #223750!important}
    body.mn-package-updates-v5 input.ui_textbox,body.mn-package-updates-v5 input[type=text],body.mn-package-updates-v5 input[type=search],body.mn-package-updates-v5 select{min-height:37px!important;border:1px solid #36506e!important;border-radius:8px!important;background:#091626!important;color:#f8fbff!important;padding:7px 10px!important;box-shadow:none!important}

    /* Echte pakketlijst. */
    body.mn-package-updates-v5 table.ui_columns{width:100%!important;margin:7px 0!important;border:1px solid #28415f!important;border-radius:12px!important;border-collapse:separate!important;border-spacing:0!important;background:#101d2d!important;overflow:hidden!important}
    body.mn-package-updates-v5 table.ui_columns thead td{background:#13243a!important;color:#8fc8f8!important;font-size:11px!important;font-weight:850!important;text-transform:uppercase!important;letter-spacing:.035em!important;padding:12px 13px!important;border:0!important;border-bottom:1px solid #2a415e!important}
    body.mn-package-updates-v5 table.ui_columns tbody td{background:#101d2d!important;color:#eef6ff!important;padding:13px!important;border:0!important;border-top:1px solid #223750!important;vertical-align:middle!important}
    body.mn-package-updates-v5 table.ui_columns tbody tr:first-child td{border-top:0!important}
    body.mn-package-updates-v5 table.ui_columns tbody tr.mainsel td,body.mn-package-updates-v5 table.ui_columns tbody tr.mainhighsel td{background:#102b38!important}
    body.mn-package-updates-v5 table.ui_columns tbody tr:hover td{background:#13243a!important}
    body.mn-package-updates-v5 table.ui_columns font[color="#00aa00"],body.mn-package-updates-v5 table.ui_columns font[color="#00AA00"]{color:#86efac!important}
    body.mn-package-updates-v5 input.ui_checkbox{width:17px!important;height:17px!important;accent-color:#3b82f6!important}

    /* Acties: modern maar niet overdreven groot. */
    body.mn-package-updates-v5 input.ui_submit,body.mn-package-updates-v5 form input[type=submit],body.mn-package-updates-v5 form button{min-height:36px!important;border:1px solid #4f9cf8!important;border-radius:8px!important;background:linear-gradient(180deg,#3484f4,#2563eb)!important;color:#fff!important;font-weight:800!important;padding:7px 13px!important;box-shadow:0 4px 12px rgba(37,99,235,.18)!important;text-shadow:none!important;cursor:pointer!important}
    body.mn-package-updates-v5 input.ui_submit:hover,body.mn-package-updates-v5 form input[type=submit]:hover,body.mn-package-updates-v5 form button:hover{background:linear-gradient(180deg,#4b96ff,#2563eb)!important}
    body.mn-package-updates-v5 table.ui_form_end_buttons,body.mn-package-updates-v5 table.ui_form_end_buttons td{background:transparent!important;border:0!important;padding:4px 6px 0 0!important}
    body.mn-package-updates-v5 a.select_all,body.mn-package-updates-v5 a.select_invert{font-size:12px!important}

    /* Installatie/bevestiging. */
    .mn-pkg-ready{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:10px 0 16px;padding:15px 17px;border:1px solid #315d8a;border-radius:14px;background:linear-gradient(135deg,#10233a,#0c1929);box-shadow:0 10px 30px rgba(0,0,0,.16)}
    .mn-pkg-ready strong{display:block;color:#fff;font-size:15px}.mn-pkg-ready span{display:block;margin-top:4px;color:#91a9c4;font-size:12px}
    .mn-install-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:rgba(3,9,17,.8);backdrop-filter:blur(4px)}
    .mn-install-card{width:min(620px,94vw);border:1px solid #315d8a;border-radius:18px;background:linear-gradient(145deg,#14243a,#0b1726);padding:22px;box-shadow:0 28px 90px rgba(0,0,0,.48)}
    .mn-install-head{display:flex;align-items:center;gap:14px}.mn-spinner{width:38px;height:38px;border-radius:50%;border:4px solid #203a58;border-top-color:#38bdf8;animation:mnspin .8s linear infinite;flex:0 0 auto}@keyframes mnspin{to{transform:rotate(360deg)}}
    .mn-install-head strong{display:block;font-size:18px}.mn-install-head span{display:block;margin-top:4px;color:#93aac4;font-size:12px;line-height:1.45}
    .mn-progress-track{height:7px;margin-top:18px;border-radius:99px;background:#07111d;overflow:hidden}.mn-progress-track i{display:block;width:35%;height:100%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#38bdf8,#a78bfa);animation:mnbar 1.2s ease-in-out infinite alternate}@keyframes mnbar{from{transform:translateX(-40%)}to{transform:translateX(220%)}}
    .mn-progress-note{margin-top:11px;color:#7f98b5;font-size:11px}
    .mn-stream-card{position:sticky;top:8px;z-index:30;margin:10px 0 16px;padding:16px;border:1px solid #315d8a;border-radius:14px;background:linear-gradient(135deg,#10233a,#0b1726);box-shadow:0 14px 34px rgba(0,0,0,.2)}
    .mn-stream-top{display:flex;align-items:center;gap:12px}.mn-stream-top .mn-spinner{width:28px;height:28px;border-width:3px}.mn-stream-title{font-weight:850;font-size:15px}.mn-stream-sub{margin-top:3px;color:#91a9c4;font-size:11px}.mn-stream-log{margin-top:12px;max-height:155px;overflow:auto;padding:10px 12px;border-radius:9px;background:#07111d;color:#bcd0e7;font:11px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap}.mn-stream-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mn-stream-actions a{display:inline-flex;padding:8px 11px;border-radius:8px;background:#2563eb;color:white!important;border:1px solid #60a5fa;text-decoration:none!important;font-weight:800}.mn-stream-card.done{border-color:#247653}.mn-stream-card.done .mn-spinner{animation:none;border-color:#22c55e;background:#22c55e;position:relative}.mn-stream-card.done .mn-spinner:after{content:'✓';position:absolute;inset:0;display:grid;place-items:center;color:#062014;font-weight:900;font-size:16px}

    @media(max-width:760px){body.mn-package-updates-v5 table.ui_tabs{border-spacing:3px 0!important}body.mn-package-updates-v5 table.ui_tabs td.ui_tab td[nowrap]{padding:7px 8px!important;font-size:11px!important}.mn-pkg-ready{align-items:flex-start;flex-direction:column}.mn-install-card{padding:18px}body.mn-package-updates-v5 table.ui_columns thead td,body.mn-package-updates-v5 table.ui_columns tbody td{padding:9px!important}}
  `;
  document.head.appendChild(style);

  const storageKey = 'mn_package_update_started';
  const baselineKey = 'mn_package_update_baseline';
  let baselineUpdates = null;
  let streamCard = null;
  let streamLog = null;
  let streamDone = false;
  let pollTimer = null;

  const normalized = value => String(value || '').replace(/\s+/g,' ').trim().toLowerCase();

  const fetchStatus = async () => {
    try {
      const r = await fetch('/memo-network/live-stats.cgi?_=' + Date.now(), {cache:'no-store',credentials:'same-origin'});
      return r.ok ? await r.json() : null;
    } catch (_) { return null; }
  };

  const showSubmitOverlay = () => {
    if (document.querySelector('.mn-install-overlay')) return;
    const overlay = document.createElement('div');
    overlay.className = 'mn-install-overlay';
    overlay.innerHTML = `<div class="mn-install-card"><div class="mn-install-head"><div class="mn-spinner"></div><div><strong>${t.preparing}</strong><span>${t.installingSub}</span></div></div><div class="mn-progress-track"><i></i></div><div class="mn-progress-note">${t.checking}</div></div>`;
    document.body.appendChild(overlay);
  };

  const looksLikeConfirmation = () => {
    const text = normalized(document.body?.innerText || document.body?.textContent);
    return /(huidige versie|current version|aktuelle version)/.test(text) && /(nieuwe versie|new version|neue version)/.test(text);
  };

  const decorateConfirmation = () => {
    if (!looksLikeConfirmation()) return;
    const forms = [...document.querySelectorAll('form')];
    const confirmForm = forms.find(form => [...form.querySelectorAll('input[type="submit"],button[type="submit"],button:not([type])')]
      .some(btn => /installeer|installieren|install\b/i.test(String(btn.value || btn.textContent || ''))));
    if (!confirmForm || confirmForm.dataset.mnV5Ready === '1') return;
    confirmForm.dataset.mnV5Ready = '1';

    const ready = document.createElement('div');
    ready.className = 'mn-pkg-ready';
    ready.innerHTML = `<div><strong>${t.ready}</strong><span>${t.readySub}</span></div>`;
    confirmForm.parentNode.insertBefore(ready, confirmForm);

    const installButton = [...confirmForm.querySelectorAll('input[type="submit"],button[type="submit"],button:not([type])')]
      .find(btn => /installeer|installieren|install\b/i.test(String(btn.value || btn.textContent || '')));
    if (installButton) { installButton.style.minWidth='150px'; installButton.style.fontSize='13px'; }

    confirmForm.addEventListener('submit', event => {
      const submitter = event.submitter || document.activeElement;
      if (submitter && !/installeer|installieren|install\b/i.test(String(submitter.value || submitter.textContent || ''))) return;
      sessionStorage.setItem(storageKey,String(Date.now()));
      if (baselineUpdates != null) sessionStorage.setItem(baselineKey,String(baselineUpdates));
      if (installButton) { installButton.disabled=true; installButton.style.opacity='.75'; }
      showSubmitOverlay();
    },{capture:true});
  };

  const ensureStreamCard = () => {
    if (streamCard || !document.body) return streamCard;
    streamCard = document.createElement('section');
    streamCard.className = 'mn-stream-card';
    streamCard.innerHTML = `<div class="mn-stream-top"><div class="mn-spinner"></div><div><div class="mn-stream-title">${t.installing}</div><div class="mn-stream-sub">${t.installingSub}</div></div></div><div class="mn-progress-track"><i></i></div><div class="mn-stream-log">${t.waiting}</div><div class="mn-stream-actions" hidden><a href="/package-updates/">${t.back}</a></div>`;
    streamLog = streamCard.querySelector('.mn-stream-log');
    document.body.prepend(streamCard);
    return streamCard;
  };

  const collectOutput = () => {
    if (!streamLog) return;
    const lines=[];
    document.querySelectorAll('ul[data-package-updates] li').forEach(li=>{const text=String(li.innerText||li.textContent||'').trim();if(text)lines.push(text)});
    if(!lines.length){
      const all=String(document.body?.innerText||'').split('\n').map(x=>x.trim()).filter(Boolean);
      lines.push(...all.filter(line=>!/MemoNetwork Edition|Software pakketten Update/i.test(line)).slice(-10));
    }
    if(lines.length)streamLog.textContent=lines.slice(-10).join('\n');
  };

  const markDone = () => {
    if(streamDone)return;
    streamDone=true;
    ensureStreamCard();
    streamCard.classList.add('done');
    streamCard.querySelector('.mn-stream-title').textContent=t.finished;
    streamCard.querySelector('.mn-stream-sub').textContent=t.finishedSub;
    streamCard.querySelector('.mn-progress-track').style.display='none';
    streamCard.querySelector('.mn-stream-actions').hidden=false;
    sessionStorage.removeItem(storageKey);sessionStorage.removeItem(baselineKey);
    if(pollTimer)clearInterval(pollTimer);
  };

  const watchInstall = () => {
    const started=Number(sessionStorage.getItem(storageKey)||0);
    const recent=started&&Date.now()-started<30*60*1000;
    const hasWebminProgress=!!document.querySelector('ul[data-package-updates]');
    if(!recent&&!hasWebminProgress)return;
    ensureStreamCard();collectOutput();
    const baseline=Number(sessionStorage.getItem(baselineKey));
    pollTimer=setInterval(async()=>{
      if(streamDone)return;
      const data=await fetchStatus();if(!data)return;
      const now=Number(data.updates_available||0);
      if(Number.isFinite(baseline)&&baseline>0&&now<baseline)markDone();
    },4000);
  };

  const boot = () => {
    document.body.classList.add('mn-package-updates-v5');
    decorateConfirmation();
    watchInstall();
    fetchStatus().then(data=>{if(data)baselineUpdates=Number(data.updates_available||0)});
    const observer=new MutationObserver(()=>{decorateConfirmation();if(streamCard)collectOutput()});
    observer.observe(document.documentElement,{childList:true,subtree:true});
  };

  if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
