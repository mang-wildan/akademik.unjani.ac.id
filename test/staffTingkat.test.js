const test = require('node:test');
const assert = require('node:assert/strict');
const { groupByTingkat } = require('../utils/staffTingkat');

test('groupByTingkat: urut atas ke bawah, tingkat kosong dilewati, nilai tak dikenal = anggota', () => {
  const g = groupByTingkat([
    { nama: 'a', tingkat: 'anggota' },
    { nama: 'b', tingkat: 'wakil-rektor' },
    { nama: 'c', tingkat: 'kepala-bagian' },
    { nama: 'd' }, // data lama tanpa tingkat
    { nama: 'e', tingkat: 'kepala-bagian' },
  ]);
  assert.deepEqual(g.map(x => x.value), ['wakil-rektor', 'kepala-bagian', 'anggota']);
  assert.deepEqual(g[1].items.map(x => x.nama), ['c', 'e']);
  assert.deepEqual(g[2].items.map(x => x.nama), ['a', 'd']);
});
