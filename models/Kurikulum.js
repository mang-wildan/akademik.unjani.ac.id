const mongoose = require('mongoose');

const KurikulumSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    programStudi: { type: String, required: true, trim: true },
    fakultas: { type: String, required: true, trim: true },
    tahun: { type: String, required: true, trim: true },
    cover: { type: String, trim: true }, // image path (tidak dipakai desain baru)
    // Rujukan ke master Program Studi (SRS FR-KU-03); programStudi/fakultas teks di atas
    // tetap sampai form admin F4 memakai field ini. Diisi migrasi 004.
    prodi: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgramStudi' },
    fileSize: { type: Number },
    file: { type: String, required: true, trim: true }, // pdf path
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kurikulum', KurikulumSchema);
