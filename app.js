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
const BLOCK_EXCEPTIONS = new Set(['SA', 'CL', 'UY', 'GY', 'QA', 'KW', 'BH', 'OM', 'AE']);
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

function initViewport() {
  vp = { tx: 0, ty: 0, scale: 1 };
  applyTransform();
}
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
    initViewport();
  });
}

// ── Overlay modes ─────────────────────────────────────────────────────────
let langMode      = false;
let gdpMode       = false;
let popMode       = false;
let expansionMode = false;

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
  if (except !== 'expansion' && expansionMode) {
    expansionMode = false;
    document.getElementById('btn-expansion').classList.remove('active');
    const bar = document.getElementById('expansion-bar');
    if (bar) bar.style.display = 'none';
    refreshExpansionPins();
  }
}

function getExpansionColor(code) {
  const phase = EXPANSION_COUNTRY_PHASE[code];
  if (!phase) return null;
  return phase.color;
}

function getExpansionFill(code) {
  return getExpansionColor(code) || DEFAULT_FILL;
}

function getLangColor(code) {
  const key = COUNTRY_LANGUAGE[code] || 'other';
  return (LANGUAGE_GROUPS[key] || LANGUAGE_GROUPS.other).color;
}

// ── Side panel ─────────────────────────────────────────────────────────────
let selectedCode = null;

function openPanel(code) {
  if (isBlocked(code)) return;
  if (expansionMode && !EXPANSION_COUNTRY_PHASE[code]) return;

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

  // Cities by population — hidden in expansion mode
  const citiesHeader = document.getElementById('panel-cities-header');
  const ul = document.getElementById('panel-cities');
  if (expansionMode) {
    citiesHeader.style.display = 'none';
    ul.style.display = 'none';
  } else {
    citiesHeader.style.display = '';
    ul.style.display = '';
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
  }

  // Expansion section
  renderExpansionPanel(code);

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

// ── City pin highlight ─────────────────────────────────────────────────────
function highlightCityPin(cc, city) {
  const existing = document.querySelector(`.city-pin[data-city="${CSS.escape(city.name)}"]`);
  if (existing) {
    existing.classList.add('pin-highlight');
    return;
  }
  // No permanent pin — create a temporary one
  if (city.lat == null || city.lng == null) return;
  const pinsGroup = document.getElementById('city-pins');
  if (!pinsGroup) return;
  const x = (city.lng + 180) / 360 * 2000;
  const y = (90 - city.lat) / 180 * 1001;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('class', 'city-pin pin-highlight pin-temp');
  g.setAttribute('transform', `translate(${x.toFixed(2)},${y.toFixed(2)})`);
  g.dataset.cc = cc;
  g.dataset.city = city.name;

  const glow = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  glow.setAttribute('r', '3.5');
  glow.setAttribute('class', 'pin-glow');

  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', '1.8');
  dot.setAttribute('class', 'pin-dot');

  g.appendChild(glow);
  g.appendChild(dot);
  pinsGroup.appendChild(g);
}

function unhighlightCityPin(city) {
  document.querySelectorAll('.city-pin').forEach(g => {
    if (g.dataset.city === city.name) {
      if (g.classList.contains('pin-temp')) {
        g.remove();
      } else {
        g.classList.remove('pin-highlight');
      }
    }
  });
}

// ── Expansion pin refresh ─────────────────────────────────────────────────
function refreshExpansionPins() {
  // Re-style city pins based on expansion mode
  document.querySelectorAll('.city-pin').forEach(g => {
    const cc = g.dataset.cc;
    if (!cc) return;
    const isTarget = expansionMode && EXPANSION_COUNTRY_PHASE[cc];
    g.classList.toggle('expansion-pin', !!isTarget);
  });
}

// ── Expansion panel section ───────────────────────────────────────────────
function renderExpansionPanel(code) {
  const phase = EXPANSION_COUNTRY_PHASE[code];
  const section = document.getElementById('panel-expansion-section');
  if (!phase) {
    section.style.display = 'none';
    return;
  }
  section.style.display = '';

  // Phase badge
  const phaseBadge = document.getElementById('panel-phase-badge');
  phaseBadge.innerHTML = `<span class="expansion-phase-badge" style="background:${phase.color};color:${isLight(phase.color)?'#111':'#fff'}">${phase.label}</span>`;

  // Status row
  const state = getCountryExpansionState(code);
  const statusRow = document.getElementById('panel-status-row');
  statusRow.innerHTML = EXPANSION_STATUSES.map(s =>
    `<button class="status-btn${state.status === s ? ' status-active' : ''}" data-status="${s}" data-cc="${code}"
      style="${state.status === s ? `background:${phase.color};color:${isLight(phase.color)?'#111':'#fff'}` : ''}">${s}</button>`
  ).join('');
  statusRow.querySelectorAll('.status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      setCountryStatus(code, btn.dataset.status);
      renderExpansionPanel(code);
      buildExpansionSidebar();
    });
  });

  // Target cities
  const cities = getTargetCities(code);
  const reps = state.reps || {};
  const cityTotal = cities.reduce((sum, c) => sum + (reps[c.name] || 0), 0);
  const cityGoal = cities.reduce((sum, c) => sum + cityRepsGoal(c.pop), 0);

  const summary = document.getElementById('panel-expansion-summary');
  summary.innerHTML = `
    <div class="expansion-summary">
      <span>${cities.length} cities · ${cityTotal}/${cityGoal} reps</span>
      <div class="exp-progress-bar"><div class="exp-progress-fill" style="width:${cityGoal > 0 ? Math.min(100, cityTotal/cityGoal*100) : 0}%;background:${phase.color}"></div></div>
    </div>`;

  const ul = document.getElementById('panel-expansion-cities');
  ul.innerHTML = '';
  cities.forEach((city, i) => {
    const count = reps[city.name] || 0;
    const badgeClass = '';
    const li = document.createElement('li');
    li.className = 'expansion-city-row';
    li.innerHTML = `
      <span class="rank-badge ${badgeClass}">${i + 1}</span>
      <div class="exp-city-info">
        <span class="city-name">${city.name}</span>
        <span class="city-pop">${formatPop(city.pop)}</span>
      </div>
      <div class="exp-rep-counter">
        <button class="rep-btn rep-minus" data-city="${city.name}" data-cc="${code}">−</button>
        <span class="rep-count ${count >= cityRepsGoal(city.pop) ? 'rep-done' : ''}">${count}/${cityRepsGoal(city.pop)}</span>
        <button class="rep-btn rep-plus" data-city="${city.name}" data-cc="${code}">+</button>
      </div>`;
    ul.appendChild(li);
  });

  cities.forEach((city, i) => {
    const li = ul.children[i];
    li.addEventListener('mouseenter', () => highlightCityPin(code, city));
    li.addEventListener('mouseleave', () => unhighlightCityPin(city));
  });

  ul.querySelectorAll('.rep-plus').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = (getCountryExpansionState(btn.dataset.cc).reps[btn.dataset.city] || 0);
      setCityReps(btn.dataset.cc, btn.dataset.city, cur + 1);
      renderExpansionPanel(btn.dataset.cc);
      updateExpansionHeader();
    });
  });
  ul.querySelectorAll('.rep-minus').forEach(btn => {
    btn.addEventListener('click', () => {
      const cur = (getCountryExpansionState(btn.dataset.cc).reps[btn.dataset.city] || 0);
      setCityReps(btn.dataset.cc, btn.dataset.city, cur - 1);
      renderExpansionPanel(btn.dataset.cc);
      updateExpansionHeader();
    });
  });
}

