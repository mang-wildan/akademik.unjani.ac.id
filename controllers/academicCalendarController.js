// Admin CRUD untuk Kalender Akademik (FR-M-03, K-04). Beda dari pola
// Pengumuman: tiap tahun ajaran punya dua sub-koleksi bersarang (events[],
// lampiran[]) yang dikelola lewat form terpisah pada halaman ubah, bukan
// field datar — jadi modul ini tidak memakai adminContentController.js.
const fs = require('fs/promises');
const path = require('path');
const AcademicCalendar = require('../models/AcademicCalendar');
const { removeUploadFiles } = require('../utils/upload');
const { validate, schemas } = require('../validators');
const ADMIN_LAYOUT = 'layouts/admin-v2';
const { parseCalendarCsv, templateCsv } = require('../utils/calendarImport');
const { SEMESTER } = require('../utils/calendar');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const toPublicUrl = absPath => `/${path.relative(PUBLIC_DIR, absPath).replace(/\\/g, '/')}`;
const removeUploaded = async req => {
  const files = [req.files?.file?.[0], req.files?.lampiran?.[0], req.files?.csv?.[0]].filter(Boolean);
  await Promise.all(files.map(f => fs.unlink(f.path).catch(() => {})));
};

const saved = (req,res,message) => req.query.partial==='1' ? res.json({ok:true,message}) : res.redirect(303, `/admin/academic-calendars/${req.params.id}/edit?success=${encodeURIComponent(message)}`);

const admin = require('../utils/academicAdmin')({ Model: AcademicCalendar, basePath: 'academic-calendars', title: 'Kalender Akademik', query: {sortable:['tahunAjaran','updatedAt'],defaultSort:{tahunAjaran:-1},searchFields:['tahunAjaran','nomorSK']}, files:i=>[i.file,...(i.lampiran||[]).map(l=>l.file)],decorate:i=>({...i,events:i.events||[],lampiran:i.lampiran||[]}) });
exports.list = admin.list;
exports.bulk = admin.bulk;

exports.showCreate = (req, res) => {
  res.renderPage('admin/academic-calendars/create', { title: 'Tambah Kalender Akademik', values: {}, errors: {} }, ADMIN_LAYOUT);
};

exports.create = async (req, res) => {
  const { data, errors, ok } = validate(schemas.calendar, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.file?.[0];
  if (!file) fieldErrors.file = 'File SK Rektor (PDF) wajib diisi.';
  if (!ok || fieldErrors.file) {
    await removeUploaded(req);
    return res.status(422).renderPage('admin/academic-calendars/create', { title: 'Tambah Kalender Akademik', values: req.body, errors: fieldErrors }, ADMIN_LAYOUT);
  }
  const existing = await AcademicCalendar.findOne({ tahunAjaran: data.tahunAjaran });
  if (existing) {
    await removeUploaded(req);
    return res.status(422).renderPage(
      'admin/academic-calendars/create',
      { title: 'Tambah Kalender Akademik', values: req.body, errors: { tahunAjaran: `Tahun ajaran ${data.tahunAjaran} sudah ada.` } },
      ADMIN_LAYOUT
    );
  }
  let created;
  try { created = await AcademicCalendar.create({ ...data, file: toPublicUrl(file.path), createdBy: req.user._id, updatedBy: req.user._id }); } catch (err) { await removeUploaded(req); throw err; }
  if(req.query.partial==='1') return res.json({ok:true,message:'Kalender akademik berhasil ditambahkan.'});
  res.redirect(303, `/admin/academic-calendars/${created._id}/edit?success=${encodeURIComponent('Kalender akademik berhasil ditambahkan.')}`);
};

const findOrThrow = async id => {
  const item = await AcademicCalendar.findById(id);
  if (!item) {
    const err = new Error('Kalender akademik tidak ditemukan.');
    err.status = 404;
    err.expose = true;
    throw err;
  }
  return item;
};

exports.showEdit = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  res.renderPage(
    'admin/academic-calendars/edit',
    { title: `Kalender ${item.tahunAjaran}`, semesterOptions: SEMESTER, item: item.toObject(), values: item.toObject(), errors: {}, eventErrors: {}, eventValues: {}, lampiranErrors: {}, lampiranValues: {}, importErrors: null },
    'layouts/admin-v2'
  );
};

exports.update = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const { data, errors, ok } = validate(schemas.calendar, req.body);
  if (!ok) {
    await removeUploaded(req);
    return res.status(422).renderPage(
      'admin/academic-calendars/edit',
      { title: `Kalender ${item.tahunAjaran}`, semesterOptions: SEMESTER, item: item.toObject(), values: req.body, errors, eventErrors: {}, eventValues: {}, lampiranErrors: {}, lampiranValues: {}, importErrors: null },
      ADMIN_LAYOUT
    );
  }
  if (data.tahunAjaran !== item.tahunAjaran) {
    const dup = await AcademicCalendar.findOne({ tahunAjaran: data.tahunAjaran, _id: { $ne: item._id } });
    if (dup) {
      await removeUploaded(req);
      return res.status(422).renderPage(
        'admin/academic-calendars/edit',
        { title: `Kalender ${item.tahunAjaran}`, semesterOptions: SEMESTER, item: item.toObject(), values: req.body, errors: { tahunAjaran: `Tahun ajaran ${data.tahunAjaran} sudah ada.` }, eventErrors: {}, eventValues: {}, lampiranErrors: {}, lampiranValues: {}, importErrors: null },
        ADMIN_LAYOUT
      );
    }
  }
  const previousFiles = [item.file];
  const file = req.files?.file?.[0];
  if (file) item.file = toPublicUrl(file.path);
  Object.assign(item, data, { updatedBy: req.user._id });
  try { await item.save(); } catch (err) { await removeUploaded(req); throw err; }
  await removeUploadFiles('academic-calendars', previousFiles.filter(url => url && ![item.file].includes(url)));
  saved(req,res,'Kalender akademik berhasil diperbarui.');
};

