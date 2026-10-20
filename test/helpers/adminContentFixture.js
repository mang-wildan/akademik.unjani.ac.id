const express = require('express');
require('express-async-errors');
const path = require('node:path');
const id = n => n.toString(16).padStart(24, '0');
const category = { _id: id(100), nama: 'Perkuliahan', jenis: 'pengumuman', isActive: true };
const seed = () => [1, 2, 3].map(n => ({ _id: id(n), title: `Pengumuman ${n}`, body: '<p>Isi pengumuman.</p>', status: n === 3 ? 'published' : 'draft', kategori: category._id, pinned: false, attachments: [], updatedAt: new Date(), createdAt: new Date() }));
const matches = (doc, filter) => Object.entries(filter).every(([key, value]) => {
  if (key === '$or') return value.some(clause => matches(doc, clause));
  if (key === '$and') return value.every(clause => matches(doc, clause));
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    if (value.$in && !value.$in.map(String).includes(String(doc[key]))) return false;
    if (Object.hasOwn(value, '$ne') && String(doc[key]) === String(value.$ne)) return false;
    if (Object.hasOwn(value, '$exists') && (doc[key] !== undefined) !== value.$exists) return false;
    if (value.$type === 'date' && !(doc[key] instanceof Date)) return false;
    if (value.$lt !== undefined && !(doc[key] < value.$lt)) return false;
    if (value.$lte !== undefined && !(doc[key] <= value.$lte)) return false;
    if (value.$gte !== undefined && !(doc[key] >= value.$gte)) return false;
    if (value.$regex && !new RegExp(value.$regex, value.$options).test(doc[key])) return false;
    return true;
  }
  return String(doc[key]) === String(value);
});
const fakeModel = (docs = seed(), references = {}) => {
  let nextId = 20;
  const calls = [];
  const wrap = doc => doc && Object.assign(doc, {
    toObject() { const { toObject, save, ...plain } = this; return plain; },
    async save() { return this; },
  });
  const query = (filter, single = false) => {
    let skip = 0, limit = Infinity, populate = [], sort = {};
    const result = () => {
      const selected = docs.filter(d => matches(d, filter)).sort((a, b) => {
        for (const [key, dir] of Object.entries(sort)) {
          if (a[key] < b[key]) return -dir;
          if (a[key] > b[key]) return dir;
        }
        return 0;
      }).slice(skip, skip + limit);
      return single ? wrap(selected[0]) : selected;
    };
    const q = {
      select() { return q; }, sort(value) { sort = value; return q; },
      skip(value) { skip = value; return q; }, limit(value) { limit = value; return q; },
      populate(ref) { populate.push(typeof ref === 'string' ? ref : ref.path); return q; },
      async lean() {
        const plain = d => {
          if(!d) return d;
          const result = {...d};
          for (const field of populate) {
            const rows = references[{kategori:'Kategori',prodi:'ProgramStudi',programStudi:'ProgramStudi',fakultas:'Faculty',lembaga:'LembagaAkreditasi'}[field]] || (field==='kategori'?[category]:[]);
            result[field] = typeof d[field] === 'object' ? d[field] : rows.find(r=>String(r._id)===String(d[field])) || null;
          }
          return result;
        };
        return single ? plain(result()) : result().map(plain);
      },
      then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject); },
    };
    return q;
  };
  return {
    docs, calls,
    find: (filter = {}) => { calls.push(['find', filter]); return query(filter); },
    findOne: (filter = {}) => query(filter, true),
    findById: value => query({ _id: value }, true),
    aggregate: async pipeline => {
      calls.push(['aggregate',pipeline]);
      let rows=docs.map(d=>({...d}));
      for(const stage of pipeline){
        if(stage.$match)rows=rows.filter(d=>matches(d,stage.$match));
        if(stage.$addFields)for(const row of rows){
          const rule=stage.$addFields._rank.$switch;
          row._rank=rule.branches.find(b=>row[b.case.$eq[0].slice(1)]===b.case.$eq[1])?.then??rule.default;
        }
        if(stage.$sort)rows.sort((a,b)=>{for(const [key,dir]of Object.entries(stage.$sort)){if(a[key]<b[key])return -dir;if(a[key]>b[key])return dir;}return 0;});
        if(stage.$skip)rows=rows.slice(stage.$skip);
        if(stage.$limit)rows=rows.slice(0,stage.$limit);
        if(stage.$unset)rows.forEach(row=>delete row[stage.$unset]);
      }
      return rows;
    },
    countDocuments: async (filter = {}) => { calls.push(['countDocuments', filter]); return docs.filter(d => matches(d, filter)).length; },
    exists: async filter => docs.some(d => matches(d, filter)),
    distinct: async field => [...new Set(docs.map(d => d[field]))],
    insertMany: async rows => { const inserted=rows.map(data=>({...data,_id:id(nextId++)})); docs.push(...inserted); return inserted; },
    create: async data => { const doc = { ...data, _id: id(nextId++), updatedAt: new Date() }; docs.push(doc); return doc; },
    updateMany: async (filter, data) => {
      const found = docs.filter(d => matches(d, filter));
      found.forEach(d => Object.assign(d, data));
      return { matchedCount: found.length };
    },
    deleteOne: async filter => { const i = docs.findIndex(d => matches(d, filter)); if (i >= 0) docs.splice(i, 1); return { deletedCount: i < 0 ? 0 : 1 }; },
    findByIdAndDelete: async value => { const i = docs.findIndex(d => d._id === value); return i < 0 ? null : docs.splice(i, 1)[0]; },
    deleteMany: async filter => {
      let deletedCount = 0;
      for (let i = docs.length - 1; i >= 0; i--) if (matches(docs[i], filter)) { docs.splice(i, 1); deletedCount++; }
      return { deletedCount };
    },
  };
};

