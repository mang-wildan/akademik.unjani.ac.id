// Basis pengetahuan Asisten Akademik: potongan teks dari konten PUBLIK situs
// (pengumuman, berita, kalender, dokumen, kurikulum, program studi, akreditasi,
// unit kerja, profil, kontak). Tidak ada data akun, staf, atau isi body berita
// (bisa ratusan KB). Di-cache beberapa menit: korpusnya kecil, jadi tidak perlu
// vector database; chat.selectItems memilih potongan yang relevan per pertanyaan.
const SiteSetting = require('./siteSettingCache');
const AcademicProfile = require('../models/AcademicProfile');
const AcademicCalendar = require('../models/AcademicCalendar');
const AcademicDocument = require('../models/AcademicDocument');
const Accreditation = require('../models/Accreditation');
const Kurikulum = require('../models/Kurikulum');
const News = require('../models/News');
const Pengumuman = require('../models/Pengumuman');
const ProgramStudi = require('../models/ProgramStudi');
const RplDocument = require('../models/RplDocument');
const Unit = require('../models/Unit');
require('../models/Faculty');
require('../models/LembagaAkreditasi');
const { formatTanggal, formatRentangTanggal } = require('./format');
const { SEMESTER, calendarEventStatus, byStart } = require('./calendar');
const { accreditationStatus, JENIS } = require('./accreditation');

const TTL_MS = 5 * 60 * 1000;
const RECENT = 40;

const clip = (text, max) => {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
};

const internal = (url, fallback) => (typeof url === 'string' && /^\/(?!\/)/.test(url) ? url : fallback);

const kontakItem = setting => {
  const s = setting || {};
  const rows = [
    `Email: ${s.kontakEmail || 'akademik@unjani.ac.id'}`,
    `Telepon/WhatsApp: ${s.kontakTelepon || '+62 (022) 6656190'}`,
    `Alamat: ${s.alamat || 'Jl. Terusan Jend. Sudirman, Cibeber, Cimahi Selatan, Kota Cimahi, Jawa Barat'}`,
    `Jam layanan: ${s.jamLayanan || 'Senin–Jumat, 08.00–15.30 WIB'}`,
  ];
  return { jenis: 'Kontak', judul: 'Kontak dan jam layanan Bidang Akademik UNJANI', teks: rows.join('\n'), url: '/', core: true };
};

const profilItem = profile =>
  profile
    ? {
        jenis: 'Profil',
        judul: 'Profil Bidang Akademik UNJANI',
        teks: clip(`${profile.ringkasan || ''} Visi: ${profile.visi || ''}`, 1200),
        url: '/profil',
        core: true,
      }
    : null;

const kalenderItems = calendars =>
  calendars.flatMap(cal => {
    const events = [...(cal.events || [])].sort(byStart);
    return SEMESTER.map(sem => {
      const rows = events
        .filter(e => e.semester === sem.value)
        .map(e => `- ${e.nama}: ${formatRentangTanggal(e.mulai, e.selesai)} (${calendarEventStatus(e.mulai, e.selesai).label})`);
      if (!rows.length) return null;
      return {
        jenis: 'Kalender akademik',
        judul: `Kalender Akademik ${cal.tahunAjaran} - ${sem.label}`,
        teks: rows.join('\n'),
        url: '/kalender-akademik',
      };
    }).filter(Boolean);
  });

const kontenItems = (rows, jenis, base) =>
  rows.map(row => ({
    jenis,
    judul: row.title,
    teks: clip(row.excerpt, 400),
    tanggal: formatTanggal(row.createdAt),
    url: `${base}/${row.slug}`,
  }));

const prodiItem = prodi => {
  const perFakultas = new Map();
  for (const p of prodi) {
    const fak = (p.fakultas && p.fakultas.nama) || 'Fakultas lain';
    if (!perFakultas.has(fak)) perFakultas.set(fak, []);
    perFakultas.get(fak).push(p.nama);
  }
  if (!perFakultas.size) return null;
  const rows = [...perFakultas].map(([fak, list]) => `${fak}: ${list.join(', ')}`);
  return { jenis: 'Program studi', judul: 'Daftar fakultas dan program studi UNJANI', teks: rows.join('\n'), url: '/kurikulum' };
};