exports.destroy = admin.destroy;

exports.downloadTemplate = (_req, res) => {
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="template-kalender-akademik.csv"');
  res.send(templateCsv());
};

// ----------------------------------------------------------- kegiatan (events)
exports.addEvent = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const { data, errors, ok } = validate(schemas.kegiatan, req.body);
  if (!ok) {
    return res.status(422).renderPage(
      'admin/academic-calendars/edit',
      { title: `Kalender ${item.tahunAjaran}`, semesterOptions: SEMESTER, item: item.toObject(), values: item.toObject(), errors: {}, eventErrors: errors, eventValues: req.body, lampiranErrors: {}, lampiranValues: {}, importErrors: null },
      ADMIN_LAYOUT
    );
  }
  item.events.push({ ...data, urutan: item.events.length + 1 });
  item.updatedBy = req.user._id;
  await item.save();
  saved(req,res,'Kegiatan berhasil ditambahkan.');
};

exports.deleteEvent = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  item.events = item.events.filter(e => String(e._id) !== req.params.eventId);
  item.updatedBy = req.user._id;
  await item.save();
  saved(req,res,'Kegiatan berhasil dihapus.');
};

// CSV import REPLACES the whole events list for this year — the admin
// re-uploads the full corrected sheet rather than appending to it, which
// avoids duplicate rows on a second attempt after fixing a typo.
exports.importEvents = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const csvFile = req.files?.csv?.[0];
  if (!csvFile) {
    return res.status(422).renderPage(
      'admin/academic-calendars/edit',
      { title: `Kalender ${item.tahunAjaran}`, semesterOptions: SEMESTER, item: item.toObject(), values: item.toObject(), errors: {}, eventErrors: {}, eventValues: {}, lampiranErrors: {}, lampiranValues: {}, importErrors: ['File CSV wajib diisi.'] },
      ADMIN_LAYOUT
    );
  }
  const text = await fs.readFile(csvFile.path, 'utf8');
  await fs.unlink(csvFile.path).catch(() => {});
  const { events, errors } = parseCalendarCsv(text);
  if (errors.length) {
    return res.status(422).renderPage(
      'admin/academic-calendars/edit',
      { title: `Kalender ${item.tahunAjaran}`, semesterOptions: SEMESTER, item: item.toObject(), values: item.toObject(), errors: {}, eventErrors: {}, eventValues: {}, lampiranErrors: {}, lampiranValues: {}, importErrors: errors },
      ADMIN_LAYOUT
    );
  }
  item.events = events;
  item.updatedBy = req.user._id;
  await item.save();
  saved(req,res,`${events.length} kegiatan berhasil diimpor (menggantikan daftar lama).`);
};

// ----------------------------------------------------------- lampiran (surat edaran)
exports.addLampiran = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const { data, errors, ok } = validate(schemas.lampiran, req.body);
  const fieldErrors = errors || {};
  const file = req.files?.lampiran?.[0];
  if (!file) fieldErrors.file = 'File surat edaran (PDF) wajib diisi.';
  if (!ok || fieldErrors.file) {
    await removeUploaded(req);
    return res.status(422).renderPage(
      'admin/academic-calendars/edit',
      { title: `Kalender ${item.tahunAjaran}`, semesterOptions: SEMESTER, item: item.toObject(), values: item.toObject(), errors: {}, eventErrors: {}, eventValues: {}, lampiranErrors: fieldErrors, lampiranValues: req.body, importErrors: null },
      ADMIN_LAYOUT
    );
  }
  item.lampiran.push({ ...data, file: toPublicUrl(file.path), fileSize: file.size });
  item.updatedBy = req.user._id;
  try { await item.save(); } catch (err) { await removeUploaded(req); throw err; }
  saved(req,res,'Lampiran berhasil ditambahkan.');
};

exports.deleteLampiran = async (req, res) => {
  const item = await findOrThrow(req.params.id).catch(async err => { await removeUploaded(req); throw err; });
  const removed = item.lampiran.find(l => String(l._id) === req.params.lampiranId);
  item.lampiran = item.lampiran.filter(l => String(l._id) !== req.params.lampiranId);
  item.updatedBy = req.user._id;
  await item.save();
  if (removed) await removeUploadFiles('academic-calendars', [removed.file]);
  saved(req,res,'Lampiran berhasil dihapus.');
};
