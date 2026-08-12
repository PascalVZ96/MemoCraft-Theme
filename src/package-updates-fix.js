(() => {
  const path = String(window.location.pathname || '');
  if (!path.includes('/package-updates/')) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : 'en';
  const i18n = {
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
    body.mn-package-updates-v5 h1{font-size:25px!important;font-weight:850!important;letter-spacing:-.02em!important;margin:10px 0 18px!important;color:#f8fbff!important}
    body.mn-package-updates-v5 a{color:#67c5ff!important}

    /* Alleen echte pakket-tabellen krijgen de v5 kaartstijl. Webmins layout-/tabellen blijven ongemoeid. */
    body.mn-package-updates-v5 table.mn-pkg-table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;border:1px solid #28415f!important;border-radius:14px!important;overflow:hidden!important;background:#101d2d!important;box-shadow:0 10px 28px rgba(0,0,0,.14)!important}
    body.mn-package-updates-v5 table.mn-pkg-table th{background:#13243a!important;color:#8fc8f8!important;font-size:11px!important;font-weight:850!important;text-transform:uppercase!important;letter-spacing:.04em!important;padding:13px 14px!important;border-color:#2a415e!important}
    body.mn-package-updates-v5 table.mn-pkg-table td{background:#101d2d!important;color:#f1f7ff!important;padding:13px 14px!important;border-color:#263d59!important;vertical-align:middle!important}
    body.mn-package-updates-v5 table.mn-pkg-table tr:hover>td{background:#13243a!important}

    body.mn-package-updates-v5 table.mn-pkg-filter-table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;border:1px solid #28415f!important;border-radius:14px!important;background:#0f1b2b!important;box-shadow:none!important}
    body.mn-package-updates-v5 table.mn-pkg-filter-table td{background:transparent!important;color:#f1f7ff!important;padding:10px 12px!important;border:0!important}

    body.mn-package-updates-v5 input[type=checkbox]{width:17px!important;height:17px!important;accent-color:#3b82f6!important}
    body.mn-package-updates-v5 form input[type=submit],body.mn-package-updates-v5 form input[type=button],body.mn-package-updates-v5 form button{min-height:38px!important;border:1px solid #60a5fa!important;border-radius:9px!important;background:linear-gradient(180deg,#3b82f6,#2563eb)!important;color:#fff!important;font-weight:850!important;padding:8px 15px!important;box-shadow:0 6px 18px rgba(37,99,235,.22)!important;text-shadow:none!important;cursor:pointer!important}
    body.mn-package-updates-v5 form input[type=submit]:hover,body.mn-package-updates-v5 form input[type=button]:hover,body.mn-package-updates-v5 form button:hover{background:linear-gradient(180deg,#60a5fa,#2563eb)!important;transform:translateY(-1px)}
    body.mn-package-updates-v5 input[type=text],body.mn-package-updates-v5 input[type=search],body.mn-package-updates-v5 select{min-height:38px!important;border:1px solid #36506e!important;border-radius:9px!important;background:#0a1726!important;color:#f8fbff!important;padding:7px 10px!important}

    .mn-pkg-ready{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:10px 0 16px;padding:15px 17px;border:1px solid #315d8a;border-radius:14px;background:linear-gradient(135deg,#10233a,#0c1929);box-shadow:0 10px 30px rgba(0,0,0,.16)}
    .mn-pkg-ready strong{display:block;color:#fff;font-size:15px}.mn-pkg-ready span{display:block;margin-top:4px;color:#91a9c4;font-size:12px}

    .mn-install-overlay{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:rgba(3,9,17,.78);backdrop-filter:blur(4px)}
    .mn-install-card{width:min(620px,94vw);border:1px solid #315d8a;border-radius:18px;background:linear-gradient(145deg,#14243a,#0b1726);padding:22px;box-shadow:0 28px 90px rgba(0,0,0,.48)}
    .mn-install-head{display:flex;align-items:center;gap:14px}.mn-spinner{width:38px;height:38px;border-radius:50%;border:4px solid #203a58;border-top-color:#38bdf8;animation:mnspin .8s linear infinite;flex:0 0 auto}@keyframes mnspin{to{transform:rotate(360deg)}}
    .mn-install-head strong{display:block;font-size:18px}.mn-install-head span{display:block;margin-top:4px;color:#93aac4;font-size:12px;line-height:1.45}
    .mn-progress-track{height:7px;margin-top:18px;border-radius:99px;background:#07111d;overflow:hidden}.mn-progress-track i{display:block;width:35%;height:100%;border-radius:99px;background:linear-gradient(90deg,#2563eb,#38bdf8,#a78bfa);animation:mnbar 1.2s ease-in-out infinite alternate}@keyframes mnbar{from{transform:translateX(-40%)}to{transform:translateX(220%)}}
    .mn-progress-note{margin-top:11px;color:#7f98b5;font-size:11px}

    .mn-stream-card{position:sticky;top:8px;z-index:30;margin:10px 0 16px;padding:16px;border:1px solid #315d8a;border-radius:14px;background:linear-gradient(135deg,#10233a,#0b1726);box-shadow:0 14px 34px rgba(0,0,0,.2)}
    .mn-stream-top{display:flex;align-items:center;gap:12px}.mn-stream-top .mn-spinner{width:28px;height:28px;border-width:3px}.mn-stream-title{font-weight:850;font-size:15px}.mn-stream-sub{margin-top:3px;color:#91a9c4;font-size:11px}.mn-stream-log{margin-top:12px;max-height:145px;overflow:auto;padding:10px 12px;border-radius:9px;background:#07111d;color:#bcd0e7;font:11px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap}.mn-stream-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.mn-stream-actions a{display:inline-flex;padding:8px 11px;border-radius:8px;background:#2563eb;color:white!important;border:1px solid #60a5fa;text-decoration:none!important;font-weight:800}.mn-stream-card.done{border-color:#247653}.mn-stream-card.done .mn-spinner{animation:none;border-color:#22c55e;background:#22c55e;position:relative}.mn-stream-card.done .mn-spinner:after{content:'✓';position:absolute;inset:0;display:grid;place-items:center;color:#062014;font-weight:900;font-size:16px}
    @media(max-width:700px){.mn-pkg-ready{align-items:flex-start;flex-direction:column}.mn-install-card{padding:18px}body.mn-package-updates-v5 table.mn-pkg-table th,body.mn-package-updates-v5 table.mn-pkg-table td{padding:10px 9px!important}}
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
  const directTableText = table => {
    const chunks = [];
    Array.from(table.rows || []).forEach(row => Array.from(row.cells || []).forEach(cell => {
      const clone = cell.cloneNode(true);
      clone.querySelectorAll('table').forEach(nested => nested.remove());
      const text = normalized(clone.textContent);
      if (text) chunks.push(text);
    }));
    return chunks.join(' ');
  };

  const classifyTables = () => {
    document.querySelectorAll('table').forEach(table => {
      if (table.classList.contains('mn-pkg-table') || table.classList.contains('mn-pkg-filter-table')) return;
      const text = directTableText(table);
      const packageWord = /\b(pakket|package|paket)\b/.test(text);
      const descriptionWord = /(omschrijving|description|beschreibung)/.test(text);
      const statusWord = /(status|huidige versie|nieuwe versie|current version|new version|aktuelle version|neue version)/.test(text);
      const filterWord = /(vind pakketten|find packages|pakete finden|zoek|search|suche)/.test(text);
      if (packageWord && descriptionWord && statusWord) {
        table.classList.add('mn-pkg-table');
      } else if (filterWord && table.querySelector('input[type="text"],input[type="search"]')) {
        table.classList.add('mn-pkg-filter-table');
      }
    });
  };

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
    overlay.innerHTML = `<div class="mn-install-card"><div class="mn-install-head"><div class="mn-spinner"></div><div><strong>${i18n.preparing}</strong><span>${i18n.installingSub}</span></div></div><div class="mn-progress-track"><i></i></div><div class="mn-progress-note">${i18n.checking}</div></div>`;
    document.body.appendChild(overlay);
  };

  const looksLikeConfirmation = () => {
    const text = normalized(document.body?.innerText || document.body?.textContent);
    return /(huidige versie|current version|aktuelle version)/.test(text) && /(nieuwe versie|new version|neue version)/.test(text);
  };

  const decorateConfirmation = () => {
    if (!looksLikeConfirmation()) return;
    const forms = [...document.querySelectorAll('form')];
    const confirmForm = forms.find(form => {
      const buttons = [...form.querySelectorAll('input[type="submit"],button[type="submit"],button:not([type])')];
      return buttons.some(btn => /installeer|installieren|install\b/i.test(String(btn.value || btn.textContent || '')));
    });
    if (!confirmForm || confirmForm.dataset.mnV5Ready === '1') return;
    confirmForm.dataset.mnV5Ready = '1';

    const ready = document.createElement('div');
    ready.className = 'mn-pkg-ready';
    ready.innerHTML = `<div><strong>${i18n.ready}</strong><span>${i18n.readySub}</span></div>`;
    confirmForm.parentNode.insertBefore(ready, confirmForm);

    const installButton = [...confirmForm.querySelectorAll('input[type="submit"],button[type="submit"],button:not([type])')]
      .find(btn => /installeer|installieren|install\b/i.test(String(btn.value || btn.textContent || '')));
    if (installButton) {
      installButton.style.minWidth = '150px';
      installButton.style.fontSize = '13px';
    }

    confirmForm.addEventListener('submit', event => {
      const submitter = event.submitter || document.activeElement;
      if (submitter && !/installeer|installieren|install\b/i.test(String(submitter.value || submitter.textContent || ''))) return;
      sessionStorage.setItem(storageKey, String(Date.now()));
      if (baselineUpdates != null) sessionStorage.setItem(baselineKey, String(baselineUpdates));
      if (installButton) { installButton.disabled = true; installButton.style.opacity = '.75'; }
      showSubmitOverlay();
    }, {capture:true});
  };

  const ensureStreamCard = () => {
    if (streamCard || !document.body) return streamCard;
    streamCard = document.createElement('section');
    streamCard.className = 'mn-stream-card';
    streamCard.innerHTML = `<div class="mn-stream-top"><div class="mn-spinner"></div><div><div class="mn-stream-title">${i18n.installing}</div><div class="mn-stream-sub">${i18n.installingSub}</div></div></div><div class="mn-progress-track"><i></i></div><div class="mn-stream-log">${i18n.waiting}</div><div class="mn-stream-actions" hidden><a href="/package-updates/">${i18n.back}</a></div>`;
    streamLog = streamCard.querySelector('.mn-stream-log');
    document.body.prepend(streamCard);
    return streamCard;
  };

  const collectOutput = () => {
    if (!streamLog) return;
    const lines = [];
    document.querySelectorAll('ul[data-package-updates] li').forEach(li => {
      const text = String(li.innerText || li.textContent || '').trim();
      if (text) lines.push(text);
    });
    if (!lines.length) {
      const all = String(document.body?.innerText || '').split('\n').map(x=>x.trim()).filter(Boolean);
      const filtered = all.filter(line => !/MemoNetwork Edition|Software pakketten Update/i.test(line)).slice(-10);
      lines.push(...filtered);
    }
    if (lines.length) streamLog.textContent = lines.slice(-10).join('\n');
  };

  const markDone = () => {
    if (streamDone) return;
    streamDone = true;
    ensureStreamCard();
    streamCard.classList.add('done');
    streamCard.querySelector('.mn-stream-title').textContent = i18n.finished;
    streamCard.querySelector('.mn-stream-sub').textContent = i18n.finishedSub;
    streamCard.querySelector('.mn-progress-track').style.display = 'none';
    streamCard.querySelector('.mn-stream-actions').hidden = false;
    sessionStorage.removeItem(storageKey);
    sessionStorage.removeItem(baselineKey);
    if (pollTimer) clearInterval(pollTimer);
  };

  const watchInstall = () => {
    const started = Number(sessionStorage.getItem(storageKey) || 0);
    const recent = started && Date.now() - started < 30 * 60 * 1000;
    const hasWebminProgress = !!document.querySelector('ul[data-package-updates]');
    if (!recent && !hasWebminProgress) return;
    ensureStreamCard();
    collectOutput();

    const baseline = Number(sessionStorage.getItem(baselineKey));
    pollTimer = setInterval(async () => {
      if (streamDone) return;
      const data = await fetchStatus();
      if (!data) return;
      const now = Number(data.updates_available || 0);
      if (Number.isFinite(baseline) && baseline > 0 && now < baseline) markDone();
    }, 4000);
  };

  const boot = () => {
    document.body.classList.add('mn-package-updates-v5');
    classifyTables();
    decorateConfirmation();
    watchInstall();
    fetchStatus().then(data => { if (data) baselineUpdates = Number(data.updates_available || 0); });

    const observer = new MutationObserver(() => {
      classifyTables();
      decorateConfirmation();
      if (streamCard) collectOutput();
    });
    observer.observe(document.documentElement,{childList:true,subtree:true});
  };

  if (document.body) boot();
  else document.addEventListener('DOMContentLoaded',boot,{once:true});
})();
