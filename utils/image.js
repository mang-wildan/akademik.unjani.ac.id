// Uploaded images → WebP at a sensible size, plus a thumbnail for lists and
// admin tables (SRS NFR-P-04). Used by the F4 upload handlers.
const fs = require('fs/promises');
const path = require('path');
const sharp = require('sharp');

const MAX_WIDTH = 1600;
const THUMB_WIDTH = 400;
const QUALITY = 80;

// processImage('/…/uploads/news/1700-foto.jpg')
//   → { file: '/…/1700-foto.webp', thumb: '/…/1700-foto-thumb.webp', width, height, size, thumbSize }
// The original is removed once the WebP copies exist.
const processImage = async (inputPath, { maxWidth = MAX_WIDTH, thumbWidth = THUMB_WIDTH } = {}) => {
  const { dir, name } = path.parse(inputPath);
  const file = path.join(dir, `${name}.webp`);
  const thumb = path.join(dir, `${name}-thumb.webp`);
  const source = await fs.readFile(inputPath); // read first: output may share the input's name

  const main = await sharp(source)
    .rotate() // honour EXIF orientation from phone photos
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(file);
  const small = await sharp(source)
    .rotate()
    .resize({ width: thumbWidth, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(thumb);

  if (path.resolve(inputPath) !== path.resolve(file)) await fs.unlink(inputPath).catch(() => {});
  return { file, thumb, width: main.width, height: main.height, size: main.size, thumbSize: small.size };
};

module.exports = { processImage, MAX_WIDTH, THUMB_WIDTH };
