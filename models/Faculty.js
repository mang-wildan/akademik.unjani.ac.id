const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    singkatan: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Faculty', FacultySchema);
