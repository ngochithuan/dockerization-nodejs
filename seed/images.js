// Generates original vector product images (3 per product) — no third-party photos are used.
// 1) studio shot on a light gradient, 2) dark "showcase" shot, 3) spec sheet card.

const BRAND_COLORS = {
  ASUS: '#2457f5',
  Dell: '#0b7bd3',
  Lenovo: '#e2382f',
  HP: '#0096d6',
  Apple: '#56627a',
  Acer: '#43a047',
  MSI: '#d32f2f',
  Gigabyte: '#f57c00',
  Samsung: '#1428a0',
  LG: '#a50034',
  AOC: '#e53935',
  ViewSonic: '#6b3fd4',
  Intel: '#0071c5',
  AMD: '#ed1c24',
  Sapphire: '#1565c0',
  PowerColor: '#c62828',
  Zotac: '#f9a825',
  Kingston: '#c8102e',
  Corsair: '#f2c200',
  'G.Skill': '#b71c1c',
  TeamGroup: '#e64a19',
  Crucial: '#0277bd',
  ADATA: '#c62828',
  WD: '#5b6dcd',
  Seagate: '#2e7d32',
  ASRock: '#455a64',
  'Cooler Master': '#7b1fa2',
  Seasonic: '#37474f',
  NZXT: '#6b3fd4',
  Thermaltake: '#00838f',
  'be quiet!': '#ef6c00',
  'Lian Li': '#263238',
  'Fractal Design': '#5d4037',
  Montech: '#00897b',
  Phanteks: '#3949ab',
  Deepcool: '#039be5',
};

const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );

// ----- device illustrations (centered around 400,400, roughly 520px wide) -----
const fan = (cx, cy, r, accent) => `
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#0f1726" stroke="#2a3550" stroke-width="4"/>
  ${[0, 72, 144, 216, 288].map((a) => `<path d="M${cx} ${cy} q ${r * 0.55} ${-r * 0.2} ${r * 0.8} ${-r * 0.65}" stroke="${accent}" stroke-opacity=".55" stroke-width="${r * 0.18}" fill="none" stroke-linecap="round" transform="rotate(${a} ${cx} ${cy})"/>`).join('')}
  <circle cx="${cx}" cy="${cy}" r="${r * 0.22}" fill="#1c2638" stroke="${accent}" stroke-width="3"/>`;

