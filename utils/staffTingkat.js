// Tingkat jabatan Pimpinan & Staf, berurutan dari atas ke bawah. Satu sumber untuk model, validator, form admin, dan halaman publik.
const TINGKAT = [
  { value: 'wakil-rektor', label: 'Wakil Rektor' },
  { value: 'kepala-biro', label: 'Kepala Biro' },
  { value: 'kepala-bagian', label: 'Kepala Bagian' },
  { value: 'kepala-urusan', label: 'Kepala Urusan' },
  { value: 'anggota', label: 'Anggota' },
];
const VALUES = TINGKAT.map(t => t.value);
const rank = v => {
  const i = VALUES.indexOf(v);
  return i === -1 ? VALUES.length - 1 : i; // nilai tak dikenal (data lama) = anggota
};

// [{ ...tingkat, items }] untuk tingkat yang berisi saja; urutan dalam tingkat mengikuti urutan input.
const groupByTingkat = staff =>
  TINGKAT.map((t, i) => ({ ...t, items: staff.filter(s => rank(s.tingkat) === i) })).filter(g => g.items.length);

module.exports = { TINGKAT, VALUES, rank, groupByTingkat };
