const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {fixture,id}=require('./helpers/adminContentFixture');
const prodi={_id:id(101),nama:'Informatika <script>',singkatan:'IF',fakultas:id(102)};
const faculty={_id:id(102),nama:'Teknik',singkatan:'FT'};
const lembaga={_id:id(103),nama:'BAN PT',singkatan:'BAN-PT',urutan:1};
const references={ProgramStudi:[prodi],Faculty:[faculty],LembagaAkreditasi:[lembaga],Kategori:[{_id:id(104),nama:'Pedoman',jenis:'dokumen',isActive:true}]};
const modules=['academic-documents','rpl-documents','kurikulum','academic-calendars','accreditations','lembaga-akreditasi','graduation-books','lulusan'];
const setup=async(t,basePath,docs=[],role='superadmin')=>{
 const refs={...references};if(basePath==='lembaga-akreditasi')delete refs.LembagaAkreditasi;
 const {app,Model}=fixture(t.mock,{basePath,docs,role,references:refs});
 const dir=path.join(__dirname,'../public/uploads',basePath),before=new Set(await fs.readdir(dir).catch(()=>[]));
 t.after(async()=>{for(const name of await fs.readdir(dir).catch(()=>[]))if(name.includes('f3-test-')&&!before.has(name))await fs.rm(path.join(dir,name),{force:true});});
 const server=app.listen(0,'127.0.0.1'); await new Promise(r=>server.once('listening',r)); t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}/admin/${basePath}`;
 return {Model,get:s=>fetch(base+s),post:(s,body)=>fetch(base+s,{method:'POST',body:body instanceof FormData?body:new URLSearchParams(body),redirect:'manual'})};
};
const multipart=(fields,fileField='file',content='%PDF-1.4\n%%EOF',mime='application/pdf')=>{
 const body=new FormData();for(const [k,v]of Object.entries(fields))body.set(k,v);
 if(fileField)body.set(fileField,new Blob([content],{type:mime}),`f3-test-${randomUUID()}.${mime==='text/csv'?'csv':'pdf'}`);
 return body;
};
for(const base of modules)test(`${base}: v2 list, partial form, 422 and safe bulk route`,async t=>{
 const {get,post}=await setup(t,base);
 let r=await get(''); assert.equal(r.status,200,await r.clone().text()); assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);
 r=await get('/new?partial=1'); const html=await r.text(); assert.equal(r.status,200,html);assert.doesNotMatch(html,/<!DOCTYPE/);assert.match(html,/name=/);
 r=await post('?partial=1',{}); const invalid=await r.text();assert.equal(r.status,422,invalid);assert.match(invalid,/aria-invalid="true"/);assert.doesNotMatch(invalid,/<!DOCTYPE/);
 r=await post('/bulk',{action:'unexpected',ids:id(1)});assert.equal(r.status,303);assert.match(r.headers.get('location'),/error=/);
});
test('academic forms expose one page heading and serif panels, with stacked partial fallback', async t=>{
 for(const base of modules){
  await t.test(base,async t=>{
   const doc={_id:id(1),title:'Judul <uji>',name:'Dokumen <uji>',judul:'RPL <uji>',nama:'Lembaga <uji>',singkatan:'UJI',urutan:0,tahun:'2026',year:2026,periode:'I',jumlah:0,tahunAjaran:'2026/2027',nomorSK:'SK <uji>',programStudi:null,prodi:null,kategori:null,fakultas:null,lembaga:null,jenis:'institusi',namaUnit:'Unit <uji>',peringkat:'Unggul',events:[],lampiran:[]};
   const {get}=await setup(t,base,[doc]);
   for(const url of ['/new',`/${id(1)}/edit`]){
    const r=await get(url),html=await r.text();assert.equal(r.status,200,html);
    assert.equal((html.match(/<h1\b/g)||[]).length,1);
    assert.match(html,/<h2[^>]*class="[^"]*font-serif/);
    if(['academic-documents','rpl-documents','kurikulum','graduation-books'].includes(base))assert.match(html,/<h2[^>]*>Berkas<\/h2>/);
    assert.doesNotMatch(html,/<input type="file"[^>]*\svalue=/);
    const partial=await(await get(url+'?partial=1')).text();
    assert.doesNotMatch(partial,/<h1\b|<!DOCTYPE/);
    assert.match(partial,/name=/);
   }
   const list=await(await get('')).text();
   assert.equal((list.match(/<h1\b/g)||[]).length,1);
   assert.doesNotMatch(list,/<script>/);
   if(base==='lulusan')assert.match(list,/<td class="dt-meta">\s*0\s*<\/td>/);
   if(base==='accreditations')assert.match(list,/Tanggal belum diisi/);
  });
 }
});

test('academic empty lists distinguish initial state from filtered results',async t=>{
 const {get}=await setup(t,'kurikulum');
 const initial=await(await get('')).text();assert.match(initial,/Belum ada kurikulum/i);assert.equal((initial.match(/href="\/admin\/kurikulum\/new"/g)||[]).length,2);
 const filtered=await(await get('?q=kosong')).text();assert.match(filtered,/Tidak ada kurikulum yang cocok/i);assert.match(filtered,/Hapus filter/);
});

test('calendar groups have native anchor navigation and keep nested form contracts and errors',async t=>{
 const {get,post}=await setup(t,'academic-calendars',[{_id:id(1),tahunAjaran:'2026/2027',nomorSK:'SK Uji',file:'/uploads/academic-calendars/current.pdf',events:[],lampiran:[]}]);
 let html=await(await get(`/${id(1)}/edit`)).text();
 for(const target of ['data-kalender','kegiatan','impor-kegiatan','lampiran']){assert.match(html,new RegExp(`href="#${target}"`));assert.match(html,new RegExp(`id="${target}"`));}
 assert.match(html,new RegExp(`method="POST" action="/admin/academic-calendars/${id(1)}/events/import" enctype="multipart/form-data"`));
 assert.match(html,/href="\/uploads\/academic-calendars\/current.pdf"/);
 let r=await post(`/${id(1)}`,{tahunAjaran:'salah',nomorSK:'SK <baru>'});assert.equal(r.status,422);html=await r.text();assert.match(html,/value="salah"/);assert.match(html,/value="SK &lt;baru&gt;"/);assert.match(html,/current.pdf/);
 r=await post(`/${id(1)}/events`,{nama:'Kegiatan <baru>',semester:'ganjil',mulai:'',selesai:''});assert.equal(r.status,422);html=await r.text();assert.match(html,/value="Kegiatan &lt;baru&gt;"/);assert.match(html,/href="#event-mulai"/);
 r=await post(`/${id(1)}/lampiran`,{judul:'Surat <uji>',nomorSurat:'SE 1',tanggal:'2026-11-16'});assert.equal(r.status,422);html=await r.text();assert.match(html,/value="Surat &lt;uji&gt;"/);assert.match(html,/href="#f-lampiran"/);
});

test('failed academic edits retain text, selections, zero and valid existing-file links',async t=>{
 const fixtures=[
  ['academic-documents',{name:'Judul <uji>',kategori:id(104),pinned:'on',keterangan:'Catatan uji'}, {name:'',kategori:id(104),pinned:'on',keterangan:'Catatan <baru>'},'file','keterangan','Catatan &lt;baru&gt;'],
  ['rpl-documents',{judul:'RPL uji',tahun:2026,status:true},{judul:'',tahun:'2027',status:'on',deskripsi:'Deskripsi <baru>'},'file','deskripsi','Deskripsi &lt;baru&gt;'],
  ['kurikulum',{prodi:id(101),tahun:'2026'},{prodi:id(101),tahun:'salah'},'file','tahun','salah'],
  ['graduation-books',{title:'Wisuda uji',year:2026,periode:'I'},{title:'',year:'2027',periode:'II'},'src','year','2027'],
  ['accreditations',{jenis:'institusi',namaUnit:'Unit',lembaga:id(103),peringkat:'Unggul'},{jenis:'institusi',namaUnit:'Unit <baru>',lembaga:id(103),peringkat:'Unggul',tanggalBerlaku:'',berlakuSampai:''},'sertifikat','namaUnit','Unit &lt;baru&gt;'],
  ['lulusan',{programStudi:id(101),fakultas:id(102),tahun:2026,periode:'I',jumlah:0},{programStudi:id(101),fakultas:id(102),tahun:'1900',periode:'II',jumlah:'0'},null,'jumlah','0'],
 ];
 for(const [base,seed,body,fileField,name,value]of fixtures)await t.test(base,async t=>{
  const doc={_id:id(1),...seed,...(fileField?{[fileField]:`/uploads/${base}/current.pdf`}:{})};
  const {post}=await setup(t,base,[doc]);const r=await post(`/${id(1)}?partial=1`,body),html=await r.text();assert.equal(r.status,422,html);
  assert.match(html,new RegExp(`name="${name}"[^>]*value="${value}"|name="${name}"[^>]*>${value}`));
  if(fileField)assert.match(html,new RegExp(`href="/uploads/${base}/current.pdf"`));
  assert.doesNotMatch(html,/<input type="file"[^>]*\svalue=/);
  for(const target of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${target[1]}"`),`${base}: ${target[1]}`);
 });
});

