// Content hash for public/css/app.css and public/js/app.js (NFR-P-05-ish /
// F5 "nama file dengan hash untuk CSS/JS"). The files keep their path --
// renaming them would mean updating every <link>/<script> tag and every
// deploy step -- a query string (?v=<hash>) is enough to bust the browser
// cache on deploy while the underlying file stays long-lived+immutable.
// Run after build:css and build:assets (see package.json "build" script).
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const TARGETS = ['css/app.css', 'js/app.js'];

const hashOf = filePath => crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex').slice(0, 10);

const manifest = {};
for (const rel of TARGETS) {
  const abs = path.join(PUBLIC_DIR, rel);
  if (!fs.existsSync(abs)) {
    console.warn(`build-manifest: ${rel} tidak ditemukan, dilewati.`);
    continue;
  }
  manifest[`/${rel}`] = hashOf(abs);
}

fs.writeFileSync(path.join(PUBLIC_DIR, 'asset-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('asset-manifest.json ditulis:', manifest);
