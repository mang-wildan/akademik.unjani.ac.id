#!/usr/bin/env node
// Copies third-party frontend assets out of node_modules into the repo, so the
// production server needs neither a build step nor devDependencies.
//   npm run build:assets
// Outputs are committed: public/fonts, public/js/vendor, utils/icons.json.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const NM = path.join(ROOT, 'node_modules');

// Every icon used by views/components. Add a name here, then rebuild.
const ICONS = [
  'add', 'apartment', 'arrow_back', 'arrow_forward', 'article', 'call', 'campaign', 'check', 'check_circle',
  'chevron_left', 'chevron_right', 'close', 'dashboard', 'delete', 'description', 'download', 'edit', 'error',
  'event', 'filter_list', 'groups', 'history', 'home', 'info', 'keep', 'keyboard_arrow_down', 'library_books', 'location_on',
  'logout', 'mail', 'menu', 'menu_book', 'more_vert', 'newspaper', 'notifications', 'open_in_new', 'person',
  'picture_as_pdf', 'schedule', 'school', 'search', 'settings', 'upload', 'verified', 'visibility',
  'warning', 'workspace_premium',
];

const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  console.log(`  ${path.relative(ROOT, to)}`);
};

console.log('Fonts');
const fontDir = path.join(NM, '@fontsource', 'plus-jakarta-sans');
for (const weight of [400, 500, 600, 700]) {
  const file = `plus-jakarta-sans-latin-${weight}-normal.woff2`;
  copy(path.join(fontDir, 'files', file), path.join(ROOT, 'public', 'fonts', 'plus-jakarta-sans', file));
}
copy(path.join(fontDir, 'LICENSE'), path.join(ROOT, 'public', 'fonts', 'plus-jakarta-sans', 'LICENSE'));

console.log('Alpine.js (CSP build)');
copy(path.join(NM, '@alpinejs', 'csp', 'dist', 'cdn.min.js'), path.join(ROOT, 'public', 'js', 'vendor', 'alpine-csp.min.js'));

console.log('Icons');
const iconDir = path.join(NM, '@material-symbols', 'svg-400', 'outlined');
const icons = {};
for (const name of ICONS) {
  const svg = fs.readFileSync(path.join(iconDir, `${name}.svg`), 'utf8');
  icons[name] = [...svg.matchAll(/ d="([^"]+)"/g)].map(m => m[1]).join(' ');
  if (!icons[name]) throw new Error(`No path data in ${name}.svg`);
}
const iconsOut = path.join(ROOT, 'utils', 'icons.json');
fs.writeFileSync(iconsOut, `${JSON.stringify(icons, null, 1)}\n`);
console.log(`  ${path.relative(ROOT, iconsOut)} (${ICONS.length} ikon)`);
