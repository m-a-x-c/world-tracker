// ── Helpers ────────────────────────────────────────────────────────────────
function formatPop(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString();
}

function countryFlag(code) {
  if (!code || code.length !== 2) return '🌍';
  const offset = 127397;
  return String.fromCodePoint(
    code.toUpperCase().charCodeAt(0) + offset,
    code.toUpperCase().charCodeAt(1) + offset
  );
}

// ── Blocked countries ──────────────────────────────────────────────────────
const GDP_BLOCK_THRESHOLD = 17000;
const BLOCK_EXCEPTIONS = new Set(['SA', 'CL', 'UY', 'GY']);
let blockMode = true; // on by default

const BLOCK_EXTRA = new Set(['KP']); // North Korea

function isBlocked(code) {
  if (!blockMode) return false;
  if (BLOCK_EXCEPTIONS.has(code)) return false;
  if (BLOCK_EXTRA.has(code)) return true;
  const gdp = GDP_PER_CAPITA[code];
  return gdp != null && gdp >= GDP_BLOCK_THRESHOLD;
}

const BLOCKED_FILL = '#111318';

// ── Pan/zoom ───────────────────────────────────────────────────────────────
let vp = { tx: 0, ty: 0, scale: 1 };
let dragging = false;
let dragMoved = false;
let dragStart = { x: 0, y: 0 };
let dragOrigin = { tx: 0, ty: 0 };

const MIN_SCALE = 1;
const MAX_SCALE = 12;

function applyTransform() {
  document.getElementById('map-wrap').style.transform =
    `matrix(${vp.scale},0,0,${vp.scale},${vp.tx},${vp.ty})`;
}

function clamp() {
  const c = document.getElementById('map-container');
  const cw = c.clientWidth, ch = c.clientHeight;
  const sw = cw * vp.scale, sh = ch * vp.scale;
  const px = cw * 0.15, py = ch * 0.15;
  vp.tx = Math.min(px, Math.max(-(sw - cw + px), vp.tx));
  vp.ty = Math.min(py, Math.max(-(sh - ch + py), vp.ty));
}

function zoomAt(sx, sy, factor) {
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, vp.scale * factor));
  const ratio = newScale / vp.scale;
  vp.tx = sx - ratio * (sx - vp.tx);
  vp.ty = sy - ratio * (sy - vp.ty);
  vp.scale = newScale;
  clamp();
  applyTransform();
}

function initPanZoom() {
  const container = document.getElementById('map-container');

  container.addEventListener('mousedown', e => {
    dragging = true;
    dragMoved = false;
    dragStart = { x: e.clientX, y: e.clientY };
    dragOrigin = { tx: vp.tx, ty: vp.ty };
    e.preventDefault();
  });

  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragMoved = true;
      vp.tx = dragOrigin.tx + dx;
      vp.ty = dragOrigin.ty + dy;
      clamp();
      applyTransform();
    }
  });

  window.addEventListener('mouseup', () => { dragging = false; });

  container.addEventListener('wheel', e => {
    e.preventDefault();
    const rect = container.getBoundingClientRect();
    zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
  }, { passive: false });

  document.getElementById('zoom-in').addEventListener('click', () => {
    const c = document.getElementById('map-container');
    zoomAt(c.clientWidth / 2, c.clientHeight / 2, 1.5);
  });
  document.getElementById('zoom-out').addEventListener('click', () => {
    const c = document.getElementById('map-container');
    zoomAt(c.clientWidth / 2, c.clientHeight / 2, 1 / 1.5);
  });
  document.getElementById('zoom-reset').addEventListener('click', () => {
    vp = { tx: 0, ty: 0, scale: 1 };
    applyTransform();
  });
}

// ── Overlay modes ─────────────────────────────────────────────────────────
let langMode = false;
let gdpMode  = false;
let popMode  = false;

const DEFAULT_FILL = '#c8ced8';

function setOverlayFills(colorFn) {
  document.querySelectorAll('.country').forEach(el => {
    const code = el.dataset.code;
    if (isBlocked(code)) {
      el.setAttribute('fill', BLOCKED_FILL);
    } else {
      el.setAttribute('fill', colorFn ? colorFn(code) : DEFAULT_FILL);
    }
  });
}

function buildLegend(items) {
  const legend = document.getElementById('legend');
  legend.innerHTML = items.map(item =>
    `<div class="legend-item"><span class="swatch" style="background:${item.color}"></span>${item.label}</div>`
  ).join('');
}

function clearLegend() {
  document.getElementById('legend').innerHTML = '';
}

function deactivateOverlays(except) {
  if (except !== 'lang' && langMode) {
    langMode = false;
    document.getElementById('btn-lang').classList.remove('active');
  }
  if (except !== 'gdp' && gdpMode) {
    gdpMode = false;
    document.getElementById('btn-gdp').classList.remove('active');
  }
  if (except !== 'pop' && popMode) {
    popMode = false;
    document.getElementById('btn-pop').classList.remove('active');
  }
}