const DRAW = {
  laptop: (a) => `
    <rect x="170" y="190" width="460" height="300" rx="18" fill="#151e30"/>
    <rect x="186" y="206" width="428" height="268" rx="8" fill="url(#screen)"/>
    <path d="M200 440 l80 -90 l60 50 l90 -110 l170 150z" fill="#fff" fill-opacity=".14"/>
    <path d="M120 500 h560 l-40 46 h-480z" fill="#c9d0dc"/>
    <rect x="340" y="500" width="120" height="10" rx="5" fill="#9aa3b5"/>
    <rect x="186" y="206" width="428" height="6" fill="${a}"/>`,
  'desktop-pc': (a) => `
    <rect x="120" y="230" width="330" height="230" rx="14" fill="#151e30"/>
    <rect x="134" y="244" width="302" height="190" rx="6" fill="url(#screen)"/>
    <rect x="265" y="460" width="40" height="50" fill="#9aa3b5"/><rect x="215" y="505" width="140" height="14" rx="7" fill="#c9d0dc"/>
    <rect x="490" y="200" width="190" height="330" rx="16" fill="#151e30"/>
    <rect x="505" y="215" width="160" height="300" rx="8" fill="#0f1726" stroke="${a}" stroke-opacity=".6" stroke-width="3"/>
    ${fan(585, 300, 46, a)}${fan(585, 420, 46, a)}
    <rect x="510" y="505" width="150" height="6" rx="3" fill="${a}"/>`,
  monitor: (a) => `
    <rect x="130" y="170" width="540" height="330" rx="16" fill="#151e30"/>
    <rect x="146" y="186" width="508" height="290" rx="6" fill="url(#screen)"/>
    <path d="M146 476 l140 -150 l90 80 l120 -140 l158 210z" fill="#fff" fill-opacity=".14"/>
    <rect x="370" y="500" width="60" height="70" fill="#9aa3b5"/>
    <rect x="280" y="566" width="240" height="18" rx="9" fill="#c9d0dc"/>
    <rect x="146" y="470" width="508" height="6" fill="${a}"/>`,
  cpu: (a) => `
    ${Array.from({ length: 11 }, (_, i) => `<rect x="${215 + i * 34}" y="180" width="10" height="40" rx="3" fill="#d4a63a"/><rect x="${215 + i * 34}" y="580" width="10" height="40" rx="3" fill="#d4a63a"/><rect x="180" y="${215 + i * 34}" width="40" height="10" rx="3" fill="#d4a63a"/><rect x="580" y="${215 + i * 34}" width="40" height="10" rx="3" fill="#d4a63a"/>`).join('')}
    <rect x="210" y="210" width="380" height="380" rx="26" fill="#2a7a3a"/>
    <rect x="250" y="250" width="300" height="300" rx="18" fill="url(#metal)" stroke="#9aa3b5" stroke-width="3"/>
    <rect x="290" y="380" width="220" height="8" rx="4" fill="${a}"/>`,
  gpu: (a) => `
    <rect x="100" y="250" width="600" height="250" rx="22" fill="#151e30"/>
    <rect x="112" y="262" width="576" height="226" rx="14" fill="#1c2638" stroke="${a}" stroke-opacity=".5" stroke-width="3"/>
    ${fan(235, 375, 88, a)}${fan(420, 375, 88, a)}${fan(605, 375, 72, a)}
    <rect x="160" y="500" width="300" height="22" fill="#d4a63a"/>
    ${Array.from({ length: 18 }, (_, i) => `<rect x="${166 + i * 16}" y="503" width="8" height="16" fill="#b38a2a"/>`).join('')}
    <rect x="112" y="262" width="576" height="8" rx="4" fill="${a}"/>`,
  ram: (a) => `
    ${[0, 1]
      .map(
        (k) => `
      <g transform="translate(0 ${k * 150})">
        <rect x="110" y="250" width="580" height="110" rx="10" fill="#151e30"/>
        <rect x="120" y="230" width="560" height="40" rx="10" fill="${a}" fill-opacity=".85"/>
        <rect x="130" y="270" width="540" height="70" rx="6" fill="url(#metal)"/>
        ${Array.from({ length: 40 }, (_, i) => `<rect x="${125 + i * 14}" y="360" width="8" height="16" fill="#d4a63a"/>`).join('')}
      </g>`,
      )
      .join('')}`,
  storage: (a, p) =>
    p.kind === 'hdd'
      ? `<rect x="200" y="160" width="400" height="480" rx="24" fill="url(#metal)" stroke="#9aa3b5" stroke-width="4"/>
         <circle cx="400" cy="360" r="150" fill="#d9dee7" stroke="#b4bccb" stroke-width="6"/><circle cx="400" cy="360" r="40" fill="#9aa3b5"/>
         <path d="M520 560 L420 380" stroke="#3b4760" stroke-width="16" stroke-linecap="round"/>
         <rect x="230" y="580" width="340" height="30" rx="8" fill="${a}"/>`
      : p.kind === 'ssd25'
        ? `<rect x="210" y="180" width="380" height="440" rx="26" fill="#151e30"/>
           <rect x="240" y="220" width="320" height="220" rx="12" fill="${a}"/>
           <text x="400" y="345" text-anchor="middle" font-size="64" font-weight="800" fill="#fff" font-family="Segoe UI, Arial, sans-serif">SSD</text>
           <rect x="240" y="470" width="320" height="16" rx="8" fill="#2a3550"/><rect x="240" y="500" width="220" height="16" rx="8" fill="#2a3550"/>`
        : `<rect x="110" y="320" width="580" height="160" rx="14" fill="#0e3b2a"/>
           <rect x="150" y="345" width="150" height="110" rx="8" fill="#151e30"/><rect x="320" y="345" width="150" height="110" rx="8" fill="#151e30"/>
           <rect x="490" y="355" width="110" height="90" rx="8" fill="#2a3550"/>
           <rect x="150" y="345" width="320" height="16" rx="6" fill="${a}"/>
           <rect x="620" y="352" width="70" height="96" fill="#d4a63a"/>
           <circle cx="135" cy="400" r="14" fill="#f6f8fb" stroke="#9aa3b5" stroke-width="3"/>`,
  mainboard: (a) => `
    <rect x="160" y="140" width="480" height="520" rx="16" fill="#151e30"/>
    <rect x="250" y="200" width="150" height="150" rx="10" fill="url(#metal)" stroke="${a}" stroke-width="4"/>
    ${[0, 1, 2, 3].map((i) => `<rect x="${440 + i * 26}" y="190" width="14" height="200" rx="4" fill="#3b4760"/>`).join('')}
    <rect x="180" y="190" width="50" height="180" rx="8" fill="#2a3550"/>
    ${[0, 1, 2].map((i) => `<rect x="200" y="${430 + i * 70}" width="360" height="18" rx="6" fill="${i === 0 ? a : '#3b4760'}"/>`).join('')}
    <rect x="480" y="560" width="120" height="70" rx="10" fill="#2a3550"/>
    <circle cx="540" cy="595" r="18" fill="${a}" fill-opacity=".7"/>`,
  psu: (a) => `
    <rect x="170" y="210" width="460" height="330" rx="22" fill="#151e30"/>
    ${fan(400, 375, 130, a)}
    ${Array.from({ length: 9 }, (_, i) => `<line x1="${290 + i * 28}" y1="255" x2="${290 + i * 28}" y2="495" stroke="#2a3550" stroke-width="3"/>`).join('')}
    <rect x="170" y="520" width="460" height="20" rx="10" fill="${a}"/>
    <path d="M630 300 q 80 0 80 90 t 60 90" stroke="#3b4760" stroke-width="18" fill="none" stroke-linecap="round"/>`,
  'pc-case': (a) => `
    <rect x="230" y="130" width="340" height="540" rx="22" fill="#151e30"/>
    <rect x="250" y="150" width="240" height="500" rx="12" fill="#0f1726" stroke="#3b4760" stroke-width="3"/>
    <rect x="250" y="150" width="240" height="500" rx="12" fill="url(#glass)"/>
    ${fan(370, 260, 52, a)}${fan(370, 400, 52, a)}${fan(370, 540, 52, a)}
    <rect x="505" y="150" width="50" height="500" rx="10" fill="#1c2638"/>
    <circle cx="530" cy="185" r="10" fill="${a}"/>
    <rect x="236" y="658" width="40" height="14" rx="4" fill="#3b4760"/><rect x="524" y="658" width="40" height="14" rx="4" fill="#3b4760"/>`,
};

