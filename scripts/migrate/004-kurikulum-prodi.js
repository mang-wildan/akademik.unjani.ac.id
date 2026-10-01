// Kurikulum: program studi as text → reference to master Program Studi (FR-KU-03).
const Kurikulum = require('../../models/Kurikulum');
const ProgramStudi = require('../../models/ProgramStudi');

const norm = text => String(text || '').toLowerCase().replace(/\bs-(\d)\b/g, 's$1').replace(/\s+/g, ' ').trim();

module.exports = {
  id: '004-kurikulum-prodi',
  title: 'Kurikulum: program studi menjadi rujukan ke data master',
  async run({ apply, log, review, backup }) {
    const prodiByName = new Map((await ProgramStudi.find({}, 'nama').lean()).map(p => [norm(p.nama), p]));
    const docs = await Kurikulum.find({ prodi: { $exists: false } }).lean();
    let linked = 0;
    for (const doc of docs) {
      const prodi = prodiByName.get(norm(doc.programStudi)) || prodiByName.get(norm(doc.nama));
      if (!prodi) {
        review(`kurikulum "${doc.nama}" (${doc.programStudi}): program studi tidak ditemukan di data master`);
        continue;
      }
      linked += 1;
      log(`"${doc.nama}" → ${prodi.nama}`);
      if (apply) {
        backup('kurikulums', [doc]);
        await Kurikulum.updateOne({ _id: doc._id }, { $set: { prodi: prodi._id } });
      }
    }
    return `${linked} dari ${docs.length} kurikulum ${apply ? 'ditautkan' : 'akan ditautkan'} ke program studi`;
  },
};
