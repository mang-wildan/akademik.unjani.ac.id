const mongoose = require('mongoose');

const SiteSettingSchema = new mongoose.Schema(
  {
    namaSitus: { type: String, required: true, trim: true },
    tagline: { type: String, trim: true },
    kontakEmail: { type: String, trim: true },
    kontakTelepon: { type: String, trim: true },
    alamat: { type: String, trim: true },
    landingFooterDescription: { type: String, trim: true },
    socialFacebook: { type: String, trim: true },
    socialTwitter: { type: String, trim: true },
    socialYoutube: { type: String, trim: true },
    socialTiktok: { type: String, trim: true },
    socialLinkedin: { type: String, trim: true },
    socialInstagram: { type: String, trim: true },
    jamLayanan: { type: String, trim: true, maxlength: 160 },
    heroImage: { type: String, trim: true },
    bannerRpl: { type: String, trim: true },
    landingVideoUrl: { type: String, trim: true },
    strukturOrganisasiImage: { type: String, trim: true },
    strukturOrganisasiUpdatedAt: { type: Date },
    slideshowImages: [{ type: String, trim: true }],
    siteLogo: { type: String, trim: true },
    favicon: { type: String, trim: true },
    quickLinks: [
      {
        label: { type: String, trim: true },
        url: { type: String, trim: true },
        target: { type: String, trim: true, enum: ['_self', '_blank'], default: '_self' },
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SiteSetting', SiteSettingSchema);