function updateExpansionHeader() {
  const el = document.getElementById('expansion-totals');
  if (el) {
    const t = getExpansionTotals();
    el.textContent = `${t.totalCities} cities · ${t.totalRepsActual.toLocaleString()}/${t.totalRepsGoal.toLocaleString()} reps`;
  }
  buildExpansionSidebar();
}

// ── Expansion sidebar ─────────────────────────────────────────────────────
function buildExpansionSidebar() {
  const body = document.getElementById('expansion-sidebar-body');
  if (!body) return;

  const totalsEl = document.getElementById('expansion-sidebar-totals');
  if (totalsEl) {
    const t = getExpansionTotals();
    totalsEl.textContent = `${t.totalCities} cities · ${t.totalRepsActual.toLocaleString()}/${t.totalRepsGoal.toLocaleString()} reps`;
  }

  // Preserve open states
  const openPhases = new Set();
  const openCountries = new Set();
  body.querySelectorAll('.sb-phase.open').forEach(el => openPhases.add(el.dataset.phase));
  body.querySelectorAll('.sb-country.open').forEach(el => openCountries.add(el.dataset.cc));

  body.innerHTML = '';

  for (const phase of EXPANSION_PHASES) {
    const phaseDiv = document.createElement('div');
    phaseDiv.className = 'sb-phase' + (openPhases.has(String(phase.id)) ? ' open' : '');
    phaseDiv.dataset.phase = phase.id;

    // Count phase cities
    let phaseCities = 0;
    for (const cc of phase.countries) {
      phaseCities += getTargetCities(cc).length;
    }

    phaseDiv.innerHTML = `
      <div class="sb-phase-header">
        <span class="sb-phase-swatch" style="background:${phase.color}"></span>
        <span class="sb-phase-label">${phase.label}</span>
        <span class="sb-phase-count">${phaseCities} cities</span>
        <span class="sb-chevron">▶</span>
      </div>
      <div class="sb-phase-body"></div>`;

    phaseDiv.querySelector('.sb-phase-header').addEventListener('click', () => {
      phaseDiv.classList.toggle('open');
    });

    const phaseBody = phaseDiv.querySelector('.sb-phase-body');

    for (const cc of phase.countries) {
      const info = COUNTRY_INFO[cc] || { name: cc };
      const state = getCountryExpansionState(cc);
      const cities = getTargetCities(cc);
      const reps = state.reps || {};
      const countryActual = cities.reduce((s, c) => s + (reps[c.name] || 0), 0);
      const countryGoal = cities.reduce((sum, c) => sum + cityRepsGoal(c.pop), 0);
      const statusClass = state.status === 'Active' ? 'status-active' : state.status === 'Launched' ? 'status-launched' : '';

      const countryDiv = document.createElement('div');
      countryDiv.className = 'sb-country' + (openCountries.has(cc) ? ' open' : '');
      countryDiv.dataset.cc = cc;

      countryDiv.innerHTML = `
        <div class="sb-country-header">
          <span class="sb-country-flag">${countryFlag(cc)}</span>
          <span class="sb-country-name">${info.name || cc} <span class="sb-city-pop">(${formatPop(COUNTRY_POPULATION[cc] || 0)})</span></span>
          ${state.status !== 'Planned' ? `<span class="sb-country-status ${statusClass}">${state.status}</span>` : ''}
          <span class="sb-country-reps">${cities.length} cities · ${countryActual}/${countryGoal} reps</span>
          <span class="sb-chevron-sm">▶</span>
        </div>
        <div class="sb-country-body"></div>`;

      countryDiv.querySelector('.sb-country-header').addEventListener('click', () => {
        countryDiv.classList.toggle('open');
      });

      const countryBody = countryDiv.querySelector('.sb-country-body');
      cities.forEach((city, i) => {
        const count = reps[city.name] || 0;
        const goal = cityRepsGoal(city.pop);
        const done = count >= goal;
        const cityRow = document.createElement('div');
        cityRow.className = 'sb-city-row';
        cityRow.innerHTML = `
          <span class="sb-city-rank">${i + 1}</span>
          <span class="sb-city-name">${city.name} <span class="sb-city-pop">(${formatPop(city.pop)})</span></span>
          <span class="sb-city-reps${done ? ' done' : ''}">${count}/${goal}</span>`;
        cityRow.addEventListener('mouseenter', () => highlightCityPin(cc, city));
        cityRow.addEventListener('mouseleave', () => unhighlightCityPin(city));
        countryBody.appendChild(cityRow);
      });

      phaseBody.appendChild(countryDiv);
    }

    body.appendChild(phaseDiv);
  }
}

