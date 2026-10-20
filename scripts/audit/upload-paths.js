// Hanya-baca: hitung record yang URL berkasnya di luar /uploads/<basePath>/. Record seperti itu
// sengaja ditolak saat dihapus (utils/upload.js removeUploadFiles). Jalankan sebelum deploy produksi:
//   node scripts/audit/upload-paths.js "$PWD"   (MONGO_URI dari .env yang dipakai)
const repo = process.argv[2];
require(`${repo}/node_modules/dotenv`).config({ path: `${repo}/.env` });
const mongoose = require(`${repo}/node_modules/mongoose`);
const M = n => require(`${repo}/models/${n}`);
const cases = [
  ['AcademicCalendar', 'academic-calendars', i => [i.file, ...(i.lampiran || []).map(l => l.file)]],
  ['AcademicDocument', 'academic-documents', i => [i.file, i.cover]],
  ['Accreditation', 'accreditations', i => [i.sertifikat]],
  ['GraduationBook', 'graduation-books', i => [i.src, i.cover]],
  ['Kurikulum', 'kurikulum', i => [i.file, i.cover]],
  ['RplDocument', 'rpl-documents', i => [i.file, i.cover]],
  ['Staff', 'staff', i => [i.foto]],
  ['Unit', 'unit', i => [i.img]],
];
(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const [name, base, files] of cases) {
    const docs = await M(name).find().lean();
    const bad = docs.filter(d => files(d).filter(Boolean).some(u => !String(u).startsWith(`/uploads/${base}/`)));
    const prefixes = [...new Set(bad.flatMap(d => files(d).filter(Boolean).filter(u => !String(u).startsWith(`/uploads/${base}/`)).map(u => String(u).split('/').slice(0, 3).join('/'))))];
    console.log(`${name.padEnd(17)} total=${String(docs.length).padStart(3)} tidak-bisa-dihapus=${bad.length} ${prefixes.length ? 'awalan: ' + prefixes.join(', ') : ''}`);
  }
  await mongoose.disconnect();
})().catch(e => { console.error(e.message); process.exit(1); });
