// Factory CRUD untuk master data sederhana (nama + singkatan, opsional
// urutan): Fakultas dan Lembaga Akreditasi. Keduanya superadmin-only
// (FR-M-11) karena mengubahnya memengaruhi banyak data turunan (prodi,
// akreditasi). Tidak dipakai Program Studi (butuh ref fakultas) atau
// Kategori (butuh jenis + slug) -- lihat kontroler masing-masing.
const { validate, schemas } = require('../validators');

module.exports = ({ Model, schema, basePath, listLabel, singularLabel, hasUrutan = false }) => {
  const list = async (req, res) => {
    const items = await Model.find().sort(hasUrutan ? { urutan: 1 } : { nama: 1 }).lean();
    res.renderPage(`admin/${basePath}/list`, { title: listLabel, items, basePath, listLabel, singularLabel, hasUrutan }, 'layouts/admin');
  };

  const showCreate = (req, res) => {
    res.renderPage(`admin/${basePath}/form`, { title: `Tambah ${singularLabel}`, mode: 'create', values: {}, errors: {}, basePath, singularLabel, hasUrutan }, 'layouts/admin');
  };

  const create = async (req, res) => {
    const { data, errors, ok } = validate(schemas[schema], req.body);
    if (!ok) {
      return res.renderPage(`admin/${basePath}/form`, { title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors, basePath, singularLabel, hasUrutan }, 'layouts/admin');
    }
    try {
      await Model.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
    } catch (e) {
      if (e.code !== 11000) throw e;
      return res.renderPage(
        `admin/${basePath}/form`,
        { title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors: { singkatan: 'Singkatan ini sudah dipakai.' }, basePath, singularLabel, hasUrutan },
        'layouts/admin'
      );
    }
    res.redirect(`/admin/${basePath}?success=${encodeURIComponent(`${singularLabel} berhasil ditambahkan.`)}`);
  };

  const findOrThrow = async id => {
    const item = await Model.findById(id);
    if (!item) {
      const err = new Error(`${singularLabel} tidak ditemukan.`);
      err.status = 404;
      err.expose = true;
      throw err;
    }
    return item;
  };

  const showEdit = async (req, res) => {
    const item = await findOrThrow(req.params.id);
    res.renderPage(`admin/${basePath}/form`, { title: `Ubah ${singularLabel}`, mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, basePath, singularLabel, hasUrutan }, 'layouts/admin');
  };

  const update = async (req, res) => {
    const item = await findOrThrow(req.params.id);
    const { data, errors, ok } = validate(schemas[schema], req.body);
    if (!ok) {
      return res.renderPage(`admin/${basePath}/form`, { title: `Ubah ${singularLabel}`, mode: 'edit', item: item.toObject(), values: req.body, errors, basePath, singularLabel, hasUrutan }, 'layouts/admin');
    }
    Object.assign(item, data, { updatedBy: req.user._id });
    try {
      await item.save();
    } catch (e) {
      if (e.code !== 11000) throw e;
      return res.renderPage(
        `admin/${basePath}/form`,
        { title: `Ubah ${singularLabel}`, mode: 'edit', item: item.toObject(), values: req.body, errors: { singkatan: 'Singkatan ini sudah dipakai.' }, basePath, singularLabel, hasUrutan },
        'layouts/admin'
      );
    }
    res.redirect(`/admin/${basePath}?success=${encodeURIComponent(`${singularLabel} berhasil diperbarui.`)}`);
  };

  const destroy = async (req, res) => {
    await Model.findByIdAndDelete(req.params.id);
    res.redirect(`/admin/${basePath}?success=${encodeURIComponent(`${singularLabel} berhasil dihapus.`)}`);
  };

  return { list, showCreate, create, showEdit, update, destroy };
};
