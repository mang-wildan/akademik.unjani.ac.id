const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('a fresh login does not load Google CAPTCHA', () => {
  const window = { location: { search: '' }, addEventListener() {} };
  const document = { addEventListener() {}, querySelector() { return null; } };
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/js/app.js'), 'utf8'), { window, document });
  assert.equal(window.onLoginCaptchaReady, undefined);
});

test('login CAPTCHA uses available width, resets on size changes, and reports load failure', () => {
  const renders = [], resets = [], events = {};
  const container = { clientWidth: 320, dataset: { sitekey: 'test-site-key' }, replaceChildren() {} };
  const script = { addEventListener(name, handler) { this[name] = handler; } };
  const window = {
    location: { search: '' },
    addEventListener(name, handler) { events[name] = handler; },
    grecaptcha: { render(target, options) { renders.push(options); return renders.length - 1; }, reset(id) { resets.push(id); } },
  };
  const document = {
    addEventListener() {}, querySelector() { return container; },
    createElement(tag) { return tag === 'script' ? script : {}; },
    head: { append() {} },
  };
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/js/app.js'), 'utf8'), { window, document });
  assert.equal(typeof window.onLoginCaptchaReady, 'function');
  window.onLoginCaptchaReady();
  assert.equal(renders[0].size, 'normal');
  assert.equal(renders[0].sitekey, 'test-site-key');
  events.resize();
  assert.equal(renders.length, 1);
  container.clientWidth = 280;
  events.resize();
  assert.equal(renders[1].size, 'compact');
  assert.deepEqual(resets, [0]);
  script.error();
  assert.match(container.textContent, /gagal dimuat/);
});
