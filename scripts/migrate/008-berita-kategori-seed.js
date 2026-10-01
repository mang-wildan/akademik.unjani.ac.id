// Kategori master gained a 'berita' jenis in F3 (models/Kategori.js), for the
// Berita list filter (FR-P-01/02) — the List "Kegiatan" page reuses the News
// model under its own categories, separate from Pengumuman's.
const Kategori = require('../../models/Kategori');

const NAMA = ['Akademik', 'Kemahasiswaan', 'Kerja Sama', 'Prestasi', 'Kegiatan Kampus'];
const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

module.exports = {
  id: '008-berita-kategori-seed',
  title: 'Data master: kategori berita',
  async run({ apply, log }) {
    let added = 0;
    for (const [i, nama] of NAMA.entries()) {
      const slug = slugify(nama);
      if (await Kategori.exists({ jenis: 'berita', slug })) continue;
      log(`kategori berita: ${nama}`);
      added += 1;
      if (apply) await Kategori.updateOne({ jenis: 'berita', slug }, { $setOnInsert: { jenis: 'berita', slug, nama, urutan: i + 1 } }, { upsert: true });
    }
    return added ? `${added} kategori berita ${apply ? 'ditambahkan' : 'akan ditambahkan'}` : 'semua kategori berita sudah ada';
  },
};
