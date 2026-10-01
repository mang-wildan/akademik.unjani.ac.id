// Server-side validation for admin forms (SRS FR-AD-06). Schemas take the raw
// req.body (all strings) and return clean values; errors come back per field
// so form-field components can show them under the right input.
const { z } = require('zod');
const { PERINGKAT, JENIS } = require('../utils/accreditation');
const { SEMESTER } = require('../utils/calendar');
const { parseTanggal } = require('../utils/calendarImport');

const req = label => `${label} wajib diisi.`;

// '' and missing both mean "not given".
const blankToUndefined = v => (typeof v === 'string' && v.trim() === '' ? undefined : v);

const text = (label, { min = 1, max = 200 } = {}) =>
  z.preprocess(
    v => (typeof v === 'string' ? v.trim() : v),
    z.string({ error: req(label) }).min(min, min === 1 ? req(label) : `${label} minimal ${min} karakter.`).max(max, `${label} maksimal ${max} karakter.`)
  );

const optionalText = (label, max = 200) =>
  z.preprocess(v => blankToUndefined(typeof v === 'string' ? v.trim() : v), z.string().max(max, `${label} maksimal ${max} karakter.`).optional());

const objectId = label => z.string({ error: req(label) }).regex(/^[a-f\d]{24}$/i, `Pilih ${label.toLowerCase()} dari daftar.`);
const optionalObjectId = label => z.preprocess(blankToUndefined, objectId(label).optional());

// Form date inputs send YYYY-MM-DD; imports may send DD/MM/YYYY. Stored as 00:00 WIB.
const date = label =>
  z.preprocess(blankToUndefined, z.any().refine(v => v !== undefined, req(label)).transform((v, ctx) => {
    const d = v instanceof Date ? v : parseTanggal(v);
    if (!d) {
      ctx.addIssue({ code: 'custom', message: `${label} tidak valid.` });
      return z.NEVER;
    }
    return d;
  }));
const optionalDate = label => z.preprocess(blankToUndefined, date(label).optional());

const checkbox = z.preprocess(v => v === true || v === 'on' || v === 'true' || v === '1', z.boolean());

const choice = (label, values) => z.enum(values, { error: `Pilih ${label.toLowerCase()} dari daftar.` });

// ---------------------------------------------------------------- akreditasi
const accreditation = z.object({
  jenis: choice('Jenis', Object.values(JENIS)),
  programStudi: optionalObjectId('Program studi'),
  namaUnit: optionalText('Nama unit', 160),
  peringkat: choice('Peringkat', PERINGKAT),
  lembaga: objectId('Lembaga akreditasi'),
  nomorSK: optionalText('Nomor SK', 120),
  tanggalBerlaku: date('Tanggal berlaku'),
  berlakuSampai: date('Berlaku sampai'),
  catatanPerpanjangan: optionalText('Catatan perpanjangan', 300),
});

// Cross-field rules run on the raw input as well, so the admin sees every
// problem at once (zod skips refinements while other fields are invalid).
const accreditationRules = raw => {
  const errors = {};
  const filled = v => typeof v === 'string' && v.trim() !== '';
  if (raw.jenis === JENIS.PRODI && !filled(raw.programStudi)) errors.programStudi = req('Program studi');
  if (raw.jenis && raw.jenis !== JENIS.PRODI && !filled(raw.namaUnit)) errors.namaUnit = req('Nama unit');
  const from = parseTanggal(raw.tanggalBerlaku);
  const to = parseTanggal(raw.berlakuSampai);
  if (from && to && to <= from) errors.berlakuSampai = 'Tanggal berlaku sampai harus setelah tanggal berlaku.';
  return errors;
};

// ---------------------------------------------------------------- kalender
const kegiatan = z.object({
  semester: choice('Semester', SEMESTER.map(s => s.value)),
  nama: text('Nama kegiatan', { max: 200 }),
  mulai: date('Tanggal mulai'),
  selesai: optionalDate('Tanggal selesai'),
});

const kegiatanRules = raw => {
  const from = parseTanggal(raw.mulai);
  const to = parseTanggal(raw.selesai);
  return from && to && to < from ? { selesai: 'Tanggal selesai tidak boleh sebelum tanggal mulai.' } : {};
};

const calendar = z.object({
  tahunAjaran: text('Tahun ajaran', { max: 9 }).refine(v => {
    const m = v.match(/^(\d{4})\/(\d{4})$/);
    return Boolean(m) && Number(m[2]) === Number(m[1]) + 1;
  }, 'Tahun ajaran ditulis seperti 2026/2027.'),
  nomorSK: optionalText('Nomor SK', 120),
});

const lampiran = z.object({
  judul: text('Judul surat', { max: 200 }),
  nomorSurat: optionalText('Nomor surat', 120),
  tanggal: optionalDate('Tanggal surat'),
});

