const mongoose = require('mongoose');

const LulusanSchema = new mongoose.Schema(
  {
    programStudi: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgramStudi', required: true },
    fakultas: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    periode: { type: String, required: true, trim: true },
    tahun: { type: Number, required: true },
    jumlah: { type: Number, required: true, min: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lulusan', LulusanSchema);
