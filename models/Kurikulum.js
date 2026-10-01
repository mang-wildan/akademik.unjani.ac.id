const mongoose = require('mongoose');

const KurikulumSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    programStudi: { type: String, required: true, trim: true },
    fakultas: { type: String, required: true, trim: true },
    tahun: { type: String, required: true, trim: true },
    cover: { type: String, required: true, trim: true }, // image path
    file: { type: String, required: true, trim: true }, // pdf path
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Kurikulum', KurikulumSchema);
