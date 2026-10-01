// Read-only: content the new pages (F3) need that only the Bidang Akademik
// team can supply. Changes nothing.
const AcademicCalendar = require('../../models/AcademicCalendar');
const Staff = require('../../models/Staff');
const News = require('../../models/News');
const Pengumuman = require('../../models/Pengumuman');
const AcademicDocument = require('../../models/AcademicDocument');
const SiteSetting = require('../../models/SiteSetting');

module.exports = {
  id: '007-readiness',
  title: 'Kesiapan konten untuk halaman baru (hanya laporan)',
  async run({ log, review }) {
    const calendars = await AcademicCalendar.find({}, 'tahunAjaran events lampiran').lean();
    calendars.forEach(c => {
      const n = (c.events || []).length;
      if (n) log(`kalender ${c.tahunAjaran}: ${n} kegiatan, ${(c.lampiran || []).length} surat edaran`);
      else review(`kalender ${c.tahunAjaran}: belum ada kegiatan — input per kegiatan atau impor CSV (K-04)`);
    });
    if (!calendars.some(c => c.tahunAjaran === '2026/2027')) review('kalender tahun ajaran 2026/2027 (berjalan) belum ada');

    const staff = await Staff.countDocuments();
    if (!staff) review('Pimpinan & Staf kosong — isi data asli (halaman publik menampilkan keadaan kosong)');
    for (const [label, Model] of [['berita', News], ['pengumuman', Pengumuman]]) {
      const published = await Model.countDocuments({ status: 'published' });
      if (published) log(`${label} terbit: ${published}`);
      else review(`belum ada ${label} yang terbit`);
    }
    const docsWithoutCategory = await AcademicDocument.countDocuments({ kategori: { $exists: false } });
    if (docsWithoutCategory) review(`${docsWithoutCategory} dokumen akademik belum punya kategori (dipilih saat form F4 tersedia)`);

    const s = (await SiteSetting.findOne().lean()) || {};
    if (!s.jamLayanan) review('Pengaturan Situs: jam layanan belum diisi (footer memakai teks bawaan)');
    if (!s.landingVideoUrl) log('Pengaturan Situs: URL video profil kosong — bagian video disembunyikan');
    return 'laporan selesai (tidak ada perubahan)';
  },
};
