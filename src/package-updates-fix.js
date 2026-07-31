(() => {
  const path = String(window.location.pathname || '');
  if (!path.includes('/package-updates/')) return;

  const dark = '#111a27';
  const panel = '#162235';
  const selected = '#173d2d';
  const text = '#e5edf7';
  const muted = '#b8c7da';
  const blue = '#7dc4ff';

  const rgb = value => {
    const match = String(value || '').match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return match ? match.slice(1, 4).map(Number) : null;
  };

  const isLight = value => {
    const c = rgb(value);
    return c && ((c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000) > 180;
  };

  const isBrightGreen = value => {
    const c = rgb(value);
    return c && c[1] > 180 && c[1] > c[0] * 1.15 && c[1] > c[2] * 1.05;
  };

  const force = (element, property, value) => {
    element.style.setProperty(property, value, 'important');
  };

  const repaint = () => {
    document.documentElement.style.setProperty('color-scheme', 'dark', 'important');
    force(document.body, 'background', '#0a111b');
    force(document.body, 'color', text);

    document.querySelectorAll('table, tbody, thead, tfoot, tr, td, th, div, form').forEach(element => {
      const style = getComputedStyle(element);
      const background = style.backgroundColor;

      if (isBrightGreen(background)) {
        force(element, 'background', selected);
        force(element, 'background-color', selected);
        force(element, 'color', '#ecfdf5');
      } else if (isLight(background)) {
        const isHeader = element.tagName === 'TH' || element.closest('thead');
        force(element, 'background', isHeader ? panel : dark);
        force(element, 'background-color', isHeader ? panel : dark);
        force(element, 'color', text);
      }
    });

    document.querySelectorAll('td, th, label, b, strong, span, font').forEach(element => {
      const style = getComputedStyle(element);
      if (isLight(style.backgroundColor) || isLight(getComputedStyle(element.parentElement || element).backgroundColor)) {
        force(element, 'color', text);
      } else if (style.color === 'rgb(238, 238, 238)' || style.color === 'rgb(221, 221, 221)') {
        force(element, 'color', muted);
      }
    });

    document.querySelectorAll('a').forEach(element => force(element, 'color', blue));

    document.querySelectorAll('input[type="text"], input[type="search"], select, textarea').forEach(element => {
      force(element, 'background', '#0b1523');
      force(element, 'color', '#f8fafc');
      force(element, 'border-color', '#3a4d68');
    });
  };

  repaint();
  document.addEventListener('DOMContentLoaded', repaint, { once: true });
  new MutationObserver(repaint).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'bgcolor', 'class']
  });
})();
