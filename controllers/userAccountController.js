// Kelola akun dan reset password khusus Super Admin (FR-M-13).
const User = require('../models/User');
const { validate, schemas } = require('../validators');
const { isSuperadmin } = require('../utils/roles');
const { parseListQuery } = require('../utils/listQuery');
const { bulkHandler } = require('../utils/bulk');
const listQuery = {
  searchFields: ['name', 'email'], sortable: ['name', 'email', 'createdAt', 'lastLoginAt'],
  defaultSort: { createdAt: -1 }, filters: { role: ['superadmin', 'admin', 'editor'], isActive: [true, false] },
};
const success = (req, res, message) => req.query.partial === '1'
  ? res.json({ ok: true, message })
  : res.redirect(303, `/admin/users?success=${encodeURIComponent(message)}`);

exports.bulk = bulkHandler({ Model: User, basePath: 'users', noun: 'akun', listQuery,
  exclude: req => [req.user._id],
  actions: { deactivate: { label: 'dinonaktifkan', update: { isActive: false } } },
});

exports.list = async (req, res) => {
  const parsed = parseListQuery(req.query, listQuery);
  const { filter, sort, limit, state } = parsed;
  const total = await User.countDocuments(filter);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = Math.min(parsed.page, totalPages);
  const items = await User.find(filter).select('-password').sort(sort).skip((page - 1) * limit).limit(limit).lean();
  res.renderPage('admin/users/list', { title: 'Akun Admin', items, state: { ...state, page: String(page) },
    pagination: { page, totalPages, total, pageSize: limit }, currentUserId: String(req.user._id) }, 'layouts/admin-v2');
};

exports.showCreate = (req, res) => {
  res.renderPage('admin/users/form', { title: 'Tambah Akun', mode: 'create', values: { role: 'editor' }, errors: {} }, 'layouts/admin-v2');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.userCreate, req.body);
  if (!ok) {
    return res.status(422).renderPage('admin/users/form', { title: 'Tambah Akun', mode: 'create', values: req.body, errors }, 'layouts/admin-v2');
  }
  const exists = await User.findOne({ email: data.email });
  if (exists) {
    return res.status(422).renderPage('admin/users/form', { title: 'Tambah Akun', mode: 'create', values: req.body, errors: { email: 'Email ini sudah dipakai.' } }, 'layouts/admin-v2');
  }
  await User.create(data);
  success(req, res, 'Akun berhasil ditambahkan.');
};

const findOrThrow = async id => {
  const item = await User.findById(id);
  if (!item) {
    const err = new Error('Akun tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

const countActiveSuperadmins = (excludeId) => User.countDocuments({ role: { $in: ['superadmin', 'admin'] }, isActive: true, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/users/form', { title: 'Ubah Akun', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, isSelf: String(item._id) === String(req.user._id) }, 'layouts/admin-v2');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.userUpdate, req.body);
  const isSelf = String(item._id) === String(req.user._id);
  if (!ok) {
    return res.status(422).renderPage('admin/users/form', { title: 'Ubah Akun', mode: 'edit', item: item.toObject(), values: req.body, errors, isSelf }, 'layouts/admin-v2');
  }
  const dup = await User.findOne({ email: data.email, _id: { $ne: item._id } });
  if (dup) {
    return res.status(422).renderPage('admin/users/form', { title: 'Ubah Akun', mode: 'edit', item: item.toObject(), values: req.body, errors: { email: 'Email ini sudah dipakai.' }, isSelf }, 'layouts/admin-v2');
  }
  // Pertahankan setidaknya satu Super Admin aktif, termasuk peran lama.
  const losesSuperadmin = isSuperadmin(item) && (data.role !== 'superadmin' || !data.isActive);
  if (losesSuperadmin && (await countActiveSuperadmins(item._id)) === 0) {
    return res.status(422).renderPage(
      'admin/users/form',
      { title: 'Ubah Akun', mode: 'edit', item: item.toObject(), values: req.body, errors: { _form: 'Tidak bisa menonaktifkan atau menurunkan peran akun ini -- tidak akan ada Super Admin aktif yang tersisa.' }, isSelf },
      'layouts/admin-v2'
    );
  }
  Object.assign(item, data);
  await item.save();
  success(req, res, 'Akun berhasil diperbarui.');
};

exports.resetPasswordForm = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/users/reset-password', { title: `Reset Password ${item.name || item.email}`, item: item.toObject(), errors: {} }, 'layouts/admin-v2');
};

exports.resetPassword = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.resetPasswordByAdmin, req.body);
  if (!ok) {
    return res.status(422).renderPage('admin/users/reset-password', { title: `Reset Password ${item.name || item.email}`, item: item.toObject(), errors }, 'layouts/admin-v2');
  }
  item.password = data.newPassword;
  await item.save();
  success(req, res, 'Password berhasil direset.');
};

exports.destroy = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  if (String(item._id) === String(req.user._id)) {
    return res.redirect(303, `/admin/users?error=${encodeURIComponent('Tidak bisa menghapus akun yang sedang digunakan.')}`);
  }
  if (isSuperadmin(item) && item.isActive && (await countActiveSuperadmins(item._id)) === 0) {
    return res.redirect(303, `/admin/users?error=${encodeURIComponent('Tidak bisa menghapus Super Admin aktif terakhir.')}`);
  }
  await User.findByIdAndDelete(req.params.id);
  success(req, res, 'Akun berhasil dihapus.');
};
