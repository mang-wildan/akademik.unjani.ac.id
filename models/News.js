const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    slug: { type: String, required: true, unique: true, trim: true },
    featuredImage: { type: String, trim: true },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  tags: [{ type: String, trim: true }],
  pinned: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

NewsSchema.plugin(require('./plugins/content'));

module.exports = mongoose.model('News', NewsSchema);
