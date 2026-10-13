const test = require('node:test');
const assert = require('node:assert/strict');
const { escapeRegex } = require('../utils/regex');

test('escapeRegex: karakter khusus dicari apa adanya', () => {
  assert.equal(escapeRegex('a.b'), 'a\\.b');
  assert.equal(new RegExp(escapeRegex('(x')).test('a(x'), true);
  assert.equal(new RegExp(escapeRegex('a.c')).test('abc'), false);
  assert.doesNotThrow(() => new RegExp(escapeRegex('[*+?')));
});
