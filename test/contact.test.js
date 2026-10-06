const test = require('node:test');
const assert = require('node:assert/strict');
const { phoneLink } = require('../utils/contact');

test('phoneLink: chat-only numbers open WhatsApp with country code', () => {
  assert.deepEqual(phoneLink('(+62) 85861328758 (Chat Only)'), { href: 'https://wa.me/6285861328758', whatsapp: true });
  assert.deepEqual(phoneLink('0858-6132-8758 (WhatsApp)'), { href: 'https://wa.me/6285861328758', whatsapp: true });
  assert.deepEqual(phoneLink('WA 62858 6132 8758'), { href: 'https://wa.me/6285861328758', whatsapp: true });
});

test('phoneLink: other numbers stay tel: links', () => {
  assert.deepEqual(phoneLink('+62 22 6656190'), { href: 'tel:+62226656190', whatsapp: false });
  assert.deepEqual(phoneLink('(022) 6656190'), { href: 'tel:0226656190', whatsapp: false });
  // "wa" only as a whole word: names like "Kawasan" must not switch to WhatsApp
  assert.equal(phoneLink('(022) 6656190 Kawasan Rektorat').whatsapp, false);
});
