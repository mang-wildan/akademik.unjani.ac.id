const mongoose = require('mongoose');
const { makeExcerpt } = require('../../utils/html');

// Shared by News and Pengumuman (SRS §5): category, attachments, and a plain
// excerpt kept in sync with `body` on every write path the controllers use
// (create/save and findByIdAndUpdate).
module.exports = function contentPlugin(schema) {
  schema.add({
    kategori: { type: mongoose.Schema.Types.ObjectId, ref: 'Kategori' },
    excerpt: { type: String, trim: true, maxlength: 300 },
    attachments: {
      type: [
        new mongoose.Schema(
          {
            judul: { type: String, required: true, trim: true, maxlength: 200 },
            file: { type: String, required: true, trim: true },
            fileSize: { type: Number },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
  });

  schema.pre('save', function syncExcerpt() {
    if (this.isModified('body')) this.excerpt = makeExcerpt(this.body);
  });

  schema.pre(['findOneAndUpdate', 'updateOne'], function syncExcerptOnUpdate() {
    const update = this.getUpdate() || {};
    const body = update.body !== undefined ? update.body : update.$set && update.$set.body;
    if (body !== undefined) this.set({ excerpt: makeExcerpt(body) });
  });
};
