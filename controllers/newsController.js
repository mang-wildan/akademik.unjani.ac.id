const News = require('../models/News');
const { normalizeTags } = require('../utils/tagNormalizer');

const slugify = str =>
  str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

exports.list = async (req, res) => {
  const news = await News.find().sort({ pinned: -1, createdAt: -1 });
  res.render('admin/news/list', {
    title: 'Berita',
    news,
    user: req.user,
  });
};

exports.newForm = (req, res) => {
  res.render('admin/news/create', {
    title: 'Tambah Berita',
    values: {},
    error: req.query.error,
    user: req.user,
  });
};

exports.create = async (req, res) => {
  const { title, body, status, tags } = req.body;
  const slug = slugify(title || '');
  const pinned = req.body.pinned === 'on' || req.body.pinned === 'true';
  const normalizedTags = normalizeTags(tags);
  if (pinned) {
    const pinnedCount = await News.countDocuments({ pinned: true });
    if (pinnedCount >= 4) {
      return res.render('admin/news/create', {
        title: 'Tambah Berita',
        user: req.user,
        error: 'Pin maksimal 4 berita. Unpin berita lain terlebih dahulu.',
        values: {
          title,
          body,
          status,
          tags: normalizedTags,
          pinned,
        },
      });
    }
  }
  await News.create({
    title,
    body,
    status: status || 'draft',
    slug,
    tags: normalizedTags,
    pinned,
    createdBy: req.user?._id,
    updatedBy: req.user?._id,
    featuredImage: req.file ? `/uploads/news/${req.file.filename}` : undefined,
  });
  res.redirect('/admin/news?success=Berita berhasil ditambahkan');
};

exports.editForm = async (req, res) => {
  const news = await News.findById(req.params.id);
  if (!news) return res.redirect('/admin/news?error=Data tidak ditemukan');
  const values = news.toObject();
  values.tags = normalizeTags(values.tags);
  res.render('admin/news/edit', {
    title: 'Edit Berita',
    values,
    error: req.query.error,
    user: req.user,
  });
};

exports.update = async (req, res) => {
  const { title, body, status, tags } = req.body;
  const slug = slugify(title || '');
  const existing = await News.findById(req.params.id);
  if (!existing) return res.redirect('/admin/news?error=Data tidak ditemukan');
  const pinned = req.body.pinned === 'on' || req.body.pinned === 'true';
  const normalizedTags = normalizeTags(tags);
  if (pinned) {
    const pinnedCount = await News.countDocuments({ pinned: true, _id: { $ne: existing._id } });
    if (pinnedCount >= 4) {
      return res.render('admin/news/edit', {
        title: 'Edit Berita',
        user: req.user,
        error: 'Pin maksimal 4 berita. Unpin berita lain terlebih dahulu.',
        values: {
          ...existing.toObject(),
          title,
          body,
          status,
          tags: normalizedTags,
          pinned,
        },
      });
    }
  }
  const update = {
    title,
    body,
    status: status || 'draft',
    slug,
    tags: normalizedTags,
    pinned,
    updatedBy: req.user?._id,
  };
  if (req.file) {
    update.featuredImage = `/uploads/news/${req.file.filename}`;
  }
  await News.findByIdAndUpdate(req.params.id, update);
  res.redirect('/admin/news?success=Berita berhasil diperbarui');
};

exports.togglePin = async (req, res) => {
  try {
    const item = await News.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    const pinned = req.body.pinned === true || req.body.pinned === 'true' || req.body.pinned === 'on';
    if (pinned && !item.pinned) {
      const pinnedCount = await News.countDocuments({ pinned: true, _id: { $ne: item._id } });
      if (pinnedCount >= 4) {
        return res.status(400).json({
          success: false,
          message: 'Pin maksimal 4 berita. Unpin berita lain terlebih dahulu.',
        });
      }
    }
    item.pinned = pinned;
    item.updatedBy = req.user?._id || item.updatedBy;
    await item.save();
    return res.json({
      success: true,
      pinned: item.pinned,
      message: pinned ? 'Berita berhasil di-pin.' : 'Pin berita dilepas.',
    });
  } catch (err) {
    console.error('Toggle pin berita error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pin berita.' });
  }
};

exports.remove = async (req, res) => {
  await News.findByIdAndDelete(req.params.id);
  res.redirect('/admin/news?success=Berita berhasil dihapus');
};
