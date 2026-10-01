const mongoose = require('mongoose');
const { SEMESTER } = require('../utils/calendar');

// One row of the calendar table (SRS FR-K-01, K-04). `selesai` empty = one-day event.
const KegiatanSchema = new mongoose.Schema(
  {
    semester: { type: String, enum: SEMESTER.map(s => s.value), required: true },
    nama: { type: String, required: true, trim: true, maxlength: 200 },
    mulai: { type: Date, required: true },
    selesai: { type: Date },
    urutan: { type: Number, default: 0 },
  },
  { _id: true }
);

// Surat edaran and other PDFs attached to this academic year (K-04).
const LampiranSchema = new mongoose.Schema(
  {
    judul: { type: String, required: true, trim: true, maxlength: 200 },
    nomorSurat: { type: String, trim: true, maxlength: 120 },
    tanggal: { type: Date },
    file: { type: String, required: true, trim: true },
    fileSize: { type: Number },
  },
  { _id: true, timestamps: true }
);

const AcademicCalendarSchema = new mongoose.Schema(
  {
    tahunAjaran: { type: String, required: true, trim: true },
    file: { type: String, required: true, trim: true }, // PDF SK Rektor
    nomorSK: { type: String, trim: true, maxlength: 120 },
    events: { type: [KegiatanSchema], default: [] },
    lampiran: { type: [LampiranSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AcademicCalendarSchema.path('events').validate(
  events => events.every(e => !e.selesai || e.selesai >= e.mulai),
  'Tanggal selesai kegiatan tidak boleh sebelum tanggal mulai.'
);

module.exports = mongoose.model('AcademicCalendar', AcademicCalendarSchema);
