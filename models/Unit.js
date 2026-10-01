const mongoose = require('mongoose');

const UnitSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    deskripsi: { type: String, trim: true },
    img: { type: String, required: true, trim: true }, // image path
    link: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Unit', UnitSchema);
