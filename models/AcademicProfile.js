const mongoose = require('mongoose');

const nonEmptyItems = arr =>
  Array.isArray(arr) && arr.filter(item => String(item || '').trim()).length > 0;

const AcademicProfileSchema = new mongoose.Schema(
  {
    judulHalaman: {
      type: String,
      required: true,
      trim: true,
      default: 'Profil Bidang Akademik',
      minlength: 5,
      maxlength: 120,
    },
    ringkasan: {
      type: String,
      required: true,
      trim: true,
      minlength: 300,
      maxlength: 1200,
    },
    visi: {
      type: String,
      required: true,
      trim: true,
      minlength: 80,
      maxlength: 500,
    },
    misi: {
      type: [String],
      required: true,
      validate: {
        validator: nonEmptyItems,
        message: 'Misi minimal 1 butir.',
      },
    },
    tugas: {
      type: [String],
      required: true,
      validate: {
        validator: nonEmptyItems,
        message: 'Tugas minimal 1 butir.',
      },
    },
    fungsi: {
      type: [String],
      required: true,
      validate: {
        validator: nonEmptyItems,
        message: 'Fungsi minimal 1 butir.',
      },
    },
    kontakEmail: { type: String, trim: true, maxlength: 160 },
    kontakTelepon: { type: String, trim: true, maxlength: 80 },
    alamatLayanan: { type: String, trim: true, maxlength: 500 },
    jamLayanan: { type: String, trim: true, maxlength: 160 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicProfile', AcademicProfileSchema);
