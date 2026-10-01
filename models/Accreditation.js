const mongoose = require('mongoose');

const AccreditationSchema = new mongoose.Schema(
  {
    institusi: { type: String, required: true, trim: true },
    unit: { type: String, required: true, trim: true },
    tahun: { type: Number, required: true },
    akreditasi: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    sertifikat: { type: String, required: true, trim: true }, // path + filename to PDF
    tanggalBerlaku: { type: Date, required: true },
    berlakuSampai: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Accreditation', AccreditationSchema);
