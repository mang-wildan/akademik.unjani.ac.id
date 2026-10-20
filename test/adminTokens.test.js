// Kontras token warna admin (docs/DESIGN.md §2, SPEC NFR-ADM-01) di mode terang
// dan gelap. Token dibaca dari sumber assets/css/admin.css: blok `@theme static`
// untuk terang, blok `@variant dark` di :root untuk gelap.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

// Komentar dibuang dulu: komentar boleh menyebut `@variant dark` tanpa dianggap blok.
const css = fs
  .readFileSync(path.join(__dirname, '../assets/css/admin.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '');

// Isi blok `{ ... }` yang dibuka tepat setelah `marker`, dengan kurung bersarang.
const blockAfter = marker => {
  const start = css.indexOf(marker);
  if (start === -1) return null;
  const open = css.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === '{') depth += 1;
    if (css[i] === '}') depth -= 1;
    if (depth === 0) return css.slice(open + 1, i);
  }
  return null;
};

const colorTokens = block => {
  const tokens = {};
  for (const [, name, value] of block.matchAll(/--color-([a-z-]+):\s*([^;]+);/g)) tokens[name] = value.trim();
  return tokens;
};

const KEYWORDS = new Set(['white', 'black', 'transparent', 'current']);

const parseColor = value => {
  let m = value.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
  m = value.match(/^rgb\(\s*(\d+)\s+(\d+)\s+(\d+)\s*(?:\/\s*([\d.]+))?\s*\)$/);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
  throw new Error(`Format warna tidak dikenali: ${value}`);
};

// Warna semi-transparan dinilai setelah ditumpuk di atas `surface` tema tersebut.
const over = (fg, bg) => {
  const a = fg[3];
  return [0, 1, 2].map(i => Math.round(fg[i] * a + bg[i] * (1 - a))).concat(1);
};

const luminance = ([r, g, b]) => {
  const lin = c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const light = colorTokens(blockAfter('@theme static') || '');
const darkBlock = blockAfter('@variant dark');
const dark = { ...light, ...colorTokens(darkBlock || '') };
const themes = { terang: light, gelap: dark };

// [teks/elemen, latar, rasio minimum]. 4.5 = teks (WCAG 1.4.3), 3 = komponen UI (1.4.11).
const PAIRS = [
  ['ink', 'canvas', 4.5], ['ink', 'surface', 4.5], ['ink', 'sunken', 4.5],
  ['muted', 'canvas', 4.5], ['muted', 'surface', 4.5], ['muted', 'sunken', 4.5],
  ['placeholder', 'surface', 4.5],
  ['primary', 'canvas', 4.5], ['primary', 'surface', 4.5], ['primary', 'sunken', 4.5],
  ['primary', 'primary-soft', 4.5], ['ink', 'primary-soft', 4.5],
  ['on-primary', 'primary', 4.5], ['on-primary', 'primary-hover', 4.5],
  ['success', 'success-soft', 4.5], ['warning', 'warning-soft', 4.5],
  ['danger', 'danger-soft', 4.5], ['info', 'info-soft', 4.5],
  ['danger', 'surface', 4.5], ['warning', 'surface', 4.5],
  ['white', 'danger-solid', 4.5],
  ['control', 'surface', 3], ['control', 'canvas', 3],
  ['primary', 'surface', 3], // cincin fokus
];

test('admin.css punya blok token terang (@theme static) dan gelap (@variant dark)', () => {
  assert.ok(Object.keys(light).length > 0, 'blok `@theme static` dengan --color-* tidak ditemukan');
  assert.ok(darkBlock, 'blok `@variant dark` tidak ditemukan');
});

test('setiap token warna punya nilai mode gelap', () => {
  const missing = Object.keys(light).filter(name => !KEYWORDS.has(name) && !(name in colorTokens(darkBlock || '')));
  assert.deepEqual(missing, [], `token tanpa nilai gelap: ${missing.join(', ')}`);
});

test('kontras token memenuhi WCAG 2.2 AA di kedua tema', () => {
  const failures = [];
  for (const [themeName, tokens] of Object.entries(themes)) {
    const surface = parseColor(tokens.surface);
    const resolve = name => {
      if (!(name in tokens)) throw new Error(`token --color-${name} tidak ada (${themeName})`);
      const c = parseColor(tokens[name]);
      return c[3] < 1 ? over(c, surface) : c;
    };
    for (const [fg, bg, min] of PAIRS) {
      const background = resolve(bg);
      const foreground = parseColor(tokens[fg]);
      const ratio = contrast(foreground[3] < 1 ? over(foreground, background) : foreground, background);
      if (ratio < min) failures.push(`${themeName}: ${fg} di atas ${bg} = ${ratio.toFixed(2)}:1 (minimum ${min}:1)`);
    }
  }
  assert.deepEqual(failures, []);
});
