const mongoose = require('mongoose');

const AcademicCalendarSchema = new mongoose.Schema(
  {
    tahunAjaran: { type: String, required: true, trim: true },
    file: { type: String, required: true, trim: true }, // path to PDF
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicCalendar', AcademicCalendarSchema);
