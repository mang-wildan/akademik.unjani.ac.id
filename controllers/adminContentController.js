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
const { sanitizeHtml } = require('../utils/html');
const { parseListQuery } = require('../utils/listQuery');
const { bulkHandler } = require('../utils/bulk');
const { removeUploadFiles } = require('../utils/upload');

const ADMIN_LAYOUT = 'layouts/admin-v2';
const PIN_LIMIT = 4;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;

module.exports = ({ Model, jenis, basePath, listLabel, singularLabel, requireFeaturedImageOnPublish = false }) => {
  const populateOpts = [{ path: 'kategori', select: 'nama' }];
  const listQuery = categories => ({
    sortable: ['title', 'updatedAt'], defaultSort: { pinned: -1, updatedAt: -1 },
    filters: { status: ['draft', 'published'], kategori: categories.map(k => String(k._id)) },
  });
  const categories = () => Kategori.find({ jenis, isActive: true }).sort({ urutan: 1 }).lean();
  const success = (req, res, message) => req.query.partial === '1'
    ? res.json({ ok: true, message })
    : res.redirect(303, `/admin/${basePath}?success=${encodeURIComponent(message)}`);

  const deleteItem = async id => {
    const item = await Model.findById(id).lean();
    if (!item) return 0;
    await removeUploadFiles(basePath, [item.featuredImage, ...(item.attachments || []).map(a => a.file)]);
    await Model.deleteOne({ _id: id });
    return 1;
  };
  const bulk = async (req, res) => bulkHandler({
    Model, basePath, noun: listLabel.toLowerCase(), listQuery: listQuery(await categories()),
    actions: {
      publish: requireFeaturedImageOnPublish ? { label: 'diterbitkan', run: async ids => {
        const rows = await Model.find({ _id: { $in: ids } }).select('_id featuredImage').lean();
        const ready = rows.filter(row => typeof row.featuredImage === 'string' && row.featuredImage.trim()).map(row => row._id);
        const done = ready.length ? (await Model.updateMany({ _id: { $in: ready } }, { status: 'published', updatedBy: req.user._id })).matchedCount : 0;
        return { done, failed: ids.length - done };
      } } : { label: 'diterbitkan', update: { status: 'published', updatedBy: req.user._id } },
      unpublish: { label: 'dijadikan draf', update: { status: 'draft', updatedBy: req.user._id } },
      delete: { label: 'dihapus', run: async ids => {
        let done = 0, failed = 0;
        for (const id of ids) {
          try { done += await deleteItem(id); }
          catch (err) { failed++; console.error('Gagal menghapus konten', id, err); }
        }
        return { done, failed };
      } },
    },
  })(req, res);

  const list = async (req, res) => {
    const kategoriList = await categories();
    const { filter, sort, page, limit, state } = parseListQuery(req.query, listQuery(kategoriList));
    const [total, totalPublished, totalDraft, totalPinned] = await Promise.all([
      Model.countDocuments(filter),
      Model.countDocuments({ status: 'published' }),
      Model.countDocuments({ status: 'draft' }),
      Model.countDocuments({ pinned: true }),
    ]);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const currentPage = Math.min(page, totalPages);
    const items = await Model.find(filter)
      .select('-body')
      .sort(sort)
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
        filters: { status: '', kategori: '', q: '', ...state },
        state: { ...state, page: String(currentPage) },
        pagination: { page: currentPage, totalPages, total, from, to, pageSize: limit },
        basePath,
        listLabel,
        singularLabel,
      },
      ADMIN_LAYOUT
    );
  };

  const formLocals = async (overrides = {}) => ({
    kategoriList: await Kategori.find({ jenis, isActive: true }).sort({ urutan: 1 }).lean(),
    basePath,
    listLabel,
    singularLabel,
    requireFeaturedImageOnPublish,
    errors: {},
    ...overrides,
    values: { ...overrides.values, body: sanitizeHtml(overrides.values?.body) },
  });

  const newForm = async (req, res) => {
    res.renderPage(`admin/${basePath}/form`, await formLocals({ title: `Tambah ${singularLabel}`, mode: 'create' }), ADMIN_LAYOUT);
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
      ADMIN_LAYOUT
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
    if (req.body.intent === 'publish') req.body.status = 'published';
    const { data, errors, ok } = validate(schemas.content, req.body);
    if (!ok) {
      await removeUploadedOnError(req);
      return res.status(422).renderPage(`admin/${basePath}/form`, await formLocals({ title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors }), ADMIN_LAYOUT);
    }
    if (data.pinned) {
      const pinnedCount = await Model.countDocuments({ pinned: true });
      if (pinnedCount >= PIN_LIMIT) {
        await removeUploadedOnError(req);
        return res.status(422).renderPage(
          `admin/${basePath}/form`,
          await formLocals({ title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors: { _form: `Maksimal ${PIN_LIMIT} ${listLabel.toLowerCase()} disematkan. Lepas sematan lain terlebih dahulu.` } }),
          ADMIN_LAYOUT
        );
      }
    }

    const featuredImageFile = req.files?.featuredImage?.[0];
    if (requireFeaturedImageOnPublish && data.status === 'published' && !featuredImageFile) {
      await removeUploadedOnError(req);
      return res.status(422).renderPage(
        `admin/${basePath}/form`,
        await formLocals({ title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors: { featuredImage: 'Gambar sampul wajib diisi saat status Terbit.' } }),
        ADMIN_LAYOUT
      );
    }
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
    success(req, res, `${singularLabel} berhasil ditambahkan.`);
  };

  const update = async (req, res) => {
    if (req.body.intent === 'publish') req.body.status = 'published';
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
      return res.status(422).renderPage(`admin/${basePath}/form`, await formLocals({ title: `Ubah ${singularLabel}`, mode: 'edit', item: existing.toObject(), values: req.body, errors }), ADMIN_LAYOUT);
    }
    if (data.pinned && !existing.pinned) {
      const pinnedCount = await Model.countDocuments({ pinned: true, _id: { $ne: existing._id } });
      if (pinnedCount >= PIN_LIMIT) {
        await removeUploadedOnError(req);
        return res.status(422).renderPage(
          `admin/${basePath}/form`,
          await formLocals({ title: `Ubah ${singularLabel}`, mode: 'edit', item: existing.toObject(), values: req.body, errors: { _form: `Maksimal ${PIN_LIMIT} ${listLabel.toLowerCase()} disematkan. Lepas sematan lain terlebih dahulu.` } }),
          ADMIN_LAYOUT
        );
      }
    }

    const featuredImageFile = req.files?.featuredImage?.[0];
    if (requireFeaturedImageOnPublish && data.status === 'published' && !featuredImageFile && !existing.featuredImage) {
      await removeUploadedOnError(req);
      return res.status(422).renderPage(
        `admin/${basePath}/form`,
        await formLocals({ title: `Ubah ${singularLabel}`, mode: 'edit', item: existing.toObject(), values: req.body, errors: { featuredImage: 'Gambar sampul wajib diisi saat status Terbit.' } }),
        ADMIN_LAYOUT
      );
    }
    const removedFiles = [];
    if (featuredImageFile) {
      const processed = await processImage(featuredImageFile.path);
      removedFiles.push(existing.featuredImage);
      existing.featuredImage = toPublicUrl(processed.file);
    }
    const newAttachments = collectAttachments(req.files);
    // Admin unchecks a box to remove an existing attachment (see form). The
    // hidden sentinel distinguishes "no boxes checked" from "field absent"
    // (an unchecked checkbox sends nothing at all, so keepAttachment alone
    // can't tell "removed everything" from "this form has no attachments yet").
    if (req.body.attachmentsEditable === '1') {
      const keepIds = new Set([].concat(req.body.keepAttachment || []).map(String));
      removedFiles.push(...existing.attachments.filter(a => !keepIds.has(String(a._id))).map(a => a.file));
      existing.attachments = existing.attachments.filter(a => keepIds.has(String(a._id)));
    }

    existing.attachments.push(...newAttachments);
    Object.assign(existing, data, { slug: await uniqueSlug(Model, data.title, existing._id), updatedBy: req.user._id });
    await existing.save();
    await removeUploadFiles(basePath, removedFiles);
    success(req, res, `${singularLabel} berhasil diperbarui.`);
  };

  const destroy = async (req, res) => {
    await deleteItem(req.params.id);
    success(req, res, `${singularLabel} berhasil dihapus.`);
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

  // Pratinjau (FR-AD-12): memakai tampilan detail publik, tetapi juga untuk draf; hanya admin yang bisa membukanya.
  const preview = async (req, res) => {
    const item = await Model.findById(req.params.id)
      .populate('kategori', 'nama')
      .populate('createdBy', 'name')
      .lean();
    if (!item) {
      const err = new Error(`${singularLabel} tidak ditemukan.`);
      err.status = 404;
      err.expose = true;
      throw err;
    }
    item.body = sanitizeHtml(item.body);
    res.renderPage(jenis === 'berita' ? 'landing/berita-show' : 'landing/pengumuman-show', {
      title: `Pratinjau: ${item.title}`,
      description: item.title,
      item,
      lainnya: [],
      kategoriList: [],
      basePath: jenis === 'berita' ? '/berita' : '/pengumuman',
      noindex: true,
      alertSuccess: item.status === 'published' ? 'Pratinjau. Halaman ini sudah terbit.' : 'Pratinjau draf. Halaman ini belum terbit dan hanya terlihat oleh admin.',
    });
  };

  return { bulk, list, newForm, editForm, create, update, destroy, togglePin, preview };
};
