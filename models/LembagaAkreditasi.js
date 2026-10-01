const mongoose = require('mongoose');

// Master data: accrediting bodies (BAN-PT, LAM-*, Perpustakaan Nasional) (SRS FR-M-11).
const LembagaAkreditasiSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true, maxlength: 160 },
    singkatan: { type: String, required: true, trim: true, maxlength: 30 },
    urutan: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

LembagaAkreditasiSchema.index({ singkatan: 1 }, { unique: true });

module.exports = mongoose.model('LembagaAkreditasi', LembagaAkreditasiSchema);
