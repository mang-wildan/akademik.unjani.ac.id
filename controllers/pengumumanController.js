// Pola acuan F4 (docs/POLA-ADMIN.md) — logika CRUD ada di adminContentController.js,
// dipakai bersama newsController karena skema Pengumuman dan News identik.
module.exports = require('./adminContentController')({
  Model: require('../models/Pengumuman'),
  jenis: 'pengumuman',
  basePath: 'pengumuman',
  listLabel: 'Pengumuman',
  singularLabel: 'Pengumuman',
});
