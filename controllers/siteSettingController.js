const SiteSetting = require('../models/SiteSetting');
const path = require('path');

const DEFAULT_LANDING_FOOTER_DESCRIPTION = 'Bidang Akademik mengatur kurikulum, jadwal perkuliahan, dan layanan administrasi mahasiswa agar proses belajar berjalan tertib dan bermutu.';

const getSingleton = async () => {
  let doc = await SiteSetting.findOne();
  if (!doc) {
    doc = await SiteSetting.create({
      namaSitus: 'BAA Akademik',
      tagline: 'Portal Akademik',
      landingFooterDescription: DEFAULT_LANDING_FOOTER_DESCRIPTION,
    });
  }
  return doc;
};

exports.show = async (req, res) => {
  const setting = await getSingleton();
  await setting.populate([
    { path: 'updatedBy', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);

  const formatDate = d => (d ? d.toLocaleString('id-ID') : '-');
  res.render('admin/settings/index', {
    title: 'Pengaturan Situs',
    user: req.user,
    values: setting,
    success: req.query.success,
    lastUpdatedLabel: formatDate(setting.updatedAt),
    strukturUpdatedLabel: formatDate(setting.strukturOrganisasiUpdatedAt),
  });
};

exports.editForm = async (req, res) => {
  const setting = await getSingleton();
  await setting.populate([
    { path: 'updatedBy', select: 'name email' },
    { path: 'createdBy', select: 'name email' },
  ]);
  const formatDate = d => (d ? d.toLocaleString('id-ID') : '-');
  res.render('admin/settings/edit', {
    title: 'Edit Pengaturan Situs',
    user: req.user,
    values: setting,
    lastUpdatedLabel: formatDate(setting.updatedAt),
    strukturUpdatedLabel: formatDate(setting.strukturOrganisasiUpdatedAt),
  });
};

exports.update = async (req, res) => {
  const {
    namaSitus,
    tagline,
    kontakEmail,
    kontakTelepon,
    alamat,
    landingFooterDescription,
    socialFacebook,
    socialTwitter,
    socialYoutube,
    socialTiktok,
    socialLinkedin,
    landingVideoUrl,
    slideshowImages,
    removeSlides,
  } = req.body;
  const quickLinkName = req.body.quickLinkName || req.body['quickLinkName[]'];
  const quickLinkUrl = req.body.quickLinkUrl || req.body['quickLinkUrl[]'];
  const quickLinkTarget = req.body.quickLinkTarget || req.body['quickLinkTarget[]'];
  const bannerFile = req.files && req.files.bannerRpl ? req.files.bannerRpl[0] : null;
  const slideshowFiles = (req.files && req.files.slideshowImages) ? req.files.slideshowImages : [];
  const siteLogoFile = req.files && req.files.siteLogo ? req.files.siteLogo[0] : null;
  const faviconFile = req.files && req.files.favicon ? req.files.favicon[0] : null;
  const strukturFile = req.files && req.files.strukturOrganisasiImage ? req.files.strukturOrganisasiImage[0] : null;
  const setting = await getSingleton();

  if (!namaSitus) {
    const formatDate = d => (d ? d.toLocaleString('id-ID') : '-');
    return res.status(400).render('admin/settings/edit', {
      title: 'Edit Pengaturan Situs',
      user: req.user,
      error: 'Nama situs wajib diisi.',
      values: {
        ...setting.toObject(),
        namaSitus,
        tagline,
        kontakEmail,
        kontakTelepon,
        alamat,
        landingFooterDescription,
        socialFacebook,
        socialTwitter,
        socialYoutube,
        socialTiktok,
        socialLinkedin,
        landingVideoUrl,
        slideshowImages,
      },
      lastUpdatedLabel: formatDate(setting.updatedAt),
      strukturUpdatedLabel: formatDate(setting.strukturOrganisasiUpdatedAt),
    });
  }

  setting.namaSitus = namaSitus;
  setting.tagline = tagline;
  setting.kontakEmail = kontakEmail;
  setting.kontakTelepon = kontakTelepon;
  setting.alamat = alamat;
  setting.landingFooterDescription = landingFooterDescription;
  setting.socialFacebook = socialFacebook;
  setting.socialTwitter = socialTwitter;
  setting.socialYoutube = socialYoutube;
  setting.socialTiktok = socialTiktok;
  setting.socialLinkedin = socialLinkedin;
  setting.landingVideoUrl = landingVideoUrl;
  const removeArr = Array.isArray(removeSlides)
    ? removeSlides
    : removeSlides
      ? [removeSlides]
      : [];
  const removeSet = new Set(removeArr);

  const existingKept = (setting.slideshowImages || []).filter(img => !removeSet.has(img));
  const uploadedSlides = slideshowFiles.map(f => toPublicUrl(f.path));

  const finalSlides = uploadedSlides.length ? existingKept.concat(uploadedSlides) : existingKept;
  setting.slideshowImages = finalSlides;
  if (bannerFile) {
    setting.bannerRpl = toPublicUrl(bannerFile.path);
  }
  if (siteLogoFile) {
    setting.siteLogo = toPublicUrl(siteLogoFile.path);
  }
  if (faviconFile) {
    setting.favicon = toPublicUrl(faviconFile.path);
  }
  if (strukturFile) {
    setting.strukturOrganisasiImage = toPublicUrl(strukturFile.path);
    setting.strukturOrganisasiUpdatedAt = new Date();
  }

  // Quick links parsing: each line "Label|URL"
  const toArr = v => (Array.isArray(v) ? v : v ? [v] : []);
  const namesArr = toArr(quickLinkName);
  const urlsArr = toArr(quickLinkUrl);
  const targetsArr = toArr(quickLinkTarget);
  const parsedQuickLinks = [];
  for (let i = 0; i < namesArr.length; i++) {
    const label = (namesArr[i] || '').trim();
    const url = (urlsArr[i] || '').trim();
    const target = (targetsArr[i] || '_self').trim() || '_self';
    if (label && url) parsedQuickLinks.push({ label, url, target });
  }
  setting.quickLinks = parsedQuickLinks;

  setting.updatedBy = req.user ? req.user._id : setting.updatedBy;
  await setting.save();
  return res.redirect('/admin/settings?success=Pengaturan situs berhasil disimpan');
};
const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = filePath => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};
