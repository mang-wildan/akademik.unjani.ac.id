// Accreditation: free-text institusi/unit/akreditasi → jenis, programStudi,
// namaUnit, peringkat (SRS FR-M-04). Dates are never changed: inconsistencies
// are listed for review, because only the certificate can say which is right.
const Accreditation = require('../../models/Accreditation');
const ProgramStudi = require('../../models/ProgramStudi');
const LembagaAkreditasi = require('../../models/LembagaAkreditasi');
const { normalizePeringkat, accreditationStatus, JENIS } = require('../../utils/accreditation');
const { formatTanggal } = require('../../utils/format');

const UNIVERSITAS = 'Universitas Jenderal Achmad Yani';

// "Teknik Sipil S-1" and "teknik sipil s1" both → "teknik sipil s1".
const norm = text => String(text || '').toLowerCase().replace(/\bs-(\d)\b/g, 's$1').replace(/\s+/g, ' ').trim();

const isInstitution = doc => ['institusi', 'universitas'].includes(norm(doc.institusi)) || norm(doc.unit) === 'universitas';

const yearsBetween = (a, b) => (new Date(b) - new Date(a)) / (365.25 * 86400000);

module.exports = {
  id: '003-accreditation',
  title: 'Akreditasi: jenis, program studi, nama unit, peringkat',
  async run({ apply, log, review, backup }) {
    const docs = await Accreditation.find().lean();
    const prodiByName = new Map((await ProgramStudi.find({}, 'nama').lean()).map(p => [norm(p.nama), p]));
    const banpt = await LembagaAkreditasi.findOne({ singkatan: 'BAN-PT' }, '_id').lean();

    let changed = 0;
    for (const doc of docs) {
      const label = `${doc.institusi} / ${doc.unit} (${doc.akreditasi})`;
      const set = {};

      if (!doc.peringkat) {
        const peringkat = normalizePeringkat(doc.akreditasi);
        if (peringkat) set.peringkat = peringkat;
        else review(`${label}: peringkat "${doc.akreditasi}" tidak ada di daftar tetap — pilih manual`);
      }

      if (!doc.jenis) {
        if (isInstitution(doc)) {
          Object.assign(set, { jenis: JENIS.INSTITUSI, namaUnit: UNIVERSITAS });
          // Institutional accreditation is always BAN-PT (seeded by 002; in a
          // dry-run 002 has not inserted it yet, so it is only announced).
          if (!doc.lembaga && banpt) set.lembaga = banpt._id;
          else if (!doc.lembaga && !apply) set.lembaga = 'BAN-PT (setelah 002)';
        } else if (prodiByName.has(norm(doc.unit))) {
          Object.assign(set, { jenis: JENIS.PRODI, programStudi: prodiByName.get(norm(doc.unit))._id });
        } else {
          Object.assign(set, { jenis: JENIS.LAINNYA, namaUnit: doc.unit });
        }
      }

      // Lembaga for program studi depends on field and year (BAN-PT vs LAM): not guessed.
      if (!doc.lembaga && !set.lembaga) review(`${label}: lembaga akreditasi belum diisi`);
      if (!doc.nomorSK) review(`${label}: nomor SK belum diisi`);

      // Data-quality checks on the existing values.
      const startYear = new Date(doc.tanggalBerlaku).getFullYear();
      if (doc.tahun && doc.tahun !== startYear) {
        review(`${label}: kolom tahun ${doc.tahun} ≠ tahun mulai berlaku ${startYear} (${formatTanggal(doc.tanggalBerlaku)}) — cek sertifikat`);
      }
      const span = yearsBetween(doc.tanggalBerlaku, doc.berlakuSampai);
      if (Math.abs(span - 5) > 0.1) review(`${label}: masa berlaku ${span.toFixed(1)} tahun (umumnya 5 tahun)`);
      const status = accreditationStatus(doc.berlakuSampai);
      if (doc.isActive !== false && status.key === 'kedaluwarsa') {
        review(`${label}: ditandai aktif tetapi kedaluwarsa sejak ${formatTanggal(doc.berlakuSampai)}`);
      }
      if (doc.isActive === false && status.key !== 'kedaluwarsa') {
        review(`${label}: disembunyikan (nonaktif) padahal masih berlaku sampai ${formatTanggal(doc.berlakuSampai)}`);
      }

      if (Object.keys(set).length) {
        changed += 1;
        const shown = { ...set };
        if (shown.programStudi) shown.programStudi = `→ prodi ${prodiByName.get(norm(doc.unit)).nama}`;
        if (shown.lembaga && typeof shown.lembaga !== 'string') shown.lembaga = 'BAN-PT';
        log(`${label}: ${JSON.stringify(shown)}`);
        if (apply) {
          backup('accreditations', [doc]);
          await Accreditation.updateOne({ _id: doc._id }, { $set: set });
        }
      }
    }
    return `${changed} dari ${docs.length} data akreditasi ${apply ? 'dilengkapi' : 'akan dilengkapi'}`;
  },
};
