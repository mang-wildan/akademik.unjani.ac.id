const express = require('express');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const homeController = require('../controllers/homeController');
const seoController = require('../controllers/seoController');
const chatController = require('../controllers/chatController');

const router = express.Router();

router.get('/robots.txt', seoController.robotsTxt);
router.get('/sitemap.xml', seoController.sitemap);

router.post('/api/chat', chatController.ask);

router.get('/', homeController.getLanding);
router.get('/profil', homeController.getProfil);
router.get('/buku', homeController.getBuku);
router.get('/akreditasi', homeController.getAkreditasiLanding);
router.get('/kalender-akademik', homeController.getKalenderLanding);
router.get('/kurikulum', homeController.getKurikulumLanding);
router.get('/dokumen-akademik', homeController.getDokumenAkademikLanding);
router.get('/rpl', homeController.getRplLanding);
router.get('/buku-wisuda', homeController.getBukuWisudaLanding);
router.get('/struktur-organisasi', homeController.getStrukturLanding);
router.get('/pimpinan-dan-staff', homeController.getPimpinanStaffLanding);
router.get('/berita', homeController.getBeritaLanding);
router.get('/berita/:slug', homeController.getBeritaDetail);
router.get('/pengumuman', homeController.getPengumumanLanding);
router.get('/pengumuman/:slug', homeController.getPengumumanDetail);
router.get('/cari', homeController.getCari);
router.get('/dashboard', requireAuth, requireAdmin, homeController.getDashboard);
router.get('/admin/dashboard', requireAuth, requireAdmin, homeController.getDashboard);

module.exports = router;
