// Appends ?v=<contenthash> to versioned static paths (public/asset-manifest.json,
// written by scripts/build-manifest.js) so app.css/app.js can be served with
// a long, immutable Cache-Control header while still busting the browser
// cache the moment a deploy changes their content.
const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '..', 'public', 'asset-manifest.json');

let manifest = {};
try {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
} catch (_err) {
  // Missing in dev if build-manifest hasn't run yet; assetUrl() just
  // returns the plain path, which still works (only loses long caching).
}

const assetUrl = relPath => (manifest[relPath] ? `${relPath}?v=${manifest[relPath]}` : relPath);

module.exports = { assetUrl };
