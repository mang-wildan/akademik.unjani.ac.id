// Admin untuk Profil Bidang Akademik (FR-M-10b) -- dokumen singleton (selalu
// tepat satu), dipakai halaman publik /profil. misi/tugas/fungsi disimpan
// sebagai array tapi diisi lewat satu <textarea> per kolom (satu baris = satu
// butir) supaya tidak perlu form dinamis tambah/hapus baris.
const AcademicProfile = require('../models/AcademicProfile');
const { validate, schemas } = require('../validators');

const DEFAULT_CONTENT = {
  judulHalaman: 'Profil Bidang Akademik',
  ringkasan:
    'Bidang Akademik Universitas Jenderal Achmad Yani merupakan unsur pelaksana layanan akademik yang berperan dalam perencanaan, koordinasi, pelaksanaan, dan pengendalian administrasi akademik. Bidang ini memastikan seluruh proses akademik berjalan tertib, akurat, dan akuntabel melalui layanan kurikulum, kalender akademik, administrasi perkuliahan, dokumen akademik, serta dukungan informasi akademik bagi sivitas. Seluruh layanan diselenggarakan untuk menjaga mutu tata kelola akademik dan mendukung pencapaian standar pendidikan tinggi.',
  visi:
    'Menjadi bidang layanan akademik yang profesional, akuntabel, dan berorientasi mutu dalam mendukung penyelenggaraan pendidikan tinggi Universitas Jenderal Achmad Yani secara berkelanjutan.',
  misi: [
    'Menyelenggarakan layanan administrasi akademik yang tertib, cepat, dan tepat.',
    'Menguatkan koordinasi kebijakan akademik bersama fakultas dan program studi.',
    'Mendukung transformasi layanan akademik berbasis data dan sistem informasi.',
  ],
  tugas: [
    'Mengelola administrasi akademik institusi sesuai kebijakan yang berlaku.',
    'Mengoordinasikan pelaksanaan kalender akademik, kurikulum, dan evaluasi akademik.',
    'Menyediakan informasi dan dokumen akademik untuk sivitas secara akurat.',
  ],
  fungsi: [
    'Perencanaan dan pengembangan layanan akademik.',
    'Pelaksanaan administrasi akademik terpadu.',
    'Pemantauan, evaluasi, dan pelaporan layanan akademik.',
  ],
};

const getSingleton = async user => {
  let doc = await AcademicProfile.findOne();
  if (!doc) doc = await AcademicProfile.create({ ...DEFAULT_CONTENT, createdBy: user?._id, updatedBy: user?._id });
  return doc;
};
exports.getProfileSingleton = getSingleton;

exports.editForm = async (req, res) => {
  const profile = await getSingleton(req.user);
  const obj = profile.toObject();
  res.renderPage(
    'admin/profil-akademik/edit',
    { title: 'Profil Bidang Akademik', values: { ...obj, misi: obj.misi.join('\n'), tugas: obj.tugas.join('\n'), fungsi: obj.fungsi.join('\n') }, errors: {}, lastUpdatedAt: profile.updatedAt },
    'layouts/admin'
  );
};

exports.update = async (req, res) => {
  const profile = await getSingleton(req.user);
  const { data, errors, ok } = validate(schemas.academicProfile, req.body);
  if (!ok) {
    return res.renderPage('admin/profil-akademik/edit', { title: 'Profil Bidang Akademik', values: req.body, errors, lastUpdatedAt: profile.updatedAt }, 'layouts/admin');
  }
  Object.assign(profile, data, { updatedBy: req.user._id });
  await profile.save();
  res.redirect(`/admin/profil-akademik?success=${encodeURIComponent('Profil berhasil diperbarui.')}`);
};
