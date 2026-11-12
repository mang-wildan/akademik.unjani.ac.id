const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const css = fs.readFileSync('assets/css/app.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const tokens = Object.fromEntries([...css.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(([, key, value]) => [key, value.trim()]));
const luminance = hex => {
  const rgb = hex.slice(1).match(/../g).map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
};

test('public foundation uses preview ivory, ink and compact surfaces', () => {
  assert.equal(tokens['color-canvas'], '#f4f1ea');
  assert.equal(tokens['color-surface'], '#fbfaf6');
  assert.equal(tokens['color-ink'], '#16181a');
  assert.equal(tokens['color-primary'], '#14532d');
  assert.equal(tokens['radius-control'], '0.25rem');
  assert.equal(tokens['radius-card'], '0.25rem');
  assert.equal(tokens['shadow-raised'], '0 18px 40px 0 rgb(20 83 45 / 0.12)');
  assert.equal(tokens['shadow-cover'], '0 10px 22px 0 rgb(22 24 26 / 0.15)');
  assert.equal(tokens['container-reading'], '45rem');
  assert.equal(tokens['font-serif'], '"Crimson Text", ui-serif, Georgia, "Times New Roman", serif');
  assert.doesNotMatch(css.match(/\.card\s*\{([^}]+)\}/)[1], /shadow-card/);
  assert.doesNotMatch(css, /\.eyebrow::before/);
  // Heading color must inherit the existing dark-band / light-card rules.
  assert.doesNotMatch(css.match(/\.section-title\s*\{([^}]+)\}/)[1], /text-ink/);
  assert.doesNotMatch(css, /--color-(?:info(?:-soft)?|gold-soft|brand-tint)|\.badge-info\b|\.lift\b/);
  for (const dir of ['views/landing', 'views/auth', 'views/components', 'views/layouts']) {
    for (const file of fs.readdirSync(dir).filter(f => f.endsWith('.ejs') && f !== 'admin-v2.ejs')) {
      const source = fs.readFileSync(`${dir}/${file}`, 'utf8').replace(/<%#[\s\S]*?%>/g, '');
      assert.doesNotMatch(source, /dateTone|badge-info|(?:border|bg|text)-info\b|gold-soft|brand-tint|[—–]/, `${dir}/${file}`);
    }
  }
  assert.ok((fs.readFileSync('views/landing/index.ejs', 'utf8').match(/eyebrow|sectionEyebrow/g) || []).length <= 2);
  for (const selector of ['btn', 'link-arrow', 'tab']) {
    assert.match(css.match(new RegExp(`\\.${selector}\\s*\\{([^}]+)\\}`))[1], /\bmin-h-11\b/, `${selector}: 44px target`);
  }
  for (const file of ['cari', 'dokumen-akademik', 'rpl', 'akreditasi']) {
    const source = fs.readFileSync(`views/landing/${file}.ejs`, 'utf8');
    for (const link of source.matchAll(/<a\b[\s\S]*?class="([^"]+)"/g)) {
      assert.match(link[1], /\b(?:min-h-11|btn|link-arrow|tab)\b/, `${file}: standalone link height`);

    }
  }
  const accreditation = fs.readFileSync('views/landing/akreditasi.ejs', 'utf8');
  assert.match(accreditation, /min-h-11 min-w-11[^\"]*\"><%- icon\('download'/);
  assert.match(accreditation, /min-h-11 min-w-11[^\"]*\">Lihat<\/a>/);
  for (const file of ['layouts/public', 'components/page-header', 'landing/akreditasi', 'landing/struktur-organisasi', 'landing/kurikulum']) {
    assert.doesNotMatch(fs.readFileSync(`views/${file}.ejs`, 'utf8'), /min-h-6/, file + ': standalone links need 44px targets');
  }
});

test('public text, status and focus token pairs meet WCAG AA', () => {
  const pairs = [];
  for (const background of ['canvas', 'surface', 'sunken', 'primary-soft']) {
    for (const foreground of ['ink', 'muted', 'primary']) pairs.push([foreground, background, 4.5]);
  }
  pairs.push(['placeholder', 'surface', 4.5], ['control', 'surface', 3], ['control', 'canvas', 3]);
  for (const background of ['primary', 'primary-hover', 'primary-active', 'brand', 'danger', 'ink']) pairs.push(['white', background, 4.5]);
  for (const foreground of ['on-brand-muted', 'on-brand-label']) pairs.push([foreground, 'brand', 4.5]);
  pairs.push(['on-brand-muted', 'primary-hover', 4.5]);
  for (const foreground of ['on-ink', 'on-ink-muted']) pairs.push([foreground, 'ink', 4.5]);
  for (const tone of ['success', 'warning', 'danger']) pairs.push([tone, `${tone}-soft`, 4.5]);
  for (const background of ['canvas', 'surface', 'sunken', 'primary-soft']) {
    for (const foreground of ['success', 'danger']) pairs.push([foreground, background, 4.5]);
  }
  for (const background of ['paper', 'photo', 'white']) {
    for (const foreground of ['ink', 'muted', 'primary']) pairs.push([foreground, background, 4.5]);
  }
  pairs.push(['ink', 'on-ink', 4.5], ['on-ink', 'brand', 4.5]);
  for (const [fg, bg, minimum] of pairs) {
    const values = [fg, bg].map(name => {
      assert.match(tokens[`color-${name}`], /^#[0-9a-f]{6}$/i);
      return luminance(tokens[`color-${name}`]);
    }).sort((a, b) => b - a);
    const ratio = (values[0] + 0.05) / (values[1] + 0.05);
    assert.ok(ratio >= minimum, `${fg}/${bg}: ${ratio.toFixed(2)}:1 < ${minimum}:1`);
  }
});
