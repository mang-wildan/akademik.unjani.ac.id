// Admin CRUD untuk Unit (FR-M-10), ditampilkan di Profil, Struktur Organisasi, dan slideshow Beranda (F8).
// Gambar dikecilkan ke WebP 900 px (kartu slideshow tidak butuh lebih).
const path = require('path');
const Unit = require('../models/Unit');
const { validate, schemas } = require('../validators');
const { removeUploadFiles } = require('../utils/upload');
const ADMIN_LAYOUT = 'layouts/admin-v2';
const { processImage } = require('../utils/image');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  if (!req.file) return;
  const converted = path.join(path.dirname(req.file.path), path.parse(req.file.path).name+'.webp');
  await removeUploadFiles('unit',[toPublicUrl(req.file.path),toPublicUrl(converted)]);
};

const LIST_QUERY = {sortable:['nama','updatedAt'],defaultSort:{createdAt:-1},searchFields:['nama','deskripsi']};
const admin = require('../utils/academicAdmin')({Model:Unit,basePath:'unit',title:'Unit',query:LIST_QUERY,files:item=>[item.img]});
exports.list = admin.list;
exports.bulk = admin.bulk;

exports.showCreate = (req, res) => {
  res.renderPage('admin/unit/form', { title: 'Tambah Unit', mode: 'create', values: {}, errors: {} }, ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.unit, req.body);
  const fieldErrors = errors || {};
  if (!req.file) fieldErrors.img = 'Gambar wajib diisi.';
  if (!ok || fieldErrors.img) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/unit/form', { title: 'Tambah Unit', mode: 'create', values: req.body, errors: fieldErrors }, ADMIN_LAYOUT);
  }
  try { await Unit.create({ ...data, img: toPublicUrl((await processImage(req.file.path, { maxWidth: 900 })).file), createdBy: req.user._id, updatedBy: req.user._id }); }
  catch (err) { await removeUploaded(req); throw err; }
  admin.success(req,res,'Unit berhasil ditambahkan.');
};

const findOrThrow = async id => {
  const item = await Unit.findById(id);
  if (!item) {
    const err = new Error('Unit tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/unit/form', { title: 'Ubah Unit', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err=>{await removeUploaded(req);throw err;});
  const { data, errors, ok } = validate(schemas.unit, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/unit/form', { title: 'Ubah Unit', mode: 'edit', item: item.toObject(), values: req.body, errors }, ADMIN_LAYOUT);
  }
  const previous = item.img;
  try {
    if (req.file) item.img = toPublicUrl((await processImage(req.file.path, { maxWidth: 900 })).file);
    Object.assign(item, data, { updatedBy: req.user._id });
    await item.save();
  } catch (err) { await removeUploaded(req); throw err; }
  if (req.file) await removeUploadFiles('unit',[previous]);
  admin.success(req,res,'Unit berhasil diperbarui.');
};

exports.destroy = admin.destroy;
