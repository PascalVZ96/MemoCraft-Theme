(() => {
  if (!String(window.location.pathname || '').includes('/package-updates/')) return;
  if (window.__memoPackageUpdatesV5Loaded) return;
  window.__memoPackageUpdatesV5Loaded = true;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : 'nl';
  const i18n = {
    nl: {
      title: 'Software-updates', subtitle: 'Beheer beschikbare Linux-pakketupdates vanuit één overzicht.', settings: 'Module-instellingen',
      packageTab: 'Pakketupdates', scheduledTab: 'Geplande updates', reposTab: 'Pakketbronnen',
      selected: 'Geselecteerde pakketten bijwerken', refresh: 'Pakketlijst verversen', selectAll: 'Alles selecteren', invert: 'Selectie omkeren',
      found: n => `${n} ${n === 1 ? 'update' : 'updates'} gevonden`,
      ready: 'Klaar om te installeren', readySub: 'Controleer de pakketwijzigingen hieronder en start daarna de installatie.',
      preparing: 'Update voorbereiden…', installing: 'Pakketupdate wordt geïnstalleerd',
      installingSub: 'Laat deze pagina open. De voortgang wordt hier live weergegeven.', waiting: 'Wachten op uitvoer van APT/dpkg…',
      finished: 'Update afgerond', finishedSub: 'Het updateproces is afgerond. Je kunt nu terug naar de pakketlijst.',
      failed: 'Update niet volledig afgerond', failedSub: 'Er ging iets mis met de verbinding of het pakketbeheer. Controleer de uitvoer hieronder.',
      back: 'Terug naar pakketupdates', stillWorking: 'Nog bezig…'
    },
    de: {
      title: 'Software-Updates', subtitle: 'Verfügbare Linux-Paketupdates übersichtlich verwalten.', settings: 'Moduleinstellungen',
      packageTab: 'Paketupdates', scheduledTab: 'Geplante Updates', reposTab: 'Paketquellen',
      selected: 'Ausgewählte Pakete aktualisieren', refresh: 'Paketliste aktualisieren', selectAll: 'Alle auswählen', invert: 'Auswahl umkehren',
      found: n => `${n} ${n === 1 ? 'Update' : 'Updates'} gefunden`,
      ready: 'Bereit zur Installation', readySub: 'Prüfe die Paketänderungen unten und starte anschließend die Installation.',
      preparing: 'Update wird vorbereitet…', installing: 'Paketupdate wird installiert',
      installingSub: 'Diese Seite geöffnet lassen. Der Fortschritt wird hier live angezeigt.', waiting: 'Warten auf Ausgabe von APT/dpkg…',
      finished: 'Update abgeschlossen', finishedSub: 'Der Updatevorgang ist abgeschlossen. Du kannst zur Paketliste zurückkehren.',
      failed: 'Update nicht vollständig abgeschlossen', failedSub: 'Bei der Verbindung oder Paketverwaltung ist ein Fehler aufgetreten. Prüfe die Ausgabe unten.',
      back: 'Zurück zu Paketupdates', stillWorking: 'Noch aktiv…'
    },
    en: {
      title: 'Software updates', subtitle: 'Manage available Linux package updates from one clear overview.', settings: 'Module settings',
      packageTab: 'Package updates', scheduledTab: 'Scheduled updates', reposTab: 'Package repositories',
      selected: 'Update selected packages', refresh: 'Refresh package list', selectAll: 'Select all', invert: 'Invert selection',
      found: n => `${n} ${n === 1 ? 'update' : 'updates'} found`,
      ready: 'Ready to install', readySub: 'Review the package changes below and then start the installation.',
      preparing: 'Preparing update…', installing: 'Package update is being installed',
      installingSub: 'Keep this page open. Progress is shown here live.', waiting: 'Waiting for APT/dpkg output…',
      finished: 'Update completed', finishedSub: 'The update process has completed. You can return to the package list.',
      failed: 'Update did not fully complete', failedSub: 'The connection or package manager reported a problem. Check the output below.',
      back: 'Back to package updates', stillWorking: 'Still working…'
    }
  }[lang];

  const css = `
    body.mn-package-updates-v5{background:#08121f!important;color:#f8fbff!important;padding-top:0!important}
    body.mn-package-updates-v5 a{color:#67c5ff!important}
    body.mn-package-updates-v5>table.header,body.mn-package-updates-v5>table.ui_tabs{display:none!important}
    body.mn-package-updates-v5 .mn-pkg-shell{padding:14px 14px 26px!important}
    .mn-pkg-hero{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:0 0 12px;padding:17px 19px;border:1px solid #294361;border-radius:15px;background:linear-gradient(145deg,#15263b,#101c2c);box-shadow:0 10px 28px rgba(0,0,0,.18)}
    .mn-pkg-hero h1{margin:0!important;color:#fff!important;font:850 23px/1.1 Inter,Arial,sans-serif!important;letter-spacing:-.02em!important}.mn-pkg-hero p{margin:5px 0 0!important;color:#8fa8c3!important;font-size:12px!important}.mn-pkg-settings{display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border:1px solid #365979;border-radius:9px;background:#0d1b2b;color:#b8d7f4!important;text-decoration:none!important;font-weight:800;font-size:11px;white-space:nowrap}.mn-pkg-settings:hover{border-color:#4b9cf7;background:#13263d}
    .mn-pkg-tabs{display:flex;align-items:center;gap:7px;margin:0 0 12px;padding:0 2px}.mn-pkg-tab{border:1px solid #31506f;border-radius:9px;background:#0d1a2a;color:#a9c4df;padding:9px 13px;font:800 11px/16px Inter,Arial,sans-serif;cursor:pointer}.mn-pkg-tab:hover{border-color:#4b85bd;color:#dbeafe}.mn-pkg-tab.active{background:#173d69;border-color:#3b82f6;color:#fff;box-shadow:0 5px 14px rgba(37,99,235,.17)}
    body.mn-package-updates-v5 table.ui_tabs_box{width:100%!important;margin:0!important;border:0!important;border-collapse:separate!important;border-spacing:0!important;background:transparent!important;box-shadow:none!important}body.mn-package-updates-v5 table.ui_tabs_box>tbody>tr:first-child{display:none!important}body.mn-package-updates-v5 table.ui_tabs_box>tbody>tr>td{background:transparent!important;border:0!important;color:#eef6ff!important;padding:0!important}
    body.mn-package-updates-v5 .ui_tabs_start{padding:0!important;background:transparent!important;color:#eef6ff!important}body.mn-package-updates-v5 .ui_tabs_start table.wrapper,body.mn-package-updates-v5 .ui_tabs_start table.shrinkwrapper,body.mn-package-updates-v5 .ui_tabs_start table.wrapper>tbody>tr>td,body.mn-package-updates-v5 .ui_tabs_start table.shrinkwrapper>tbody>tr>td{background:transparent!important;border:0!important;box-shadow:none!important;padding-left:0!important;padding-right:0!important}
    body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table{width:100%!important;border:1px solid #294361!important;border-radius:13px!important;border-collapse:separate!important;border-spacing:0!important;background:#101d2d!important;overflow:hidden!important;box-shadow:0 7px 22px rgba(0,0,0,.12)!important}body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table td{background:#101d2d!important;color:#eef6ff!important;border:0!important;padding:11px 13px!important;vertical-align:middle!important}body.mn-package-updates-v5 .ui_tabs_start table.ui_grid_table tr+tr td{border-top:1px solid #223750!important}
    body.mn-package-updates-v5 input.ui_textbox,body.mn-package-updates-v5 input[type=text],body.mn-package-updates-v5 input[type=search],body.mn-package-updates-v5 select{min-height:37px!important;border:1px solid #36506e!important;border-radius:8px!important;background:#091626!important;color:#f8fbff!important;padding:7px 10px!important;box-shadow:none!important}
    .mn-pkg-summary{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:13px 0 8px}.mn-pkg-count{display:inline-flex;align-items:center;gap:7px;color:#b7cae0;font-size:11px;font-weight:800}.mn-pkg-count:before{content:'';width:7px;height:7px;border-radius:50%;background:#38bdf8;box-shadow:0 0 8px rgba(56,189,248,.7)}
    .mn-pkg-actionbar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 10px;padding:10px 11px;border:1px solid #294361;border-radius:11px;background:#0e1a29}.mn-pkg-actions,.mn-pkg-select-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}.mn-pkg-action{min-height:35px;border:1px solid #365979;border-radius:8px;background:#122239;color:#c9ddf1;padding:7px 11px;font:800 11px/16px Inter,Arial,sans-serif;cursor:pointer}.mn-pkg-action:hover{border-color:#4b9cf7}.mn-pkg-action.primary{background:linear-gradient(180deg,#3484f4,#2563eb);border-color:#5aa2f8;color:#fff;box-shadow:0 4px 12px rgba(37,99,235,.18)}.mn-pkg-linkaction{border:0;background:transparent;color:#67c5ff;padding:6px 4px;font:700 11px Inter,Arial,sans-serif;cursor:pointer}
    body.mn-package-updates-v5 #ok_top,body.mn-package-updates-v5 #refresh_top,body.mn-package-updates-v5 #div_pkgs table.ui_form_end_buttons,body.mn-package-updates-v5 #div_pkgs a.select_all,body.mn-package-updates-v5 #div_pkgs a.select_invert{display:none!important}
    body.mn-package-updates-v5 table.ui_columns{width:100%!important;margin:0!important;border:1px solid #294361!important;border-radius:13px!important;border-collapse:separate!important;border-spacing:0!important;background:#101d2d!important;overflow:hidden!important;box-shadow:0 8px 24px rgba(0,0,0,.13)!important}body.mn-package-updates-v5 table.ui_columns thead td{background:#13243a!important;color:#8fc8f8!important;font-size:10px!important;font-weight:850!important;text-transform:uppercase!important;letter-spacing:.055em!important;padding:12px 13px!important;border:0!important;border-bottom:1px solid #2a415e!important}body.mn-package-updates-v5 table.ui_columns tbody td{background:#101d2d!important;color:#eef6ff!important;padding:13px!important;border:0!important;border-top:1px solid #223750!important;vertical-align:middle!important}body.mn-package-updates-v5 table.ui_columns tbody tr:first-child td{border-top:0!important}body.mn-package-updates-v5 table.ui_columns tbody tr.mainsel td,body.mn-package-updates-v5 table.ui_columns tbody tr.mainhighsel td{background:#102b38!important}body.mn-package-updates-v5 table.ui_columns tbody tr:hover td{background:#13243a!important}body.mn-package-updates-v5 table.ui_columns font[color='#00aa00'],body.mn-package-updates-v5 table.ui_columns font[color='#00AA00']{color:#86efac!important}body.mn-package-updates-v5 input.ui_checkbox{width:17px!important;height:17px!important;accent-color:#3b82f6!important}
    body.mn-package-updates-v5 input.ui_submit,body.mn-package-updates-v5 form input[type=submit],body.mn-package-updates-v5 form button{min-height:36px!important;border:1px solid #4f9cf8!important;border-radius:8px!important;background:linear-gradient(180deg,#3484f4,#2563eb)!important;color:#fff!important;font-weight:800!important;padding:7px 13px!important;box-shadow:0 4px 12px rgba(37,99,235,.18)!important;text-shadow:none!important;cursor:pointer!important}
    .mn-pkg-ready{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:10px 0 16px;padding:15px 17px;border:1px solid #315d8a;border-radius:14px;background:linear-gradient(135deg,#10233a,#0c1929);box-shadow:0 10px 30px rgba(0,0,0,.16)}.mn-pkg-ready strong{display:block;color:#fff;font-size:15px}.mn-pkg-ready span{display:block;margin-top:4px;color:#91a9c4;font-size:12px}
    .mn-install-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:rgba(3,9,17,.86);backdrop-filter:blur(5px)}.mn-install-card{width:min(720px,94vw);border:1px solid #315d8a;border-radius:18px;background:linear-gradient(145deg,#14243a,#0b1726);padding:22px;box-shadow:0 28px 90px rgba(0,0,0,.48)}.mn-install-head{display:flex;align-items:center;gap:14px}.mn-spinner{width:38px;height:38px;border-radius:50%;border:4px solid #203a58;border-top-color:#38bdf8;animation:mnspin .8s linear infinite;flex:0 0 auto}@keyframes mnspin{to{transform:rotate(360deg)}}.mn-install-head strong{display:block;font-size:18px}.mn-install-head span{display:block;margin-top:4px;color:#93aac4;font-size:12px;line-height:1.45}.mn-progress-track{height:7px;margin-top:18px;border-radius:99px;background:#07111d;overflow:hidden}.mn-progress-track i{display:block;width:35%;height:100%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#38bdf8,#a78bfa);animation:mnbar 1.2s ease-in-out infinite alternate}@keyframes mnbar{from{transform:translateX(-40%)}to{transform:translateX(220%)}}.mn-progress-note{margin-top:10px;color:#7f98b5;font-size:11px}.mn-install-log{margin-top:14px;min-height:58px;max-height:240px;overflow:auto;padding:11px 12px;border:1px solid #20364f;border-radius:10px;background:#07111d;color:#c8d8e9;font:11px/1.55 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap}.mn-install-actions{display:none;gap:8px;margin-top:14px}.mn-install-actions a{display:inline-flex;padding:9px 12px;border:1px solid #60a5fa;border-radius:8px;background:#2563eb;color:#fff!important;text-decoration:none!important;font-weight:800}.mn-install-card.done{border-color:#247653}.mn-install-card.done .mn-spinner{animation:none;border-color:#22c55e;background:#22c55e;position:relative}.mn-install-card.done .mn-spinner:after{content:'✓';position:absolute;inset:0;display:grid;place-items:center;color:#062014;font-weight:900;font-size:16px}.mn-install-card.done .mn-progress-track{display:none}.mn-install-card.done .mn-install-actions{display:flex}.mn-install-card.failed{border-color:#9a5b36}.mn-install-card.failed .mn-spinner{animation:none;border-color:#f59e0b;background:#f59e0b}.mn-install-card.failed .mn-progress-track{display:none}.mn-install-card.failed .mn-install-actions{display:flex}
    @media(max-width:760px){.mn-pkg-hero{align-items:flex-start;flex-direction:column}.mn-pkg-tabs{overflow:auto}.mn-pkg-actionbar{align-items:flex-start;flex-direction:column}body.mn-package-updates-v5 table.ui_columns thead td,body.mn-package-updates-v5 table.ui_columns tbody td{padding:9px!important}.mn-install-card{padding:18px}}
  `;
  const style = document.createElement('style');
  style.id = 'mn-package-updates-v5-style';
  style.textContent = css;
  document.head.appendChild(style);

  const normalized = value => String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
  let baselineUpdates = null;
  let installRunning = false;

  const fetchStatus = async () => {
    try {
      const r = await fetch('/memo-network/live-stats.cgi?_=' + Date.now(), {cache:'no-store', credentials:'same-origin'});
      return r.ok ? await r.json() : null;
    } catch (_) { return null; }
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
    hero.innerHTML = `<div><h1>${i18n.title}</h1><p>${i18n.subtitle}</p></div><a class="mn-pkg-settings" href="${moduleLink}">⚙ ${i18n.settings}</a>`;
    header.parentNode.insertBefore(shell, header); shell.appendChild(hero);
    const tabbar = document.createElement('nav'); tabbar.className = 'mn-pkg-tabs';
    [['pkgs',i18n.packageTab],['sched',i18n.scheduledTab],['repos',i18n.reposTab]].forEach(([name,label]) => {
      if (!document.getElementById('div_' + name)) return;
      const button = document.createElement('button'); button.type = 'button'; button.className = 'mn-pkg-tab'; button.dataset.tab = name; button.textContent = label;
      button.addEventListener('click', () => { if (typeof window.select_tab === 'function') window.select_tab('tab', name); setTimeout(updateTabState, 0); });
      tabbar.appendChild(button);
    });
    shell.appendChild(tabbar); shell.appendChild(tabsBox);
    const updateTabState = () => tabbar.querySelectorAll('.mn-pkg-tab').forEach(button => button.classList.toggle('active', document.getElementById('div_' + button.dataset.tab)?.classList.contains('opener_shown')));
    window.setInterval(updateTabState, 500); updateTabState();
  };

  const cleanupLegacySeparators = () => {
    const area = document.getElementById('div_pkgs');
    if (!area) return;
    const walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT);
    const remove = [];
    while (walker.nextNode()) if (/^\s*\|\s*$/.test(walker.currentNode.nodeValue || '')) remove.push(walker.currentNode);
    remove.forEach(node => node.remove());
  };

  const setupPackageActions = () => {
    const form = [...document.querySelectorAll('form[action="update.cgi"]')].find(f => f.querySelector('table.ui_columns'));
    const table = form?.querySelector('table.ui_columns');
    if (!form || !table || form.querySelector('.mn-pkg-actionbar')) return;
    const ok = form.querySelector('#ok_top') || form.querySelector('#ok');
    const refresh = form.querySelector('#refresh_top') || form.querySelector('#refresh');
    const selectAll = form.querySelector('a.select_all');
    const invert = form.querySelector('a.select_invert');
    const wrapper = table.closest('table.wrapper') || table;
    const count = table.querySelectorAll('tbody tr[id^="row_"]').length;
    const summary = document.createElement('div'); summary.className = 'mn-pkg-summary'; summary.innerHTML = `<span class="mn-pkg-count">${i18n.found(count)}</span>`;
    wrapper.parentNode.insertBefore(summary, wrapper);
    const bar = document.createElement('div'); bar.className = 'mn-pkg-actionbar';
    bar.innerHTML = `<div class="mn-pkg-actions"><button class="mn-pkg-action primary" type="button" data-act="update">${i18n.selected}</button><button class="mn-pkg-action" type="button" data-act="refresh">${i18n.refresh}</button></div><div class="mn-pkg-select-actions"><button class="mn-pkg-linkaction" type="button" data-act="all">${i18n.selectAll}</button><button class="mn-pkg-linkaction" type="button" data-act="invert">${i18n.invert}</button></div>`;
    wrapper.parentNode.insertBefore(bar, wrapper);
    bar.querySelector('[data-act="update"]').addEventListener('click', () => ok?.click());
    bar.querySelector('[data-act="refresh"]').addEventListener('click', () => refresh?.click());
    bar.querySelector('[data-act="all"]').addEventListener('click', () => selectAll?.click());
    bar.querySelector('[data-act="invert"]').addEventListener('click', () => invert?.click());
    const walker = document.createTreeWalker(form, NodeFilter.SHOW_TEXT); const remove = [];
    while (walker.nextNode()) if (/\d+\s+(overeenkomende pakketten gevonden|matching packages found|pakete gefunden)/i.test(walker.currentNode.nodeValue || '')) remove.push(walker.currentNode);
    remove.forEach(node => { node.nodeValue = ''; }); cleanupLegacySeparators();
  };

  const looksLikeConfirmation = () => {
    const text = normalized(document.body?.innerText || document.body?.textContent);
    return /(huidige versie|current version|aktuelle version)/.test(text) && /(nieuwe versie|new version|neue version)/.test(text);
  };

  const installButtons = form => [...form.querySelectorAll('input[type="submit"],button[type="submit"],button:not([type])')]
    .filter(btn => /installeer|installieren|install\b/i.test(String(btn.value || btn.textContent || '')));

  const createOverlay = () => {
    document.querySelector('.mn-install-overlay')?.remove();
    const overlay = document.createElement('div'); overlay.className = 'mn-install-overlay';
    overlay.innerHTML = `<div class="mn-install-card"><div class="mn-install-head"><div class="mn-spinner"></div><div><strong class="mn-install-title">${i18n.preparing}</strong><span class="mn-install-sub">${i18n.installingSub}</span></div></div><div class="mn-progress-track"><i></i></div><div class="mn-progress-note">${i18n.stillWorking}</div><div class="mn-install-log">${i18n.waiting}</div><div class="mn-install-actions"><a href="/package-updates/index.cgi?tab=pkgs">${i18n.back}</a></div></div>`;
    document.body.appendChild(overlay);
    return {
      overlay,
      card: overlay.querySelector('.mn-install-card'), title: overlay.querySelector('.mn-install-title'), sub: overlay.querySelector('.mn-install-sub'),
      note: overlay.querySelector('.mn-progress-note'), log: overlay.querySelector('.mn-install-log')
    };
  };

  const extractProgress = html => {
    if (!html) return [];
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const lines = [];
      doc.querySelectorAll('ul[data-package-updates] li').forEach(li => {
        const line = String(li.textContent || '').replace(/\s+/g, ' ').trim();
        if (line && !lines.includes(line)) lines.push(line);
      });
      return lines.slice(-14);
    } catch (_) { return []; }
  };

  const finishOverlay = (ui, success, lines, detail) => {
    ui.card.classList.add(success ? 'done' : 'failed');
    ui.title.textContent = success ? i18n.finished : i18n.failed;
    ui.sub.textContent = success ? i18n.finishedSub : i18n.failedSub;
    ui.note.textContent = detail || '';
    if (lines?.length) ui.log.textContent = lines.join('\n');
  };

  const runInstallAjax = async (form, submitter) => {
    if (installRunning) return;
    installRunning = true;
    const ui = createOverlay();
    const started = Date.now();
    const elapsedTimer = setInterval(() => { if (!ui.card.classList.contains('done') && !ui.card.classList.contains('failed')) ui.note.textContent = `${i18n.stillWorking} ${Math.floor((Date.now() - started) / 1000)}s`; }, 1000);
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => params.append(key, String(value)));
    if (submitter?.name) params.append(submitter.name, submitter.value || '1');
    if (!params.has('confirm')) params.append('confirm', '1');
    const action = new URL(form.getAttribute('action') || 'update.cgi', window.location.href).href;
    let buffer = '';
    let lastLines = [];
    try {
      ui.title.textContent = i18n.installing;
      const response = await fetch(action, {method:'POST', credentials:'same-origin', cache:'no-store', headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'}, body:params.toString()});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (response.body?.getReader) {
        const reader = response.body.getReader(); const decoder = new TextDecoder();
        while (true) {
          const {done, value} = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, {stream:true});
          if (buffer.length > 500000) buffer = buffer.slice(-350000);
          const lines = extractProgress(buffer);
          if (lines.length) { lastLines = lines; ui.log.textContent = lines.join('\n'); ui.log.scrollTop = ui.log.scrollHeight; }
        }
        buffer += decoder.decode();
      } else {
        buffer = await response.text();
      }
      const lines = extractProgress(buffer); if (lines.length) lastLines = lines;
      const text = normalized(new DOMParser().parseFromString(buffer, 'text/html').body?.textContent || '');
      const explicitFailure = /(update failed|update mislukt|aktualisierung fehlgeschlagen|error while|dpkg: error|apt.*error)/i.test(text);
      clearInterval(elapsedTimer);
      finishOverlay(ui, !explicitFailure, lastLines, `${Math.max(1, Math.floor((Date.now() - started) / 1000))}s`);
    } catch (error) {
      clearInterval(elapsedTimer);
      const status = await fetchStatus();
      const current = Number(status?.updates_available);
      const completedDespiteDisconnect = Number.isFinite(baselineUpdates) && baselineUpdates > 0 && Number.isFinite(current) && current < baselineUpdates;
      finishOverlay(ui, completedDespiteDisconnect, lastLines, completedDespiteDisconnect ? '' : String(error?.message || error || ''));
    } finally {
      installRunning = false;
    }
  };

  const decorateConfirmation = () => {
    if (!looksLikeConfirmation() || document.querySelector('.mn-pkg-ready')) return;
    const forms = [...document.querySelectorAll('form')].filter(form => installButtons(form).length);
    if (!forms.length) return;
    const form = forms.find(f => !f.hasAttribute('data-outside-of-viewport')) || forms[0];
    forms.filter(f => f !== form).forEach(f => { f.style.display = 'none'; });
    const button = installButtons(form)[0];
    if (button) { button.style.minWidth = '150px'; button.style.fontSize = '13px'; }
    const ready = document.createElement('div'); ready.className = 'mn-pkg-ready'; ready.innerHTML = `<div><strong>${i18n.ready}</strong><span>${i18n.readySub}</span></div>`;
    form.parentNode.insertBefore(ready, form);
    form.addEventListener('submit', event => {
      const submitter = event.submitter || document.activeElement || button;
      if (!submitter || !/installeer|installieren|install\b/i.test(String(submitter.value || submitter.textContent || ''))) return;
      event.preventDefault(); event.stopPropagation();
      if (button) { button.disabled = true; button.style.opacity = '.7'; }
      runInstallAjax(form, submitter).finally(() => { if (button) { button.disabled = false; button.style.opacity = ''; } });
    }, true);
  };

  const boot = () => {
    document.body.classList.add('mn-package-updates-v5');
    setupChrome(); setupPackageActions(); cleanupLegacySeparators(); decorateConfirmation();
    fetchStatus().then(data => { if (data) baselineUpdates = Number(data.updates_available || 0); });
    const observer = new MutationObserver(() => { setupChrome(); setupPackageActions(); cleanupLegacySeparators(); decorateConfirmation(); });
    observer.observe(document.documentElement, {childList:true, subtree:true});
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
})();
