(() => {
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

  const updateActiveLink = () => {
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
