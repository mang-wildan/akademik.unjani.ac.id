const mongoose = require('mongoose');
const { PERINGKAT, JENIS } = require('../utils/accreditation');

const AccreditationSchema = new mongoose.Schema(
  {
    // Legacy pre-F4 fields. The F4 admin form (controllers/accreditationController.js)
    // writes jenis/namaUnit/programStudi/peringkat below instead; these stay
    // optional so old rows keep their data without blocking new writes.
    institusi: { type: String, trim: true },
    unit: { type: String, trim: true },
    tahun: { type: Number },
    akreditasi: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sertifikat: { type: String, required: true, trim: true }, // path + filename to PDF
    tanggalBerlaku: { type: Date, required: true },
    berlakuSampai: { type: Date, required: true },

    // F2 (SRS §5). Filled by migration 003 from institusi/unit/akreditasi above.
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
