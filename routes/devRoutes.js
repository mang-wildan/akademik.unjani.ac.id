// Development-only pages for checking the design system. Mounted only when
// NODE_ENV is not "production" (see server.js).
const express = require('express');
const strictCsp = require('../middleware/strictCsp');

const router = express.Router();
router.use(strictCsp);

router.get('/komponen', (req, res) =>
  res.renderPage('dev/komponen', { title: 'Katalog Komponen', description: 'Katalog komponen design system.' })
);

// Simulates a slow save so the busy-form spinner (public/js/app.js) is visible while testing.
router.post('/komponen', (req, res) => {
  setTimeout(() => res.redirect('/dev/komponen?success=Contoh%20tersimpan'), 1500);
});

router.get('/admin', (req, res) =>
  res.renderPage(
    'dev/admin',
    { title: 'Kelola Pengumuman', user: res.locals.user || { name: 'Admin Contoh', role: 'editor' } },
    'layouts/admin'
  )
);

module.exports = router;
