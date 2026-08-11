(() => {
  const dashboardUrl = "/right.cgi";
  const installedVersion = "4.5.0";
  const releaseDate = "11-08-2026";
  const versionUrl = "https://raw.githubusercontent.com/PascalVZ96/MemoCraft-Theme/main/version.json";

  const normalize = (value) => {
    try {
      const url = new URL(value, window.location.href);
      return `${url.pathname.replace(/\/+$/, "") || "/"}${url.search}`;
    } catch (_error) {
      return "";
    }
  };

  const numericVersion = (value) => String(value || '')
    .replace(/^v/i, '')
    .split(/[.-]/)
    .slice(0, 3)
    .map((part) => Number.parseInt(part, 10) || 0);

  const compareVersions = (left, right) => {
    const a = numericVersion(left);
    const b = numericVersion(right);
    for (let i = 0; i < 3; i += 1) {
      if ((a[i] || 0) > (b[i] || 0)) return 1;
      if ((a[i] || 0) < (b[i] || 0)) return -1;
    }
    return 0;
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
        openDashboard(event);
      }
    });
    document.querySelectorAll('.leftmenu a[href*="memo-dashboard.cgi"], .leftmenu a[href="/right.cgi"], .leftmenu a[href$="/right.cgi"]').forEach((link) => {
      link.setAttribute('href', dashboardUrl);
      link.setAttribute('target', 'right');
    });
  };

  const setupDashboardLinks = () => {
    const dashboard = currentContentDocument();
    if (!dashboard) return;

    const actions = dashboard.querySelector('.quick-actions');
    if (actions && !actions.querySelector('[data-memo-insights="1"]')) {
      const link = dashboard.createElement('a');
      link.className = 'quick-btn';
      link.href = '/memo-network/system-info.cgi?view=insights';
      link.dataset.memoInsights = '1';
      link.textContent = 'Inzichten';
      actions.appendChild(link);
    }

    const badge = dashboard.querySelector('.brandline .ver');
    if (badge) {
      badge.textContent = 'Dashboard v4.5';
      badge.title = 'MemoNetwork 4.5';
    }

    dashboard.querySelector('[data-memo-rc="1"]')?.remove();
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
      #memo-version-footer .memo-version-status.dev{color:#c4b5fd}
      #memo-version-footer .memo-version-status.error{color:#94a3b8}
    `;
    document.head.appendChild(style);

    const footer = document.createElement('div');
    footer.id = 'memo-version-footer';
    footer.innerHTML = `<div class="memo-edition">MemoNetwork Edition</div><div class="memo-version">v${installedVersion}</div><div class="memo-version-status" id="memo-version-status">Versie controleren… · Built ${releaseDate}</div>`;
    document.body.appendChild(footer);

    const status = document.getElementById('memo-version-status');
    fetch(`${versionUrl}?_=${Date.now()}`, {cache:'no-store'})
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((remote) => {
        const latest = String(remote.version || '').trim();
        if (!latest) throw new Error('Geen versie ontvangen');
        const comparison = compareVersions(installedVersion, latest);
        if (comparison === 0) {
          status.textContent = `Laatste versie · Built ${releaseDate}`;
          status.className = 'memo-version-status ok';
        } else if (comparison > 0) {
          status.textContent = `Testversie · main v${latest}`;
          status.className = 'memo-version-status dev';
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
    setupDashboardLinks();
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
