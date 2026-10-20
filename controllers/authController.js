const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const loginAttempts = require('../utils/loginAttempts');
const { isStaff } = require('../utils/roles');
const { validate, schemas } = require('../validators');

const recaptchaSiteKey = process.env.RECAPTCHA_SITE_KEY;
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
if (!recaptchaSiteKey || !recaptchaSecretKey) {
  // eslint-disable-next-line no-console
  console.warn('RECAPTCHA_SITE_KEY/RECAPTCHA_SECRET_KEY belum diisi: login akan terkunci setelah percobaan gagal berulang.');
}

// Compared against when the email is unknown, so a missing account takes as
// long to reject as a wrong password (no account enumeration by timing).
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('unused-placeholder-password', 10);

const publicPath = path.join(__dirname, '..', 'public');
const toPublicUrl = filePath => {
  if (!filePath) return '';
  const relative = path.relative(publicPath, filePath).replace(/\\/g, '/');
  return `/${relative}`;
};

const renderLogin = (res, statusCode = 200, payload = {}) =>
  res.status(statusCode).render('auth/login', {
    title: 'Masuk',
    recaptchaSiteKey,
    requireCaptcha: false,
    loginBlocked: false,
    ...payload,
  });

const renderBlockedLogin = (res, retryAfter, email = '') => {
  res.set('Retry-After', String(retryAfter));
  return renderLogin(res, 429, {
    error: `Terlalu banyak percobaan masuk yang gagal. Akses masuk diblokir 1 jam. Coba lagi dalam ${Math.ceil(retryAfter / 60)} menit.`,
    values: { email },
    loginBlocked: true,
  });
};

const normalizeToken = (token) => {
  if (Array.isArray(token)) {
    return token.filter(Boolean).pop() || '';
  }
  return token || '';
};

const verifyRecaptcha = async (rawToken, remoteIp) => {
  const token = normalizeToken(rawToken);
  if (!token) {
    return { ok: false, message: 'Mohon selesaikan verifikasi reCAPTCHA.' };
  }

  const params = new URLSearchParams();
  params.append('secret', recaptchaSecretKey);
  params.append('response', token);
  if (remoteIp) params.append('remoteip', remoteIp);

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const data = await response.json();
    if (data.success) return { ok: true };

    return {
      ok: false,
      message: 'Verifikasi reCAPTCHA gagal. Silakan coba lagi.',
    };
  } catch (error) {
    return {
      ok: false,
      message: 'Gagal memvalidasi reCAPTCHA. Silakan coba kembali.',
    };
  }
};

const createToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
  );

const expiryMsFromEnv = () => {
  const raw = process.env.JWT_EXPIRES_IN || '1h';
  const match = /^(\d+)([smhd])$/.exec(raw);
  if (!match) return 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const map = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * map[unit];
};

const sendTokenResponse = (user, req, res, statusCode = 200, message = 'OK') => {
  const token = createToken(user);
  const httpOnlyCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiryMsFromEnv(),
  };
  res.cookie('token', token, httpOnlyCookieOptions);

  const safeUser = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    profilePhoto: user.profilePhoto || '',
  };
  const wantsJSON = req.headers.accept && req.headers.accept.includes('application/json');

  // Option 1: send token in JSON body for API clients
  if (wantsJSON) {
    return res.status(statusCode).json({ token, user: safeUser, message });
  }
  // Option 2: rely on secure HTTP-only cookie for browser flows
  const redirectPath = isStaff(user) ? '/admin/dashboard' : '/dashboard';
  return res.redirect(redirectPath);
};

exports.getLogin = (req, res) => {
  const targetUser = req.user || res.locals.user;
  if (targetUser) {
    return res.redirect(isStaff(targetUser) ? '/admin/dashboard' : '/dashboard');
  }
  const retryAfter = loginAttempts.retryAfter({ ip: req.ip });
  if (retryAfter) return renderBlockedLogin(res, retryAfter);
  return renderLogin(res);
};