// Real routes, middleware and templates; only database methods are replaced.
const fixture = (mock, { basePath = 'pengumuman', docs, role = 'admin', references = {} } = {}) => {
  const Model = fakeModel(docs, references);
  const modules={settings:'SiteSetting',profile:'User',users:'User','program-studi':'ProgramStudi',staff:'Staff',unit:'Unit',faculties:'Faculty','profil-akademik':'AcademicProfile',kategori:'Kategori',pengumuman:'Pengumuman',news:'News',books:'Book','academic-documents':'AcademicDocument','rpl-documents':'RplDocument',kurikulum:'Kurikulum','academic-calendars':'AcademicCalendar',accreditations:'Accreditation','graduation-books':'GraduationBook',lulusan:'Lulusan','lembaga-akreditasi':'LembagaAkreditasi'};
  const actual = require(`../../models/${modules[basePath]}`);
  for (const [key, value] of Object.entries(Model)) if (typeof value === 'function') mock.method(actual, key, value);
  if (['pengumuman', 'news'].includes(basePath)) mock.method(require('../../models/Kategori'), 'find', () => ({ sort() { return this; }, lean: async () => [category] }));
  for (const [name, rows] of Object.entries(references)) {
    const ref = require(`../../models/${name}`), fake = fakeModel(rows);
    for (const [key,value] of Object.entries(fake)) if(typeof value==='function') mock.method(ref,key,value);
  }
  const app = express();
  app.set('view engine', 'ejs'); app.set('views', path.join(__dirname, '../../views'));
  Object.assign(app.locals, require('../../utils/navigation'), require('../../utils/format'), require('../../utils/listQuery'), {
    icon: require('../../utils/icons'), roleLabel: require('../../utils/roles').roleLabel, isSuperadmin: require('../../utils/roles').isSuperadmin, assetUrl: p => p,
    TINGKAT: require('../../utils/staffTingkat').TINGKAT,
  });
  app.use(express.urlencoded({ extended: true }));
  app.use(require('cookie-parser')());
  app.use(require('../../middleware/adminPrefs'));
  app.use(['/admin', '/dashboard', '/profile'], require('../../middleware/strictCsp'));
  app.use(require('../../middleware/renderPage'));
  app.use(express.static(path.join(__dirname, '../../public')));
  app.use((req, res, next) => {
    req.user = { _id: id(200), name: 'Admin Uji', role, ...(basePath === 'profile' ? docs?.find(d => String(d._id) === id(200)) : {}) };
    Object.assign(res.locals, { path: req.path, alertSuccess: req.query.success, alertError: req.query.error });
    next();
  });
  const routeNames={settings:'siteSetting',profile:'auth',users:'userAccount','program-studi':'programStudi',faculties:'faculty','profil-akademik':'academicProfile','academic-documents':'academicDocument','rpl-documents':'rplDocument','academic-calendars':'academicCalendar',accreditations:'accreditation','graduation-books':'graduationBook','lembaga-akreditasi':'lembagaAkreditasi',books:'book'};
  app.use(basePath === 'profile' ? '/' : `/admin/${basePath}`, require(`../../routes/${routeNames[basePath]||basePath}Routes`));
  app.use((err, req, res, next) => res.status(err.status || 500).send(err.stack));
  return { app, Model };
};
module.exports = { id, category, seed, fakeModel, fixture };
