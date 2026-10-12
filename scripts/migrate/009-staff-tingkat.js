// Staff.kelompok (pimpinan/staf) diganti Staff.tingkat (F8). Hanya mengisi tingkat yang masih kosong.
// Tingkat ditebak dari awal teks jabatan; bila tak cocok: 'pimpinan' -> 'wakil-rektor' (tebakan), 'staf' -> 'anggota'. Koreksi lewat /admin/staff.
const Staff = require('../../models/Staff');

const PETA = { pimpinan: 'wakil-rektor', staf: 'anggota' };
const DARI_JABATAN = [[/^wakil rektor/i, 'wakil-rektor'], [/^kepala biro/i, 'kepala-biro'], [/^kepala bagian/i, 'kepala-bagian'], [/^kepala urusan/i, 'kepala-urusan']];
const tebak = r => (DARI_JABATAN.find(([re]) => re.test(r.jabatan || '')) || [])[1];

module.exports = {
  id: '009-staff-tingkat',
  title: 'Pimpinan & Staf: kelompok -> tingkat',
  async run({ apply, log, review, backup, db }) {
    const rows = await db.collection(Staff.collection.name).find({ tingkat: { $exists: false } }).toArray();
    if (!rows.length) return 'semua data sudah punya tingkat';
    backup('staff', rows);
    for (const r of rows) {
      const dariJabatan = tebak(r);
      const tingkat = dariJabatan || PETA[r.kelompok] || 'anggota';
      log(`${r.nama} (${r.jabatan}): ${r.kelompok || '(kosong)'} -> ${tingkat}`);
      if (!dariJabatan && tingkat === 'wakil-rektor') review(`${r.nama} (${r.jabatan}) dipetakan ke Wakil Rektor — periksa tingkat yang benar`);
      if (apply) await db.collection(Staff.collection.name).updateOne({ _id: r._id }, { $set: { tingkat }, $unset: { kelompok: '' } });
    }
    return `${rows.length} data ${apply ? 'diperbarui' : 'akan diperbarui'}`;
  },
};
