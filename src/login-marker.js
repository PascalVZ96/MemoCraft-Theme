(function () {
  document.documentElement.classList.add('memonetwork-login');

  function markBody() {
    if (document.body) {
      document.body.classList.add('memonetwork-login');
    }
  }

  markBody();
  document.addEventListener('DOMContentLoaded', markBody, { once: true });
})();
