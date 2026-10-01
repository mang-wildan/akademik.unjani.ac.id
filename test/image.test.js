const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const sharp = require('sharp');
const { processImage } = require('../utils/image');

test('processImage shrinks a large photo to WebP + thumbnail and removes the original', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'img-'));
  const input = path.join(dir, '1700-foto-kampus.jpg');
  await sharp({ create: { width: 4000, height: 3000, channels: 3, background: '#15803d' } }).jpeg({ quality: 95 }).toFile(input);

  const out = await processImage(input);
  assert.equal(path.basename(out.file), '1700-foto-kampus.webp');
  assert.equal(path.basename(out.thumb), '1700-foto-kampus-thumb.webp');
  assert.equal(out.width, 1600);
  assert.equal(out.height, 1200);
  assert.equal((await sharp(out.thumb).metadata()).width, 400);
  assert.equal(fs.existsSync(input), false);
});

test('processImage never enlarges a small image', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'img-'));
  const input = path.join(dir, 'logo.png');
  await sharp({ create: { width: 240, height: 231, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toFile(input);
  const out = await processImage(input);
  assert.equal(out.width, 240);
  assert.equal((await sharp(out.thumb).metadata()).width, 240);
});
