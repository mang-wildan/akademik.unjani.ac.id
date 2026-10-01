// Shared admin CRUD for Pengumuman and News — identical schema via
// models/plugins/content.js (title, body, kategori, status, pinned,
// featuredImage, attachments[]). This is the F4 reference pattern (SRS
// FR-M-01/02, FR-AD-05/06): docs/POLA-ADMIN.md explains it for new modules.
const fs = require('fs/promises');
const path = require('path');
const Kategori = require('../models/Kategori');
const { validate, schemas } = require('../validators');
const { uniqueSlug } = require('../utils/slug');
const { processImage } = require('../utils/image');

const PIN_LIMIT = 4;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;

module.exports = ({ Model, jenis, basePath, listLabel, singularLabel }) => {
  const populateOpts = [{ path: 'kategori', select: 'nama' }];

  const list = async (req, res) => {
    const status = String(req.query.status || '');
    const kategoriId = String(req.query.kategori || '');
    const q = String(req.query.q || '').trim();
    const filter = {};
    if (status) filter.status = status;
    if (kategoriId) filter.kategori = kategoriId;
    if (q) filter.title = { $regex: q, $options: 'i' };

    const limit = 15;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const [kategoriList, total, totalPublished, totalDraft, totalPinned] = await Promise.all([
      Kategori.find({ jenis, isActive: true }).sort({ urutan: 1 }).lean(),
      Model.countDocuments(filter),
      Model.countDocuments({ status: 'published' }),
      Model.countDocuments({ status: 'draft' }),
      Model.countDocuments({ pinned: true }),
    ]);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const currentPage = Math.min(page, totalPages);
    const items = await Model.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .skip((currentPage - 1) * limit)
      .limit(limit)
      .populate(populateOpts)
      .lean();
    const from = total === 0 ? 0 : (currentPage - 1) * limit + 1;
    const to = Math.min(currentPage * limit, total);

    res.renderPage(
      `admin/${basePath}/list`,
      {
        title: `Kelola ${listLabel}`,
        items,
        kategoriList,
        counts: { total: totalPublished + totalDraft, totalPublished, totalDraft, totalPinned },
        filters: { status, kategori: kategoriId, q },
        pagination: { page: currentPage, totalPages, total, from, to },
        basePath,
        listLabel,
        singularLabel,
      },
      'layouts/admin'
    );
  };

  const formLocals = async (overrides = {}) => ({
    kategoriList: await Kategori.find({ jenis, isActive: true }).sort({ urutan: 1 }).lean(),
    basePath,
    listLabel,
    singularLabel,
    values: {},
    errors: {},
    ...overrides,
  });

  const newForm = async (req, res) => {
    res.renderPage(`admin/${basePath}/form`, await formLocals({ title: `Tambah ${singularLabel}`, mode: 'create' }), 'layouts/admin');
  };

  const editForm = async (req, res) => {
    const item = await Model.findById(req.params.id).lean();
    if (!item) {
      const err = new Error(`${singularLabel} tidak ditemukan.`);
      err.status = 404;
      err.expose = true;
      throw err;
    }
    res.renderPage(
      `admin/${basePath}/form`,
      await formLocals({ title: `Ubah ${singularLabel}`, mode: 'edit', item, values: item }),
      'layouts/admin'
    );
  };

  // Multiple PDFs uploaded under `attachments`; each file's own name becomes
  // its title (admins rename the source file beforehand if they want a nicer one).
  const collectAttachments = files => {
    const list = Array.isArray(files?.attachments) ? files.attachments : [];
    return list.map(f => ({
      judul: path.parse(f.originalname).name.replace(/[_-]+/g, ' ').trim() || f.originalname,
      file: toPublicUrl(f.path),
      fileSize: f.size,
    }));
  };

  const removeUploadedOnError = async req => {
    const files = [req.files?.featuredImage?.[0], ...(req.files?.attachments || [])].filter(Boolean);
    await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
  };

  const create = async (req, res) => {
    const { data, errors, ok } = validate(schemas.content, req.body);
    if (!ok) {
      await removeUploadedOnError(req);
      return res.renderPage(`admin/${basePath}/form`, await formLocals({ title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors }), 'layouts/admin');
    }
    if (data.pinned) {
      const pinnedCount = await Model.countDocuments({ pinned: true });
      if (pinnedCount >= PIN_LIMIT) {
        await removeUploadedOnError(req);
        return res.renderPage(
          `admin/${basePath}/form`,
          await formLocals({ title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors: { _form: `Maksimal ${PIN_LIMIT} ${listLabel.toLowerCase()} disematkan. Lepas sematan lain terlebih dahulu.` } }),
          'layouts/admin'
        );
      }
    }

    const featuredImageFile = req.files?.featuredImage?.[0];
    let featuredImage;
    if (featuredImageFile) {
      const processed = await processImage(featuredImageFile.path);
      featuredImage = toPublicUrl(processed.file);
    }

    await Model.create({
      ...data,
      slug: await uniqueSlug(Model, data.title),
      featuredImage,
      attachments: collectAttachments(req.files),
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });
    res.redirect(`/admin/${basePath}?success=${encodeURIComponent(`${singularLabel} berhasil ditambahkan.`)}`);
  };

  const update = async (req, res) => {
    const existing = await Model.findById(req.params.id);
    if (!existing) {
      await removeUploadedOnError(req);
      const err = new Error(`${singularLabel} tidak ditemukan.`);
      err.status = 404;
      err.expose = true;
      throw err;
    }

    const { data, errors, ok } = validate(schemas.content, req.body);
    if (!ok) {
      await removeUploadedOnError(req);
      return res.renderPage(`admin/${basePath}/form`, await formLocals({ title: `Ubah ${singularLabel}`, mode: 'edit', item: existing.toObject(), values: req.body, errors }), 'layouts/admin');
    }
    if (data.pinned && !existing.pinned) {
      const pinnedCount = await Model.countDocuments({ pinned: true, _id: { $ne: existing._id } });
      if (pinnedCount >= PIN_LIMIT) {
        await removeUploadedOnError(req);
        return res.renderPage(
          `admin/${basePath}/form`,
          await formLocals({ title: `Ubah ${singularLabel}`, mode: 'edit', item: existing.toObject(), values: req.body, errors: { _form: `Maksimal ${PIN_LIMIT} ${listLabel.toLowerCase()} disematkan. Lepas sematan lain terlebih dahulu.` } }),
          'layouts/admin'
        );
      }
    }

    const featuredImageFile = req.files?.featuredImage?.[0];
    if (featuredImageFile) {
      const processed = await processImage(featuredImageFile.path);
      existing.featuredImage = toPublicUrl(processed.file);
    }
    const newAttachments = collectAttachments(req.files);
    if (newAttachments.length) existing.attachments.push(...newAttachments);
    // Admin unchecks a box to remove an existing attachment (see form). The
    // hidden sentinel distinguishes "no boxes checked" from "field absent"
    // (an unchecked checkbox sends nothing at all, so keepAttachment alone
    // can't tell "removed everything" from "this form has no attachments yet").
    if (req.body.attachmentsEditable === '1') {
      const keepIds = new Set([].concat(req.body.keepAttachment || []).map(String));
      existing.attachments = existing.attachments.filter(a => keepIds.has(String(a._id)));
    }

    Object.assign(existing, data, { slug: await uniqueSlug(Model, data.title, existing._id), updatedBy: req.user._id });
    await existing.save();
    res.redirect(`/admin/${basePath}?success=${encodeURIComponent(`${singularLabel} berhasil diperbarui.`)}`);
  };

  const destroy = async (req, res) => {
    await Model.findByIdAndDelete(req.params.id);
    res.redirect(`/admin/${basePath}?success=${encodeURIComponent(`${singularLabel} berhasil dihapus.`)}`);
  };

  // Plain POST + redirect (no fetch/AJAX), consistent with the rest of the
  // admin: every mutation is a real form, so it works without client JS too.
  const togglePin = async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) {
      const err = new Error(`${singularLabel} tidak ditemukan.`);
      err.status = 404;
      err.expose = true;
      throw err;
    }
    const pin = !item.pinned;
    if (pin) {
      const pinnedCount = await Model.countDocuments({ pinned: true, _id: { $ne: item._id } });
      if (pinnedCount >= PIN_LIMIT) {
        return res.redirect(`/admin/${basePath}?error=${encodeURIComponent(`Maksimal ${PIN_LIMIT} ${listLabel.toLowerCase()} disematkan.`)}`);
      }
    }
    item.pinned = pin;
    item.updatedBy = req.user._id;
    await item.save();
    res.redirect(`/admin/${basePath}?success=${encodeURIComponent(pin ? 'Disematkan.' : 'Sematan dilepas.')}`);
  };

  return { list, newForm, editForm, create, update, destroy, togglePin };
};
