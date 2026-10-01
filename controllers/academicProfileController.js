const AcademicProfile = require('../models/AcademicProfile');

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
  kontakEmail: '',
  kontakTelepon: '',
  alamatLayanan: '',
  jamLayanan: 'Senin-Jumat, 08.00-15.30 WIB',
};

const splitLines = value => {
  if (Array.isArray(value)) {
    return value.map(item => String(item || '').trim()).filter(Boolean);
  }
  return String(value || '')
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean);
};

const getSingleton = async user => {
  let doc = await AcademicProfile.findOne();
  if (!doc) {
    doc = await AcademicProfile.create({
      ...DEFAULT_CONTENT,
      createdBy: user ? user._id : undefined,
      updatedBy: user ? user._id : undefined,
    });
  }
  return doc;
};

const normalizeValues = body => ({
  judulHalaman: String(body.judulHalaman || '').trim(),
  ringkasan: String(body.ringkasan || '').trim(),
  visi: String(body.visi || '').trim(),
  misi: splitLines(body.misi),
  tugas: splitLines(body.tugas),
  fungsi: splitLines(body.fungsi),
  kontakEmail: String(body.kontakEmail || '').trim(),
  kontakTelepon: String(body.kontakTelepon || '').trim(),
  alamatLayanan: String(body.alamatLayanan || '').trim(),
  jamLayanan: String(body.jamLayanan || '').trim(),
});

const validateValues = values => {
  if (!values.judulHalaman) return 'Judul halaman wajib diisi.';
  if (values.ringkasan.length < 300 || values.ringkasan.length > 1200) {
    return 'Ringkasan harus 300-1200 karakter.';
  }
  if (values.visi.length < 80 || values.visi.length > 500) {
    return 'Visi harus 80-500 karakter.';
  }
  if (!values.misi.length) return 'Misi minimal 1 butir.';
  if (!values.tugas.length) return 'Tugas minimal 1 butir.';
  if (!values.fungsi.length) return 'Fungsi minimal 1 butir.';
  return '';
};

exports.getProfileSingleton = getSingleton;

exports.show = async (req, res) => {
  const profile = await getSingleton(req.user);
  await profile.populate([
    { path: 'updatedBy', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  const formatDate = d => (d ? d.toLocaleString('id-ID') : '-');
  return res.render('admin/profil-akademik/index', {
    title: 'Profil Akademik',
    user: req.user,
    values: profile,
    success: req.query.success,
    lastUpdatedLabel: formatDate(profile.updatedAt),
  });
};

exports.editForm = async (req, res) => {
  const profile = await getSingleton(req.user);
  const formatDate = d => (d ? d.toLocaleString('id-ID') : '-');
  return res.render('admin/profil-akademik/edit', {
    title: 'Edit Profil Akademik',
    user: req.user,
    values: profile,
    lastUpdatedLabel: formatDate(profile.updatedAt),
  });
};

exports.update = async (req, res) => {
  const profile = await getSingleton(req.user);
  const values = normalizeValues(req.body);
  const validationError = validateValues(values);

  if (validationError) {
    return res.status(400).render('admin/profil-akademik/edit', {
      title: 'Edit Profil Akademik',
      user: req.user,
      error: validationError,
      values: { ...profile.toObject(), ...values },
      lastUpdatedLabel: profile.updatedAt ? profile.updatedAt.toLocaleString('id-ID') : '-',
    });
  }

  profile.judulHalaman = values.judulHalaman;
  profile.ringkasan = values.ringkasan;
  profile.visi = values.visi;
  profile.misi = values.misi;
  profile.tugas = values.tugas;
  profile.fungsi = values.fungsi;
  profile.kontakEmail = values.kontakEmail;
  profile.kontakTelepon = values.kontakTelepon;
  profile.alamatLayanan = values.alamatLayanan;
  profile.jamLayanan = values.jamLayanan;
  profile.updatedBy = req.user ? req.user._id : profile.updatedBy;

  await profile.save();
  return res.redirect('/admin/profil-akademik?success=Profil akademik berhasil diperbarui');
};
