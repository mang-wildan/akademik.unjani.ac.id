const mongoose = require('mongoose');
const { PERINGKAT, JENIS } = require('../utils/accreditation');

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

    // F2 (SRS §5). Filled by migration 003 from institusi/unit/akreditasi above;
    // those, plus tahun and isActive, stay until the F4 admin form replaces them.
    // Status is never stored: see utils/accreditation.accreditationStatus().
    jenis: { type: String, enum: Object.values(JENIS) },
    programStudi: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgramStudi' },
    namaUnit: { type: String, trim: true, maxlength: 160 },
    peringkat: { type: String, enum: PERINGKAT },
    lembaga: { type: mongoose.Schema.Types.ObjectId, ref: 'LembagaAkreditasi' },
    nomorSK: { type: String, trim: true, maxlength: 120 },
    catatanPerpanjangan: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Accreditation', AccreditationSchema);
