const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    year: { type: Number },
    src: { type: String, required: true, trim: true }, // path + filename to PDF
    cover: { type: String, required: true, trim: true }, // path + filename to image
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', BookSchema);
