(() => {
  const path = String(window.location.pathname || '');
  if (!path.includes('/package-updates/')) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : 'nl';
  const t = {
    nl: {
      title:'Software-updates', subtitle:'Beheer beschikbare Linux-pakketupdates vanuit één overzicht.', settings:'Module-instellingen',
      packageTab:'Pakketupdates', scheduledTab:'Geplande updates', reposTab:'Pakketbronnen',
      selected:'Geselecteerde pakketten bijwerken', refresh:'Pakketlijst verversen', selectAll:'Alles selecteren', invert:'Selectie omkeren',
      found:n=>`${n} ${n===1?'update':'updates'} gevonden`,
      ready:'Klaar om te installeren', readySub:'Controleer de pakketwijzigingen hieronder en start daarna de installatie.',
      preparing:'Update voorbereiden…', installing:'Pakketupdate wordt geïnstalleerd',
      installingSub:'Laat deze pagina open. APT/dpkg kan soms even geen nieuwe uitvoer tonen; de installatie loopt dan gewoon door.',
      checking:'Pakketstatus controleren…', waiting:'Wachten op nieuwe uitvoer van het pakketbeheer…',
      finished:'Update afgerond', finishedSub:'De pakketstatus is vernieuwd en de installatie is afgerond.', back:'Terug naar pakketupdates'
    },
    de: {
      title:'Software-Updates', subtitle:'Verfügbare Linux-Paketupdates übersichtlich verwalten.', settings:'Moduleinstellungen',
      packageTab:'Paketupdates', scheduledTab:'Geplante Updates', reposTab:'Paketquellen',
      selected:'Ausgewählte Pakete aktualisieren', refresh:'Paketliste aktualisieren', selectAll:'Alle auswählen', invert:'Auswahl umkehren',
      found:n=>`${n} ${n===1?'Update':'Updates'} gefunden`,
      ready:'Bereit zur Installation', readySub:'Prüfe die Paketänderungen unten und starte anschließend die Installation.',
      preparing:'Update wird vorbereitet…', installing:'Paketupdate wird installiert',
      installingSub:'Diese Seite geöffnet lassen. APT/dpkg kann kurz keine neue Ausgabe zeigen; die Installation läuft trotzdem weiter.',
      checking:'Paketstatus wird geprüft…', waiting:'Warten auf neue Ausgabe der Paketverwaltung…',
      finished:'Update abgeschlossen', finishedSub:'Der Paketstatus wurde aktualisiert und die Installation ist abgeschlossen.', back:'Zurück zu Paketupdates'
    },
    en: {
      title:'Software updates', subtitle:'Manage available Linux package updates from one clear overview.', settings:'Module settings',
      packageTab:'Package updates', scheduledTab:'Scheduled updates', reposTab:'Package repositories',
      selected:'Update selected packages', refresh:'Refresh package list', selectAll:'Select all', invert:'Invert selection',
      found:n=>`${n} ${n===1?'update':'updates'} found`,
      ready:'Ready to install', readySub:'Review the package changes below and then start the installation.',
      preparing:'Preparing update…', installing:'Package update is being installed',
      installingSub:'Keep this page open. APT/dpkg can be quiet for a while; the installation will keep running.',
      checking:'Checking package status…', waiting:'Waiting for new package-manager output…',
      finished:'Update completed', finishedSub:'Package status has been refreshed and the installation completed.', back:'Back to package updates'
    }
  }[lang];

  const style = document.createElement('style');
  style.id = 'mn-package-updates-v5-style';
  style.textContent = `
    body.mn-package-updates-v5{background:#08121f!important;color:#f8fbff!important;padding-top:0!important}
    body.mn-package-updates-v5 a{color:#67c5ff!important}
    body.mn-package-updates-v5>table.header,body.mn-package-updates-v5>table.ui_tabs{display:none!important}
    body.mn-package-updates-v5 .mn-pkg-shell{padding:14px 14px 26px!important}
    .mn-pkg-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 12px;padding:17px 19px;border:1px solid #294361;border-radius:15px;background:linear-gradient(145deg,#15263b,#101c2c);box-shadow:0 10px 28px rgba(0,0,0,.18)}
    .mn-pkg-hero h1{margin:0!important;color:#fff!important;font:850 23px/1.1 Inter,Arial,sans-serif!important;letter-spacing:-.02em!important}.mn-pkg-hero p{margin:5px 0 0!important;color:#8fa8c3!important;font-size:12px!important}.mn-pkg-settings{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #365979;border-radius:9px;background:#0d1b2b;color:#b8d7f4!important;text-decoration:none!important;font-weight:800;font-size:11px;white-space:nowrap}.mn-pkg-settings:hover{border-color:#4b9cf7;background:#13263d}
    .mn-pkg-tabs{display:flex;align-items:center;gap:7px;margin:0 0 12px;padding:0 2px}.mn-pkg-tab{border:1px solid #31506f;border-radius:9px;background:#0d1a2a;color:#a9c4df;padding:9px 13px;font:800 11px/16px Inter,Arial,sans-serif;cursor:pointer}.mn-pkg-tab:hover{border-color:#4b85bd;color:#dbeafe}.mn-pkg-tab.active{background:#173d69;border-color:#3b82f6;color:#fff;box-shadow:0 5px 14px rgba(37,99,235,.17)}
    body.mn-package-updates-v5 table.ui_tabs_box{width:100%!important;margin:0!important;border:0!important;border-collapse:separate!important;border-spacing:0!important;background:transparent!important;box-shadow:none!important}
    body.mn-package-updates-v5 table.ui_tabs_box>tbody>tr:first-child{display:none!important}body.mn-package-updates-v5 table.ui_tabs_box>tbody>tr>td{background:transparent!important;border:0!important;color:#eef6ff!important;padding:0!important}
    body.mn-package-updates-v5 .ui_tabs_start{padding:0!important;background:transparent!important;color:#eef6ff!important}
    body.mn-package-updates-v5 .ui_tabs_start table.wrapper,body.mn-package-updates-v5 .ui_tabs_start table.shrinkwrapper,body.mn-package-updates-v5 .ui_tabs_start table.wrapper>tbody>tr>td,body.mn-package-updates-v5 .ui_tabs_start table.shrinkwrapper>tbody>tr>td{background:transparent!important;border:0!important;box-shadow:none!important;padding-left:0!important;padding-right:0!important}
    body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table{width:100%!important;border:1px solid #294361!important;border-radius:13px!important;border-collapse:separate!important;border-spacing:0!important;background:#101d2d!important;overflow:hidden!important;box-shadow:0 7px 22px rgba(0,0,0,.12)!important}
    body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table td{background:#101d2d!important;color:#eef6ff!important;border:0!important;padding:11px 13px!important;vertical-align:middle!important}body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table tr+tr td{border-top:1px solid #223750!important}
    body.mn-package-updates-v5 input.ui_textbox,body.mn-package-updates-v5 input[type=text],body.mn-package-updates-v5 input[type=search],body.mn-package-updates-v5 select{min-height:37px!important;border:1px solid #36506e!important;border-radius:8px!important;background:#091626!important;color:#f8fbff!important;padding:7px 10px!important;box-shadow:none!important}
    .mn-pkg-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:13px 0 8px}.mn-pkg-count{display:inline-flex;align-items:center;gap:7px;color:#b7cae0;font-size:11px;font-weight:800}.mn-pkg-count:before{content:'';width:7px;height:7px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px rgba(56,189,248,.7)}
    .mn-pkg-actionbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px;padding:10px 11px;border:1px solid #294361;border-radius:11px;background:#0e1a29}.mn-pkg-actions,.mn-pkg-select-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.mn-pkg-action{min-height:35px;border:1px solid #365979;border-radius:8px;background:#122239;color:#c9ddf1;padding:7px 11px;font:800 11px/16px Inter,Arial,sans-serif;cursor:pointer}.mn-pkg-action:hover{border-color:#4b9cf7}.mn-pkg-action.primary{background:linear-gradient(180deg,#3484f4,#2563eb);border-color:#5aa2f8;color:#fff;box-shadow:0 4px 12px rgba(37,99,235,.18)}.mn-pkg-linkaction{border:0;background:transparent;color:#67c5ff;padding:6px 4px;font:700 11px Inter,Arial,sans-serif;cursor:pointer}
    body.mn-package-updates-v5 #ok_top,body.mn-package-updates-v5 #refresh_top,body.mn-package-updates-v5 table.ui_form_end_buttons,body.mn-package-updates-v5 a.select_all,body.mn-package-updates-v5 a.select_invert{display:none!important}
    body.mn-package-updates-v5 table.ui_columns{width:100%!important;margin:0!important;border:1px solid #294361!important;border-radius:13px!important;border-collapse:separate!important;border-spacing:0!important;background:#101d2d!important;overflow:hidden!important;box-shadow:0 8px 24px rgba(0,0,0,.13)!important}
    body.mn-package-updates-v5 table.ui_columns thead td{background:#13243a!important;color:#8fc8f8!important;font-size:10px!important;font-weight:850!important;text-transform:uppercase!important;letter-spacing:.055em!important;padding:12px 13px!important;border:0!important;border-bottom:1px solid #2a415e!important}body.mn-package-updates-v5 table.ui_columns tbody td{background:#101d2d!important;color:#eef6ff!important;padding:13px!important;border:0!important;border-top:1px solid #223750!important;vertical-align:middle!important}body.mn-package-updates-v5 table.ui_columns tbody tr:first-child td{border-top:0!important}body.mn-package-updates-v5 table.ui_columns tbody tr.mainsel td,body.mn-package-updates-v5 table.ui_columns tbody tr.mainhighsel td{background:#102b38!important}body.mn-package-updates-v5 table.ui_columns tbody tr:hover td{background:#13243a!important}body.mn-package-updates-v5 table.ui_columns font[color='#00aa00'],body.mn-package-updates-v5 table.ui_columns font[color='#00AA00']{color:#86efac!important}body.mn-package-updates-v5 input.ui_checkbox{width:17px!important;height:17px!important;accent-color:#3b82f6!important}
    body.mn-package-updates-v5 input.ui_submit,body.mn-package-updates-v5 form input[type=submit],body.mn-package-updates-v5 form button{min-height:36px!important;border:1px solid #4f9cf8!important;border-radius:8px!important;background:linear-gradient(180deg,#3484f4,#2563eb)!important;color:#fff!important;font-weight:800!important;padding:7px 13px!important;box-shadow:0 4px 12px rgba(37,99,235,.18)!important;text-shadow:none!important;cursor:pointer!important}
    .mn-pkg-ready{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:10px 0 16px;padding:15px 17px;border:1px solid #315d8a;border-radius:14px;background:linear-gradient(135deg,#10233a,#0c1929);box-shadow:0 10px 30px rgba(0,0,0,.16)}.mn-pkg-ready strong{display:block;color:#fff;font-size:15px}.mn-pkg-ready span{display:block;margin-top:4px;color:#91a9c4;font-size:12px}
    .mn-install-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:rgba(3,9,17,.8);backdrop-filter:blur(4px)}.mn-install-card{width:min(620px,94vw);border:1px solid #315d8a;border-radius:18px;background:linear-gradient(145deg,#14243a,#0b1726);padding:22px;box-shadow:0 28px 90px rgba(0,0,0,.48)}.mn-install-head{display:flex;align-items:center;gap:14px}.mn-spinner{width:38px;height:38px;border-radius:50%;border:4px solid #203a58;border-top-color:#38bdf8;animation:mnspin .8s linear infinite;flex:0 0 auto}@keyframes mnspin{to{transform:rotate(360deg)}}.mn-install-head strong{display:block;font-size:18px}.mn-install-head span{display:block;margin-top:4px;color:#93aac4;font-size:12px;line-height:1.45}.mn-progress-track{height:7px;margin-top:18px;border-radius:99px;background:#07111d;overflow:hidden}.mn-progress-track i{display:block;width:35%;height:100%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#38bdf8,#a78bfa);animation:mnbar 1.2s ease-in-out infinite alternate}@keyframes mnbar{from{transform:translateX(-40%)}to{transform:translateX(220%)}}.mn-progress-note{margin-top:11px;color:#7f98b5;font-size:11px}
    .mn-stream-card{position:sticky;top:8px;z-index:30;margin:10px 0 16px;padding:16px;border:1px solid #315d8a;border-radius:14px;background:linear-gradient(135deg,#10233a,#0b1726);box-shadow:0 14px 34px rgba(0,0,0,.2)}.mn-stream-top{display:flex;align-items:center;gap:12px}.mn-stream-top .mn-spinner{width:28px;height:28px;border-width:3px}.mn-stream-title{font-weight:850;font-size:15px}.mn-stream-sub{margin-top:3px;color:#91a9c4;font-size:11px}.mn-stream-log{margin-top:12px;max-height:155px;overflow:auto;padding:10px 12px;border-radius:9px;background:#07111d;color:#bcd0e7;font:11px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap}.mn-stream-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mn-stream-actions a{display:inline-flex;padding:8px 11px;border-radius:8px;background:#2563eb;color:white!important;border:1px solid #60a5fa;text-decoration:none!important;font-weight:800}.mn-stream-card.done{border-color:#247653}.mn-stream-card.done .mn-spinner{animation:none;border-color:#22c55e;background:#22c55e;position:relative}.mn-stream-card.done .mn-spinner:after{content:'✓';position:absolute;inset:0;display:grid;place-items:center;color:#062014;font-weight:900;font-size:16px}
    @media(max-width:760px){.mn-pkg-hero{align-items:flex-start;flex-direction:column}.mn-pkg-tabs{overflow:auto}.mn-pkg-actionbar{align-items:flex-start;flex-direction:column}body.mn-package-updates-v5 table.ui_columns thead td,body.mn-package-updates-v5 table.ui_columns tbody td{padding:9px!important}.mn-install-card{padding:18px}}
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

  const cleanupLegacySeparators = root => {
    if (!root) return;
    const parents = new Set();
    root.querySelectorAll('a.select_all,a.select_invert').forEach(link => { if (link.parentNode) parents.add(link.parentNode); });
    parents.forEach(parent => {
      [...parent.childNodes].forEach(node => {
        if (node.nodeType === Node.TEXT_NODE && String(node.nodeValue || '').trim() === '|') node.nodeValue = '';
      });
    });
  };

  const setupChrome = () => {
    if (document.querySelector('.mn-pkg-hero')) return;
    const header = document.querySelector('table.header');
    const tabs = document.querySelector('table.ui_tabs');
    const tabsBox = document.querySelector('table.ui_tabs_box');
    if (!header || !tabs || !tabsBox) return;
    const moduleLink = header.querySelector('#headln2l a')?.getAttribute('href') || '/config.cgi?module=package-updates';
    const shell = document.createElement('div'); shell.className = 'mn-pkg-shell';
    const hero = document.createElement('section'); hero.className = 'mn-pkg-hero';
    hero.innerHTML = `<div><h1>${t.title}</h1><p>${t.subtitle}</p></div><a class="mn-pkg-settings" href="${moduleLink}">⚙ ${t.settings}</a>`;
    header.parentNode.insertBefore(shell, header); shell.appendChild(hero);
    const tabbar = document.createElement('nav'); tabbar.className = 'mn-pkg-tabs';
    [['pkgs',t.packageTab],['sched',t.scheduledTab],['repos',t.reposTab]].forEach(([name,label]) => {
      const button = document.createElement('button'); button.type='button'; button.className='mn-pkg-tab'; button.dataset.tab=name; button.textContent=label;
      button.addEventListener('click',()=>{ if(typeof window.select_tab==='function') window.select_tab('tab',name); setTimeout(updateTabState,0); }); tabbar.appendChild(button);
    });
    shell.appendChild(tabbar); shell.appendChild(tabsBox);
    const updateTabState = () => tabbar.querySelectorAll('.mn-pkg-tab').forEach(button => button.classList.toggle('active',document.getElementById('div_'+button.dataset.tab)?.classList.contains('opener_shown')));
    window.setInterval(updateTabState,500); updateTabState();
  };

  const setupPackageActions = () => {
    const form = document.querySelector('form[action="update.cgi"]');
    const table = form?.querySelector('table.ui_columns');
    if (!form || !table) return;
    cleanupLegacySeparators(form);
    if (form.querySelector('.mn-pkg-actionbar')) return;
    const ok = form.querySelector('#ok_top') || form.querySelector('#ok');
    const refresh = form.querySelector('#refresh_top') || form.querySelector('#refresh');
    const selectAll = form.querySelector('a.select_all');
    const invert = form.querySelector('a.select_invert');
    const wrapper = table.closest('table.wrapper') || table;
    const count = table.querySelectorAll('tbody tr[id^="row_"]').length;
    const summary = document.createElement('div'); summary.className='mn-pkg-summary'; summary.innerHTML=`<span class="mn-pkg-count">${t.found(count)}</span>`; wrapper.parentNode.insertBefore(summary,wrapper);
    const bar = document.createElement('div'); bar.className='mn-pkg-actionbar';
    bar.innerHTML=`<div class="mn-pkg-actions"><button class="mn-pkg-action primary" type="button" data-act="update">${t.selected}</button><button class="mn-pkg-action" type="button" data-act="refresh">${t.refresh}</button></div><div class="mn-pkg-select-actions"><button class="mn-pkg-linkaction" type="button" data-act="all">${t.selectAll}</button><button class="mn-pkg-linkaction" type="button" data-act="invert">${t.invert}</button></div>`;
    wrapper.parentNode.insertBefore(bar,wrapper);
    bar.querySelector('[data-act="update"]').addEventListener('click',()=>ok?.click());
    bar.querySelector('[data-act="refresh"]').addEventListener('click',()=>refresh?.click());
    bar.querySelector('[data-act="all"]').addEventListener('click',()=>selectAll?.click());
    bar.querySelector('[data-act="invert"]').addEventListener('click',()=>invert?.click());
    const walker = document.createTreeWalker(form,NodeFilter.SHOW_TEXT); const remove=[];
    while(walker.nextNode()){
      const node=walker.currentNode;
      if(/\d+\s+(overeenkomende pakketten gevonden|matching packages found|pakete gefunden)/i.test(node.nodeValue||'')) remove.push(node);
      if(String(node.nodeValue||'').trim()==='|') remove.push(node);
    }
    remove.forEach(node=>{node.nodeValue=''});
  };

  const fetchStatus = async () => { try { const r=await fetch('/memo-network/live-stats.cgi?_='+Date.now(),{cache:'no-store',credentials:'same-origin'}); return r.ok?await r.json():null; } catch(_){ return null; } };
  const showSubmitOverlay = () => { if(document.querySelector('.mn-install-overlay'))return;const overlay=document.createElement('div');overlay.className='mn-install-overlay';overlay.innerHTML=`<div class="mn-install-card"><div class="mn-install-head"><div class="mn-spinner"></div><div><strong>${t.preparing}</strong><span>${t.installingSub}</span></div></div><div class="mn-progress-track"><i></i></div><div class="mn-progress-note">${t.checking}</div></div>`;document.body.appendChild(overlay); };
  const looksLikeConfirmation = () => {const text=normalized(document.body?.innerText||document.body?.textContent);return /(huidige versie|current version|aktuelle version)/.test(text)&&/(nieuwe versie|new version|neue version)/.test(text)};
  const decorateConfirmation = () => {
    if(!looksLikeConfirmation())return;const forms=[...document.querySelectorAll('form')];const confirmForm=forms.find(form=>[...form.querySelectorAll('input[type="submit"],button[type="submit"],button:not([type])')].some(btn=>/installeer|installieren|install\b/i.test(String(btn.value||btn.textContent||''))));if(!confirmForm||confirmForm.dataset.mnV5Ready==='1')return;confirmForm.dataset.mnV5Ready='1';
    const ready=document.createElement('div');ready.className='mn-pkg-ready';ready.innerHTML=`<div><strong>${t.ready}</strong><span>${t.readySub}</span></div>`;confirmForm.parentNode.insertBefore(ready,confirmForm);
    const installButton=[...confirmForm.querySelectorAll('input[type="submit"],button[type="submit"],button:not([type])')].find(btn=>/installeer|installieren|install\b/i.test(String(btn.value||btn.textContent||'')));if(installButton){installButton.style.minWidth='150px';installButton.style.fontSize='13px'}
    confirmForm.addEventListener('submit',event=>{const submitter=event.submitter||document.activeElement;if(submitter&&!/installeer|installieren|install\b/i.test(String(submitter.value||submitter.textContent||'')))return;sessionStorage.setItem(storageKey,String(Date.now()));if(baselineUpdates!=null)sessionStorage.setItem(baselineKey,String(baselineUpdates));if(installButton){installButton.disabled=true;installButton.style.opacity='.75'}showSubmitOverlay()},{capture:true});
  };
  const ensureStreamCard = () => {if(streamCard||!document.body)return streamCard;streamCard=document.createElement('section');streamCard.className='mn-stream-card';streamCard.innerHTML=`<div class="mn-stream-top"><div class="mn-spinner"></div><div><div class="mn-stream-title">${t.installing}</div><div class="mn-stream-sub">${t.installingSub}</div></div></div><div class="mn-progress-track"><i></i></div><div class="mn-stream-log">${t.waiting}</div><div class="mn-stream-actions" hidden><a href="/package-updates/">${t.back}</a></div>`;streamLog=streamCard.querySelector('.mn-stream-log');document.body.prepend(streamCard);return streamCard};
  const collectOutput = () => {if(!streamLog)return;const lines=[];document.querySelectorAll('ul[data-package-updates] li').forEach(li=>{const text=String(li.innerText||li.textContent||'').trim();if(text)lines.push(text)});if(!lines.length){const all=String(document.body?.innerText||'').split('\n').map(x=>x.trim()).filter(Boolean);lines.push(...all.filter(line=>!/MemoNetwork Edition|Software pakketten Update/i.test(line)).slice(-10))}if(lines.length)streamLog.textContent=lines.slice(-10).join('\n')};
  const markDone = () => {if(streamDone)return;streamDone=true;ensureStreamCard();streamCard.classList.add('done');streamCard.querySelector('.mn-stream-title').textContent=t.finished;streamCard.querySelector('.mn-stream-sub').textContent=t.finishedSub;streamCard.querySelector('.mn-progress-track').style.display='none';streamCard.querySelector('.mn-stream-actions').hidden=false;sessionStorage.removeItem(storageKey);sessionStorage.removeItem(baselineKey);if(pollTimer)clearInterval(pollTimer)};
  const watchInstall = () => {const started=Number(sessionStorage.getItem(storageKey)||0),recent=started&&Date.now()-started<30*60*1000,hasWebminProgress=!!document.querySelector('ul[data-package-updates]');if(!recent&&!hasWebminProgress)return;ensureStreamCard();collectOutput();const baseline=Number(sessionStorage.getItem(baselineKey));pollTimer=setInterval(async()=>{if(streamDone)return;const data=await fetchStatus();if(!data)return;const now=Number(data.updates_available||0);if(Number.isFinite(baseline)&&baseline>0&&now<baseline)markDone()},4000)};

  const boot = () => {
    document.body.classList.add('mn-package-updates-v5'); setupChrome(); setupPackageActions(); decorateConfirmation(); watchInstall(); fetchStatus().then(data=>{if(data)baselineUpdates=Number(data.updates_available||0)});
    const observer=new MutationObserver(()=>{setupChrome();setupPackageActions();cleanupLegacySeparators(document);decorateConfirmation();if(streamCard)collectOutput()}); observer.observe(document.documentElement,{childList:true,subtree:true});
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();
