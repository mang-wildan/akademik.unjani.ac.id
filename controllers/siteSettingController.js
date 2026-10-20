// Admin untuk Pengaturan Situs (FR-M-12) -- dokumen singleton. Hanya
// menawarkan field yang benar-benar dipakai tampilan publik saat ini
// (footer: kontak/alamat/jam layanan/sosial media/quick links, beranda:
// video, struktur organisasi: gambar). namaSitus/tagline/heroImage/
// bannerRpl/siteLogo/slideshowImages ada di skema tapi tidak dipakai
// desain F3 mana pun -- sengaja tidak ditawarkan di form ini (lihat
// docs/POLA-ADMIN.md untuk pola serupa di modul lain).
const fs = require('fs/promises');
const path = require('path');
const SiteSetting = require('../models/SiteSetting');
const { validate, schemas } = require('../validators');
const siteSettingCache = require('../utils/siteSettingCache');
const { removeUploadFiles } = require('../utils/upload');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const discardUploads = req => removeUploadFiles('settings', Object.values(req.files || {}).flat().map(file => toPublicUrl(file.path)));

const getSingleton = async () => {
  let doc = await SiteSetting.findOne();
  if (!doc) doc = await SiteSetting.create({ namaSitus: 'Bidang Akademik UNJANI' });
  return doc;
};
exports.getSettingSingleton = getSingleton;

exports.editForm = async (req, res) => {
  const setting = await getSingleton();
  res.renderPage(
    'admin/settings/edit',
    { title: 'Pengaturan Situs', item: setting.toObject(), values: setting.toObject(), errors: {}, quickLinkErrors: {}, quickLinkValues: {}, lastUpdatedAt: setting.updatedAt },
    'layouts/admin-v2'
  );
};

exports.update = async (req, res) => {
  const setting = await getSingleton();
  const { data, errors, ok } = validate(schemas.siteSetting, req.body);
  if (!ok) {
    await discardUploads(req);
    return res.status(422).renderPage(
      'admin/settings/edit',
      { title: 'Pengaturan Situs', item: setting.toObject(), values: req.body, errors, quickLinkErrors: {}, quickLinkValues: {}, lastUpdatedAt: setting.updatedAt },
      'layouts/admin-v2'
    );
  }
  const favicon = req.files?.favicon?.[0];
  const struktur = req.files?.strukturOrganisasiImage?.[0];
  if (favicon) setting.favicon = toPublicUrl(favicon.path);
  if (struktur) {
    setting.strukturOrganisasiImage = toPublicUrl(struktur.path);
    setting.strukturOrganisasiUpdatedAt = new Date();
  }
  Object.assign(setting, data, { updatedBy: req.user._id });
  try { await setting.save(); }
  catch (err) { await discardUploads(req); throw err; }
  siteSettingCache.invalidate(setting.toObject());
  res.redirect(303, `/admin/settings?success=${encodeURIComponent('Pengaturan situs berhasil disimpan.')}`);
};

exports.addQuickLink = async (req, res) => {
  const setting = await getSingleton();
  const { data, errors, ok } = validate(schemas.quickLink, req.body);
  if (!ok) {
    return res.status(422).renderPage(
      'admin/settings/edit',
      { title: 'Pengaturan Situs', item: setting.toObject(), values: setting.toObject(), errors: {}, quickLinkErrors: errors, quickLinkValues: req.body, lastUpdatedAt: setting.updatedAt },
      'layouts/admin-v2'
    );
  }
  setting.quickLinks.push(data);
  setting.updatedBy = req.user._id;
  await setting.save();
  siteSettingCache.invalidate(setting.toObject());
  res.redirect(303, `/admin/settings?success=${encodeURIComponent('Tautan cepat berhasil ditambahkan.')}`);
};

exports.deleteQuickLink = async (req, res) => {
  const setting = await getSingleton();
  setting.quickLinks = setting.quickLinks.filter(l => String(l._id) !== req.params.linkId);
  setting.updatedBy = req.user._id;
  await setting.save();
  siteSettingCache.invalidate(setting.toObject());
  res.redirect(303, `/admin/settings?success=${encodeURIComponent('Tautan cepat berhasil dihapus.')}`);
};
