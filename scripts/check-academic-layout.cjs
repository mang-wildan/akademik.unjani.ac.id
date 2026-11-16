// Manual browser regression: PLAYWRIGHT_MODULE=<module> CHROMIUM_EXECUTABLE=<chrome> node scripts/check-academic-layout.cjs
// Uses existing route/DB fixture; no production DB or new dependency.
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const { fixture, id } = require('../test/helpers/adminContentFixture');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_EXECUTABLE ? { executablePath: process.env.CHROMIUM_EXECUTABLE } : {}) });
  const doc = { _id: id(1), tahunAjaran: '2026/2027', nomorSK: 'SK', events: [{ _id: id(2), nama: 'Orientasi', semester: 'ganjil', mulai: new Date('2026-08-01') }], lampiran: [{ _id: id(3), judul: 'Surat edaran', nomorSurat: 'SE/1', file: '/fixture.pdf' }] };
  const { app } = fixture(mock, { basePath: 'academic-calendars', docs: [doc] });
  const server = app.listen(0, '127.0.0.1');
  try {
    await new Promise(resolve => server.once('listening', resolve));
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const base = `http://127.0.0.1:${server.address().port}/admin/academic-calendars`;
    for (const long of [false, true]) {
      if (long) {
        doc.nomorSK = 'NomorSK'.repeat(65);
        doc.events[0].nama = 'Kegiatan'.repeat(65);
        doc.lampiran[0].judul = 'Lampiran'.repeat(65);
        doc.lampiran[0].nomorSurat = 'Surat'.repeat(65);
      }
      for (const width of [1440, 1024, 820, 768, 390, 320]) {
        await page.setViewportSize({ width, height: 1000 });
        for (const route of ['', `/${id(1)}/edit`]) {
          await page.goto(base + route, { waitUntil: 'networkidle' });
          assert.equal(await page.locator('h1').count(), 1);
          assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width} ${route} long=${long}: overflow`);
          if (width >= 768) {
            for (const size of await page.locator('.data-table th.dt-meta').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().width))) {
              assert.ok(size >= 80, `${width}: metadata column ${size}px too narrow`);
            }
          }
        }
      }
    }
    assert.deepEqual(errors, []);
    console.log('Academic layout: normal/long list and calendar edit, six viewports passed.');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    mock.restoreAll();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
