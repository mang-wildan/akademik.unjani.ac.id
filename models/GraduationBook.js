const mongoose = require('mongoose');

const GraduationBookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    periode: { type: String, required: true, trim: true },
    year: { type: Number, required: true },
    src: { type: String, required: true, trim: true }, // pdf path
    cover: { type: String, required: true, trim: true }, // image path
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('GraduationBook', GraduationBookSchema);
