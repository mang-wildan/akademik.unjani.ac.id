// Berita & pengumuman: plain-text excerpt from body (FR-P-05). New saves keep it
// in sync through models/plugins/content.js; this fills existing documents.
const News = require('../../models/News');
const Pengumuman = require('../../models/Pengumuman');
const { makeExcerpt } = require('../../utils/html');

// Tagify sometimes saved its raw JSON ('[{"value":"unjani"}') as tag text.
const looksLikeTagifyJson = tag => /^\[?\{"value":/.test(tag) || /"\}\]?$/.test(tag);

module.exports = {
  id: '005-content-excerpt',
  title: 'Berita & pengumuman: ringkasan teks dari isi',
  async run({ apply, log, review, backup }) {
    const results = [];
    for (const [label, Model] of [['berita', News], ['pengumuman', Pengumuman]]) {
      const docs = await Model.find({}, 'title body excerpt tags status').lean();
      const todo = docs.filter(d => d.excerpt !== makeExcerpt(d.body));
      todo.forEach(d => log(`${label} "${d.title}": "${makeExcerpt(d.body, 60)}"`));
      docs.filter(d => (d.tags || []).some(looksLikeTagifyJson)).forEach(d =>
        review(`${label} "${d.title}" (${d.status}): tag tersimpan sebagai JSON mentah ${JSON.stringify(d.tags)}`)
      );
      if (apply) {
        backup(label, todo.map(({ _id, excerpt }) => ({ _id, excerpt })));
        for (const d of todo) await Model.updateOne({ _id: d._id }, { $set: { excerpt: makeExcerpt(d.body) } });
      }
      results.push(`${todo.length} ${label}`);
    }
    return `ringkasan ${apply ? 'diisi' : 'akan diisi'}: ${results.join(', ')}`;
  },
};