const akreditasiItems = (rows, now = new Date()) => {
  const line = (a, nama) => {
    const status = accreditationStatus(a.berlakuSampai, now);
    const lembaga = (a.lembaga && (a.lembaga.singkatan || a.lembaga.nama)) || 'lembaga akreditasi';
    return `- ${nama}: ${a.peringkat || 'peringkat belum diisi'} (${lembaga}), berlaku sampai ${formatTanggal(a.berlakuSampai, { long: true })} - ${status.label}`;
  };
  const items = [];
  const institusi = rows.filter(a => a.jenis === JENIS.INSTITUSI);
  if (institusi.length) {
    items.push({ jenis: 'Akreditasi', judul: 'Akreditasi institusi UNJANI', teks: institusi.map(a => line(a, 'Institusi')).join('\n'), url: '/akreditasi' });
  }
  // Rows arrive newest-first: the first certificate per prodi wins.
  const newest = new Map();
  for (const a of rows.filter(r => r.jenis === JENIS.PRODI && r.programStudi && r.programStudi.nama)) {
    const key = String(a.programStudi._id);
    if (!newest.has(key)) newest.set(key, a);
  }
  if (newest.size) {
    items.push({ jenis: 'Akreditasi', judul: 'Akreditasi program studi UNJANI', teks: [...newest.values()].map(a => line(a, a.programStudi.nama)).join('\n'), url: '/akreditasi' });
  }
  return items;
};

const build = async () => {
  const [setting, profile, calendars, pengumuman, berita, dokumen, kurikulum, prodi, akreditasi, unit, rpl] = await Promise.all([
    SiteSetting.get(),
    AcademicProfile.findOne().lean(),
    AcademicCalendar.find().sort({ tahunAjaran: -1 }).limit(2).lean(),
    Pengumuman.find({ status: 'published' }, 'title slug excerpt createdAt').sort({ pinned: -1, createdAt: -1 }).limit(RECENT).lean(),
    News.find({ status: 'published' }, 'title slug excerpt createdAt').sort({ pinned: -1, createdAt: -1 }).limit(RECENT).lean(),
    AcademicDocument.find({}, 'name keterangan file').sort({ createdAt: -1 }).limit(RECENT).lean(),
    Kurikulum.find({}, 'nama programStudi fakultas tahun file').sort({ createdAt: -1 }).limit(RECENT).lean(),
    ProgramStudi.find({}, 'nama fakultas').populate('fakultas', 'nama').sort({ nama: 1 }).lean(),
    Accreditation.find({}, 'jenis peringkat berlakuSampai programStudi lembaga').populate('lembaga', 'singkatan nama').populate('programStudi', 'nama').sort({ berlakuSampai: -1 }).limit(120).lean(),
    Unit.find({}, 'nama deskripsi').sort({ createdAt: -1 }).lean(),
    RplDocument.find({ status: true }, 'judul tahun deskripsi file').sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return [
    kontakItem(setting),
    profilItem(profile),
    ...kalenderItems(calendars),
    ...kontenItems(pengumuman, 'Pengumuman', '/pengumuman'),
    ...kontenItems(berita, 'Berita', '/berita'),
    ...dokumen.map(d => ({ jenis: 'Dokumen akademik', judul: d.name, teks: clip(d.keterangan, 300), url: internal(d.file, '/dokumen-akademik') })),
    ...kurikulum.map(k => ({
      jenis: 'Kurikulum',
      judul: k.nama,
      teks: clip([k.programStudi, k.fakultas, k.tahun && `Tahun ${k.tahun}`].filter(Boolean).join(' - '), 200),
      url: internal(k.file, '/kurikulum'),
    })),
    prodiItem(prodi),
    ...akreditasiItems(akreditasi),
    ...unit.map(u => ({ jenis: 'Unit kerja', judul: u.nama, teks: clip(u.deskripsi, 400), url: '/struktur-organisasi' })),
    ...rpl.map(r => ({ jenis: 'RPL', judul: r.judul, teks: clip([r.tahun && `Tahun ${r.tahun}`, r.deskripsi].filter(Boolean).join(' - '), 400), url: internal(r.file, '/rpl') })),
  ].filter(Boolean);
};

let cache = { at: 0, items: null, pending: null };

const getItems = async () => {
  if (cache.items && Date.now() - cache.at < TTL_MS) return cache.items;
  if (!cache.pending) {
    cache.pending = build()
      .then(items => {
        cache = { at: Date.now(), items, pending: null };
        return items;
      })
      .catch(err => {
        cache.pending = null;
        if (cache.items) return cache.items; // data lama lebih baik daripada gagal
        throw err;
      });
  }
  return cache.pending;
};

const invalidate = () => {
  cache = { at: 0, items: cache.items, pending: null };
};

module.exports = { getItems, invalidate, akreditasiItems, kalenderItems };
