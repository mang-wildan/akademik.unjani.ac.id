// Pola acuan F4 (docs/POLA-ADMIN.md) — logika CRUD ada di adminContentController.js,
// dipakai bersama pengumumanController karena skema News dan Pengumuman identik.
// Beda dengan Pengumuman: FR-M-02 mewajibkan gambar sampul saat status Terbit.
module.exports = require('./adminContentController')({
  Model: require('../models/News'),
  jenis: 'berita',
  basePath: 'news',
  listLabel: 'Berita',
  singularLabel: 'Berita',
  requireFeaturedImageOnPublish: true,
});
