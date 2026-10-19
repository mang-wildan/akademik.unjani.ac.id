const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const ejs = require('ejs');

const render = overrides => ejs.renderFile(path.join(__dirname, '../views/auth/login.ejs'), {
  icon: require('../utils/icons'), assetUrl: value => value,
  requireCaptcha: false, recaptchaSiteKey: 'preview-site-key', ...overrides,
});

test('login uses native validation and retains password manager support', async () => {
  const html = await render();
  assert.match(html, /action="\/login" method="POST"/);
  assert.doesNotMatch(html, /\bnovalidate\b/);
  assert.match(html, /type="email"[^>]*required[^>]*autocomplete="username"/);
  assert.match(html, /name="password"[^>]*required[^>]*autocomplete="current-password"/);
  assert.match(html, /aria-controls="f-password"/);
  assert.match(html, /Sembunyikan password/);
  assert.match(html, /data-busy-label="Sedang masuk…"/);
});

test('login error appears once, keeps the escaped email, and never returns a password', async () => {
  const html = await render({
    error: 'Email atau password salah.',
    values: { email: 'nama+"<akun>@example.test', password: 'never-return-this' },
  });
  assert.equal(html.split('Email atau password salah.').length - 1, 1);
  assert.match(html, /value="nama\+&#34;&lt;akun&gt;@example.test"/);
  assert.match(html, /aria-describedby="login-error"/);
  assert.doesNotMatch(html, /never-return-this/);
});

test('reCAPTCHA stays conditional and uses a widget size that fits small screens', async () => {
  assert.doesNotMatch(await render(), /google\.com\/recaptcha\/api\.js/);
  const html = await render({ requireCaptcha: true });
  assert.match(html, /data-login-captcha data-sitekey="preview-site-key"/);
  assert.doesNotMatch(html, /data-size="compact"/);
  assert.match(html, /Verifikasi keamanan/);
});

test('blocked login shows the reason and a reload link instead of accepting submissions', async () => {
  const html = await render({ loginBlocked: true, error: 'Coba lagi dalam 60 menit.' });
  assert.match(html, /<button type="submit"[^>]* disabled[^>]*>Masuk diblokir sementara/);
  assert.match(html, /href="\/login"[^>]*>Periksa kembali/);
  assert.doesNotMatch(html, /google\.com\/recaptcha\/api\.js/);
});
