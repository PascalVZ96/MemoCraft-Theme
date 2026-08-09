(() => {
  const dashboardUrl = "/right.cgi";
  const installedVersion = "4.1.5";
  const releaseDate = "09-08-2026";
  const versionUrl = "https://raw.githubusercontent.com/PascalVZ96/MemoCraft-Theme/main/version.json";
  let storageLastUpdate = 0;
  let storageBusy = false;

  const normalize = (value) => {
    try {
      const url = new URL(value, window.location.href);
      return `${url.pathname.replace(/\/+$/, "") || "/"}${url.search}`;
    } catch (_error) {
      return "";
    }
  };

  const currentContentUrl = () => {
    try {
      for (const frame of Array.from(parent.frames)) {
        if (frame === window) continue;
        const href = frame.location.href;
        if (href && href !== "about:blank") return href;
      }
    } catch (_error) {
      return "";
    }
    return "";
  };

  const currentContentDocument = () => {
    try {
      for (const frame of Array.from(parent.frames)) {
        if (frame === window) continue;
        if (frame.document && frame.document.querySelector('.v3')) return frame.document;
      }
    } catch (_error) {
      return null;
    }
    return null;
  };

  const openDashboard = (event) => {
    if (event) event.preventDefault();
    try {
      if (parent && parent.frames && parent.frames.length > 1) {
        parent.frames[1].location.href = dashboardUrl;
      } else {
        window.top.location.href = dashboardUrl;
      }
    } catch (_error) {
      window.top.location.href = dashboardUrl;
    }
  };

  const setupBrand = () => {
    const brand = document.querySelector('.memo-brand');
    if (!brand || brand.dataset.memoReady === '1') return;
    brand.dataset.memoReady = '1';
    brand.setAttribute('href', dashboardUrl);
    brand.setAttribute('target', 'right');
    brand.setAttribute('role', 'link');
    brand.setAttribute('tabindex', '0');
    brand.setAttribute('aria-label', 'Ga naar MemoNetwork Dashboard');
    brand.addEventListener('click', openDashboard);
    brand.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openDashboard();
      }
    });

    document.querySelectorAll('.leftmenu a[href*="memo-dashboard.cgi"], .leftmenu a[href="/right.cgi"], .leftmenu a[href$="/right.cgi"]').forEach((link) => {
      link.setAttribute('href', dashboardUrl);
      link.setAttribute('target', 'right');
    });
  };

  const formatStorage = (gib) => {
    const value = Number(gib) || 0;
    if (value >= 1024) return `${(value / 1024).toFixed(2)} TiB`;
    return `${value.toFixed(value >= 100 ? 0 : 1)} GiB`;
  };

  const updateLiveStorage = async () => {
    const dashboard = currentContentDocument();
    if (!dashboard) return;

    const card = dashboard.querySelector('.card.storage');
    if (!card) return;

    const now = Date.now();
    if (storageBusy || now - storageLastUpdate < 5000) return;
    storageBusy = true;
    storageLastUpdate = now;

    try {
      const response = await fetch(`/memo-network/live-stats.cgi?storage=1&_=${now}`, {
        credentials: 'same-origin',
        cache: 'no-store'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const disks = Array.isArray(data.disks) ? data.disks : [];
      if (!disks.length) return;

      const total = disks.reduce((sum, disk) => sum + (Number(disk.total_gib) || 0), 0);
      const used = disks.reduce((sum, disk) => sum + (Number(disk.used_gib) || 0), 0);
      const percent = total > 0 ? Math.min(100, (used / total) * 100) : 0;

      const value = card.querySelector('.value');
      const sub = card.querySelector('.sub');
      const meter = card.querySelector('.meter i');
      const label = card.querySelector('.label');

      if (value) value.textContent = formatStorage(used);
      if (sub) sub.textContent = `${formatStorage(total)} totaal · ${formatStorage(Math.max(0, total - used))} vrij`;
      if (meter) meter.style.width = `${percent.toFixed(1)}%`;

      if (label && !label.querySelector('.live')) {
        const live = dashboard.createElement('span');
        live.className = 'live';
        live.textContent = 'Live';
        label.appendChild(live);
      }

      const details = disks.map((disk) => `${disk.path}: ${formatStorage(disk.used_gib)} / ${formatStorage(disk.total_gib)}`).join('\n');
      card.title = details;
    } catch (_error) {
      // Laat de laatst bekende waarden staan als de API tijdelijk niet reageert.
    } finally {
      storageBusy = false;
    }
  };

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const enhanceServiceDetails = () => {
    const dashboard = currentContentDocument();
    if (!dashboard) return;

    const detail = dashboard.getElementById('service-detail');
    const dockerCard = dashboard.getElementById('docker-card');
    const ampCard = dashboard.getElementById('amp-card');
    if (!detail || !dockerCard || !ampCard) return;

    if (!dashboard.getElementById('memo-service-detail-style')) {
      const style = dashboard.createElement('style');
      style.id = 'memo-service-detail-style';
      style.textContent = `
        .memo-service-list{margin-top:16px;border:1px solid #263a54;border-radius:12px;overflow:hidden;background:#0e1928}
        .memo-service-row{display:grid;grid-template-columns:minmax(170px,1.15fr) minmax(220px,2fr) minmax(90px,.7fr);gap:14px;align-items:center;padding:12px 14px;border-top:1px solid #203249}
        .memo-service-row:first-child{border-top:0}
        .memo-service-head{background:#122238;color:#8fa5bf;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em}
        .memo-service-name{font-weight:800;color:#fff}
        .memo-service-meta{color:#9db1ca;font-size:12px;overflow-wrap:anywhere}
        .memo-service-state{display:inline-flex;align-items:center;gap:7px;font-size:12px;font-weight:700}
        .memo-service-state:before{content:'';width:8px;height:8px;border-radius:50%;background:#ef4444;box-shadow:0 0 8px rgba(239,68,68,.45)}
        .memo-service-state.ok{color:#86efac}.memo-service-state.ok:before{background:#22c55e;box-shadow:0 0 8px rgba(34,197,94,.6)}
        .memo-service-empty{padding:16px;color:#8fa5bf;font-size:12px}
        @media(max-width:760px){.memo-service-row{grid-template-columns:1fr;gap:5px}.memo-service-head{display:none}}
      `;
      dashboard.head.appendChild(style);
    }

    let list = dashboard.getElementById('memo-service-items');
    if (!list) {
      list = dashboard.createElement('div');
      list.id = 'memo-service-items';
      list.className = 'memo-service-list';
      detail.insertBefore(list, detail.querySelector('.detail-actions'));
    }

    const loadItems = async (type) => {
      list.innerHTML = '<div class="memo-service-empty">Live details laden…</div>';
      try {
        const response = await fetch(`/memo-network/live-stats.cgi?details=1&_=${Date.now()}`, {
          credentials: 'same-origin',
          cache: 'no-store'
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        const items = Array.isArray(data?.[type]?.items) ? data[type].items : [];

        if (!items.length) {
          list.innerHTML = `<div class="memo-service-empty">Geen ${type === 'docker' ? 'containers' : 'AMP-instances'} gevonden.</div>`;
          return;
        }

        if (type === 'docker') {
          list.innerHTML = '<div class="memo-service-row memo-service-head"><span>Container</span><span>Image / status</span><span>Status</span></div>' +
            items.map((item) => `
              <div class="memo-service-row">
                <span class="memo-service-name">${escapeHtml(item.name || 'Onbekend')}</span>
                <span class="memo-service-meta"><strong>${escapeHtml(item.image || 'Onbekend image')}</strong><br>${escapeHtml(item.status || '')}</span>
                <span class="memo-service-state ${item.running ? 'ok' : ''}">${item.running ? 'Actief' : 'Gestopt'}</span>
              </div>`).join('');
        } else {
          list.innerHTML = '<div class="memo-service-row memo-service-head"><span>Instance</span><span>Type</span><span>Status</span></div>' +
            items.map((item) => `
              <div class="memo-service-row">
                <span class="memo-service-name">${escapeHtml(item.name || 'Onbekend')}</span>
                <span class="memo-service-meta">AMP instance</span>
                <span class="memo-service-state ${item.running ? 'ok' : ''}">${item.running ? 'Actief' : 'Gestopt'}</span>
              </div>`).join('');
        }
      } catch (error) {
        list.innerHTML = `<div class="memo-service-empty">Details konden niet worden geladen: ${escapeHtml(error.message)}</div>`;
      }
    };

    if (dockerCard.dataset.memoDetails !== '1') {
      dockerCard.dataset.memoDetails = '1';
      dockerCard.addEventListener('click', () => loadItems('docker'));
    }
    if (ampCard.dataset.memoDetails !== '1') {
      ampCard.dataset.memoDetails = '1';
      ampCard.addEventListener('click', () => loadItems('amp'));
    }
  };

  const setupVersionFooter = () => {
    if (document.getElementById('memo-version-footer')) return;

    const style = document.createElement('style');
    style.textContent = `
      .memo-menu-content { padding-bottom: 96px !important; }
      #memo-version-footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        box-sizing: border-box;
        padding: 10px 10px 12px;
        border-top: 1px solid rgba(96,165,250,.18);
        background: linear-gradient(180deg, rgba(10,17,28,.94), #09111d 38%);
        text-align: center;
        box-shadow: 0 -8px 20px rgba(0,0,0,.24);
      }
      #memo-version-footer .memo-edition {
        color: #38bdf8;
        font-size: 12px;
        font-weight: 800;
        line-height: 16px;
      }
      #memo-version-footer .memo-version {
        margin-top: 2px;
        color: #8ec5ff;
        font-size: 11px;
        font-weight: 700;
        line-height: 15px;
      }
      #memo-version-footer .memo-version-status {
        margin-top: 2px;
        color: #71839b;
        font-size: 10px;
        line-height: 14px;
      }
      #memo-version-footer .memo-version-status.ok { color: #4ade80; }
      #memo-version-footer .memo-version-status.update { color: #fbbf24; }
      #memo-version-footer .memo-version-status.error { color: #94a3b8; }
    `;
    document.head.appendChild(style);

    const footer = document.createElement('div');
    footer.id = 'memo-version-footer';
    footer.innerHTML = `
      <div class="memo-edition">MemoNetwork Edition</div>
      <div class="memo-version">v${installedVersion}</div>
      <div class="memo-version-status" id="memo-version-status">Versie controleren… · Built ${releaseDate}</div>
    `;
    document.body.appendChild(footer);

    const status = document.getElementById('memo-version-status');
    fetch(`${versionUrl}?_=${Date.now()}`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((remote) => {
        const latest = String(remote.version || '').trim();
        if (!latest) throw new Error('Geen versie ontvangen');
        if (latest === installedVersion) {
          status.textContent = `Laatste versie · Built ${releaseDate}`;
          status.className = 'memo-version-status ok';
        } else {
          status.textContent = `Update beschikbaar: v${latest}`;
          status.className = 'memo-version-status update';
        }
      })
      .catch(() => {
        status.textContent = `Versiecontrole niet beschikbaar · Built ${releaseDate}`;
        status.className = 'memo-version-status error';
      });
  };

  const updateActiveLink = () => {
    setupBrand();
    setupVersionFooter();
    updateLiveStorage();
    enhanceServiceDetails();
    const current = normalize(currentContentUrl());
    if (!current) return;

    document.querySelectorAll(".leftmenu a[href]").forEach((link) => {
      const target = normalize(link.href);
      const active = target && (current === target || current.startsWith(`${target}&`) || current.startsWith(`${target}?`));
      link.classList.toggle("memo-active", Boolean(active));
      link.closest(".linkwithicon")?.classList.toggle("memo-active-row", Boolean(active));

      if (active) {
        const group = link.closest("details");
        if (group) group.open = true;
      }
    });
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest(".leftmenu a[href]");
    if (!link) return;
    document.querySelectorAll(".leftmenu a.memo-active").forEach((item) => item.classList.remove("memo-active"));
    document.querySelectorAll(".leftmenu .memo-active-row").forEach((item) => item.classList.remove("memo-active-row"));
    link.classList.add("memo-active");
    link.closest(".linkwithicon")?.classList.add("memo-active-row");
  });

  window.addEventListener("load", updateActiveLink);
  setInterval(updateActiveLink, 700);
})();
