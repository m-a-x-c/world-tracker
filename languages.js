// Primary language groups and their colors
const LANGUAGE_GROUPS = {
  spanish:    { label: 'Spanish',       color: '#ff3d3d' },
  portuguese: { label: 'Portuguese',    color: '#ff9a00' },
  english:    { label: 'English',       color: '#00cfff' },
  french:     { label: 'French',        color: '#7b5ea7' },
  arabic:     { label: 'Arabic',        color: '#00e676' },
  russian:    { label: 'Russian',       color: '#ff4fa3' },
  chinese:    { label: 'Chinese',       color: '#ffe000' },
  german:     { label: 'German',        color: '#00e5cc' },
  malay:      { label: 'Malay',         color: '#40c4ff' },
  indonesian: { label: 'Indonesian',    color: '#ff6e40' },
  persian:    { label: 'Persian/Dari',  color: '#bf80ff' },
  japanese:   { label: 'Japanese',      color: '#ff80ab' },
  korean:     { label: 'Korean',        color: '#b2ff59' },
  dutch:      { label: 'Dutch',         color: '#ff6d00' },
  italian:    { label: 'Italian',       color: '#69ff47' },
  turkish:    { label: 'Turkish',       color: '#ff1744' },
  hindi:      { label: 'Hindi',         color: '#ff6680' },
  urdu:       { label: 'Urdu',          color: '#f48fb1' },
  bengali:    { label: 'Bengali',       color: '#ffd180' },
  swahili:    { label: 'Swahili',       color: '#18ffb2' },
  vietnamese: { label: 'Vietnamese',    color: '#ea80fc' },
  thai:       { label: 'Thai',          color: '#f4ff81' },
  hausa:      { label: 'Hausa',         color: '#a5d6a7' },
  amharic:    { label: 'Amharic',       color: '#80cbc4' },
  somali:     { label: 'Somali',        color: '#00acc1' },
  zulu:       { label: 'Zulu',          color: '#ce93d8' },
  shona:      { label: 'Shona',         color: '#ffab40' },
  kinyarwanda:{ label: 'Kinyarwanda',   color: '#69f0ae' },
  malagasy:   { label: 'Malagasy',      color: '#ff8a65' },
  tagalog:    { label: 'Tagalog',       color: '#4fc3f7' },
  burmese:    { label: 'Burmese',       color: '#aed581' },
  khmer:      { label: 'Khmer',         color: '#ffca28' },
  nepali:     { label: 'Nepali',        color: '#ef9a9a' },
  sinhala:    { label: 'Sinhala',       color: '#80cbc4' },
  kazakh:     { label: 'Kazakh',        color: '#ffcc02' },
  uzbek:      { label: 'Uzbek',         color: '#a78bfa' },
  azerbaijani:{ label: 'Azerbaijani',   color: '#34d399' },
  greek:      { label: 'Greek',         color: '#60a5fa' },
  hebrew:     { label: 'Hebrew',        color: '#f9a8d4' },
  hungarian:  { label: 'Hungarian',     color: '#fb923c' },
  czech:      { label: 'Czech',         color: '#c084fc' },
  polish:     { label: 'Polish',        color: '#f87171' },
  ukrainian:  { label: 'Ukrainian',     color: '#fbbf24' },
  romanian:   { label: 'Romanian',      color: '#4ade80' },
  swedish:    { label: 'Scandinavian',  color: '#38bdf8' },
  serbian:    { label: 'Serbian/S.Slav',color: '#a3e635' },
  armenian:   { label: 'Armenian',      color: '#f472b6' },
  georgian:   { label: 'Georgian',      color: '#fb7185' },
  mongolian:  { label: 'Mongolian',     color: '#c4b5fd' },
  lao:        { label: 'Lao',           color: '#6ee7b7' },
  sango:      { label: 'Bantu/Central', color: '#fcd34d' },
  akan:       { label: 'Akan',          color: '#86efac' },
  kirundi:    { label: 'Kirundi',       color: '#67e8f9' },
  tigrinya:   { label: 'Tigrinya',      color: '#fda4af' },
  chichewa:   { label: 'Chichewa',      color: '#d9f99d' },
  tswana:     { label: 'Tswana',        color: '#a5b4fc' },
  sesotho:    { label: 'Sesotho',       color: '#fdba74' },
  other:      { label: 'Other',         color: '#90a4ae' },
};

