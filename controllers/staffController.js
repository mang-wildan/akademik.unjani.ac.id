// Admin CRUD untuk Pimpinan & Staf (FR-M-09). `tingkat` menentukan blok
// hierarki di halaman publik (lihat utils/staffTingkat.js dan
// getPimpinanStaffLanding); gelar ditampilkan di depan nama.
// NIP/NID boleh diisi admin (dipakai internal)
// tapi tidak pernah dikirim ke halaman publik (K-05).
const fs = require('fs/promises');
const path = require('path');
const Staff = require('../models/Staff');
const { validate, schemas } = require('../validators');
const { removeUploadFiles } = require('../utils/upload');
const ADMIN_LAYOUT = 'layouts/admin-v2';
const { VALUES } = require('../utils/staffTingkat');
const { parseListQuery } = require('../utils/listQuery');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  if (req.file) await fs.unlink(req.file.path).catch(() => {});
};

const LIST_QUERY = { sortable: ['nama','jabatan','nomorUrut','updatedAt'], defaultSort: {nomorUrut:1,createdAt:-1}, searchFields:['nama','jabatan','gelar'], filters:{tingkat:require('../utils/staffTingkat').VALUES} };
const admin = require('../utils/academicAdmin')({Model:Staff,basePath:'staff',title:'Pimpinan & Staf',query:LIST_QUERY,files:item=>[item.foto]});
exports.list = async (req,res) => {
  const {filter,sort,page:requested,limit,state} = parseListQuery(req.query,LIST_QUERY);
  if (state.sort) return admin.list(req,res);
  const total = await Staff.countDocuments(filter);
  const totalPages = Math.max(Math.ceil(total/limit),1),page=Math.min(requested,totalPages);
  // Hierarki harus diurutkan sebelum paginasi, termasuk tingkat lama yang kosong.
  const items = await Staff.aggregate([
    {$match:filter},
    {$addFields:{_rank:{$switch:{branches:VALUES.map((value,index)=>({case:{$eq:['$tingkat',value]},then:index})),default:VALUES.length-1}}}},
    {$sort:{_rank:1,...sort,_id:1}},{$skip:(page-1)*limit},{$limit:limit},{$unset:'_rank'},
  ]);
  res.renderPage('admin/staff/list',{title:'Pimpinan & Staf',items,state:{...state,page:String(page)},pagination:{page,totalPages,total,pageSize:limit}},ADMIN_LAYOUT);
};
exports.bulk = admin.bulk;

exports.showCreate = (req, res) => {
  res.renderPage('admin/staff/form', { title: 'Tambah Staf', mode: 'create', values: { tingkat: 'anggota', nomorUrut: 0 }, errors: {} }, ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.staff, req.body);
  const fieldErrors = errors || {};
  if (!req.file) fieldErrors.foto = 'Foto wajib diisi.';
  if (!ok || fieldErrors.foto) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/staff/form', { title: 'Tambah Staf', mode: 'create', values: req.body, errors: fieldErrors }, ADMIN_LAYOUT);
  }
  try { await Staff.create({ ...data, foto: toPublicUrl(req.file.path), createdBy: req.user._id, updatedBy: req.user._id }); }
  catch (err) { await removeUploaded(req); throw err; }
  admin.success(req,res,'Staf berhasil ditambahkan.');
};

const findOrThrow = async id => {
  const item = await Staff.findById(id);
  if (!item) {
    const err = new Error('Staf tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/staff/form', { title: 'Ubah Staf', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {} }, ADMIN_LAYOUT);
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err=>{await removeUploaded(req);throw err;});
  const { data, errors, ok } = validate(schemas.staff, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/staff/form', { title: 'Ubah Staf', mode: 'edit', item: item.toObject(), values: req.body, errors }, ADMIN_LAYOUT);
  }
  const previous = item.foto;
  try {
    if (req.file) item.foto = toPublicUrl(req.file.path);
    Object.assign(item, data, { updatedBy: req.user._id });
    await item.save();
  } catch (err) { await removeUploaded(req); throw err; }
  if (req.file) await removeUploadFiles('staff',[previous]);
  admin.success(req,res,'Staf berhasil diperbarui.');
};

exports.destroy = admin.destroy;
