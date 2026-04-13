// ── Expansion phases ────────────────────────────────────────────────────────
const EXPANSION_PHASES = [
  {
    id: 1,
    label: 'Phase 1 — Spanish LatAm',
    color: '#00e676',
    countries: ['CO', 'MX', 'AR', 'VE', 'PE', 'CL', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'],
  },
  {
    id: 2,
    label: 'Phase 2 — Arabic',
    color: '#ffab40',
    countries: ['SA', 'EG', 'DZ', 'MA', 'LY', 'TN', 'SD', 'IQ', 'SY', 'YE', 'JO', 'LB', 'OM', 'KW', 'QA', 'BH'],
  },
  {
    id: 3,
    label: 'Phase 3 — Indonesia',
    color: '#ff6e40',
    countries: ['ID'],
  },
  {
    id: 4,
    label: 'Phase 4 — China',
    color: '#ffe000',
    countries: ['CN'],
  },
  {
    id: 5,
    label: 'Phase 5 — Brazil',
    color: '#ff9a00',
    countries: ['BR'],
  },
  {
    id: 6,
    label: 'Phase 6 — South Asia',
    color: '#ea80fc',
    countries: ['IN', 'PK', 'BD', 'NP', 'LK'],
  },
  {
    id: 7,
    label: 'Phase 7 — Southeast Asia',
    color: '#40c4ff',
    countries: ['VN', 'TH', 'KH', 'LA', 'MM', 'MY', 'PH'],
  },
  {
    id: 8,
    label: 'Phase 8 — Russia & Central Asia',
    color: '#ff4fa3',
    countries: ['RU', 'KZ', 'UZ', 'TM', 'KG', 'TJ', 'MN'],
  },
  {
    id: 9,
    label: 'Phase 9 — Iran, Turkey & Caucasus',
    color: '#bf80ff',
    countries: ['IR', 'TR', 'GE', 'AM', 'AZ'],
  },
  {
    id: 10,
    label: 'Phase 10 — English Africa',
    color: '#ffd180',
    countries: ['NG', 'KE', 'ZA', 'GH', 'TZ', 'UG', 'ZW', 'ZM'],
  },
  {
    id: 11,
    label: 'Phase 11 — Ethiopia',
    color: '#a5d6a7',
    countries: ['ET'],
  },
  {
    id: 13,
    label: 'Phase 13 — Remaining Europe',
    color: '#80cbc4',
    countries: ['UA', 'MD', 'AL', 'XK', 'BA', 'RS', 'ME', 'MK', 'BG', 'RO', 'BY'],
  },
  {
    id: 12,
    label: 'Phase 12 — Francophone Africa',
    color: '#f9a8d4',
    countries: ['SN', 'ML', 'CI', 'BJ', 'TG', 'GN', 'NE', 'BF', 'CF', 'GA', 'CG', 'CD', 'CM', 'MG', 'MU', 'SC'],
  },
];

// Status options for each country
const EXPANSION_STATUSES = ['Planned', 'Active', 'Launched'];

// City selection: all cities >= 500k pop, minimum 5 per country
const EXPANSION_POP_THRESHOLD = 500000;
const EXPANSION_MIN_CITIES = 5;
const EXPANSION_REPS_PER_CITY = 10;

// Build a flat lookup: code -> phase
const EXPANSION_COUNTRY_PHASE = {};
for (const phase of EXPANSION_PHASES) {
  for (const cc of phase.countries) {
    EXPANSION_COUNTRY_PHASE[cc] = phase;
  }
}

// Compute target cities for a country from CITIES data
function getTargetCities(cc) {
  const cities = (typeof CITIES !== 'undefined' && CITIES[cc]) || [];
  const over = cities.filter(c => c.pop >= EXPANSION_POP_THRESHOLD);
  if (over.length >= EXPANSION_MIN_CITIES) return over;
  return cities.slice(0, EXPANSION_MIN_CITIES);
}

// ── Persistent state (localStorage) ─────────────────────────────────────────
const EXPANSION_STORAGE_KEY = 'expansion_state';

function loadExpansionState() {
  try {
    const raw = localStorage.getItem(EXPANSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
}

function saveExpansionState(state) {
  localStorage.setItem(EXPANSION_STORAGE_KEY, JSON.stringify(state));
}

// state shape: { [cc]: { status: 'Planned'|'Active'|'Launched', reps: { [cityName]: number } } }
let expansionState = loadExpansionState();

function getCountryExpansionState(cc) {
  if (!expansionState[cc]) {
    expansionState[cc] = { status: 'Planned', reps: {} };
  }
  return expansionState[cc];
}

function setCountryStatus(cc, status) {
  getCountryExpansionState(cc).status = status;
  saveExpansionState(expansionState);
}

function setCityReps(cc, cityName, count) {
  const s = getCountryExpansionState(cc);
  s.reps[cityName] = Math.max(0, count);
  saveExpansionState(expansionState);
}

// ── Totals ────────────────────────────────────────────────────────────────────
function getExpansionTotals() {
  let totalCities = 0;
  let totalRepsGoal = 0;
  let totalRepsActual = 0;

  for (const cc of Object.keys(EXPANSION_COUNTRY_PHASE)) {
    const cities = getTargetCities(cc);
    totalCities += cities.length;
    totalRepsGoal += cities.length * EXPANSION_REPS_PER_CITY;
    const s = expansionState[cc];
    if (s && s.reps) {
      for (const r of Object.values(s.reps)) totalRepsActual += r;
    }
  }
  return { totalCities, totalRepsGoal, totalRepsActual };
}