function getLangColor(code) {
  const key = COUNTRY_LANGUAGE[code] || 'other';
  return (LANGUAGE_GROUPS[key] || LANGUAGE_GROUPS.other).color;
}

// ── Side panel ─────────────────────────────────────────────────────────────
let selectedCode = null;

function openPanel(code) {
  if (isBlocked(code)) return;

  selectedCode = code;
  const info = COUNTRY_INFO[code] || { name: code };

  document.querySelectorAll('.country.selected').forEach(el => el.classList.remove('selected'));
  document.querySelectorAll(`.country[data-code="${code}"]`).forEach(el => el.classList.add('selected'));

  document.getElementById('panel-flag').textContent = countryFlag(code);
  document.getElementById('panel-name').textContent = info.name || code;

  // Language badge
  const langKey = COUNTRY_LANGUAGE[code] || 'other';
  const lang = LANGUAGE_GROUPS[langKey] || LANGUAGE_GROUPS.other;
  const badge = document.getElementById('panel-lang');
  badge.textContent = lang.label;
  badge.style.background = lang.color;
  badge.style.color = isLight(lang.color) ? '#111' : '#fff';

  // GDP badge
  const gdpVal = GDP_PER_CAPITA[code];
  const gdpEl = document.getElementById('panel-gdp');
  if (gdpVal) {
    gdpEl.textContent = '💰 $' + gdpVal.toLocaleString() + ' GDP/capita';
    gdpEl.style.background = getGdpColor(code);
    gdpEl.style.color = isLight(getGdpColor(code)) ? '#111' : '#fff';
  } else {
    gdpEl.textContent = 'No GDP data';
    gdpEl.style.background = '#555';
    gdpEl.style.color = '#fff';
  }

  // Population badge
  const popVal = COUNTRY_POPULATION[code];
  const popEl = document.getElementById('panel-pop');
  if (popVal) {
    popEl.textContent = '👥 ' + formatPop(popVal) + ' population';
    popEl.style.background = getPopColor(code);
    popEl.style.color = isLight(getPopColor(code)) ? '#111' : '#fff';
  } else {
    popEl.textContent = 'No population data';
    popEl.style.background = '#555';
    popEl.style.color = '#fff';
  }

  // Cities
  const ul = document.getElementById('panel-cities');
  ul.innerHTML = '';
  const cities = CITIES[code];
  if (!cities || cities.length === 0) {
    ul.innerHTML = '<li style="color:#9ba3c2;font-size:0.8rem;padding:8px">No city data available</li>';
  } else {
    cities.forEach((city, i) => {
      const li = document.createElement('li');
      const badgeClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      li.innerHTML = `
        <span class="rank-badge ${badgeClass}">${i + 1}</span>
        <span class="city-name">${city.name}</span>
        <span class="city-pop">${formatPop(city.pop)}</span>
      `;
      ul.appendChild(li);
    });
  }

  document.getElementById('panel').classList.remove('panel-hidden');
}

function isLight(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return (r*299 + g*587 + b*114) / 1000 > 128;
}

function closePanel() {
  document.getElementById('panel').classList.add('panel-hidden');
  document.querySelectorAll('.country.selected').forEach(el => el.classList.remove('selected'));
  selectedCode = null;
}

// ── Tooltip ────────────────────────────────────────────────────────────────
const tooltip = document.getElementById('tooltip');

function showTooltip(e, text) {
  tooltip.textContent = text;
  tooltip.classList.add('visible');
  moveTooltip(e);
}
function moveTooltip(e) {
  tooltip.style.left = (e.clientX + 14) + 'px';
  tooltip.style.top  = (e.clientY - 28) + 'px';
}
function hideTooltip() { tooltip.classList.remove('visible'); }