// ── Full Roadmap Overlay ──────────────────────────────────────────────────
function buildRoadmapOverlay() {
  const body = document.getElementById('roadmap-body');
  body.innerHTML = '';

  const t = getExpansionTotals();
  document.getElementById('roadmap-totals').textContent =
    `${t.totalCities} cities · ${t.totalRepsActual.toLocaleString()}/${t.totalRepsGoal.toLocaleString()} reps`;

  const tree = document.createElement('div');
  tree.className = 'rm-tree';

  for (let pi = 0; pi < EXPANSION_PHASES.length; pi++) {
    const phase = EXPANSION_PHASES[pi];
    const isLastPhase = pi === EXPANSION_PHASES.length - 1;

    let phaseCities = 0, phaseActual = 0, phaseGoal = 0;
    for (const cc of phase.countries) {
      const cities = getTargetCities(cc);
      phaseCities += cities.length;
      phaseGoal += cities.reduce((s, c) => s + cityRepsGoal(c.pop), 0);
      const st = expansionState[cc];
      if (st && st.reps) for (const r of Object.values(st.reps)) phaseActual += r;
    }

    // Phase row
    const phaseRow = document.createElement('div');
    phaseRow.className = 'rm-row rm-phase-row';
    phaseRow.innerHTML = `
      <span class="rm-prefix">${isLastPhase ? '└─' : '├─'}</span>
      <span class="rm-swatch" style="background:${phase.color}"></span>
      <span class="rm-phase-name">${phase.label}</span>
      <span class="rm-stats">${phaseCities} cities · ${phaseActual}/${phaseGoal} reps</span>`;
    tree.appendChild(phaseRow);

    for (let ci = 0; ci < phase.countries.length; ci++) {
      const cc = phase.countries[ci];
      const isLastCountry = ci === phase.countries.length - 1;
      const info = COUNTRY_INFO[cc] || { name: cc };
      const state = getCountryExpansionState(cc);
      const cities = getTargetCities(cc);
      const reps = state.reps || {};
      const actual = cities.reduce((s, c) => s + (reps[c.name] || 0), 0);
      const goal = cities.reduce((s, c) => s + cityRepsGoal(c.pop), 0);

      const phaseIndent = isLastPhase ? '&nbsp;&nbsp;&nbsp;&nbsp;' : '│&nbsp;&nbsp;&nbsp;';
      const countryPrefix = isLastCountry ? '└─' : '├─';

      // Country row
      const countryRow = document.createElement('div');
      countryRow.className = 'rm-row rm-country-row';
      countryRow.innerHTML = `
        <span class="rm-prefix">${phaseIndent}${countryPrefix}</span>
        <span class="rm-flag">${countryFlag(cc)}</span>
        <span class="rm-country-name">${info.name || cc}</span>
        <span class="rm-stats">${cities.length} cities · ${actual}/${goal} reps</span>`;
      tree.appendChild(countryRow);

      for (let ki = 0; ki < cities.length; ki++) {
        const city = cities[ki];
        const isLastCity = ki === cities.length - 1;
        const count = reps[city.name] || 0;
        const cgoal = cityRepsGoal(city.pop);
        const done = count >= cgoal;
        const countryIndent = isLastCountry ? '&nbsp;&nbsp;&nbsp;&nbsp;' : '│&nbsp;&nbsp;&nbsp;';
        const cityPrefix = isLastCity ? '└─' : '├─';

        const cityRow = document.createElement('div');
        cityRow.className = 'rm-row rm-city-row';
        cityRow.innerHTML = `
          <span class="rm-prefix">${phaseIndent}${countryIndent}${cityPrefix}</span>
          <span class="rm-city-rank">${ki + 1}</span>
          <span class="rm-city-name">${city.name}</span>
          <span class="rm-city-pop">(${formatPop(city.pop)})</span>
          <span class="rm-city-reps${done ? ' done' : ''}">${count}/${cgoal} reps</span>`;
        tree.appendChild(cityRow);
      }
    }
  }

  body.appendChild(tree);
}

