(() => {
  if (!String(window.location.pathname || '').includes('/package-updates/')) return;
  if (document.querySelector('script[data-memo-package-updates-v5="1"]')) return;
  const script = document.createElement('script');
  script.src = `/memocraft-theme/package-updates-v5.js?_=${Date.now()}`;
  script.dataset.memoPackageUpdatesV5 = '1';
  script.async = false;
  document.head.appendChild(script);
})();
