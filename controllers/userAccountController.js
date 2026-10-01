// Admin untuk Akun Admin (FR-M-13), superadmin-only. Termasuk reset password
// Super Admin untuk akun lain (ditunda dari bagian Autentikasi F4 -- lihat
// docs/TODO.md) karena butuh halaman kelola akun lebih dulu.
const User = require('../models/User');
const { validate, schemas } = require('../validators');
const { isSuperadmin } = require('../utils/roles');

exports.list = async (req, res) => {
  const items = await User.find().select('-password').sort({ createdAt: -1 }).lean();
  res.renderPage('admin/users/list', { title: 'Akun Admin', items, currentUserId: String(req.user._id) }, 'layouts/admin');
};

exports.showCreate = (req, res) => {
  res.renderPage('admin/users/form', { title: 'Tambah Akun', mode: 'create', values: { role: 'editor' }, errors: {} }, 'layouts/admin');
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.userCreate, req.body);
  if (!ok) {
    return res.renderPage('admin/users/form', { title: 'Tambah Akun', mode: 'create', values: req.body, errors }, 'layouts/admin');
  }
  const exists = await User.findOne({ email: data.email });
  if (exists) {
    return res.renderPage('admin/users/form', { title: 'Tambah Akun', mode: 'create', values: req.body, errors: { email: 'Email ini sudah dipakai.' } }, 'layouts/admin');
  }
  await User.create(data);
  res.redirect(`/admin/users?success=${encodeURIComponent('Akun berhasil ditambahkan.')}`);
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

const countActiveSuperadmins = (excludeId) => User.countDocuments({ role: 'superadmin', isActive: true, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/users/form', { title: 'Ubah Akun', mode: 'edit', item: item.toObject(), values: item.toObject(), errors: {}, isSelf: String(item._id) === String(req.user._id) }, 'layouts/admin');
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.userUpdate, req.body);
  const isSelf = String(item._id) === String(req.user._id);
  if (!ok) {
    return res.renderPage('admin/users/form', { title: 'Ubah Akun', mode: 'edit', item: item.toObject(), values: req.body, errors, isSelf }, 'layouts/admin');
  }
  const dup = await User.findOne({ email: data.email, _id: { $ne: item._id } });
  if (dup) {
    return res.renderPage('admin/users/form', { title: 'Ubah Akun', mode: 'edit', item: item.toObject(), values: req.body, errors: { email: 'Email ini sudah dipakai.' }, isSelf }, 'layouts/admin');
  }
  // Mencegah kunci-diri: tidak boleh menonaktifkan atau menurunkan peran diri
  // sendiri jika itu akan membuat tidak ada satu pun Super Admin aktif tersisa.
  const losesSuperadmin = isSuperadmin(item) && (data.role !== 'superadmin' || !data.isActive);
  if (isSelf && losesSuperadmin && (await countActiveSuperadmins(item._id)) === 0) {
    return res.renderPage(
      'admin/users/form',
      { title: 'Ubah Akun', mode: 'edit', item: item.toObject(), values: req.body, errors: { _form: 'Tidak bisa menonaktifkan atau menurunkan peran akun ini -- tidak akan ada Super Admin aktif yang tersisa.' }, isSelf },
      'layouts/admin'
    );
  }
  Object.assign(item, data);
  await item.save();
  res.redirect(`/admin/users?success=${encodeURIComponent('Akun berhasil diperbarui.')}`);
};

exports.resetPasswordForm = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  res.renderPage('admin/users/reset-password', { title: `Reset Password ${item.name || item.email}`, item: item.toObject(), errors: {} }, 'layouts/admin');
};

exports.resetPassword = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  const { data, errors, ok } = validate(schemas.resetPasswordByAdmin, req.body);
  if (!ok) {
    return res.renderPage('admin/users/reset-password', { title: `Reset Password ${item.name || item.email}`, item: item.toObject(), errors }, 'layouts/admin');
  }
  item.password = data.newPassword;
  await item.save();
  res.redirect(`/admin/users?success=${encodeURIComponent('Password berhasil direset.')}`);
};

exports.destroy = async (req, res) => {
  const item = await findOrThrow(req.params.id);
  if (String(item._id) === String(req.user._id)) {
    return res.redirect(`/admin/users?error=${encodeURIComponent('Tidak bisa menghapus akun yang sedang digunakan.')}`);
  }
  if (isSuperadmin(item) && item.isActive && (await countActiveSuperadmins(item._id)) === 0) {
    return res.redirect(`/admin/users?error=${encodeURIComponent('Tidak bisa menghapus Super Admin aktif terakhir.')}`);
  }
  await User.findByIdAndDelete(req.params.id);
  res.redirect(`/admin/users?success=${encodeURIComponent('Akun berhasil dihapus.')}`);
};
