// File size & type for downloadable documents (FR-D-01 shows "PDF · 245 KB"),
// and a check that every stored file path still exists on disk.
const fs = require('fs');
const path = require('path');
const AcademicDocument = require('../../models/AcademicDocument');
const RplDocument = require('../../models/RplDocument');
const Kurikulum = require('../../models/Kurikulum');
const AcademicCalendar = require('../../models/AcademicCalendar');
const Accreditation = require('../../models/Accreditation');
const { formatUkuranFile } = require('../../utils/format');

const PUBLIC = path.join(__dirname, '..', '..', 'public');
const onDisk = url => (url ? path.join(PUBLIC, decodeURI(url).replace(/^\/+/, '')) : null);
const MIME = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

module.exports = {
  id: '006-files-meta',
  title: 'Dokumen: ukuran & jenis file, cek file yang hilang',
  async run({ apply, log, review, backup }) {
    let filled = 0;
    for (const [label, Model, nameField, withMeta] of [
      ['dokumen akademik', AcademicDocument, 'name', true],
      ['dokumen RPL', RplDocument, 'judul', true],
      ['kurikulum', Kurikulum, 'nama', true],
      ['kalender', AcademicCalendar, 'tahunAjaran', false],
      ['akreditasi', Accreditation, 'unit', false],
    ]) {
      const fileField = Model === Accreditation ? 'sertifikat' : 'file';
      for (const doc of await Model.find().lean()) {
        const file = onDisk(doc[fileField]);
        if (!file || !fs.existsSync(file)) {
          review(`${label} "${doc[nameField]}": file ${doc[fileField] || '(kosong)'} tidak ditemukan di server — tautan unduh rusak`);
          continue;
        }
        if (!withMeta || doc.fileSize) continue;
        const set = { fileSize: fs.statSync(file).size };
        if (Model !== Kurikulum) set.mimeType = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
        filled += 1;
        log(`${label} "${doc[nameField]}": ${formatUkuranFile(set.fileSize)}${set.mimeType ? `, ${set.mimeType}` : ''}`);
        if (apply) {
          backup(label, [{ _id: doc._id, fileSize: doc.fileSize, mimeType: doc.mimeType }]);
          await Model.updateOne({ _id: doc._id }, { $set: set });
        }
      }
    }
    return `${filled} dokumen ${apply ? 'dilengkapi' : 'akan dilengkapi'} ukuran file`;
  },
};
