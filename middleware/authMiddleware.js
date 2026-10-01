const jwt = require('jsonwebtoken');
const User = require('../models/User');

const unauthorized = (req, res, message = 'Silakan login terlebih dahulu.') => {
  const wantsJSON = req.headers.accept && req.headers.accept.includes('application/json');
  if (wantsJSON) {
    return res.status(401).json({ error: message });
  }
  return res.redirect('/login');
};

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  return null;
};

const requireAuth = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) {
    return unauthorized(req, res);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return unauthorized(req, res);
    }
    req.user = user;
    res.locals.user = user;
    return next();
  } catch (error) {
    return unauthorized(req, res, 'Token tidak valid atau kedaluwarsa.');
  }
};

const requireAdmin = async (req, res, next) => {
  const authResult = await requireAuth(req, res, () => {});
  if (res.headersSent) return; // unauthorized handled
  const user = req.user || res.locals.user;
  if (!user || user.role !== 'admin') {
    return unauthorized(req, res, 'Akses khusus admin.');
  }
  return next();
};

module.exports = { requireAuth, requireAdmin };