function openRoadmap() {
  buildRoadmapOverlay();
  document.getElementById('roadmap-overlay').classList.remove('roadmap-hidden');
  document.getElementById('btn-roadmap').classList.add('active');
}

function closeRoadmap() {
  document.getElementById('roadmap-overlay').classList.add('roadmap-hidden');
  document.getElementById('btn-roadmap').classList.remove('active');
}

// ── Build map ──────────────────────────────────────────────────────────────
function buildMap() {
  const container = document.getElementById('map-container');
  const wrap = document.getElementById('map-wrap');
  const W = container.clientWidth;
  const H = container.clientHeight;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 2060 1001');
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
      g.dataset.city = city.name;

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
  document.getElementById('btn-roadmap').addEventListener('click', openRoadmap);
  document.getElementById('roadmap-close').addEventListener('click', closeRoadmap);

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

  document.getElementById('btn-expansion').addEventListener('click', () => {
    expansionMode = !expansionMode;
    document.getElementById('btn-expansion').classList.toggle('active', expansionMode);
    if (expansionMode) {
      deactivateOverlays('expansion');
      setOverlayFills(code => getExpansionColor(code) || DEFAULT_FILL);
      clearLegend();
      refreshExpansionPins();
      const bar = document.getElementById('expansion-bar');
      if (bar) bar.style.display = '';
      updateExpansionHeader();
    } else {
      setOverlayFills(null);
      clearLegend();
      refreshExpansionPins();
      const bar = document.getElementById('expansion-bar');
      if (bar) bar.style.display = 'none';
    }
  });
}

function applyBlockState() {
  const currentOverlay = langMode ? getLangColor : gdpMode ? getGdpColor : popMode ? getPopColor : expansionMode ? (code => getExpansionColor(code) || DEFAULT_FILL) : null;
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
  // city pins: hide/show based on block state, re-apply expansion styling
  document.querySelectorAll('.city-pin').forEach(g => {
    const cc = g.dataset.cc;
    if (!cc) return;
    g.style.display = isBlocked(cc) ? 'none' : '';
    g.classList.toggle('expansion-pin', expansionMode && !!EXPANSION_COUNTRY_PHASE[cc]);
  });
}

// ── Init ───────────────────────────────────────────────────────────────────
buildMap();
initPanZoom();
initControls();

// Set initial viewport
initViewport();

// Build sidebar on load (always visible)
buildExpansionSidebar();

// Auto-activate expansion overlay on load
document.getElementById('btn-expansion').click();

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
