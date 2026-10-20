// Daftar dan penghapusan berkas memakai cakupan yang sama untuk aksi satuan/massal.
const { parseListQuery } = require('./listQuery');
const { bulkHandler } = require('./bulk');
const { removeUploadFiles } = require('./upload');

module.exports = ({ Model, basePath, title, query, resolve = async () => {}, populate = [], refs = async () => ({}), files = () => [], actions = {}, decorate = item => item }) => {
  const parseQuery = async input => {
    const parsed = parseListQuery(input, typeof query === 'function' ? await query() : query);
    await resolve(parsed.filter, parsed.state);
    return parsed;
  };
  const list = async (req, res, extra = {}) => {
    const parsed = await parseQuery(req.query);
    const { filter, sort, limit, state } = parsed;
    const total = await Model.countDocuments(filter);
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const page = Math.min(parsed.page, totalPages);
    let cursor = Model.find(filter);
    for (const ref of populate) cursor = cursor.populate(ref);
    const items = (await cursor.sort(sort).skip((page - 1) * limit).limit(limit).lean()).map(decorate);
    res.renderPage(`admin/${basePath}/list`, { title, items, state: { ...state, page: String(page) }, pagination: { page, totalPages, total, pageSize: limit }, ...(await refs()), ...extra }, 'layouts/admin-v2');
  };
  const success = (req, res, message) => req.query.partial === '1' ? res.json({ ok: true, message }) : res.redirect(303, `/admin/${basePath}?success=${encodeURIComponent(message)}`);
  const deleteItem = async id => {
    const item = await Model.findById(id).lean();
    if (!item) return 0;
    await removeUploadFiles(basePath, files(item).filter(Boolean));
    await Model.deleteOne({ _id: id });
    return 1;
  };
  const destroy = async (req, res) => { await deleteItem(req.params.id); success(req, res, `${title} berhasil dihapus.`); };
  const bulk = bulkHandler({ Model, basePath, noun: title.toLowerCase(), parseQuery, actions: {
    ...actions,
    delete: { label: 'dihapus', run: async ids => {
      let done = 0, failed = 0;
      for (const id of ids) {
        try { done += await deleteItem(id); }
        catch (err) { failed++; console.error(`Gagal menghapus ${basePath}`, id, err); }
      }
      return { done, failed };
    } },
  } });
  return { list, success, destroy, bulk };
};