test('Lembaga is restricted to superadmin',async t=>{const{get,post}=await setup(t,'lembaga-akreditasi',[],'editor');assert.equal((await get('')).status,403);assert.equal((await post('/bulk',{action:'delete',ids:id(1)})).status,403);});
test('RPL boolean filters apply identically to bulk; selected IDs ignore the list filter',async t=>{
 const {Model,get,post}=await setup(t,'rpl-documents',[{_id:id(1),judul:'RPL (baru)',tahun:2026,status:true},{_id:id(2),judul:'Lama',tahun:2025,status:false}]);
 let r=await get('?status=true&q=%28&sort=tahun&dir=desc&page=99');assert.equal(r.status,200,await r.clone().text());assert.match(await r.text(),/RPL \(baru\)/);
 r=await post('/bulk',{action:'deactivate',scope:'filter',status:'true',q:'('});assert.equal(r.status,303);assert.deepEqual(Model.docs.map(d=>d.status),[false,false]);
 await post('/bulk',{action:'activate',scope:'selected',ids:id(2),status:'true'});assert.equal(Model.docs[1].status,true);
});
test('Academic documents enforce pin limit and clean rejected/replaced/deleted PDFs',async t=>{
 const{Model,post}=await setup(t,'academic-documents');const fields={name:'Pedoman Akademik',kategori:id(104)};
 let r=await post('?partial=1',multipart(fields));assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).ok,true);
 const first=Model.docs[0], old=first.file;await fs.access(path.join(__dirname,'../public',old));
 r=await post(`/${first._id}?partial=1`,multipart({...fields,name:'Pedoman diperbarui'}));assert.equal(r.status,200);assert.notEqual(first.file,old);await assert.rejects(fs.access(path.join(__dirname,'../public',old)),{code:'ENOENT'});
 const current=first.file;await post('/bulk',{action:'delete',ids:first._id});assert.equal(Model.docs.length,0);await assert.rejects(fs.access(path.join(__dirname,'../public',current)),{code:'ENOENT'});
 for(let n=1;n<=4;n++)Model.docs.push({_id:id(n),name:'Sematan',pinned:true});
 r=await post('?partial=1',multipart({...fields,pinned:'on'}));assert.equal(r.status,422);assert.match(await r.text(),/Maksimal 4/);assert.equal(Model.docs.length,4);
});
test('Kurikulum duplicate validation, full-page create/update and filtered bulk',async t=>{
 const{Model,get,post}=await setup(t,'kurikulum');const fields={prodi:id(101),tahun:'2026/2027'};
 let r=await post('',multipart(fields));assert.equal(r.status,303,await r.clone().text());const item=Model.docs[0];
 r=await post('?partial=1',multipart(fields));assert.equal(r.status,422);assert.match(await r.text(),/sudah ada/);
 r=await get('');assert.equal(r.status,200);const html=await r.text();assert.match(html,/Informatika &lt;script&gt;/);assert.doesNotMatch(html,/data-slide-over/);
 r=await post(`/${item._id}?partial=1`,fields);assert.equal(r.status,200);assert.equal((await r.json()).ok,true);
 await post('/bulk',{action:'delete',scope:'filter',prodi:id(101),q:'2026'});assert.equal(Model.docs.length,0);
});
test('Akreditasi expiry and reference search preserve WIB status in bulk; invalid dates render 422',async t=>{
 const{Model,get,post}=await setup(t,'accreditations',[{_id:id(1),jenis:'prodi',programStudi:id(101),lembaga:id(103),peringkat:'Unggul',berlakuSampai:new Date('2000-01-01'),isActive:true}]);
 let r=await get('?status=kedaluwarsa&q=Informatika');assert.equal(r.status,200,await r.clone().text());assert.match(await r.text(),/Kedaluwarsa/);
 r=await post('/bulk',{action:'deactivate',scope:'filter',status:'kedaluwarsa',q:'Informatika'});assert.equal(r.status,303);assert.equal(Model.docs[0].isActive,false);
 r=await post(`/${id(1)}?partial=1`,{tanggalBerlaku:'bad',berlakuSampai:'bad'});assert.equal(r.status,422,await r.clone().text());
});
test('Kalender nested validation, CSV replacement and attachment cleanup',async t=>{
 const{Model,get,post}=await setup(t,'academic-calendars');let r=await post('',multipart({tahunAjaran:'2026/2027',nomorSK:'SK 1'}));assert.equal(r.status,303,await r.clone().text());const item=Model.docs[0];item.events=[];item.lampiran=[];
 assert.match(r.headers.get('location'),new RegExp(item._id+'/edit'));
 r=await get(`/${item._id}/edit`);assert.equal(r.status,200,await r.clone().text());
 r=await post(`/${item._id}/events`,{nama:'Kegiatan'});assert.equal(r.status,422);assert.equal(item.events.length,0);
 r=await post(`/${item._id}/events/import`,multipart({},'csv','semester,kegiatan,mulai,selesai\nganjil,Orientasi,2026-08-01,\n','text/csv'));assert.equal(r.status,303,await r.clone().text());assert.equal(item.events.length,1);
 r=await post(`/${item._id}/events/import`,multipart({},'csv','salah\n','text/csv'));assert.equal(r.status,422);assert.equal(item.events.length,1);
 r=await post(`/${item._id}/lampiran`,multipart({judul:'Surat Edaran'},'lampiran'));assert.equal(r.status,303,await r.clone().text());assert.equal(item.lampiran.length,1);const file=item.lampiran[0].file;item.lampiran[0]._id=id(50);
 await post(`/${item._id}/lampiran/${id(50)}/delete`,{});await assert.rejects(fs.access(path.join(__dirname,'../public',file)),{code:'ENOENT'});assert.equal(item.lampiran.length,0);
 await post('/bulk',{action:'delete',ids:item._id});assert.equal(Model.docs.length,0);
});
test('Lulusan filters survive imports errors; CSV resolves master names and inserts atomically',async t=>{
 const{Model,get,post}=await setup(t,'lulusan');let r=await post('/import',{});assert.equal(r.status,422,await r.clone().text());assert.match(await r.text(),/File CSV wajib/);
 r=await post('/import',multipart({},'csv','programStudi,fakultas,periode,tahun,jumlah\nIF,FT,I,2026,120\n','text/csv'));assert.equal(r.status,303,await r.clone().text());assert.equal(Model.docs.length,1);
 r=await get(`?programStudi=${id(101)}&tahun=2026`);assert.equal(r.status,200,await r.clone().text());assert.match(await r.text(),/120/);
 r=await post('/import',multipart({},'csv','programStudi,fakultas,periode,tahun,jumlah\nTidak Ada,FT,I,2026,120\n','text/csv'));assert.equal(r.status,422);assert.equal(Model.docs.length,1);
 await post('/bulk',{action:'delete',scope:'filter',programStudi:id(101),tahun:'2026'});assert.equal(Model.docs.length,0);
});
test('Buku Wisuda multipart cover/PDF survive edit and are removed by bulk deletion',async t=>{
 const {Model,post}=await setup(t,'graduation-books');const fields={title:'Buku Wisuda 2026',year:'2026',periode:'I'};
 const body=multipart(fields),png=await require('sharp')({create:{width:2,height:2,channels:3,background:'#ffffff'}}).png().toBuffer();
 body.set('cover',new Blob([png],{type:'image/png'}),`f3-test-${randomUUID()}.png`);
 let r=await post('?partial=1',body);assert.equal(r.status,200,await r.clone().text());const item=Model.docs[0],files=[item.src,item.cover];
 for(const file of files)await fs.access(path.join(__dirname,'../public',file));
 r=await post(`/${item._id}?partial=1`,{...fields,title:'Buku wisuda diubah'});assert.equal(r.status,200);assert.deepEqual([item.src,item.cover],files);
 r=await post('/bulk',{action:'delete',ids:item._id});assert.equal(r.status,303);assert.equal(Model.docs.length,0);
 for(const file of files)await assert.rejects(fs.access(path.join(__dirname,'../public',file)),{code:'ENOENT'});
});
test('Buku Wisuda accepts a 150 MB PDF, replaces it, and cleans files rejected above 200 MB',async t=>{
 const {Model,post}=await setup(t,'graduation-books');const fields={title:'Buku besar',year:'2026',periode:'I'};
 const png=await require('sharp')({create:{width:2,height:2,channels:3,background:'#ffffff'}}).png().toBuffer();
 const pdf=Buffer.alloc(150*1024*1024,32);pdf.write('%PDF-1.4\n');
 const bodyCreate=multipart(fields,'file',pdf);
 bodyCreate.set('cover',new Blob([png],{type:'image/png'}),`f3-test-${randomUUID()}.png`);
 let r=await post('',bodyCreate);assert.equal(r.status,303,await r.clone().text());
 const item=Model.docs[0],old=path.join(__dirname,'../public',item.src);assert.equal((await fs.stat(old)).size,pdf.length);
 r=await post(`/${item._id}`,multipart(fields));assert.equal(r.status,303);await assert.rejects(fs.access(old),{code:'ENOENT'});
 const current=item.src;
 const tooLarge=Buffer.alloc(200*1024*1024+1,32);tooLarge.write('%PDF-1.4\n');
 const dir=path.join(__dirname,'../public/uploads/graduation-books'),before=(await fs.readdir(dir)).sort();
 r=await post(`/${item._id}`,multipart(fields,'file',tooLarge));assert.equal(r.status,413);assert.match(await r.text(),/PDF Buku Wisuda 200 MB/);
 assert.equal(item.src,current);assert.deepEqual((await fs.readdir(dir)).sort(),before);
 await post('/bulk',{action:'delete',ids:item._id});assert.equal(Model.docs.length,0);
 await assert.rejects(fs.access(path.join(__dirname,'../public',current)),{code:'ENOENT'});
});
test('Buku Wisuda compresses each uploaded PDF once before persistence; failure still saves',async t=>{
 const {Model,post}=await setup(t,'graduation-books');
 const calls=[];t.mock.method(require('../utils/pdfCompress'),'compressPdf',async file=>{await fs.access(file);calls.push(file);return {compressed:false,before:9,after:9};});
 const png=await require('sharp')({create:{width:2,height:2,channels:3,background:'#ffffff'}}).png().toBuffer();
 const fields={title:'Kompres gagal tetap simpan',year:'2026',periode:'I'};
 const create=multipart(fields);create.set('cover',new Blob([png],{type:'image/png'}),`f3-test-${randomUUID()}.png`);
 const actual=require('../models/GraduationBook'),createOriginal=actual.create;
 t.mock.method(actual,'create',async data=>{assert.equal(calls.length,1);return createOriginal(data);});
 let r=await post('',create);assert.equal(r.status,303);assert.equal(Model.docs.length,1);assert.equal(calls.length,1);
 const item=Model.docs[0],save=item.save;
 item.save=async()=>{assert.equal(calls.length,2);return save.call(item);};
 r=await post(`/${item._id}`,multipart(fields));assert.equal(r.status,303);assert.equal(calls.length,2);
 r=await post(`/${item._id}`,fields);assert.equal(r.status,303);assert.equal(calls.length,2);
});
test('Buku Wisuda create/edit advertise 200 MB PDFs with 5 MB covers',async t=>{
 const {get}=await setup(t,'graduation-books',[{_id:id(1),title:'Buku uji',year:2026,periode:'I'}]);
 for(const url of ['/new',`/${id(1)}/edit`]){
  const html=await(await get(url)).text();assert.match(html,/PDF, maks\. 200 MB\./);assert.match(html,/JPG\/PNG\/WEBP, maks\. 5 MB\./);
 }
});
test('Buku Wisuda size errors use ADM-09, discard uploads, and preserve records',async t=>{
 const {Model,post}=await setup(t,'graduation-books',[{_id:id(1),title:'Buku lama',year:2026,periode:'I'}]);
 const png=Buffer.alloc(5*1024*1024+1);Buffer.from([0x89,0x50,0x4e,0x47]).copy(png);
 for(const url of ['',`/${id(1)}`]){
  const body=multipart({title:'Buku baru',year:'2026',periode:'I'});
  body.set('cover',new Blob([png],{type:'image/png'}),`f3-test-${randomUUID()}.png`);
  const r=await post(url,body);assert.equal(r.status,413);assert.match(await r.text(),/Ukuran file terlalu besar\. Batas maksimal: PDF Buku Wisuda 200 MB, gambar 5 MB\./);
  assert.equal(Model.docs.length,1);assert.equal(Model.docs[0].title,'Buku lama');
 }
});
test('Failed file deletion is reported by bulk and retains the database record',async t=>{
 t.mock.method(console,'error',()=>{});
 const{Model,post}=await setup(t,'academic-documents',[{_id:id(1),name:'Path tidak aman',file:'/uploads/academic-documents/../../private.pdf'}]);
 const r=await post('/bulk',{action:'delete',ids:id(1)});assert.equal(r.status,303);assert.match(r.headers.get('location'),/error=/);assert.equal(Model.docs.length,1);
});
test('Editing akreditasi preserves dates at midnight WIB instead of moving them to the previous UTC day',async t=>{
 const dates={tanggalBerlaku:new Date('2025-01-01T00:00:00+07:00'),berlakuSampai:new Date('2030-01-01T00:00:00+07:00')};
 const {Model,get,post}=await setup(t,'accreditations',[{_id:id(1),jenis:'institusi',namaUnit:'Universitas',peringkat:'Unggul',lembaga:id(103),...dates}]);
 const html=await(await get(`/${id(1)}/edit?partial=1`)).text();
 for(const [field,date]of Object.entries({tanggalBerlaku:'2025-01-01',berlakuSampai:'2030-01-01'}))assert.match(html,new RegExp(`name="${field}"[^>]*value="${date}"`));
 const r=await post(`/${id(1)}?partial=1`,{jenis:'institusi',namaUnit:'Universitas',peringkat:'Unggul',lembaga:id(103),tanggalBerlaku:'2025-01-01',berlakuSampai:'2030-01-01'});
 assert.equal(r.status,200,await r.clone().text());for(const field of Object.keys(dates))assert.equal(+Model.docs[0][field],+dates[field]);
});
