const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { isStaff, isSuperadmin } = require('../utils/roles');

const unauthorized = (req, res, message = 'Silakan login terlebih dahulu.') => {
  const wantsJSON = req.headers.accept && req.headers.accept.includes('application/json');
  if (wantsJSON) {
    return res.status(401).json({ error: message });
  }
  res.clearCookie('token');
  return res.redirect('/login');
};

// Logged in but not allowed: shown by the central error handler.
const forbidden = message => Object.assign(new Error(message), { status: 403, expose: true });

const extractToken = req => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

// Reuses the user already loaded by the soft-auth middleware in server.js.
const loadUser = async req => {
  if (req.user) return req.user;
  const token = extractToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return await User.findById(decoded.id).select('-password');
  } catch (_err) {
    return null;
  }
};

const requireAuth = async (req, res, next) => {
  const user = await loadUser(req);
  if (!user) return unauthorized(req, res);
  if (user.isActive === false) return unauthorized(req, res, 'Akun dinonaktifkan.');
  req.user = user;
  res.locals.user = user;
  return next();
};

const requireRole = (check, message) => async (req, res, next) => {
  const user = await loadUser(req);
  if (!user || user.isActive === false) return unauthorized(req, res);
  req.user = user;
  res.locals.user = user;
  if (!check(user)) return next(forbidden(message));
  return next();
};

// Super Admin and Editor.
const requireAdmin = requireRole(isStaff, 'Halaman ini khusus admin.');

// Accounts, site settings, master data (SRS §2.2).
const requireSuperadmin = requireRole(isSuperadmin, 'Halaman ini hanya untuk Super Admin.');

module.exports = { requireAuth, requireAdmin, requireSuperadmin };
