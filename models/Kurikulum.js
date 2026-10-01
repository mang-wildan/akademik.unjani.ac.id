const mongoose = require('mongoose');

const KurikulumSchema = new mongoose.Schema(
  {
    // Legacy pre-F4 fields (teks bebas). Form F4 (controllers/kurikulumController.js)
    // memakai `prodi` (ref) di bawah; field ini tetap optional agar data lama
    // yang belum dimigrasi ke `prodi` tidak hilang, tapi tidak lagi diisi admin.
    nama: { type: String, trim: true },
    programStudi: { type: String, trim: true },
    fakultas: { type: String, trim: true },
    tahun: { type: String, required: true, trim: true },
    cover: { type: String, trim: true }, // image path (tidak dipakai desain baru)
    // Rujukan ke master Program Studi (SRS FR-KU-03). Diisi migrasi 004 untuk data lama.
    prodi: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgramStudi' },
    fileSize: { type: Number },
    file: { type: String, required: true, trim: true }, // pdf path
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kurikulum', KurikulumSchema);
