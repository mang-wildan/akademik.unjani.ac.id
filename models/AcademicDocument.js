const mongoose = require('mongoose');

const AcademicDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    keterangan: { type: String, trim: true },
    cover: { type: String, trim: true }, // image path (tidak dipakai desain baru)
    file: { type: String, required: true, trim: true }, // pdf path
    pinned: { type: Boolean, default: false },
    kategori: { type: mongoose.Schema.Types.ObjectId, ref: 'Kategori' },
    fileSize: { type: Number },
    mimeType: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicDocument', AcademicDocumentSchema);
