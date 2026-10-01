const Pengumuman = require('../models/Pengumuman');
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
  const pengumuman = await Pengumuman.find().sort({ pinned: -1, createdAt: -1 });
  res.render('admin/pengumuman/list', {
    title: 'Pengumuman',
    pengumuman,
    user: req.user,
  });
};

exports.newForm = (req, res) => {
  res.render('admin/pengumuman/create', {
    title: 'Tambah Pengumuman',
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
    const pinnedCount = await Pengumuman.countDocuments({ pinned: true });
    if (pinnedCount >= 4) {
      return res.render('admin/pengumuman/create', {
        title: 'Tambah Pengumuman',
        user: req.user,
        error: 'Pin maksimal 4 pengumuman. Unpin pengumuman lain terlebih dahulu.',
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
  await Pengumuman.create({
    title,
    body,
    status: status || 'draft',
    slug,
    tags: normalizedTags,
    pinned,
    featuredImage: req.file ? `/uploads/pengumuman/${req.file.filename}` : undefined,
    createdBy: req.user?._id,
    updatedBy: req.user?._id,
  });
  res.redirect('/admin/pengumuman?success=Pengumuman berhasil ditambahkan');
};

exports.editForm = async (req, res) => {
  const item = await Pengumuman.findById(req.params.id);
  if (!item) return res.redirect('/admin/pengumuman?error=Data tidak ditemukan');
  const values = item.toObject();
  values.tags = normalizeTags(values.tags);
  res.render('admin/pengumuman/edit', {
    title: 'Edit Pengumuman',
    values,
    error: req.query.error,
    user: req.user,
  });
};

exports.update = async (req, res) => {
  const { title, body, status, tags } = req.body;
  const slug = slugify(title || '');
  const existing = await Pengumuman.findById(req.params.id);
  if (!existing) return res.redirect('/admin/pengumuman?error=Data tidak ditemukan');
  const pinned = req.body.pinned === 'on' || req.body.pinned === 'true';
  const normalizedTags = normalizeTags(tags);
  if (pinned) {
    const pinnedCount = await Pengumuman.countDocuments({ pinned: true, _id: { $ne: existing._id } });
    if (pinnedCount >= 4) {
      return res.render('admin/pengumuman/edit', {
        title: 'Edit Pengumuman',
        user: req.user,
        error: 'Pin maksimal 4 pengumuman. Unpin pengumuman lain terlebih dahulu.',
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
  if (req.file) update.featuredImage = `/uploads/pengumuman/${req.file.filename}`;

  await Pengumuman.findByIdAndUpdate(req.params.id, update);
  res.redirect('/admin/pengumuman?success=Pengumuman berhasil diperbarui');
};

exports.togglePin = async (req, res) => {
  try {
    const item = await Pengumuman.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });
    const pinned = req.body.pinned === true || req.body.pinned === 'true' || req.body.pinned === 'on';
    if (pinned && !item.pinned) {
      const pinnedCount = await Pengumuman.countDocuments({ pinned: true, _id: { $ne: item._id } });
      if (pinnedCount >= 4) {
        return res.status(400).json({
          success: false,
          message: 'Pin maksimal 4 pengumuman. Unpin pengumuman lain terlebih dahulu.',
        });
      }
    }
    item.pinned = pinned;
    item.updatedBy = req.user?._id || item.updatedBy;
    await item.save();
    return res.json({
      success: true,
      pinned: item.pinned,
      message: pinned ? 'Pengumuman berhasil di-pin.' : 'Pin pengumuman dilepas.',
    });
  } catch (err) {
    console.error('Toggle pin pengumuman error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memperbarui pin pengumuman.' });
  }
};

exports.remove = async (req, res) => {
  await Pengumuman.findByIdAndDelete(req.params.id);
  res.redirect('/admin/pengumuman?success=Pengumuman berhasil dihapus');
};
