const mongoose = require('mongoose');

// Catatan pertanyaan ke Asisten Akademik, supaya staf bisa melihat apa yang
// ditanyakan dan di mana jawabannya gagal. IP disimpan sebagai hash. Dihapus
// otomatis setelah 90 hari (indeks TTL).
const ChatLogSchema = new mongoose.Schema(
  {
    question: { type: String, maxlength: 600 },
    answer: { type: String, maxlength: 4000 },
    sources: [{ type: String }],
    status: { type: String, enum: ['ok', 'error'], default: 'ok' },
    error: { type: String, maxlength: 40 },
    ipHash: { type: String, maxlength: 32 },
    createdAt: { type: Date, default: Date.now, expires: '90d' },
  },
  { versionKey: false }
);

module.exports = mongoose.model('ChatLog', ChatLogSchema);
