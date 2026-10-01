// Degree level, read from the program name (SRS FR-KU-02).
// ProgramStudi has no `jenjang` field yet — names already carry it
// consistently ("Teknik Kimia S1", "Profesi Dokter Profesi"), so this derives
// a filterable value without a schema change. Promote to a real field if a
// name ever doesn't carry it cleanly.
const PATTERNS = [
  [/\bs-?3\b/i, 'S3'],
  [/\bs-?2\b/i, 'S2'],
  [/\bs-?1\b/i, 'S1'],
  [/\bd-?4\b/i, 'D4'],
  [/\bd-?3\b/i, 'D3'],
  [/\bprofesi\b/i, 'Profesi'],
];

const jenjangFromNama = nama => {
  const text = String(nama || '');
  for (const [pattern, label] of PATTERNS) if (pattern.test(text)) return label;
  return 'Lainnya';
};

module.exports = { jenjangFromNama, JENJANG_URUTAN: ['S1', 'S2', 'S3', 'D3', 'D4', 'Profesi', 'Lainnya'] };
