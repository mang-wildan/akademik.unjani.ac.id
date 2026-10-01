#!/usr/bin/env node
// F0 — bersihkan konten uji coba (audit temuan 05 & 07).
//
//   node scripts/f0-cleanup-test-content.js            # dry-run: hanya laporan
//   node scripts/f0-cleanup-test-content.js --apply    # backup JSON lalu terapkan
//
// Berita & pengumuman uji diubah ke draft (bisa dipulihkan dari admin).
// Buku, buku wisuda, dan staf uji dihapus (modelnya tidak punya status draft);
// salinan lengkapnya disimpan di backups/ sebelum dihapus.
// ID diambil dari database salinan; di database lain, ID yang tidak ada dilewati.
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const News = require('../models/News');
const Pengumuman = require('../models/Pengumuman');
const Book = require('../models/Book');
const GraduationBook = require('../models/GraduationBook');
const Staff = require('../models/Staff');

const APPLY = process.argv.includes('--apply');
const ROOT = path.join(__dirname, '..');
const UPLOADS = path.join(ROOT, 'public', 'uploads');

const PLAN = {
  draft: {
    News: [
      '69801f0329696600ec47b154', // Berita Contoh
      '6982ae0cdefda7ef69654468', // gjgjgj
      '6985620087ef1e6ed77c3fd2', // gjgjgj
      '6985621287ef1e6ed77c3fd3', // gjgjgj
      '6985621a87ef1e6ed77c3fd4', // gjgjgj
      '6985622387ef1e6ed77c3fd5', // fasfaf
      '6985622c87ef1e6ed77c3fd6', // ghrdb
      '6985623787ef1e6ed77c3fd7', // edtbed
      '6985624287ef1e6ed77c3fd8', // pm
      '6985626687ef1e6ed77c3fda', // Berita Confwftoh
      '6985627187ef1e6ed77c3fdb', // Berita fasf
      '6987f4b3151f796807aad7ab', // test
      '6988055e8df18edaff7ce796', // rgwegewrg
    ],
    Pengumuman: [
      '6981a3987b3e4d8f4f1586c5', // Test Pengumuman
      '6981afba77ca7693240fa4b0', // Informasi Pendaftaran Wisuda ... (Lorem ipsum)
      '6985655287ef1e6ed77c3fdd', // idem
      '6985656987ef1e6ed77c3fde', // idem
      '6985657187ef1e6ed77c3fdf', // idem
      '6985657987ef1e6ed77c3fe0', // idem (disematkan)
      '69880c29ce0149e8a6bb7342', // Pengumuman Baru (isi salinan berita Humas)
      '69880d21135192912ec7e240', // threhre (isi salinan berita Humas)
    ],
  },
  remove: {
    Book: [
      '6982ad21defda7ef696543fe', // test
      '69843ca5a8944bc59603e783', // dgsge
    ],
    GraduationBook: [
      '6982ad4cdefda7ef69654412', // Buku Kelulusan 2027
    ],
    Staff: [
      '69829f8a5d4c473960b4305c', // Dr. Test, S.Test
      '69829fc05d4c473960b4306a', // Test, S.Test., M.Test.
    ],
  },
  // Gambar 128 MB (peta game) yang dipakai 3 berita uji.
  oversizedFile: /TERRA_INFINITA_MAP_15K/,
};

const MODELS = { News, Pengumuman, Book, GraduationBook, Staff };

const listFiles = dir =>
  fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
        e.isDirectory() ? listFiles(path.join(dir, e.name)) : [path.join(dir, e.name)])
    : [];

const toUrl = file => `/${path.relative(path.join(ROOT, 'public'), file).replace(/\\/g, '/')}`;
const mb = bytes => `${(bytes / 1048576).toFixed(1)} MB`;

// Every "/uploads/..." string stored anywhere in the database.
const referencedUploads = async () => {
  const refs = new Set();
  const collections = await mongoose.connection.db.listCollections().toArray();
  for (const { name } of collections) {
    const docs = await mongoose.connection.db.collection(name).find({}).toArray();
    for (const doc of docs) {
      for (const match of JSON.stringify(doc).matchAll(/\/uploads\/[^"\\]+/g)) refs.add(decodeURI(match[0]));
    }
  }
  return refs;
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log(APPLY ? 'MODE: APPLY' : 'MODE: DRY-RUN (tambahkan --apply untuk menerapkan)');

  const backup = { createdAt: new Date().toISOString(), drafted: {}, removed: {}, files: [] };

  for (const [model, ids] of Object.entries(PLAN.draft)) {
    const docs = await MODELS[model].find({ _id: { $in: ids } }).lean();
    backup.drafted[model] = docs;
    console.log(`\n${model}: ${docs.length}/${ids.length} ditemukan → draft + lepas sematan`);
    docs.forEach(d => console.log(`  - ${d.title} [${d.status}${d.pinned ? ', disematkan' : ''}]`));
  }
  for (const [model, ids] of Object.entries(PLAN.remove)) {
    const docs = await MODELS[model].find({ _id: { $in: ids } }).lean();
    backup.removed[model] = docs;
    console.log(`\n${model}: ${docs.length}/${ids.length} ditemukan → hapus`);
    docs.forEach(d => console.log(`  - ${d.title || d.nama}`));
  }

  const oversized = listFiles(UPLOADS).filter(f => PLAN.oversizedFile.test(path.basename(f)));
  console.log(`\nFile terlalu besar: ${oversized.length}`);
  oversized.forEach(f => console.log(`  - ${toUrl(f)} (${mb(fs.statSync(f).size)})`));

  if (APPLY) {
    const dir = path.join(ROOT, 'backups');
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `f0-cleanup-${backup.createdAt.replace(/[:.]/g, '-')}.json`);
    backup.files = oversized.map(toUrl);
    fs.writeFileSync(file, JSON.stringify(backup, null, 2));
    console.log(`\nBackup: ${path.relative(ROOT, file)}`);

    for (const [model, ids] of Object.entries(PLAN.draft)) {
      const r = await MODELS[model].updateMany({ _id: { $in: ids } }, { $set: { status: 'draft', pinned: false } });
      console.log(`${model}: ${r.modifiedCount} diubah ke draft`);
    }
    for (const [model, ids] of Object.entries(PLAN.remove)) {
      const r = await MODELS[model].deleteMany({ _id: { $in: ids } });
      console.log(`${model}: ${r.deletedCount} dihapus`);
    }
    for (const f of oversized) {
      const url = toUrl(f);
      const r = await News.updateMany({ featuredImage: url }, { $set: { featuredImage: '' } });
      fs.unlinkSync(f);
      console.log(`File ${url} dihapus; rujukan dikosongkan di ${r.modifiedCount} berita`);
    }
  }

  // Read-only report: uploaded files nothing points to are still public.
  const refs = await referencedUploads();
  const orphans = listFiles(UPLOADS).filter(f => !refs.has(toUrl(f)) && path.basename(f) !== '.gitkeep');
  const total = orphans.reduce((sum, f) => sum + fs.statSync(f).size, 0);
  console.log(`\nFile unggahan yatim (tidak dirujuk database, tetap bisa diakses publik): ${orphans.length}, ${mb(total)}`);
  orphans.forEach(f => console.log(`  - ${toUrl(f)} (${mb(fs.statSync(f).size)})`));

  await mongoose.disconnect();
})().catch(err => {
  console.error(err);
  process.exit(1);
});
