const mongoose = require('mongoose');

const RplDocumentSchema = new mongoose.Schema(
  {
    judul: { type: String, required: true, trim: true },
    tahun: { type: Number, required: true },
    cover: { type: String, required: true, trim: true },
    file: { type: String, required: true, trim: true },
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RplDocument', RplDocumentSchema);
