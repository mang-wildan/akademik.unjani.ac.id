module.exports = (req, res, next) => {
  const { admin_theme, admin_sidebar } = req.cookies || {};
  res.locals.adminTheme = ['light', 'dark', 'system'].includes(admin_theme) ? admin_theme : 'system';
  res.locals.adminSidebar = ['open', 'collapsed'].includes(admin_sidebar) ? admin_sidebar : 'open';
  next();
};
