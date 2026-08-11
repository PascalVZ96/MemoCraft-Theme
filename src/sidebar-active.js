(() => {
  const dashboardUrl = "/right.cgi";
  const installedVersion = "4.3.0";
  const releaseDate = "11-08-2026";
  const versionUrl = "https://raw.githubusercontent.com/PascalVZ96/MemoCraft-Theme/main/version.json";
  let dashboardCheckAt = 0;
  let dashboardData = null;

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
    } catch (_error) {}
    return "";
  };

  const currentContentDocument = () => {
    try {
      for (const frame of Array.from(parent.frames)) {
        if (frame === window) continue;
        if (frame.document && frame.document.querySelector('.v3')) return frame.document;
      }
    } catch (_error) {}
    return null;
  };

  const openDashboard = (event) => {
    if (event) event.preventDefault();
    try {
      if (parent && parent.frames && parent.frames.length > 1) parent.frames[1].location.href = dashboardUrl;
      else window.top.location.href = dashboardUrl;
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

  const setupVersionFooter = () => {
    if (document.getElementById('memo-version-footer')) return;
    const style = document.createElement('style');
    style.textContent = `
      .memo-menu-content{padding-bottom:96px!important}
      #memo-version-footer{position:fixed;left:0;right:0;bottom:0;z-index:50;box-sizing:border-box;padding:10px 10px 12px;border-top:1px solid rgba(96,165,250,.18);background:linear-gradient(180deg,rgba(10,17,28,.94),#09111d 38%);text-align:center;box-shadow:0 -8px 20px rgba(0,0,0,.24)}
      #memo-version-footer .memo-edition{color:#38bdf8;font-size:12px;font-weight:800;line-height:16px}
      #memo-version-footer .memo-version{margin-top:2px;color:#8ec5ff;font-size:11px;font-weight:700;line-height:15px}
      #memo-version-footer .memo-version-status{margin-top:2px;color:#71839b;font-size:10px;line-height:14px}
      #memo-version-footer .memo-version-status.ok{color:#4ade80}
      #memo-version-footer .memo-version-status.update{color:#fbbf24}
      #memo-version-footer .memo-version-status.error{color:#94a3b8}
    `;
    document.head.appendChild(style);
    const footer = document.createElement('div');
    footer.id = 'memo-version-footer';
    footer.innerHTML = `<div class="memo-edition">MemoNetwork Edition</div><div class="memo-version">v${installedVersion}</div><div class="memo-version-status" id="memo-version-status">Versie controleren… · Built ${releaseDate}</div>`;
    document.body.appendChild(footer);
    const status = document.getElementById('memo-version-status');
    fetch(`${versionUrl}?_=${Date.now()}`, {cache:'no-store'})
      .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.json(); })
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

  const refreshDashboardData = async () => {
    const now = Date.now();
    if (dashboardData && now - dashboardCheckAt < 8000) return dashboardData;
    dashboardCheckAt = now;
    try {
      const response = await fetch(`/memo-network/live-stats.cgi?sidebar=1&_=${now}`, {credentials:'same-origin', cache:'no-store'});
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      dashboardData = await response.json();
    } catch (_error) {
      dashboardData = null;
    }
    return dashboardData;
  };

  const dockerAction = async (dashboard, container, operation, button) => {
    if ((operation === 'stop' || operation === 'restart') && !window.confirm(`${container} ${operation === 'stop' ? 'stoppen' : 'herstarten'}?`)) return;
    const oldText = button.textContent;
    button.disabled = true;
    button.textContent = 'Bezig…';
    try {
      const url = `/memo-network/system-info.cgi?action=docker&operation=${encodeURIComponent(operation)}&container=${encodeURIComponent(container)}`;
      const response = await fetch(url, {method:'POST', credentials:'same-origin', cache:'no-store', headers:{'X-Requested-With':'MemoNetwork'}});
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.error || `HTTP ${response.status}`);
      button.textContent = 'Klaar';
      dashboardData = null;
      dashboardCheckAt = 0;
      setTimeout(() => dashboard.getElementById('refresh-now')?.click(), 500);
      setTimeout(() => dashboard.getElementById('docker-card')?.click(), 1800);
    } catch (error) {
      button.textContent = 'Fout';
      window.alert(`Docker-actie mislukt: ${error.message}`);
    } finally {
      setTimeout(() => { button.disabled = false; button.textContent = oldText; }, 2300);
    }
  };

  const enhanceDockerDetails = (dashboard) => {
    const detail = dashboard.getElementById('service-detail');
    const title = dashboard.getElementById('detail-title');
    const list = dashboard.getElementById('service-list');
    if (!detail?.classList.contains('show') || !title || !/^Docker/.test(title.textContent || '') || !list) return;

    const head = list.querySelector('.service-head');
    if (head && !head.querySelector('.memo-control-head')) {
      const controlHead = dashboard.createElement('span');
      controlHead.className = 'memo-control-head';
      controlHead.textContent = 'Beheer';
      head.appendChild(controlHead);
    }

    list.querySelectorAll('.service-row:not(.service-head)').forEach((row) => {
      if (row.querySelector('.memo-docker-actions')) return;
      const name = row.querySelector('.service-name')?.textContent?.trim();
      if (!name) return;
      const state = row.querySelector('.state');
      const running = !!state?.classList.contains('ok');
      const actions = dashboard.createElement('span');
      actions.className = 'memo-docker-actions';
      const buttons = running
        ? [['restart','Herstart'],['stop','Stop']]
        : [['start','Start']];
      buttons.forEach(([operation, label]) => {
        const button = dashboard.createElement('button');
        button.type = 'button';
        button.className = `memo-container-btn ${operation}`;
        button.textContent = label;
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          dockerAction(dashboard, name, operation, button);
        });
        actions.appendChild(button);
      });
      row.appendChild(actions);
    });
  };

  const enhanceSpecialServiceDetails = (dashboard, data) => {
    if (!data) return;
    const detail = dashboard.getElementById('service-detail');
    const title = dashboard.getElementById('detail-title');
    const list = dashboard.getElementById('service-list');
    if (!detail?.classList.contains('show') || !title || !list) return;

    if (/^MinIO/.test(title.textContent || '')) {
      const minio = data.minio || {};
      const mode = minio.mode === 'docker' ? `Docker-container ${minio.container || ''}` : minio.mode === 'process' ? 'Lokaal proces' : 'Niet gedetecteerd';
      list.innerHTML = `<div class="service-row"><span class="service-name">MinIO</span><span class="service-meta">${mode}</span><span class="state ${minio.running ? 'ok' : ''}">${minio.running ? 'Online' : 'Offline'}</span></div>`;
    }

    if (/^WireGuard/.test(title.textContent || '')) {
      const wg = data.wireguard || {};
      const age = Number(wg.latest_handshake_age_seconds);
      const handshake = Number.isFinite(age) && age >= 0 ? (age < 60 ? `${Math.floor(age)} sec geleden` : age < 3600 ? `${Math.floor(age/60)} min geleden` : `${Math.floor(age/3600)} uur geleden`) : 'Geen recente handshake';
      list.innerHTML = `<div class="service-row"><span class="service-name">${wg.interface || 'wg0'}</span><span class="service-meta">${Number(wg.peers)||0} peer(s) · ${handshake}</span><span class="state ${wg.available ? 'ok' : ''}">${wg.available ? 'Online' : 'Offline'}</span></div>`;
      dashboard.getElementById('detail-running').textContent = Number(wg.peers) || 0;
      dashboard.getElementById('detail-total').textContent = 'peers';
    }
  };

  const updateBackupWarning = (dashboard, data) => {
    if (!data) return;
    const alerts = dashboard.querySelector('.alerts');
    if (!alerts) return;
    let warning = dashboard.getElementById('memo-backup-alert');
    const ok = !!data.storage?.backup_mount_ok;
    if (ok) {
      warning?.remove();
      return;
    }
    if (!warning) {
      warning = dashboard.createElement('div');
      warning.id = 'memo-backup-alert';
      warning.className = 'alert memo-backup-alert show';
      warning.innerHTML = '<div><strong>Backup HDD niet gemount</strong><span>/mnt/backups staat niet op een apart bestandssysteem. Backups kunnen daardoor op de systeemschijf terechtkomen.</span></div><a href="/mount/index.cgi">Schijven controleren</a>';
      alerts.prepend(warning);
    }
  };

  const setupDashboardEnhancements = async () => {
    const dashboard = currentContentDocument();
    if (!dashboard) return;

    if (!dashboard.getElementById('memo-v43-enhancement-style')) {
      const style = dashboard.createElement('style');
      style.id = 'memo-v43-enhancement-style';
      style.textContent = `
        .memo-backup-alert{border-color:#b45309!important;background:linear-gradient(90deg,#2b1706,#17191f)!important;color:#fed7aa!important}
        .memo-backup-alert a{background:#ea580c!important;border-color:#fb923c!important}
        .service-row:has(.memo-docker-actions),.service-head:has(.memo-control-head){grid-template-columns:minmax(150px,1.05fr) minmax(210px,1.8fr) minmax(90px,.65fr) minmax(150px,.9fr)!important}
        .memo-docker-actions{display:flex;gap:6px;justify-content:flex-end;flex-wrap:wrap}
        .memo-container-btn{border:1px solid #315d8a;background:#10233b;color:#dbeafe;border-radius:7px;padding:6px 9px;font:700 10px Arial,sans-serif;cursor:pointer}
        .memo-container-btn:hover{background:#17345a}.memo-container-btn.stop{border-color:#b45309;background:#4a2108;color:#fed7aa}.memo-container-btn.restart{border-color:#6d4cc8;background:#241547;color:#ddd6fe}.memo-container-btn:disabled{opacity:.6;cursor:wait}
        @media(max-width:760px){.service-row:has(.memo-docker-actions),.service-head:has(.memo-control-head){grid-template-columns:1fr!important}.memo-docker-actions{justify-content:flex-start}}
      `;
      dashboard.head.appendChild(style);
    }

    const data = await refreshDashboardData();
    updateBackupWarning(dashboard, data);
    enhanceDockerDetails(dashboard);
    enhanceSpecialServiceDetails(dashboard, data);
  };

  const updateActiveLink = () => {
    setupBrand();
    setupVersionFooter();
    setupDashboardEnhancements();
    const current = normalize(currentContentUrl());
    if (!current) return;
    document.querySelectorAll('.leftmenu a[href]').forEach((link) => {
      const target = normalize(link.href);
      const active = target && (current === target || current.startsWith(`${target}&`) || current.startsWith(`${target}?`));
      link.classList.toggle('memo-active', Boolean(active));
      link.closest('.linkwithicon')?.classList.toggle('memo-active-row', Boolean(active));
      if (active) link.closest('details')?.setAttribute('open', 'open');
    });
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('.leftmenu a[href]');
    if (!link) return;
    document.querySelectorAll('.leftmenu a.memo-active').forEach((item) => item.classList.remove('memo-active'));
    document.querySelectorAll('.leftmenu .memo-active-row').forEach((item) => item.classList.remove('memo-active-row'));
    link.classList.add('memo-active');
    link.closest('.linkwithicon')?.classList.add('memo-active-row');
  });

  window.addEventListener('load', updateActiveLink);
  setInterval(updateActiveLink, 700);
})();
