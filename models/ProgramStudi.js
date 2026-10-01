const mongoose = require('mongoose');

const ProgramStudiSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    singkatan: { type: String, required: true, trim: true },
    fakultas: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProgramStudi', ProgramStudiSchema);
