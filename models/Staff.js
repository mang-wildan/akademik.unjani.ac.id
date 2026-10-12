const mongoose = require('mongoose');
const { VALUES } = require('../utils/staffTingkat');

const StaffSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    nip: { type: String, trim: true }, // NIP/NID — internal saja, tidak pernah tampil publik (K-05)
    jabatan: { type: String, required: true, trim: true },
    foto: { type: String, required: true, trim: true }, // image path
    nomorUrut: { type: Number, default: 0 },
    tingkat: { type: String, enum: VALUES, default: 'anggota' },
    gelar: { type: String, trim: true, maxlength: 80 },
    email: { type: String, trim: true, lowercase: true, maxlength: 160 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', StaffSchema);