// ISO2 -> language group key (primary spoken language by most people in the country)
const COUNTRY_LANGUAGE = {

  // ── Spanish ──────────────────────────────────────────────────────────────
  MX:'spanish', CO:'spanish', ES:'spanish', AR:'spanish', VE:'spanish',
  PE:'spanish', CL:'spanish', EC:'spanish', GT:'spanish', CU:'spanish',
  BO:'spanish', DO:'spanish', HN:'spanish', PY:'spanish', SV:'spanish',
  NI:'spanish', CR:'spanish', PA:'spanish', UY:'spanish', GQ:'spanish',

  // ── Portuguese ───────────────────────────────────────────────────────────
  BR:'portuguese', PT:'portuguese', AO:'portuguese', MZ:'portuguese',
  GW:'portuguese', CV:'portuguese', ST:'portuguese', TL:'portuguese',

  // ── English ──────────────────────────────────────────────────────────────
  US:'english', GB:'english', AU:'english', NZ:'english', CA:'english',
  IE:'english',
  JM:'english', TT:'english', BB:'english', BS:'english', GY:'english',
  BZ:'english', GD:'english', AG:'english', DM:'english',
  KN:'english', LC:'english', VC:'english',
  SB:'english', WS:'english', TO:'english', KI:'english', MH:'english',
  FM:'english', PW:'english', NR:'english', TV:'english',

  // ── French ───────────────────────────────────────────────────────────────
  FR:'french', MC:'french', LU:'french',
  HT:'french',
  SN:'french', ML:'french', CI:'french', BJ:'french', TG:'french',
  GN:'french', NE:'french', BF:'french', CF:'french',
  GA:'french', CG:'french', CD:'french',
  SC:'french', NC:'french', PF:'french', MU:'french',

  // ── Arabic ───────────────────────────────────────────────────────────────
  SA:'arabic', EG:'arabic', DZ:'arabic', MA:'arabic', LY:'arabic',
  TN:'arabic', SD:'arabic', IQ:'arabic', SY:'arabic', YE:'arabic',
  JO:'arabic', LB:'arabic', AE:'arabic', OM:'arabic', KW:'arabic',
  QA:'arabic', BH:'arabic', PS:'arabic',
  MR:'arabic', TD:'arabic',

  // ── Russian ───────────────────────────────────────────────────────────────
  RU:'russian', BY:'russian',

  // ── Chinese ───────────────────────────────────────────────────────────────
  CN:'chinese', TW:'chinese', 'CN-TW':'chinese', HK:'chinese', MO:'chinese', SG:'chinese',

  // ── German ───────────────────────────────────────────────────────────────
  DE:'german', AT:'german', LI:'german', CH:'german',

  // ── Dutch ────────────────────────────────────────────────────────────────
  NL:'dutch', BE:'dutch', SR:'dutch',

  // ── Italian ───────────────────────────────────────────────────────────────
  IT:'italian', SM:'italian', VA:'italian',

  // ── Turkish ───────────────────────────────────────────────────────────────
  TR:'turkish',

  // ── Malay ────────────────────────────────────────────────────────────────
  MY:'malay', BN:'malay',

  // ── Indonesian ───────────────────────────────────────────────────────────
  ID:'indonesian',

  // ── Persian / Dari ───────────────────────────────────────────────────────
  IR:'persian', AF:'persian', TJ:'persian',

  // ── Japanese ─────────────────────────────────────────────────────────────
  JP:'japanese',

  // ── Korean ───────────────────────────────────────────────────────────────
  KR:'korean', KP:'korean',

  // ── Hindi ────────────────────────────────────────────────────────────────
  IN:'hindi',

  // ── Urdu ─────────────────────────────────────────────────────────────────
  PK:'urdu',

  // ── Bengali ──────────────────────────────────────────────────────────────
  BD:'bengali',

  // ── Nepali ───────────────────────────────────────────────────────────────
  NP:'nepali',

  // ── Sinhala ───────────────────────────────────────────────────────────────
  LK:'sinhala',

  // ── Swahili ──────────────────────────────────────────────────────────────
  TZ:'swahili', KE:'swahili', UG:'swahili',

  // ── Vietnamese ───────────────────────────────────────────────────────────
  VN:'vietnamese',

  // ── Thai ─────────────────────────────────────────────────────────────────
  TH:'thai',

  // ── Tagalog ───────────────────────────────────────────────────────────────
  PH:'tagalog',

  // ── Burmese ───────────────────────────────────────────────────────────────
  MM:'burmese',

  // ── Khmer ────────────────────────────────────────────────────────────────
  KH:'khmer',

  // ── Lao ──────────────────────────────────────────────────────────────────
  LA:'lao',

  // ── Mongolian ─────────────────────────────────────────────────────────────
  MN:'mongolian',

  // ── Hausa ────────────────────────────────────────────────────────────────
  NG:'hausa',

  // ── Amharic ──────────────────────────────────────────────────────────────
  ET:'amharic',

  // ── Somali ───────────────────────────────────────────────────────────────
  SO:'somali', DJ:'somali',

  // ── Zulu ─────────────────────────────────────────────────────────────────
  ZA:'zulu',

  // ── Shona ────────────────────────────────────────────────────────────────
  ZW:'shona',

  // ── Kinyarwanda ──────────────────────────────────────────────────────────
  RW:'kinyarwanda',

  // ── Kirundi ──────────────────────────────────────────────────────────────
  BI:'kirundi',

  // ── Malagasy ─────────────────────────────────────────────────────────────
  MG:'malagasy',

  // ── Tigrinya ─────────────────────────────────────────────────────────────
  ER:'tigrinya',

  // ── Akan (Ghana) ─────────────────────────────────────────────────────────
  GH:'akan',

  // ── Chichewa ─────────────────────────────────────────────────────────────
  MW:'chichewa',

  // ── Tswana ───────────────────────────────────────────────────────────────
  BW:'tswana',

  // ── Sesotho ──────────────────────────────────────────────────────────────
  LS:'sesotho',

  // ── Bantu/Central Africa (Sango, Lingala area) ───────────────────────────
  CM:'sango',   // Cameroon — Fulfulde most spoken natively but French/Sango lingua franca; using sango group
  SS:'sango',   // South Sudan — Dinka most spoken but Juba Arabic/English mix; sango group for central Bantu
  KM:'sango',   // Comoros — Comorian (Bantu-based)

  // ── Namibia ──────────────────────────────────────────────────────────────
  NA:'sango',   // Oshiwambo (Bantu) spoken by ~50%

  // ── Swaziland/Eswatini ────────────────────────────────────────────────────
  SZ:'sesotho', // Swati, closely related to Sesotho/Nguni group

  // ── Zambia ───────────────────────────────────────────────────────────────
  ZM:'chichewa', // Bemba most spoken (~33%) but Nyanja/Chichewa widely used as lingua franca

  // ── Fiji ──────────────────────────────────────────────────────────────────
  FJ:'english', // English is the lingua franca; iTaukei Fijian and Hindi also spoken

  // ── Papua New Guinea ──────────────────────────────────────────────────────
  PG:'english', // Tok Pisin (English creole) is the true national lingua franca

  // ── Sierra Leone / Liberia / Gambia / Guinea-Bissau ──────────────────────
  SL:'english', // Krio (English creole) is lingua franca
  LR:'english', // Liberian English is the true lingua franca
  GM:'english', // English is lingua franca; Mandinka most spoken native

  // ── Central Asia ──────────────────────────────────────────────────────────
  KZ:'kazakh',
  UZ:'uzbek',
  TM:'uzbek',   // Turkmen — same Turkic family, close to Uzbek
  KG:'uzbek',   // Kyrgyz — Turkic, grouped with Uzbek
  AZ:'azerbaijani',

  // ── European languages ────────────────────────────────────────────────────
  PL:'polish',
  UA:'ukrainian',
  RO:'romanian', MD:'romanian',
  HU:'hungarian',
  GR:'greek', CY:'greek',
  CZ:'czech', SK:'czech',   // Slovak and Czech are mutually intelligible
  SE:'swedish', NO:'swedish', DK:'swedish', IS:'swedish', FI:'swedish',
  // South Slavic
  RS:'serbian', BA:'serbian', ME:'serbian', MK:'serbian',
  HR:'serbian', SI:'serbian',
  // Other European
  BG:'ukrainian', // Bulgarian — South Slavic like Ukrainian; close enough to group
  LT:'polish',    // Lithuanian — Baltic, grouped with Polish (both East European)
  LV:'polish',    // Latvian — Baltic
  EE:'hungarian', // Estonian — Finno-Ugric like Hungarian
  AL:'armenian',  // Albanian — unique but grouped with Armenian (both Caucasus/Balkan isolates)
  XK:'serbian',   // Kosovo — Albanian/Serbian
  IL:'hebrew',
  AM:'armenian',
  GE:'georgian',
  MT:'arabic',    // Maltese is a Semitic language derived from Arabic
  BT:'nepali',    // Dzongkha — Tibeto-Burman, grouped with Nepali
  MV:'sinhala',   // Dhivehi is related to Sinhala
  TL:'portuguese',// Timor-Leste — Tetum + Portuguese co-official, Portuguese dominant in formal use
};