function defs(accent) {
  return `<defs>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="#0b1220"/></linearGradient>
    <linearGradient id="metal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#eef1f6"/><stop offset="1" stop-color="#b4bccb"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".12"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="${accent}" stop-opacity=".18"/></linearGradient>
    <radialGradient id="glow" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="${accent}" stop-opacity=".55"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
  </defs>`;
}

const FONT = `font-family="Segoe UI, Roboto, Arial, sans-serif"`;
const wrap = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${body}</svg>`;

function shortName(p) {
  return p.name.length > 34 ? `${p.name.slice(0, 33)}…` : p.name;
}

export function productImages(category, p) {
  const accent = BRAND_COLORS[p.brand] || '#2457f5';
  const art = DRAW[category](accent, p);

  const studio = wrap(`${defs(accent)}
    <rect width="800" height="800" fill="#f6f8fb"/>
    <circle cx="400" cy="420" r="330" fill="${accent}" fill-opacity=".07"/>
    <ellipse cx="400" cy="660" rx="260" ry="22" fill="#0b1220" fill-opacity=".08"/>
    ${art}
    <text x="48" y="78" ${FONT} font-size="30" font-weight="800" fill="${accent}">${esc(p.brand.toUpperCase())}</text>
    <text x="48" y="740" ${FONT} font-size="28" font-weight="600" fill="#243049">${esc(shortName(p))}</text>`);

  const showcase = wrap(`${defs(accent)}
    <rect width="800" height="800" fill="#0b1220"/>
    <rect width="800" height="800" fill="url(#glow)"/>
    <g opacity=".08">${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="800" stroke="#fff"/><line x1="0" y1="${i * 40}" x2="800" y2="${i * 40}" stroke="#fff"/>`).join('')}</g>
    <g transform="rotate(-8 400 400) translate(400 410) scale(1.05) translate(-400 -400)">${art}</g>
    <text x="48" y="740" ${FONT} font-size="26" font-weight="700" fill="#fff" fill-opacity=".9">${esc(p.brand)}</text>
    <text x="752" y="740" text-anchor="end" ${FONT} font-size="22" fill="${accent}" font-weight="700">CIRCUIT</text>`);

  const rows = Object.entries(p.specs).slice(0, 5);
  const specCard = wrap(`${defs(accent)}
    <rect width="800" height="800" fill="#ffffff"/>
    <rect x="0" y="0" width="800" height="220" fill="#0b1220"/>
    <rect x="0" y="214" width="800" height="6" fill="${accent}"/>
    <text x="56" y="100" ${FONT} font-size="30" font-weight="800" fill="${accent}">${esc(p.brand.toUpperCase())}</text>
    <text x="56" y="160" ${FONT} font-size="34" font-weight="700" fill="#fff">${esc(shortName(p))}</text>
    <g transform="translate(560 40) scale(0.26)">${art}</g>
    ${rows
      .map(
        ([k, val], i) => `
      <rect x="56" y="${270 + i * 96}" width="688" height="80" rx="14" fill="${i % 2 ? '#ffffff' : '#f6f8fb'}" stroke="#e5e9f0"/>
      <text x="84" y="${318 + i * 96}" ${FONT} font-size="22" fill="#7d879b">${esc(k)}</text>
      <text x="716" y="${318 + i * 96}" text-anchor="end" ${FONT} font-size="24" font-weight="700" fill="#0b1220">${esc(val.length > 30 ? `${val.slice(0, 29)}…` : val)}</text>`,
      )
      .join('')}`);

  return [studio, showcase, specCard];
}
