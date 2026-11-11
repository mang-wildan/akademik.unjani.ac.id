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

test('public foundation uses ivory, warm ink and flat compact surfaces', () => {
  assert.equal(tokens['color-canvas'], '#faf8f3');
  assert.equal(tokens['color-ink'], '#1a2e22');
  assert.equal(tokens['radius-control'], '0.375rem');
  assert.equal(tokens['radius-card'], '0.5rem');
  assert.equal(tokens['shadow-card'], 'none');
  assert.doesNotMatch(css.match(/\.card\s*\{([^}]+)\}/)[1], /shadow-card/);
  assert.doesNotMatch(css, /\.eyebrow::before/);
  // Heading color must inherit the existing dark-band / light-card rules.
  assert.doesNotMatch(css.match(/\.section-title\s*\{([^}]+)\}/)[1], /text-ink/);
});

test('public text, status and focus token pairs meet WCAG AA', () => {
  const pairs = [];
  for (const background of ['canvas', 'surface', 'sunken', 'primary-soft', 'brand-tint']) {
    for (const foreground of ['ink', 'muted', 'primary']) pairs.push([foreground, background, 4.5]);
  }
  pairs.push(['placeholder', 'surface', 4.5], ['control', 'surface', 3], ['control', 'canvas', 3]);
  for (const background of ['primary', 'primary-hover', 'primary-active', 'brand', 'danger-solid']) pairs.push(['white', background, 4.5]);
  for (const foreground of ['on-dark-muted', 'on-dark-accent']) pairs.push([foreground, 'brand', 4.5]);
  for (const tone of ['success', 'warning', 'danger', 'info', 'gold']) pairs.push([tone, `${tone}-soft`, 4.5]);
  for (const [fg, bg, minimum] of pairs) {
    const values = [fg, bg].map(name => {
      assert.match(tokens[`color-${name}`], /^#[0-9a-f]{6}$/i);
      return luminance(tokens[`color-${name}`]);
    }).sort((a, b) => b - a);
    const ratio = (values[0] + 0.05) / (values[1] + 0.05);
    assert.ok(ratio >= minimum, `${fg}/${bg}: ${ratio.toFixed(2)}:1 < ${minimum}:1`);
  }
});
