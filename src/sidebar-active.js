(() => {
  const dashboardUrl = "/memo-network/control-center.html";
  const installedVersion = "5.0.2";
  const releaseDate = "16-08-2026";
  const versionUrl = "https://raw.githubusercontent.com/PascalVZ96/MemoCraft-Theme/main/version.json";
  const i18nUrl = "/memocraft-theme/memo-i18n.js";
  const languageUrl = "/memo-network/language.cgi";
  let i18nLoading = false;
  let i18nLoaded = false;
  let i18nLastAttempt = 0;
  let languageResolved = '';
  let languageLoading = false;
  let languageLastAttempt = 0;

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

  const normalizeLanguage = (value) => {
    const lang = String(value || '').trim().toLowerCase();
    if (lang.startsWith('nl')) return 'nl';
    if (lang.startsWith('de')) return 'de';
    if (lang.startsWith('en')) return 'en';
    return '';
  };

  const applyLanguage = (language) => {
    const lang = normalizeLanguage(language);
    if (!lang) return '';
    languageResolved = lang;
    document.cookie = `memo_lang=${lang}; Path=/; SameSite=Lax`;
    document.documentElement.dataset.memoWebminLang = lang;
    return lang;
  };

  const ensureWebminLanguage = () => {
    if (languageResolved || languageLoading) return;
    const now = Date.now();
    if (languageLastAttempt && now - languageLastAttempt < 3000) return;
    languageLoading = true;
    languageLastAttempt = now;

    fetch(`${languageUrl}?_=${now}`, {credentials:'same-origin', cache:'no-store'})
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (!applyLanguage(data?.language)) throw new Error('Geen ondersteunde Webmin-taal ontvangen');
      })
      .catch(() => {
        const browserLanguage = normalizeLanguage(navigator.language) || 'en';
        applyLanguage(browserLanguage);
      })
      .finally(() => { languageLoading = false; });
  };

  const ensureI18n = () => {
    if (!languageResolved) return;

    if (window.MemoNetworkI18n) {
      const current = normalizeLanguage(window.MemoNetworkI18n.language);
      if (current === languageResolved) {
        i18nLoaded = true;
        window.MemoNetworkI18n.refresh?.();
      } else {
        i18nLoaded = false;
      }
      return;
    }

    const now = Date.now();
    if (i18nLoading || (i18nLastAttempt && now - i18nLastAttempt < 5000)) return;
    i18nLoading = true;
    i18nLastAttempt = now;

    fetch(`${i18nUrl}?v=${encodeURIComponent(installedVersion)}&_=${now}`, {credentials:'same-origin', cache:'no-store'})
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((code) => {
        if (!code || !code.includes('MemoNetworkI18n')) throw new Error('Ongeldige i18n-runtime');
        document.querySelector('script[data-memo-i18n-inline="1"]')?.remove();
        const script = document.createElement('script');
        script.dataset.memoI18nInline = '1';
        script.textContent = `${code}\n//# sourceURL=/memocraft-theme/memo-i18n.js`;
        document.head.appendChild(script);
        i18nLoaded = false;
      })
      .catch((error) => {
        i18nLoaded = false;
        console.warn('MemoNetwork i18n kon niet worden geladen:', error);
      })
      .finally(() => { i18nLoading = false; });
  };

  const currentContentUrl = () => {
    try {
      for (const frame of Array.from(parent.frames)) {
        if (frame === window) continue;
        const href = frame.location.href;
        if (href && href !== 'about:blank') return href;
      }
    } catch (_error) {}
    return '';
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

  const routeDefaultDashboard = () => {
    if (!languageResolved) return false;
    try {
      for (const frame of Array.from(parent.frames)) {
        if (frame === window) continue;
        if (String(frame.location?.pathname || '') !== '/right.cgi') continue;
        frame.location.replace(`${dashboardUrl}?v=${encodeURIComponent(installedVersion)}`);
        return true;
      }
    } catch (_error) {}
    return false;
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
    brand.setAttribute('aria-label', 'Ga naar MemoNetwork Control Center');
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
    if (actions && !actions.querySelector('[data-memo-v5="1"]')) {
      const link = dashboard.createElement('a');
      link.className = 'quick-btn';
      link.href = dashboardUrl;
      link.dataset.memoV5 = '1';
      link.textContent = 'Control Center';
      link.style.borderColor = '#6d5ca8';
      link.style.color = '#d8c8ff';
      actions.appendChild(link);
    }
    [dashboard.querySelector('.brandline .ver'), dashboard.getElementById('health-pill'), dashboard.getElementById('host-pill')].forEach((item) => {
      if (item) item.style.setProperty('display', 'none', 'important');
    });
    dashboard.querySelector('[data-memo-rc="1"]')?.remove();
  };

  const addRuntime = (doc, marker, src) => {
    if (doc.querySelector(`script[${marker}="1"]`)) return;
    const script = doc.createElement('script');
    script.src = `${src}?v=${encodeURIComponent(installedVersion)}&_=${Date.now()}`;
    script.setAttribute(marker, '1');
    doc.head.appendChild(script);
  };

  const stabilizeControlCenterChrome = (doc) => {
    doc.querySelector('.pill.dev')?.remove();
    doc.querySelector('a[data-i18n="oldDashboard"]')?.remove();

    if (!doc.getElementById('memo-v5-stable-nav-order')) {
      const style = doc.createElement('style');
      style.id = 'memo-v5-stable-nav-order';
      style.textContent = `
        .nav button[data-view="overview"]{order:10}
        .nav button[data-view="services"]{order:20}
        .nav button[data-view="infrastructure"]{order:30}
        .nav button[data-view="health"]{order:40}
        .nav button[data-view="reliability"]{order:50}
        .nav button[data-view="notifications"]{order:60}
        .nav button[data-view="activity"]{order:70}
        .nav button[data-view="incidents"]{order:80}
        .nav button[data-view="readiness"]{order:90}
        .nav button[data-view="diagnostics"]{order:100}
      `;
      doc.head.appendChild(style);
    }
  };

  const setupV5ControlCenter = () => {
    if (!languageResolved) return;
    try {
      for (const frame of Array.from(parent.frames)) {
        if (frame === window) continue;
        if (String(frame.location?.pathname || '') !== '/memo-network/control-center.html') continue;
        const doc = frame.document;
        if (!doc?.head) return;

        doc.documentElement.dataset.memoWebminLang = languageResolved;
        doc.documentElement.lang = languageResolved;
        stabilizeControlCenterChrome(doc);

        if (doc.documentElement.dataset.memoAmpNativeFix !== '1') {
          doc.documentElement.dataset.memoAmpNativeFix = '1';
          doc.addEventListener('click', (event) => {
            const link = event.target.closest?.('a[href^="https://amp.memocraft.nl"],a[data-memo-amp-link="1"]');
            if (!link) return;
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            event.stopImmediatePropagation();
          }, true);
        }
        doc.querySelectorAll('a[href^="https://amp.memocraft.nl"]').forEach((link) => {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
          link.dataset.memoAmpLink = '1';
        });

        const footer = doc.querySelector('.footer');
        if (footer) footer.textContent = installedVersion.includes('-') ? `MemoNetwork v5 Control Center · ${installedVersion.split('-')[1]} preview` : 'MemoNetwork v5 Control Center · stable';

        addRuntime(doc, 'data-memo-v5-operations', '/memo-network/control-center-operations.js');
        addRuntime(doc, 'data-memo-v5-incidents', '/memo-network/control-center-incidents.js');
        addRuntime(doc, 'data-memo-v5-maintenance', '/memo-network/control-center-maintenance.js');
        addRuntime(doc, 'data-memo-v5-activity', '/memo-network/control-center-activity.js');
        addRuntime(doc, 'data-memo-v5-reliability', '/memo-network/control-center-reliability.js');
        addRuntime(doc, 'data-memo-v5-healthscore', '/memo-network/control-center-healthscore.js');
        addRuntime(doc, 'data-memo-v5-intelligence', '/memo-network/control-center-intelligence.js');
        addRuntime(doc, 'data-memo-v5-readiness', '/memo-network/control-center-readiness.js');
        addRuntime(doc, 'data-memo-v5-service-details', '/memo-network/control-center-services.js');
        addRuntime(doc, 'data-memo-v5-container-monitor', '/memo-network/control-center-container-monitor.js');
        addRuntime(doc, 'data-memo-v5-diagnostics', '/memo-network/control-center-diagnostics.js');
        addRuntime(doc, 'data-memo-v5-log-center', '/memo-network/control-center-logcenter.js');
        addRuntime(doc, 'data-memo-v5-log-explain', '/memo-network/control-center-log-explain.js');
        addRuntime(doc, 'data-memo-v5-security-center', '/memo-network/control-center-security.js');
        addRuntime(doc, 'data-memo-v5-infrastructure', '/memo-network/control-center-infrastructure.js');
        addRuntime(doc, 'data-memo-v5-backup-center', '/memo-network/control-center-backups.js');
        addRuntime(doc, 'data-memo-v5-speedtest', '/memo-network/control-center-speedtest.js');
        addRuntime(doc, 'data-memo-v5-network-check', '/memo-network/control-center-networkcheck.js');
      }
    } catch (_error) {}
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
          status.textContent = `Stable · Built ${releaseDate}`;
          status.className = 'memo-version-status ok';
        } else {
          status.textContent = `Update beschikbaar: v${latest}`;
          status.className = 'memo-version-status update';
        }
        window.MemoNetworkI18n?.refresh?.();
      })
      .catch(() => {
        status.textContent = `Versiecontrole niet beschikbaar · Built ${releaseDate}`;
        status.className = 'memo-version-status error';
        window.MemoNetworkI18n?.refresh?.();
      });
  };

  const updateActiveLink = () => {
    ensureWebminLanguage();
    ensureI18n();
    setupBrand();
    setupVersionFooter();

    if (!languageResolved) return;
    if (routeDefaultDashboard()) return;

    setupDashboardLinks();
    setupV5ControlCenter();
    if (i18nLoaded) window.MemoNetworkI18n?.refresh?.();

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