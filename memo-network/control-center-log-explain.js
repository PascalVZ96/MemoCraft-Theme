(() => {
  if (window.MemoNetworkV5LogExplain) return;

  const cookie = String(document.cookie || '').match(/(?:^|;\s*)memo_lang=(nl|de|en)(?:;|$)/i);
  const lang = cookie ? cookie[1].toLowerCase() : (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
  const dict = {
    nl: {
      explain:'Uitleg', action:'Actie', close:'Sluiten', what:'Wat betekent dit?', advice:'Wat kun je doen?', details:'Technische details', source:'Bron', severity:'Niveau', unknown:'Deze melding wordt nog niet specifiek herkend. De tekst hieronder is een veilige algemene uitleg op basis van bron en niveau.',
      ufwTitle:'Firewall heeft netwerkverkeer geblokkeerd', ufwSummary:'UFW heeft dit netwerkpakket tegengehouden. Dat betekent op zichzelf niet dat iemand is binnengedrongen; de firewall heeft juist verkeer geweigerd.', ufwLocal:'De bron komt uit je lokale netwerk en het doel is multicast. Dit is meestal normaal router-, discovery- of multicastverkeer en kan veilig als waarschuwing in de logs verschijnen.', ufwAdvice:'Als netwerk, Docker, AMP en andere diensten normaal werken, hoef je hier meestal niets aan te doen. Maak alleen een extra firewallregel als je zeker weet dat dit verkeer bewust toegestaan moet worden.',
      authTitle:'Mislukte aanmeldpoging', authSummary:'Een aanmelding of authenticatie is geweigerd. Eén losse melding hoeft geen probleem te zijn; veel herhalingen kunnen op scans of brute-forcepogingen wijzen.', authAdvice:'Controleer bij veel herhalingen de bron-IP, SSH-instellingen en firewall. Laat wachtwoordlogin uitgeschakeld als je alleen sleutels gebruikt en overweeg rate limiting of Fail2ban.',
      serviceTitle:'Service kon niet starten of stopte onverwacht', serviceSummary:'systemd meldt dat een service niet succesvol is gestart of onverwacht is beëindigd.', serviceAdvice:'Bekijk dezelfde unit in het Log Center en controleer de service-status. Zoek vooral naar de eerste foutregel vlak vóór deze melding.',
      oomTitle:'Geheugentekort / OOM', oomSummary:'Linux had onvoldoende beschikbaar geheugen en heeft mogelijk een proces beëindigd om het systeem stabiel te houden.', oomAdvice:'Controleer RAM- en swapgebruik en welk proces veel geheugen gebruikte. Als dit terugkomt, verlaag geheugengebruik of voeg voldoende swap/RAM toe.',
      diskTitle:'Opslag- of bestandssysteemprobleem', diskSummary:'Deze melding wijst op een probleem met vrije schijfruimte, I/O of het bestandssysteem.', diskAdvice:'Controleer onmiddellijk vrije ruimte, mounts en schijfstatus. Bij I/O- of filesystem-errors is een backup en verdere schijfcontrole verstandig.',
      crashTitle:'Procescrash gedetecteerd', crashSummary:'Een proces is gecrasht, bijvoorbeeld door een segmentation fault of protection fault.', crashAdvice:'Controleer welke service of toepassing bij deze melding hoort en bekijk de omliggende logregels. Als dit vaker gebeurt, controleer updates, configuratie en applicatielogs.',
      timeoutTitle:'Actie of service liep in een timeout', timeoutSummary:'Een proces, service of netwerkactie reageerde niet binnen de verwachte tijd.', timeoutAdvice:'Controleer de betreffende service en eventuele netwerkafhankelijkheden. Een incidentele timeout kan tijdelijk zijn; herhaalde timeouts verdienen onderzoek.',
      genericTitle:'Systeemwaarschuwing', genericAdvice:'Gebruik de bron/unit en omliggende regels om te bepalen wat er gebeurde. Een waarschuwing is niet automatisch een storing; kijk vooral of dezelfde melding vaak terugkomt of samenvalt met een merkbaar probleem.',
      low:'Waarschijnlijk onschuldig', medium:'Aandacht', high:'Belangrijk'
    },
    de: {
      explain:'Erklärung', action:'Aktion', close:'Schließen', what:'Was bedeutet das?', advice:'Was kannst du tun?', details:'Technische Details', source:'Quelle', severity:'Stufe', unknown:'Diese Meldung wird noch nicht speziell erkannt. Unten steht eine sichere allgemeine Erklärung anhand von Quelle und Stufe.',
      ufwTitle:'Firewall hat Netzwerkverkehr blockiert', ufwSummary:'UFW hat dieses Netzwerkpaket verworfen. Das bedeutet nicht automatisch einen Einbruch; die Firewall hat den Verkehr gerade abgewiesen.', ufwLocal:'Die Quelle liegt im lokalen Netzwerk und das Ziel ist Multicast. Das ist meistens normaler Router-, Discovery- oder Multicast-Verkehr.', ufwAdvice:'Wenn Netzwerk und Dienste normal funktionieren, ist meist keine Aktion nötig. Erstelle nur dann eine zusätzliche Firewallregel, wenn dieser Verkehr bewusst erlaubt werden soll.',
      authTitle:'Fehlgeschlagener Anmeldeversuch', authSummary:'Eine Anmeldung oder Authentifizierung wurde abgewiesen. Einzelne Meldungen sind nicht ungewöhnlich; viele Wiederholungen können auf Scans oder Brute-Force hindeuten.', authAdvice:'Bei vielen Wiederholungen Quell-IP, SSH und Firewall prüfen. Schlüssel-Anmeldung bevorzugen und bei Bedarf Rate-Limiting oder Fail2ban einsetzen.',
      serviceTitle:'Dienst konnte nicht starten oder wurde beendet', serviceSummary:'systemd meldet, dass ein Dienst nicht erfolgreich gestartet wurde oder unerwartet beendet wurde.', serviceAdvice:'Status der betreffenden Unit und die vorhergehenden Logzeilen prüfen. Die erste Fehlermeldung vor diesem Eintrag ist meistens am wichtigsten.',
      oomTitle:'Speichermangel / OOM', oomSummary:'Linux hatte zu wenig verfügbaren Arbeitsspeicher und hat möglicherweise einen Prozess beendet.', oomAdvice:'RAM-, Swap- und Prozessverbrauch prüfen. Bei Wiederholungen Speichernutzung reduzieren oder genügend RAM/Swap bereitstellen.',
      diskTitle:'Speicher- oder Dateisystemproblem', diskSummary:'Diese Meldung deutet auf freien Speicherplatz, I/O oder ein Dateisystemproblem hin.', diskAdvice:'Freien Speicherplatz, Mounts und Datenträgerzustand sofort prüfen. Bei I/O- oder Dateisystemfehlern Backup und weitere Datenträgerprüfung durchführen.',
      crashTitle:'Prozessabsturz erkannt', crashSummary:'Ein Prozess ist abgestürzt, zum Beispiel durch einen Segmentation Fault.', crashAdvice:'Betroffenen Dienst und umliegende Logzeilen prüfen. Bei Wiederholungen Updates, Konfiguration und Anwendungslogs kontrollieren.',
      timeoutTitle:'Zeitüberschreitung erkannt', timeoutSummary:'Ein Prozess, Dienst oder Netzwerkvorgang hat nicht rechtzeitig geantwortet.', timeoutAdvice:'Betroffenen Dienst und Netzwerkabhängigkeiten prüfen. Einzelne Timeouts können vorübergehend sein; wiederholte Timeouts sollten untersucht werden.',
      genericTitle:'Systemwarnung', genericAdvice:'Quelle/Unit und umliegende Zeilen verwenden, um die Ursache einzugrenzen. Eine Warnung ist nicht automatisch eine Störung; besonders auf Wiederholungen achten.',
      low:'Wahrscheinlich harmlos', medium:'Beachten', high:'Wichtig'
    },
    en: {
      explain:'Explain', action:'Action', close:'Close', what:'What does this mean?', advice:'What can you do?', details:'Technical details', source:'Source', severity:'Level', unknown:'This message is not specifically recognized yet. The explanation below is a safe general interpretation based on its source and severity.',
      ufwTitle:'Firewall blocked network traffic', ufwSummary:'UFW blocked this network packet. By itself this does not mean someone got in; the firewall actually refused the traffic.', ufwLocal:'The source is on your local network and the destination is multicast. This is usually normal router, discovery or multicast traffic.', ufwAdvice:'If networking and services work normally, you usually do not need to change anything. Only add a firewall rule when you are sure this traffic is intentionally required.',
      authTitle:'Failed login attempt', authSummary:'A login or authentication attempt was refused. A single event is not unusual; repeated events can indicate scanning or brute-force attempts.', authAdvice:'If it repeats often, review the source IP, SSH settings and firewall. Prefer key authentication and consider rate limiting or Fail2ban.',
      serviceTitle:'Service failed to start or exited', serviceSummary:'systemd reports that a service did not start successfully or exited unexpectedly.', serviceAdvice:'Check the unit status and nearby log entries. The first error just before this message is usually the most useful.',
      oomTitle:'Low memory / OOM', oomSummary:'Linux ran short of available memory and may have killed a process to keep the system stable.', oomAdvice:'Check RAM, swap and the process using the most memory. If this repeats, reduce memory usage or provide enough RAM/swap.',
      diskTitle:'Storage or filesystem problem', diskSummary:'This message points to free-space, I/O or filesystem trouble.', diskAdvice:'Check free space, mounts and disk health promptly. For I/O or filesystem errors, make sure backups are current and investigate the disk.',
      crashTitle:'Process crash detected', crashSummary:'A process crashed, for example with a segmentation fault or protection fault.', crashAdvice:'Check the related service and nearby log lines. If it repeats, review updates, configuration and application logs.',
      timeoutTitle:'Operation or service timed out', timeoutSummary:'A process, service or network operation did not respond within the expected time.', timeoutAdvice:'Check the affected service and its network dependencies. A single timeout can be temporary; repeated timeouts should be investigated.',
      genericTitle:'System warning', genericAdvice:'Use the source/unit and surrounding log lines to determine what happened. A warning is not automatically an outage; repeated events or visible service impact matter most.',
      low:'Probably harmless', medium:'Attention', high:'Important'
    }
  };
  const t = key => dict[lang]?.[key] || dict.en[key] || key;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  const style = document.createElement('style');
  style.textContent = `
    .memo-log-explain-head,.memo-log-explain-cell{width:78px;text-align:right!important;white-space:nowrap}.memo-log-explain-btn{appearance:none;border:1px solid #315776;border-radius:7px;background:#10233a;color:#9bdcff;padding:5px 8px;font-size:8px;font-weight:850;cursor:pointer}.memo-log-explain-btn:hover{border-color:#60a5fa;background:#133052;color:#fff}
    #memo-log-explain-overlay{position:fixed;inset:0;z-index:999999;background:rgba(2,8,18,.72);display:none;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)}#memo-log-explain-overlay.open{display:flex}.memo-log-explain-dialog{width:min(760px,96vw);max-height:88vh;overflow:auto;border:1px solid #31506f;border-radius:16px;background:linear-gradient(145deg,#13233a,#0b1726);box-shadow:0 24px 70px rgba(0,0,0,.55);padding:18px}.memo-log-explain-top{display:flex;justify-content:space-between;gap:14px;align-items:flex-start}.memo-log-explain-top small{display:block;color:#7895b6;font-size:9px;font-weight:850;text-transform:uppercase}.memo-log-explain-top h3{margin:4px 0 0;font-size:18px}.memo-log-explain-close{appearance:none;border:1px solid #315776;border-radius:8px;background:#10233a;color:#c9e8ff;padding:7px 10px;font-weight:800;cursor:pointer}.memo-log-explain-risk{display:inline-block;margin-top:10px;padding:5px 9px;border-radius:999px;border:1px solid #315776;color:#9bdcff;font-size:9px;font-weight:850}.memo-log-explain-risk.low{border-color:#247653;background:#0d281f;color:#86efac}.memo-log-explain-risk.medium{border-color:#6f5a21;background:#251f10;color:#fde68a}.memo-log-explain-risk.high{border-color:#7f3a49;background:#2a1520;color:#fecdd3}.memo-log-explain-section{margin-top:13px;padding:12px;border:1px solid #263d59;border-radius:11px;background:#0b1726}.memo-log-explain-section small{display:block;color:#7895b6;font-size:8px;font-weight:850;text-transform:uppercase}.memo-log-explain-section p{margin:6px 0 0;color:#dcecff;font-size:11px;line-height:1.55}.memo-log-explain-details{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:7px}.memo-log-explain-kv{padding:8px;border:1px solid #20354e;border-radius:8px;background:#07121f;font-size:10px;overflow-wrap:anywhere}.memo-log-explain-kv b{color:#7895b6}.memo-log-explain-original{margin-top:7px;color:#9fb6ce;font:9px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:600px){.memo-log-explain-details{grid-template-columns:1fr}.memo-log-explain-dialog{padding:14px}}
  `;
  document.head.appendChild(style);

  const tokenMap = message => {
    const out = {};
    String(message || '').replace(/\b([A-Z][A-Z0-9_]*)=([^\s]+)/g, (_all, key, value) => { out[key] = value; return _all; });
    return out;
  };
  const isPrivate = ip => /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(String(ip || ''));
  const isMulticast = ip => {
    const value = String(ip || '').toLowerCase();
    if (/^ff[0-9a-f]{2}:/.test(value)) return true;
    const first = Number(value.split('.')[0]);
    return first >= 224 && first <= 239;
  };
  const protoName = value => ({'1':'ICMP','2':'IGMP','6':'TCP','17':'UDP','58':'ICMPv6'}[String(value || '')] || value || '—');

  const explain = (message, source, severity) => {
    const text = String(message || '');
    const lower = text.toLowerCase();
    const tokens = tokenMap(text);
    const technical = [];
    let risk = 'medium', title = t('genericTitle'), summary = t('unknown'), advice = t('genericAdvice');

    if (/\[ufw\s+block\]/i.test(text) || /ufw.*block/i.test(text)) {
      const localMulticast = isPrivate(tokens.SRC) && isMulticast(tokens.DST);
      risk = localMulticast ? 'low' : 'medium';
      title = t('ufwTitle');
      summary = `${t('ufwSummary')}${localMulticast ? ` ${t('ufwLocal')}` : ''}`;
      advice = t('ufwAdvice');
      if (tokens.IN) technical.push(['IN', tokens.IN]);
      if (tokens.OUT) technical.push(['OUT', tokens.OUT]);
      if (tokens.SRC) technical.push(['SRC', tokens.SRC]);
      if (tokens.DST) technical.push(['DST', tokens.DST]);
      if (tokens.PROTO) technical.push(['PROTO', protoName(tokens.PROTO)]);
      if (tokens.SPT) technical.push(['SPT', tokens.SPT]);
      if (tokens.DPT) technical.push(['DPT', tokens.DPT]);
    } else if (/failed password|authentication failure|invalid user|pam_unix.*authentication/i.test(text)) {
      risk = 'medium'; title = t('authTitle'); summary = t('authSummary'); advice = t('authAdvice');
    } else if (/out of memory|oom-killer|killed process .* total-vm|memory cgroup out of memory/i.test(text)) {
      risk = 'high'; title = t('oomTitle'); summary = t('oomSummary'); advice = t('oomAdvice');
    } else if (/no space left on device|i\/o error|buffer i\/o|ext4-fs error|xfs.*error|read-only file system|filesystem.*error/i.test(text)) {
      risk = 'high'; title = t('diskTitle'); summary = t('diskSummary'); advice = t('diskAdvice');
    } else if (/segfault|general protection fault|core dumped|segmentation fault/i.test(text)) {
      risk = 'high'; title = t('crashTitle'); summary = t('crashSummary'); advice = t('crashAdvice');
    } else if (/failed to start|failed with result|main process exited|unit .* failed/i.test(text)) {
      risk = 'high'; title = t('serviceTitle'); summary = t('serviceSummary'); advice = t('serviceAdvice');
    } else if (/timed out|timeout|time out/i.test(text)) {
      risk = 'medium'; title = t('timeoutTitle'); summary = t('timeoutSummary'); advice = t('timeoutAdvice');
    } else {
      const sev = String(severity || '').toLowerCase();
      risk = /critical|krit|fout|error|fehler/.test(sev) ? 'high' : 'medium';
    }

    technical.unshift([t('source'), source || 'system'], [t('severity'), severity || '—']);
    return {risk, title, summary, advice, technical, original:text};
  };

  const ensureOverlay = () => {
    let overlay = document.getElementById('memo-log-explain-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'memo-log-explain-overlay';
    overlay.innerHTML = '<div class="memo-log-explain-dialog" role="dialog" aria-modal="true"><div id="memo-log-explain-content"></div></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', event => { if (event.target === overlay) closeOverlay(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape' && overlay.classList.contains('open')) closeOverlay(); });
    return overlay;
  };
  const closeOverlay = () => document.getElementById('memo-log-explain-overlay')?.classList.remove('open');
  const openExplanation = (message, source, severity) => {
    const data = explain(message, source, severity);
    const overlay = ensureOverlay();
    const content = overlay.querySelector('#memo-log-explain-content');
    content.innerHTML = `
      <div class="memo-log-explain-top"><div><small>${esc(t('what'))}</small><h3>${esc(data.title)}</h3><span class="memo-log-explain-risk ${data.risk}">${esc(t(data.risk))}</span></div><button class="memo-log-explain-close" type="button">${esc(t('close'))}</button></div>
      <div class="memo-log-explain-section"><small>${esc(t('what'))}</small><p>${esc(data.summary)}</p></div>
      <div class="memo-log-explain-section"><small>${esc(t('advice'))}</small><p>${esc(data.advice)}</p></div>
      <div class="memo-log-explain-section"><small>${esc(t('details'))}</small><div class="memo-log-explain-details">${data.technical.map(([k,v]) => `<div class="memo-log-explain-kv"><b>${esc(k)}:</b> ${esc(v)}</div>`).join('')}</div><div class="memo-log-explain-original">${esc(data.original)}</div></div>`;
    content.querySelector('.memo-log-explain-close')?.addEventListener('click', closeOverlay);
    overlay.classList.add('open');
  };

  const enhance = () => {
    const panel = document.getElementById('memo-logcenter');
    const table = panel?.querySelector('.memo-log-table');
    if (!table) return;
    const head = table.querySelector('thead tr');
    if (head && !head.querySelector('.memo-log-explain-head')) {
      const th = document.createElement('th');
      th.className = 'memo-log-explain-head';
      th.textContent = t('action');
      head.appendChild(th);
    }
    table.querySelectorAll('tbody tr').forEach(row => {
      if (row.querySelector('.memo-log-empty') || row.querySelector('.memo-log-explain-cell')) return;
      const cells = row.querySelectorAll(':scope > td');
      if (cells.length < 4) return;
      const message = row.querySelector('.memo-log-message')?.textContent?.trim() || cells[3]?.textContent?.trim() || '';
      const source = row.querySelector('td.source')?.textContent?.trim() || '';
      const severity = row.querySelector('.memo-log-sev')?.textContent?.trim() || '';
      const td = document.createElement('td');
      td.className = 'memo-log-explain-cell';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'memo-log-explain-btn';
      button.textContent = `? ${t('explain')}`;
      button.addEventListener('click', () => openExplanation(message, source, severity));
      td.appendChild(button);
      row.appendChild(td);
    });
    table.querySelectorAll('tbody tr').forEach(row => {
      if (row.querySelector('.memo-log-empty')) row.querySelector('td')?.setAttribute('colspan', '5');
    });
  };

  const observer = new MutationObserver(enhance);
  observer.observe(document.body, {childList:true, subtree:true});
  ensureOverlay();
  enhance();
  window.MemoNetworkV5LogExplain = {refresh: enhance};
})();
