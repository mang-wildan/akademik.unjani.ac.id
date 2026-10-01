const mongoose = require('mongoose');

const StaffSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    nip: { type: String, required: true, trim: true }, // NIP/NID
    jabatan: { type: String, required: true, trim: true },
    foto: { type: String, required: true, trim: true }, // image path
    nomorUrut: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', StaffSchema);
