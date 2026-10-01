// Master data the new forms choose from (SRS FR-M-11). Only missing entries
// are inserted; names edited later in the admin panel are left alone.
const Kategori = require('../../models/Kategori');
const LembagaAkreditasi = require('../../models/LembagaAkreditasi');

const KATEGORI = {
  pengumuman: ['Akademik Umum', 'Perkuliahan', 'Ujian', 'Wisuda', 'Administrasi'],
  dokumen: ['Formulir', 'Pedoman', 'Peraturan', 'Surat Keputusan', 'Surat Edaran'],
};

// Bodies whose names are certain; others (e.g. newer LAMs) are added by the admin.
const LEMBAGA = [
  ['BAN-PT', 'Badan Akreditasi Nasional Perguruan Tinggi'],
  ['LAM-PTKes', 'Lembaga Akreditasi Mandiri Pendidikan Tinggi Kesehatan'],
  ['LAMEMBA', 'Lembaga Akreditasi Mandiri Ekonomi Manajemen Bisnis dan Akuntansi'],
  ['LAM INFOKOM', 'Lembaga Akreditasi Mandiri Informatika dan Komputer'],
  ['LAM Teknik', 'Lembaga Akreditasi Mandiri Teknik'],
  ['LAMDIK', 'Lembaga Akreditasi Mandiri Kependidikan'],
  ['Perpusnas', 'Perpustakaan Nasional Republik Indonesia'],
];

const slugify = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

module.exports = {
  id: '002-master-seed',
  title: 'Data master: kategori pengumuman & dokumen, lembaga akreditasi',
  async run({ apply, log }) {
    let added = 0;
    for (const [jenis, names] of Object.entries(KATEGORI)) {
      for (const [i, nama] of names.entries()) {
        const slug = slugify(nama);
        if (await Kategori.exists({ jenis, slug })) continue;
        log(`kategori ${jenis}: ${nama}`);
        added += 1;
        if (apply) await Kategori.updateOne({ jenis, slug }, { $setOnInsert: { jenis, slug, nama, urutan: i + 1 } }, { upsert: true });
      }
    }
    for (const [i, [singkatan, nama]] of LEMBAGA.entries()) {
      if (await LembagaAkreditasi.exists({ singkatan })) continue;
      log(`lembaga: ${singkatan} — ${nama}`);
      added += 1;
      if (apply) await LembagaAkreditasi.updateOne({ singkatan }, { $setOnInsert: { singkatan, nama, urutan: i + 1 } }, { upsert: true });
    }
    return added ? `${added} entri master ${apply ? 'ditambahkan' : 'akan ditambahkan'}` : 'semua entri master sudah ada';
  },
};