// ---------------------------------------------------------------- konten
const content = z.object({
  title: text('Judul', { min: 5, max: 150 }),
  body: z.string({ error: req('Isi') }).refine(v => v.replace(/<[^>]*>/g, '').trim().length > 0, req('Isi')),
  kategori: optionalObjectId('Kategori'),
  status: choice('Status', ['draft', 'published']),
  pinned: checkbox,
});

const academicDocument = z.object({
  name: text('Judul dokumen', { min: 3, max: 200 }),
  keterangan: optionalText('Keterangan', 300),
  kategori: objectId('Kategori'),
  pinned: checkbox,
});

const rplDocument = z.object({
  judul: text('Judul', { min: 3, max: 200 }),
  tahun: z.preprocess(v => Number(v), z.number({ error: req('Tahun') }).int('Tahun harus bilangan bulat.').min(2000, 'Tahun tidak valid.').max(2100, 'Tahun tidak valid.')),
  deskripsi: optionalText('Deskripsi', 500),
  status: checkbox,
});

const optionalYear = label => z.preprocess(v => (blankToUndefined(v) === undefined ? undefined : Number(v)), z.number().int().min(1950, `${label} tidak valid.`).max(2100, `${label} tidak valid.`).optional());
const year = label => z.preprocess(v => Number(v), z.number({ error: req(label) }).int(`${label} tidak valid.`).min(1950, `${label} tidak valid.`).max(2100, `${label} tidak valid.`));

const book = z.object({
  title: text('Judul', { min: 3, max: 200 }),
  year: optionalYear('Tahun'),
});

const graduationBook = z.object({
  title: text('Judul', { min: 3, max: 200 }),
  periode: choice('Periode', ['I', 'II', 'III']),
  year: year('Tahun'),
});

const lulusan = z.object({
  programStudi: objectId('Program studi'),
  fakultas: objectId('Fakultas'),
  periode: text('Periode', { max: 40 }),
  tahun: year('Tahun'),
  jumlah: z.preprocess(v => Number(v), z.number({ error: req('Jumlah') }).int('Jumlah harus bilangan bulat.').min(0, 'Jumlah tidak boleh negatif.')),
});

const kurikulum = z.object({
  prodi: objectId('Program studi'),
  tahun: text('Tahun kurikulum', { max: 9 }).refine(v => /^\d{4}(\/\d{4})?$/.test(v), 'Tahun kurikulum ditulis seperti 2021 atau 2025/2026.'),
});

const staff = z.object({
  nama: text('Nama', { max: 120 }),
  gelar: optionalText('Gelar', 80),
  jabatan: text('Jabatan', { max: 120 }),
  kelompok: choice('Kelompok', ['pimpinan', 'staf']),
  email: z.preprocess(blankToUndefined, z.email('Format email tidak valid.').optional()),
  nip: optionalText('NIP/NID', 40),
  nomorUrut: z.preprocess(v => (blankToUndefined(v) === undefined ? 0 : Number(v)), z.number().int('Urutan harus bilangan bulat.').min(0).max(999)),
});

// ---------------------------------------------------------------- akun
const password = z.string({ error: req('Password') }).min(8, 'Password minimal 8 karakter.').max(128);

const userCreate = z.object({
  name: text('Nama', { max: 120 }),
  email: z.preprocess(v => (typeof v === 'string' ? v.trim().toLowerCase() : v), z.email('Format email tidak valid.')),
  role: choice('Role', ['superadmin', 'editor']),
  password,
});

const passwordChange = z
  .object({ currentPassword: z.string().min(1, req('Password saat ini')), newPassword: password, confirmPassword: z.string() })
  .refine(v => v.newPassword === v.confirmPassword, { path: ['confirmPassword'], message: 'Konfirmasi password tidak sesuai.' })
  .refine(v => v.newPassword !== v.currentPassword, { path: ['newPassword'], message: 'Password baru harus berbeda dari password saat ini.' });

const RULES = new Map([[accreditation, accreditationRules], [kegiatan, kegiatanRules]]);

// { ok: true, data } or { ok: false, errors: { field: 'pesan' } } — first message per field.
const validate = (schema, input = {}) => {
  const result = schema.safeParse(input);
  const errors = {};
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = issue.path.join('.') || '_form';
      if (!errors[key]) errors[key] = issue.message;
    }
  }
  const rules = RULES.get(schema);
  if (rules) for (const [key, message] of Object.entries(rules(input))) if (!errors[key]) errors[key] = message;
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: result.data };
};

module.exports = {
  validate,
  schemas: { accreditation, calendar, kegiatan, lampiran, content, academicDocument, rplDocument, kurikulum, book, graduationBook, lulusan, staff, userCreate, passwordChange },
};