// ── Build map ──────────────────────────────────────────────────────────────
function buildMap() {
  const container = document.getElementById('map-container');
  const wrap = document.getElementById('map-wrap');
  const W = container.clientWidth;
  const H = container.clientHeight;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 2000 1001');
  svg.setAttribute('width', W);
  svg.setAttribute('height', H);
  svg.id = 'world-svg';

  // Country paths
  for (const [code, d] of Object.entries(MAP_PATHS)) {
    const info = COUNTRY_INFO[code] || { name: code };
    const blocked = isBlocked(code);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('data-code', code);
    path.setAttribute('class', 'country' + (blocked ? ' blocked' : ''));
    path.setAttribute('fill', blocked ? BLOCKED_FILL : DEFAULT_FILL);

    path.addEventListener('click', e => {
      if (dragMoved || isBlocked(code)) return;
      openPanel(code);
    });
    path.addEventListener('mouseenter', e => {
      if (isBlocked(code)) return;
      showTooltip(e, `${countryFlag(code)} ${info.name}`);
    });
    path.addEventListener('mousemove', e => {
      if (isBlocked(code)) return;
      moveTooltip(e);
    });
    path.addEventListener('mouseleave', hideTooltip);

    svg.appendChild(path);
  }

  // City pins — hide pins for blocked countries
  const pinsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  pinsGroup.id = 'city-pins';

  for (const [cc, cities] of Object.entries(CITIES)) {
    if (isBlocked(cc)) continue;
    const top10 = cities.filter(c => c.lat != null && c.lng != null).slice(0, 5);
    top10.forEach((city, i) => {
      const x = (city.lng + 180) / 360 * 2000;
      const y = (90 - city.lat) / 180 * 1001;

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'city-pin');
      g.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`);
      g.dataset.cc = cc;

      const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      glow.setAttribute('r', '3.5');
      glow.setAttribute('class', 'pin-glow');

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('r', i === 0 ? '2.2' : i < 3 ? '1.8' : '1.4');
      dot.setAttribute('class', 'pin-dot');

      g.appendChild(glow);
      g.appendChild(dot);
      g.addEventListener('mouseenter', e => showTooltip(e, `${city.name} — ${formatPop(city.pop)}`));
      g.addEventListener('mousemove', moveTooltip);
      g.addEventListener('mouseleave', hideTooltip);

      pinsGroup.appendChild(g);
    });
  }

  svg.appendChild(pinsGroup);
  wrap.appendChild(svg);
}

// ── Controls ───────────────────────────────────────────────────────────────
function initControls() {
  document.getElementById('panel-close').addEventListener('click', closePanel);

  document.getElementById('btn-lang').addEventListener('click', () => {
    langMode = !langMode;
    document.getElementById('btn-lang').classList.toggle('active', langMode);
    if (langMode) {
      deactivateOverlays('lang');
      setOverlayFills(getLangColor);
      buildLegend(Object.values(LANGUAGE_GROUPS));
    } else {
      setOverlayFills(null);
      clearLegend();
    }
  });

  document.getElementById('btn-gdp').addEventListener('click', () => {
    gdpMode = !gdpMode;
    document.getElementById('btn-gdp').classList.toggle('active', gdpMode);
    if (gdpMode) {
      deactivateOverlays('gdp');
      setOverlayFills(getGdpColor);
      buildLegend(GDP_BINS.map(b => ({ color: b.color, label: b.label })));
    } else {
      setOverlayFills(null);
      clearLegend();
    }
  });

  document.getElementById('btn-pins').addEventListener('click', () => {
    const pins = document.getElementById('city-pins');
    const nowHidden = pins.classList.toggle('hidden');
    document.getElementById('btn-pins').classList.toggle('active', !nowHidden);
  });

  document.getElementById('btn-pop').addEventListener('click', () => {
    popMode = !popMode;
    document.getElementById('btn-pop').classList.toggle('active', popMode);
    if (popMode) {
      deactivateOverlays('pop');
      setOverlayFills(getPopColor);
      buildLegend(POP_BINS.map(b => ({ color: b.color, label: b.label })));
    } else {
      setOverlayFills(null);
      clearLegend();
    }
  });
}

function applyBlockState() {
  const currentOverlay = langMode ? getLangColor : gdpMode ? getGdpColor : popMode ? getPopColor : null;
  document.querySelectorAll('.country').forEach(el => {
    const code = el.dataset.code;
    const blocked = isBlocked(code);
    if (blocked) {
      el.classList.add('blocked');
      el.setAttribute('fill', BLOCKED_FILL);
      // remove interactivity
      el._blocked = true;
    } else {
      el.classList.remove('blocked');
      el._blocked = false;
      el.setAttribute('fill', currentOverlay ? currentOverlay(code) : DEFAULT_FILL);
    }
  });
  // city pins: hide/show based on block state
  document.querySelectorAll('.city-pin').forEach(g => {
    const cc = g.dataset.cc;
    if (cc) g.style.display = isBlocked(cc) ? 'none' : '';
  });
}

// ── Init ───────────────────────────────────────────────────────────────────
buildMap();
initPanZoom();
initControls();

// Block toggle
const chkBlock = document.getElementById('chk-block');
const toggleLabel = document.getElementById('block-toggle');
toggleLabel.classList.add('is-checked'); // default on

chkBlock.addEventListener('change', () => {
  blockMode = chkBlock.checked;
  toggleLabel.classList.toggle('is-checked', blockMode);
  applyBlockState();
  // If panel is open on a now-blocked country, close it
  if (selectedCode && isBlocked(selectedCode)) closePanel();
});
