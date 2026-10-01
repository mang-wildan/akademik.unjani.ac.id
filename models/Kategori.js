const mongoose = require('mongoose');

// Master data: categories for pengumuman and dokumen akademik (SRS FR-M-11).
const KategoriSchema = new mongoose.Schema(
  {
    jenis: { type: String, enum: ['pengumuman', 'dokumen'], required: true },
    nama: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 60 },
    urutan: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

KategoriSchema.index({ jenis: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Kategori', KategoriSchema);
