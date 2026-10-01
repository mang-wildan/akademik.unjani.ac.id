const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const path = require('path');
const User = require('../models/User');
const loginAttempts = require('../utils/loginAttempts');

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
    ...payload,
  });

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
  const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/dashboard';
  return res.redirect(redirectPath);
};

exports.getLogin = (req, res) => {
  const targetUser = req.user || res.locals.user;
  if (targetUser) {
    return res.redirect(targetUser.role === 'admin' ? '/admin/dashboard' : '/dashboard');
  }
  return renderLogin(res, 200, { requireCaptcha: loginAttempts.captchaRequired({ ip: req.ip }) });
};

// reCAPTCHA is only demanded once this IP or this email has failed
// CAPTCHA_AFTER_FAILURES times within the attempt window.
exports.login = async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const who = { ip: req.ip, email };

  const fail = message =>
    renderLogin(res, 400, {
      error: message,
      values: { email },
      requireCaptcha: loginAttempts.captchaRequired(who),
    });

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

  if (!user || !isMatch) {
    loginAttempts.recordFailure(who);
    const message = loginAttempts.captchaRequired(who)
      ? 'Email atau password salah. Demi keamanan, selesaikan verifikasi reCAPTCHA sebelum mencoba lagi.'
      : 'Email atau password salah.';
    return fail(message);
  }

  loginAttempts.reset(who);
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

const renderProfilePage = (res, view, payload = {}, statusCode = 200) =>
  res.status(statusCode).render(`admin/profile/${view}`, {
    title: payload.title || 'Profil Saya',
    ...payload,
  });

exports.getProfile = async (req, res) => {
  const currentUser = await User.findById(req.user._id).select('-password').lean();
  if (!currentUser) {
    res.clearCookie('token');
    return res.redirect('/login');
  }

  return renderProfilePage(res, 'index', {
    title: 'Profil Saya',
    user: req.user,
    profile: currentUser,
    success: req.query.success || '',
    error: req.query.error || '',
  });
};

exports.getEditProfile = async (req, res) => {
  const currentUser = await User.findById(req.user._id).select('-password').lean();
  if (!currentUser) {
    res.clearCookie('token');
    return res.redirect('/login');
  }

  return renderProfilePage(res, 'edit', {
    title: 'Edit Profil',
    user: req.user,
    values: {
      name: currentUser.name || '',
      email: currentUser.email || '',
      profilePhoto: currentUser.profilePhoto || '',
    },
    profile: currentUser,
    error: '',
  });
};

exports.updateProfile = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const removeProfilePhoto = String(req.body.removeProfilePhoto || '') === '1';
  const uploadedPhoto = req.file || null;

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    res.clearCookie('token');
    return res.redirect('/login');
  }

  if (!name || !email) {
    return renderProfilePage(
      res,
      'edit',
      {
        title: 'Edit Profil',
        user: req.user,
        values: {
          name,
          email,
          profilePhoto: currentUser.profilePhoto || '',
        },
        profile: currentUser.toObject(),
        error: 'Nama dan email wajib diisi.',
      },
      400
    );
  }

  const usedByAnotherUser = await User.findOne({
    email,
    _id: { $ne: currentUser._id },
  });
  if (usedByAnotherUser) {
    return renderProfilePage(
      res,
      'edit',
      {
        title: 'Edit Profil',
        user: req.user,
        values: {
          name,
          email,
          profilePhoto: currentUser.profilePhoto || '',
        },
        profile: currentUser.toObject(),
        error: 'Email sudah digunakan oleh akun lain.',
      },
      400
    );
  }

  if (removeProfilePhoto) {
    currentUser.profilePhoto = '';
  }
  if (uploadedPhoto && uploadedPhoto.path) {
    currentUser.profilePhoto = toPublicUrl(uploadedPhoto.path);
  }
  currentUser.name = name;
  currentUser.email = email;
  await currentUser.save();

  if (req.user) {
    req.user.name = currentUser.name;
    req.user.email = currentUser.email;
    req.user.profilePhoto = currentUser.profilePhoto;
  }
  if (res.locals.user) {
    res.locals.user.name = currentUser.name;
    res.locals.user.email = currentUser.email;
    res.locals.user.profilePhoto = currentUser.profilePhoto;
  }

  return res.redirect('/profile?success=Profil berhasil diperbarui');
};

exports.getChangePassword = async (req, res) => {
  return renderProfilePage(res, 'password', {
    title: 'Ubah Password',
    user: req.user,
    error: '',
  });
};

exports.updatePassword = async (req, res) => {
  const currentPassword = String(req.body.currentPassword || '');
  const newPassword = String(req.body.newPassword || '');
  const confirmPassword = String(req.body.confirmPassword || '');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return renderProfilePage(
      res,
      'password',
      {
        title: 'Ubah Password',
        user: req.user,
        error: 'Semua field password wajib diisi.',
      },
      400
    );
  }

  if (newPassword.length < 6) {
    return renderProfilePage(
      res,
      'password',
      {
        title: 'Ubah Password',
        user: req.user,
        error: 'Password baru minimal 6 karakter.',
      },
      400
    );
  }

  if (newPassword !== confirmPassword) {
    return renderProfilePage(
      res,
      'password',
      {
        title: 'Ubah Password',
        user: req.user,
        error: 'Konfirmasi password baru tidak sesuai.',
      },
      400
    );
  }

  if (currentPassword === newPassword) {
    return renderProfilePage(
      res,
      'password',
      {
        title: 'Ubah Password',
        user: req.user,
        error: 'Password baru harus berbeda dari password saat ini.',
      },
      400
    );
  }

  const currentUser = await User.findById(req.user._id);
  if (!currentUser) {
    res.clearCookie('token');
    return res.redirect('/login');
  }

  const isCurrentPasswordValid = await currentUser.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return renderProfilePage(
      res,
      'password',
      {
        title: 'Ubah Password',
        user: req.user,
        error: 'Password saat ini tidak sesuai.',
      },
      400
    );
  }

  currentUser.password = newPassword;
  await currentUser.save();

  return res.redirect('/profile?success=Password berhasil diperbarui');
};