// reCAPTCHA is only demanded once this email has failed
// CAPTCHA_AFTER_FAILURES times within the attempt window.
exports.login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const who = { ip: req.ip, email };
  const retryAfter = loginAttempts.retryAfter(who);
  if (retryAfter) return renderBlockedLogin(res, retryAfter, email);

  const fail = message => {
    loginAttempts.recordFailure(who);
    const remaining = loginAttempts.retryAfter(who);
    if (remaining) return renderBlockedLogin(res, remaining, email);
    return renderLogin(res, 400, {
      error: message,
      values: { email },
      requireCaptcha: loginAttempts.captchaRequired(who),
    });
  };

  if (loginAttempts.captchaRequired(who)) {
    const recaptchaToken = req.body['g-recaptcha-response'] || req.body.recaptcha_token;
    const recaptcha = await verifyRecaptcha(recaptchaToken, req.ip);
    if (!recaptcha.ok) return fail(recaptcha.message);
  }

  if (!email || !password) {
    return fail('Email dan password wajib diisi.');
  }

  const user = await User.findOne({ email });
  const isMatch = user
    ? await user.comparePassword(password)
    : await bcrypt.compare(password, DUMMY_PASSWORD_HASH);

  const remaining = loginAttempts.retryAfter(who);
  if (remaining) return renderBlockedLogin(res, remaining, email);
  if (!user || !isMatch) {
    return fail('Email atau password salah.');
  }

  // Checked after the password so a wrong guess can't tell an inactive account apart.
  if (user.isActive === false) {
    return fail('Akun ini dinonaktifkan. Hubungi Super Admin Bidang Akademik.');
  }
  loginAttempts.reset(who);
  await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
  return sendTokenResponse(user, req, res, 200, 'Login berhasil');
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  const wantsJSON = req.headers.accept && req.headers.accept.includes('application/json');
  if (wantsJSON) {
    return res.json({ message: 'Logout berhasil' });
  }
  return res.redirect('/login');
};

// ---------------------------------------------------------------- profil sendiri
// Halaman profil memakai layout admin; req.user sudah dimuat ulang dari DB
// (tanpa password) oleh requireAuth di setiap request.
const PROFILE_TITLES = { index: 'Profil Saya', edit: 'Ubah Profil', password: 'Ubah Password' };

const renderProfilePage = (res, view, locals = {}, statusCode = 200) =>
  res.status(statusCode).renderPage(`admin/profile/${view}`, { title: PROFILE_TITLES[view], errors: {}, ...locals }, 'layouts/admin-v2');

// Also used by routes/authRoutes.js when the photo upload itself fails.
// values: what was submitted (defaults to the saved name/email); photoDropped:
// a photo was chosen but not kept, so the page asks to pick it again.
const renderEditProfile = (req, res, { values, errors = {}, photoDropped = false } = {}, statusCode = 200) =>
  renderProfilePage(res, 'edit', {
    profile: req.user,
    values: values || { name: req.user.name || '', email: req.user.email || '' },
    errors,
    photoDropped,
  }, statusCode);
exports.renderEditProfile = renderEditProfile;

// The photo just uploaded is not used when the form is rejected.
const discardUpload = req => {
  if (req.file && req.file.path) fs.unlink(req.file.path, () => {});
};

exports.getProfile = (req, res) => renderProfilePage(res, 'index', { profile: req.user });

exports.getEditProfile = (req, res) => renderEditProfile(req, res);

exports.updateProfile = async (req, res) => {
  const body = req.body || {};
  const removeProfilePhoto = String(body.removeProfilePhoto || '') === '1';
  const values = { name: String(body.name || ''), email: String(body.email || ''), removeProfilePhoto };

  const result = validate(schemas.profileUpdate, values);
  const errors = result.ok ? {} : { ...result.errors };
  if (result.ok) {
    const usedByAnotherUser = await User.exists({ email: result.data.email, _id: { $ne: req.user._id } });
    if (usedByAnotherUser) errors.email = 'Email sudah digunakan oleh akun lain.';
  }
  if (Object.keys(errors).length) {
    discardUpload(req);
    return renderEditProfile(req, res, { values, errors, photoDropped: Boolean(req.file) }, 422);
  }

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    discardUpload(req);
    res.clearCookie('token');
    return res.redirect('/login');
  }

  if (removeProfilePhoto) currentUser.profilePhoto = '';
  if (req.file && req.file.path) currentUser.profilePhoto = toPublicUrl(req.file.path);
  currentUser.name = result.data.name;
  currentUser.email = result.data.email;
  await currentUser.save();

  // Keep the already-loaded session user in step for the rest of this request.
  for (const target of [req.user, res.locals.user]) {
    if (target) Object.assign(target, { name: currentUser.name, email: currentUser.email, profilePhoto: currentUser.profilePhoto });
  }

  return res.redirect(303, '/profile?success=Profil berhasil diperbarui');
};

exports.getChangePassword = (req, res) => renderProfilePage(res, 'password');

exports.updatePassword = async (req, res) => {
  // Password fields are never sent back to the form. Missing fields count as
  // empty so non-browser clients get the same Indonesian messages.
  const body = req.body || {};
  const input = Object.fromEntries(['currentPassword', 'newPassword', 'confirmPassword'].map(k => [k, String(body[k] || '')]));
  const result = validate(schemas.passwordChange, input);
  if (!result.ok) return renderProfilePage(res, 'password', { errors: result.errors }, 422);

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    res.clearCookie('token');
    return res.redirect('/login');
  }

  if (!(await currentUser.comparePassword(result.data.currentPassword))) {
    return renderProfilePage(res, 'password', { errors: { currentPassword: 'Password saat ini tidak sesuai.' } }, 422);
  }

  currentUser.password = result.data.newPassword;
  await currentUser.save();

  return res.redirect(303, '/profile?success=Password berhasil diperbarui');
};
