const { escapeRegex } = require('./regex');

// Konfigurasi berasal dari modul, bukan req.query. Filter memakai daftar nilai
// bertipe asli; state hanya berisi string yang bisa dipakai URLSearchParams.
const parseListQuery = (query = {}, {
  sortable = [],
  defaultSort = { updatedAt: -1 },
  filters = {},
  searchFields = ['title'],
  pageSize = 25,
} = {}) => {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new TypeError('pageSize harus bilangan bulat positif');
  const scalar = key => Object.hasOwn(query, key) && typeof query[key] === 'string' ? query[key].trim() : '';
  const filter = {}, state = {};
  for (const [field, allowed] of Object.entries(filters)) {
    const raw = scalar(field);
    if (!raw) continue;
    const value = allowed.find(value => String(value) === raw);
    if (value === undefined) continue;
    filter[field] = value;
    state[field] = String(value);
  }

  const q = scalar('q');
  if (q && searchFields.length) {
    filter.$or = searchFields.map(field => ({ [field]: { $regex: escapeRegex(q), $options: 'i' } }));
    state.q = q;
  }

  let sort = { ...defaultSort };
  const field = scalar('sort');
  if (field && sortable.includes(field)) {
    const requestedDir = scalar('dir');
    const dir = ['asc', 'desc'].includes(requestedDir) ? requestedDir : defaultSort[field] === -1 ? 'desc' : 'asc';
    sort = { [field]: dir === 'desc' ? -1 : 1 };
    state.sort = field;
    state.dir = dir;
  }

  const rawPage = scalar('page');
  const requestedPage = /^\d+$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && Number.isSafeInteger((requestedPage - 1) * pageSize) ? requestedPage : 1;
  state.page = String(page);
  return { filter, sort, page, limit: pageSize, skip: (page - 1) * pageSize, state };
};

// Tautan relatif untuk daftar: state dari parseListQuery + perubahan. Setiap
// perubahan selain `page` (filter, cari, urutan) kembali ke halaman 1.
const listHref = (state = {}, changes = {}) => {
  const merged = { ...state, ...changes };
  if (!Object.hasOwn(changes, 'page') || String(merged.page) === '1') delete merged.page;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  }
  return `?${params}`;
};

// Nomor halaman untuk pagination: pertama, terakhir, dan tetangga halaman aktif.
// Celah lebih dari satu halaman menjadi '…'; celah tepat satu halaman tetap angka.
const pageItems = (page, totalPages) => {
  const last = Math.max(totalPages, 1);
  const shown = [...new Set([1, page - 1, page, page + 1, last])].filter(n => n >= 1 && n <= last).sort((a, b) => a - b);
  const items = [];
  shown.forEach((n, i) => {
    const gap = i ? n - shown[i - 1] : 1;
    if (gap === 2) items.push(n - 1);
    else if (gap > 2) items.push('…');
    items.push(n);
  });
  return items;
};

module.exports = { parseListQuery, listHref, pageItems };
