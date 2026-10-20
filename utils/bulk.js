// Aksi massal untuk halaman daftar admin (docs/ARCHITECTURE.md §2.7, SPEC FR-ADM-32..37).
//
//   router.post('/bulk', bulkHandler({ Model, basePath: 'news', noun: 'berita', actions: {...} }))
//   (daftarkan sebelum '/:id' agar "bulk" tidak tertangkap sebagai ID)
//
// actions: { key: { label: 'diterbitkan', update: { status: 'published' } } }
//       atau { key: { label: 'dihapus', run: async (ids, req) => number | { done, failed } } }
//   update → satu updateMany; run → untuk efek samping (mis. hapus file upload).
// listQuery: opsi parseListQuery yang sama dengan halaman daftar. Dipakai untuk
//   scope=filter ("pilih semua hasil filter") dan untuk membawa filter kembali ke daftar.
// parseQuery: parser async modul untuk filter turunan/referensi; hasilnya tetap
//   {filter,state} dari parseListQuery yang dipakai juga oleh halaman daftar.
// baseFilter: cakupan modul yang selalu berlaku (juga untuk ID yang dipilih eksplisit).
// exclude: req => ID yang tidak boleh diproses (mis. akun sendiri); dilaporkan "dilewati".
const { validate, bulkSchema } = require('../validators');
const { parseListQuery, listHref } = require('./listQuery');

const BULK_LIMIT = 500;

const firstError = errors => {
  for (const field of ['action', 'scope', 'ids']) {
    const hit = Object.entries(errors).find(([key]) => key === field || key.startsWith(`${field}.`));
    if (hit) return hit[1];
  }
  return Object.values(errors)[0];
};

const bulkHandler = ({ Model, basePath, noun, actions = {}, listQuery = {}, parseQuery = query => parseListQuery(query, listQuery), baseFilter = {}, exclude = () => [], limit = BULK_LIMIT }) => {
  if (!/^[a-z0-9-]+$/.test(basePath || '')) throw new TypeError('bulkHandler: basePath harus slug modul, mis. "news"');
  const keys = Object.keys(actions);
  if (!keys.length) throw new TypeError('bulkHandler: daftarkan minimal satu aksi');
  for (const [key, spec] of Object.entries(actions)) {
    if (Boolean(spec.update) === Boolean(spec.run)) throw new TypeError(`bulkHandler: aksi "${key}" harus punya update atau run (salah satu)`);
  }
  const schema = bulkSchema(keys, limit);

  return async (req, res) => {
    const body = req.body || {};
    // Filter dari body disaring ulang dengan daftar putih yang sama seperti halaman daftar;
    // tujuan redirect selalu /admin/<basePath>, jadi body tidak bisa membelokkannya.
    const list = await parseQuery(body);
    const back = changes => res.redirect(303, `/admin/${basePath}${listHref(list.state, { page: list.state.page, ...changes })}`);

    const result = validate(schema, body);
    if (!result.ok) return back({ error: firstError(result.errors) });
    const { action, scope, ids } = result.data;

    let filter;
    if (scope === 'filter') {
      filter = { ...list.filter, ...baseFilter };
      const total = await Model.countDocuments(filter);
      if (total > limit) return back({ error: `Hasil filter berisi ${total} data; maksimal ${limit} per aksi. Persempit filter dulu.` });
    } else {
      filter = { ...baseFilter, _id: { $in: [...new Set(ids)] } };
    }

    // ID yang tidak ada atau di luar cakupan modul gugur di sini.
    const found = (await Model.find(filter).select('_id').lean()).map(doc => String(doc._id));
    const protectedIds = new Set((await exclude(req)).map(String));
    const targets = found.filter(target => !protectedIds.has(target));
    const skipped = found.length - targets.length;
    if (!targets.length) return back({ error: 'Tidak ada data yang bisa diproses.' });

    const spec = actions[action];
    let done = targets.length;
    let failed = 0;
    if (spec.update) {
      done = (await Model.updateMany({ ...baseFilter, _id: { $in: targets } }, spec.update)).matchedCount;
    } else {
      const outcome = await spec.run(targets, req);
      if (typeof outcome === 'number') done = outcome;
      else if (outcome && typeof outcome === 'object') ({ done = 0, failed = 0 } = outcome);
    }

    if (!done && failed) return back({ error: `${failed} ${noun} gagal ${spec.label}` });
    const parts = [`${done} ${noun} ${spec.label}`];
    if (failed) parts.push(`${failed} gagal`);
    if (skipped) parts.push(`${skipped} dilewati`);
    return back({ success: parts.join(', ') });
  };
};

module.exports = { bulkHandler, BULK_LIMIT };
