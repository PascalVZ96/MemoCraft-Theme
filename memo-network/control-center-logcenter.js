(() => {
  if (window.MemoNetworkV5LogCenter) return;

  const view = document.getElementById('diagnostics');
  if (!view) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      eyebrow:'Systeemlogboeken', title:'Log Center', subtitle:'Doorzoek recente systemd-journalmeldingen zonder het Control Center te verlaten.', refresh:'Vernieuwen', refreshing:'Laden…', autoOn:'Auto-refresh aan', autoOff:'Auto-refresh uit', period:'Periode', oneHour:'Laatste uur', sixHours:'Laatste 6 uur', day:'Laatste 24 uur', boot:'Sinds serverstart', level:'Niveau', all:'Alles', warning:'Waarschuwing +', warningLevel:'Waarschuwing', error:'Fout +', errorLevel:'Fout', critical:'Kritiek', unit:'Bron / unit', allUnits:'Alle bronnen', search:'Zoeken in meldingen…', entries:'Logregels', warnings:'Waarschuwingen', errors:'Fouten', criticals:'Kritiek', time:'Tijd', severity:'Niveau', source:'Bron', message:'Melding', noRows:'Geen logregels voor deze filters', shown:'weergegeven', of:'van', lastUpdate:'Laatste update', unavailable:'journalctl is niet beschikbaar op deze server', failed:'Systeemlogboek kon niet worden geladen', truncated:'Uitvoer is begrensd voor een snelle en veilige weergave.'
    },
    de: {
      eyebrow:'Systemprotokolle', title:'Log Center', subtitle:'Aktuelle systemd-Journalmeldungen direkt im Control Center durchsuchen.', refresh:'Aktualisieren', refreshing:'Laden…', autoOn:'Auto-Aktualisierung an', autoOff:'Auto-Aktualisierung aus', period:'Zeitraum', oneHour:'Letzte Stunde', sixHours:'Letzte 6 Stunden', day:'Letzte 24 Stunden', boot:'Seit Serverstart', level:'Stufe', all:'Alle', warning:'Warnung +', warningLevel:'Warnung', error:'Fehler +', errorLevel:'Fehler', critical:'Kritisch', unit:'Quelle / Unit', allUnits:'Alle Quellen', search:'Meldungen durchsuchen…', entries:'Protokollzeilen', warnings:'Warnungen', errors:'Fehler', criticals:'Kritisch', time:'Zeit', severity:'Stufe', source:'Quelle', message:'Meldung', noRows:'Keine Protokollzeilen für diese Filter', shown:'angezeigt', of:'von', lastUpdate:'Letzte Aktualisierung', unavailable:'journalctl ist auf diesem Server nicht verfügbar', failed:'Systemprotokoll konnte nicht geladen werden', truncated:'Die Ausgabe ist für eine schnelle und sichere Anzeige begrenzt.'
    },
    en: {
      eyebrow:'System logs', title:'Log Center', subtitle:'Search recent systemd journal messages without leaving the Control Center.', refresh:'Refresh', refreshing:'Loading…', autoOn:'Auto-refresh on', autoOff:'Auto-refresh off', period:'Period', oneHour:'Last hour', sixHours:'Last 6 hours', day:'Last 24 hours', boot:'Since server boot', level:'Level', all:'All', warning:'Warning +', warningLevel:'Warning', error:'Error +', errorLevel:'Error', critical:'Critical', unit:'Source / unit', allUnits:'All sources', search:'Search messages…', entries:'Log entries', warnings:'Warnings', errors:'Errors', criticals:'Critical', time:'Time', severity:'Level', source:'Source', message:'Message', noRows:'No log entries match these filters', shown:'shown', of:'of', lastUpdate:'Last update', unavailable:'journalctl is not available on this server', failed:'System log could not be loaded', truncated:'Output is capped for a fast and safe view.'
    }
  };
  const t = key => dict[lang]?.[key] || dict.en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatTime = epoch => {
    const date = new Date(Number(epoch || 0) * 1000);
    return !epoch || Number.isNaN(date.getTime()) ? '—' : date.toLocaleString([], {dateStyle:'short', timeStyle:'medium'});
  };
  const severityKey = priority => Number(priority) <= 2 ? 'critical' : Number(priority) <= 3 ? 'error' : Number(priority) <= 4 ? 'warning' : Number(priority) <= 5 ? 'notice' : 'info';
  const severityLabel = priority => {
    const key = severityKey(priority);
    if (key === 'critical') return t('critical');
    if (key === 'error') return t('errorLevel');
    if (key === 'warning') return t('warningLevel');
    return key === 'notice' ? 'Notice' : 'Info';
  };

  const style = document.createElement('style');
  style.textContent = `
    .memo-logcenter{margin-top:12px;padding:15px;border:1px solid #2a4868;border-radius:15px;background:linear-gradient(145deg,#122136,#0d1928)}
    .memo-log-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.memo-log-head small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase;letter-spacing:.06em}.memo-log-head h3{margin:3px 0 0;font-size:16px}.memo-log-head p{margin:5px 0 0;color:#8ea6c2;font-size:11px}.memo-log-actions{display:flex;gap:7px;flex-wrap:wrap;justify-content:flex-end}.memo-log-btn{appearance:none;border:1px solid #315776;border-radius:9px;background:#10233a;color:#c9e8ff;padding:8px 10px;font-weight:800;cursor:pointer}.memo-log-btn:hover{border-color:#60a5fa;background:#133052}.memo-log-btn.active{border-color:#247653;color:#86efac;background:#0d281f}.memo-log-btn:disabled{opacity:.55;cursor:wait}
    .memo-log-error{margin-top:11px;padding:11px 12px;border:1px solid #7f3a49;border-radius:10px;background:#2a1520;color:#fecdd3;font-size:11px}.memo-log-note{margin-top:9px;color:#7189a5;font-size:9px}
    .memo-log-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}.memo-log-stat{padding:11px;border:1px solid #263d59;border-radius:11px;background:#0b1726}.memo-log-stat small{display:block;color:#7895b6;font-size:8px;font-weight:850;text-transform:uppercase}.memo-log-stat strong{display:block;margin-top:4px;font-size:16px}.memo-log-stat.warning strong{color:#fcd34d}.memo-log-stat.error strong{color:#fca5a5}.memo-log-stat.critical strong{color:#fb7185}
    .memo-log-filters{display:grid;grid-template-columns:1fr 1fr 1.2fr 2fr;gap:8px;margin-top:10px}.memo-log-field label{display:block;margin-bottom:4px;color:#7895b6;font-size:8px;font-weight:850;text-transform:uppercase}.memo-log-field select,.memo-log-field input{width:100%;border:1px solid #29415e;border-radius:9px;background:#071523;color:#dcecff;padding:8px 9px;font-size:10px;outline:none}.memo-log-field select:focus,.memo-log-field input:focus{border-color:#60a5fa}
    .memo-log-table-wrap{margin-top:10px;overflow:auto;border:1px solid #20354e;border-radius:11px;background:#07121f}.memo-log-table{width:100%;border-collapse:collapse;min-width:900px}.memo-log-table th,.memo-log-table td{padding:9px 8px;border-top:1px solid #20354e;text-align:left;font-size:9px;vertical-align:top}.memo-log-table th{position:sticky;top:0;border-top:0;background:#091625;color:#7895b6;text-transform:uppercase;letter-spacing:.04em}.memo-log-table td.time{white-space:nowrap;color:#8ea6c2}.memo-log-table td.source{white-space:nowrap;color:#c9e8ff;font-weight:750}.memo-log-message{max-width:760px;color:#d6e2f2;white-space:pre-wrap;overflow-wrap:anywhere}.memo-log-sev{display:inline-block;padding:3px 6px;border:1px solid #315776;border-radius:999px;color:#9bdcff;font-size:8px;font-weight:800;white-space:nowrap}.memo-log-sev.warning{border-color:#6f5a21;color:#fde68a;background:#251f10}.memo-log-sev.error{border-color:#7f3a49;color:#fecdd3;background:#2a1520}.memo-log-sev.critical{border-color:#9f3148;color:#fda4af;background:#32121a}.memo-log-empty{padding:25px;text-align:center;color:#7895b6;font-size:10px}.memo-log-foot{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-top:8px;color:#7895b6;font-size:9px}
    @media(max-width:1050px){.memo-log-filters{grid-template-columns:1fr 1fr}.memo-log-summary{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.memo-log-head{flex-direction:column}.memo-log-actions{justify-content:flex-start}.memo-log-filters,.memo-log-summary{grid-template-columns:1fr}.memo-log-foot{align-items:flex-start;flex-direction:column}}
  `;
  document.head.appendChild(style);

  const state = {
    items: [], units: [], counts: {total:0, warning:0, error:0, critical:0},
    period: '1h', level: 'warning', unit: '', search: '', busy: false, auto: true,
    generatedAt: 0, available: true, error: '', truncated: false,
  };

  const diagnosticsRoot = () => document.getElementById('memo-v5-diagnostics');

  const filteredItems = () => {
    const needle = state.search.trim().toLowerCase();
    return state.items.filter(item => {
      const p = Number(item?.priority ?? 6);
      if (state.level === 'warning' && p > 4) return false;
      if (state.level === 'error' && p > 3) return false;
      if (state.level === 'critical' && p > 2) return false;
      if (state.unit && String(item?.source || '') !== state.unit) return false;
      if (needle) {
        const haystack = `${item?.source || ''} ${item?.unit || ''} ${item?.message || ''} ${item?.pid || ''}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    }).reverse();
  };

  const periodOptions = () => [
    ['1h', t('oneHour')], ['6h', t('sixHours')], ['24h', t('day')], ['boot', t('boot')]
  ].map(([value,label]) => `<option value="${value}"${state.period === value ? ' selected' : ''}>${esc(label)}</option>`).join('');

  const levelOptions = () => [
    ['all', t('all')], ['warning', t('warning')], ['error', t('error')], ['critical', t('critical')]
  ].map(([value,label]) => `<option value="${value}"${state.level === value ? ' selected' : ''}>${esc(label)}</option>`).join('');

  const unitOptions = () => `<option value="">${esc(t('allUnits'))}</option>` + state.units.map(unit => `<option value="${esc(unit)}"${state.unit === unit ? ' selected' : ''}>${esc(unit)}</option>`).join('');

  const rowsHtml = items => {
    const visible = items.slice(0, 100);
    if (!visible.length) return `<tr><td colspan="4"><div class="memo-log-empty">${esc(t('noRows'))}</div></td></tr>`;
    return visible.map(item => {
      const key = severityKey(item.priority);
      const src = item.source || item.unit || 'system';
      const pid = item.pid ? ` · PID ${item.pid}` : '';
      return `<tr><td class="time">${esc(formatTime(item.timestamp))}</td><td><span class="memo-log-sev ${key}">${esc(severityLabel(item.priority))}</span></td><td class="source">${esc(src)}${esc(pid)}</td><td><div class="memo-log-message">${esc(item.message || '—')}</div></td></tr>`;
    }).join('');
  };

  const render = () => {
    const root = diagnosticsRoot();
    if (!root) return;
    let panel = root.querySelector('#memo-logcenter');
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'memo-logcenter';
      panel.className = 'memo-logcenter';
      const tools = Array.from(root.querySelectorAll('.memo-diag-panel')).find(el => el.querySelector('.memo-diag-links'));
      if (tools) root.insertBefore(panel, tools);
      else root.appendChild(panel);
    }

    const filtered = filteredItems();
    panel.innerHTML = `
      <div class="memo-log-head">
        <div><small>${esc(t('eyebrow'))}</small><h3>${esc(t('title'))}</h3><p>${esc(t('subtitle'))}</p></div>
        <div class="memo-log-actions"><button class="memo-log-btn ${state.auto ? 'active' : ''}" id="memo-log-auto" type="button">${esc(state.auto ? t('autoOn') : t('autoOff'))}</button><button class="memo-log-btn" id="memo-log-refresh" type="button" ${state.busy ? 'disabled' : ''}>↻ ${esc(state.busy ? t('refreshing') : t('refresh'))}</button></div>
      </div>
      ${state.error ? `<div class="memo-log-error"><strong>${esc(t('failed'))}</strong><div style="margin-top:4px">${esc(state.error)}</div></div>` : ''}
      ${!state.available ? `<div class="memo-log-error">${esc(t('unavailable'))}</div>` : ''}
      <div class="memo-log-summary">
        <div class="memo-log-stat"><small>${esc(t('entries'))}</small><strong>${Number(state.counts.total ?? state.items.length)}</strong></div>
        <div class="memo-log-stat warning"><small>${esc(t('warnings'))}</small><strong>${Number(state.counts.warning || 0)}</strong></div>
        <div class="memo-log-stat error"><small>${esc(t('errors'))}</small><strong>${Number(state.counts.error || 0)}</strong></div>
        <div class="memo-log-stat critical"><small>${esc(t('criticals'))}</small><strong>${Number(state.counts.critical || 0)}</strong></div>
      </div>
      <div class="memo-log-filters">
        <div class="memo-log-field"><label>${esc(t('period'))}</label><select id="memo-log-period">${periodOptions()}</select></div>
        <div class="memo-log-field"><label>${esc(t('level'))}</label><select id="memo-log-level">${levelOptions()}</select></div>
        <div class="memo-log-field"><label>${esc(t('unit'))}</label><select id="memo-log-unit">${unitOptions()}</select></div>
        <div class="memo-log-field"><label>${esc(t('search'))}</label><input id="memo-log-search" type="search" value="${esc(state.search)}" placeholder="${esc(t('search'))}"></div>
      </div>
      <div class="memo-log-table-wrap"><table class="memo-log-table"><thead><tr><th>${esc(t('time'))}</th><th>${esc(t('severity'))}</th><th>${esc(t('source'))}</th><th>${esc(t('message'))}</th></tr></thead><tbody>${rowsHtml(filtered)}</tbody></table></div>
      <div class="memo-log-foot"><span>${Math.min(filtered.length, 100)} ${esc(t('shown'))} ${esc(t('of'))} ${filtered.length}</span><span>${esc(t('lastUpdate'))}: ${esc(state.generatedAt ? formatTime(state.generatedAt) : '—')}</span></div>
      ${state.truncated ? `<div class="memo-log-note">${esc(t('truncated'))}</div>` : ''}`;

    panel.querySelector('#memo-log-refresh')?.addEventListener('click', () => load(true));
    panel.querySelector('#memo-log-auto')?.addEventListener('click', () => { state.auto = !state.auto; render(); });
    panel.querySelector('#memo-log-period')?.addEventListener('change', event => { state.period = event.target.value; state.unit = ''; load(true); });
    panel.querySelector('#memo-log-level')?.addEventListener('change', event => { state.level = event.target.value; render(); });
    panel.querySelector('#memo-log-unit')?.addEventListener('change', event => { state.unit = event.target.value; render(); });
    panel.querySelector('#memo-log-search')?.addEventListener('input', event => {
      state.search = event.target.value;
      render();
      const input = document.getElementById('memo-log-search');
      if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    });
  };

  const load = async (force = false) => {
    if (state.busy) return;
    if (!force && !view.classList.contains('active')) return;
    state.busy = true;
    state.error = '';
    render();
    try {
      const response = await fetch(`/memo-network/journal.cgi?period=${encodeURIComponent(state.period)}&_=${Date.now()}`, {credentials:'same-origin', cache:'no-store'});
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || `HTTP ${response.status}`);
      state.available = data.available !== false;
      state.items = Array.isArray(data.items) ? data.items : [];
      state.units = Array.isArray(data.units) ? data.units : [];
      state.counts = data.counts || {total:state.items.length,warning:0,error:0,critical:0};
      state.generatedAt = Number(data.generated_at || 0);
      state.truncated = !!data.truncated;
      if (state.unit && !state.units.includes(state.unit)) state.unit = '';
    } catch (error) {
      state.error = error?.message || String(error);
    } finally {
      state.busy = false;
      render();
    }
  };

  const ensurePanel = () => {
    const root = diagnosticsRoot();
    if (!root || root.querySelector('#memo-logcenter')) return;
    render();
  };

  const observer = new MutationObserver(() => ensurePanel());
  observer.observe(view, {childList:true, subtree:true});
  ensurePanel();
  setTimeout(() => load(true), 250);
  setInterval(() => { if (state.auto && !state.busy && view.classList.contains('active')) load(false); }, 30000);

  window.MemoNetworkV5LogCenter = {refresh: () => load(true)};
})();
