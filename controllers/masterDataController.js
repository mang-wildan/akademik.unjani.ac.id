// Factory CRUD untuk master data sederhana (nama + singkatan, opsional
// urutan): Fakultas dan Lembaga Akreditasi. Keduanya superadmin-only
// (FR-M-11) karena mengubahnya memengaruhi banyak data turunan (prodi,
// akreditasi). Tidak dipakai Program Studi (butuh ref fakultas) atau
// Kategori (butuh jenis + slug) -- lihat kontroler masing-masing.
const { validate, schemas } = require('../validators');

module.exports = ({ Model, schema, basePath, listLabel, singularLabel, hasUrutan = false }) => {
  const layout = 'layouts/admin-v2';
  const admin = require('../utils/academicAdmin')({Model,basePath,title:listLabel,query:{sortable:hasUrutan ? ['nama','singkatan','urutan'] : ['nama','singkatan'],defaultSort:hasUrutan ? {urutan:1} : {nama:1},searchFields:['nama','singkatan']}});
  const success = admin.success;

  const showCreate = (req, res) => {
    res.renderPage(`admin/${basePath}/form`, { title: `Tambah ${singularLabel}`, mode: 'create', values: {}, errors: {}, basePath, singularLabel, hasUrutan }, layout);
  };

  const create = async (req, res) => {
    const { data, errors, ok } = validate(schemas[schema], req.body);
    if (!ok) {
      return res.status(422).renderPage(`admin/${basePath}/form`, { title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors, basePath, singularLabel, hasUrutan }, layout);
    }
    try {
      await Model.create({ ...data, createdBy: req.user._id, updatedBy: req.user._id });
    } catch (e) {
      if (e.code !== 11000) throw e;
      return res.status(422).renderPage(
        `admin/${basePath}/form`,
        { title: `Tambah ${singularLabel}`, mode: 'create', values: req.body, errors: { singkatan: 'Singkatan ini sudah dipakai.' }, basePath, singularLabel, hasUrutan },
        layout
      );
    }
    success(req,res,`${singularLabel} berhasil ditambahkan.`);
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
    res.renderPage(`admin/${basePath}/form`, { title: `Ubah ${singularLabel}`, mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, basePath, singularLabel, hasUrutan }, layout);
  };

  const update = async (req, res) => {
    const item = await findOrThrow(req.params.id);
    const { data, errors, ok } = validate(schemas[schema], req.body);
    if (!ok) {
      return res.status(422).renderPage(`admin/${basePath}/form`, { title: `Ubah ${singularLabel}`, mode: 'edit', item: item.toObject(), values: req.body, errors, basePath, singularLabel, hasUrutan }, layout);
    }
    Object.assign(item, data, { updatedBy: req.user._id });
    try {
      await item.save();
    } catch (e) {
      if (e.code !== 11000) throw e;
      return res.status(422).renderPage(
        `admin/${basePath}/form`,
        { title: `Ubah ${singularLabel}`, mode: 'edit', item: item.toObject(), values: req.body, errors: { singkatan: 'Singkatan ini sudah dipakai.' }, basePath, singularLabel, hasUrutan },
        layout
      );
    }
    success(req,res,`${singularLabel} berhasil diperbarui.`);
  };

  return { list: admin.list, showCreate, create, showEdit, update, destroy: admin.destroy, bulk: admin.bulk };
};
