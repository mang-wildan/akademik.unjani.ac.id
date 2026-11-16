const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {fixture,id}=require('./helpers/adminContentFixture');
const setup=async(t,basePath,docs=[],role='superadmin')=>{
 const {app,Model}=fixture(t.mock,{basePath,docs,role});
 const dir=path.join(__dirname,'../public/uploads',basePath),before=new Set(await fs.readdir(dir).catch(()=>[]));
 t.after(async()=>{for(const file of await fs.readdir(dir).catch(()=>[]))if(file.includes('f4-test-')&&!before.has(file))await fs.rm(path.join(dir,file),{force:true});});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}/admin/${basePath}`;
 return{Model,get:s=>fetch(base+s),post:(s,body)=>fetch(base+s,{method:'POST',body:body instanceof FormData?body:new URLSearchParams(body),redirect:'manual'})};
};
const profile={_id:id(1),judulHalaman:'Profil Akademik',ringkasan:'Layanan akademik. '.repeat(25),visi:'Layanan bermutu. '.repeat(8),misi:['Misi pertama','Misi kedua'],tugas:['Tugas pertama'],fungsi:['Fungsi pertama']};
test('organization forms use serif panels, preserve full-page fallback and expose current images',async t=>{
 for(const base of ['profil-akademik','staff','unit','faculties'])await t.test(base,async t=>{
  const doc=base==='profil-akademik'?{...profile}:{_id:id(1),nama:'Nama <uji>'+ 'Panjang'.repeat(40),singkatan:'FT',jabatan:'Layanan',tingkat:'anggota',nomorUrut:0,foto:'/img/staf-uji.png',img:'/img/unit-uji.png'};
  const {get}=await setup(t,base,[doc]);
  for(const url of base==='profil-akademik'?['']:['/new',`/${id(1)}/edit`]){
   const r=await get(url),html=await r.text();assert.equal(r.status,200,html);assert.equal((html.match(/<h1\b/g)||[]).length,1);assert.match(html,/<h2[^>]*class="[^"]*font-serif/);assert.match(html,/method="POST"/);
   if(base==='profil-akademik')for(const heading of ['Ringkasan','Visi dan misi','Tugas dan fungsi','Kontak layanan'])assert.match(html,new RegExp(`<h2[^>]*>${heading}</h2>`));
   if(base==='staff')for(const heading of ['Identitas','Jabatan','Foto'])assert.match(html,new RegExp(`<h2[^>]*>${heading}</h2>`));
   const partial=await(await get(url+'?partial=1')).text();assert.doesNotMatch(partial,/<h1\b|<!DOCTYPE/);
   if(url.includes('/edit')&&['staff','unit'].includes(base))assert.match(html,new RegExp(`<img[^>]*src="${base==='staff'?doc.foto:doc.img}"`));
  }
  if(base!=='profil-akademik'){const html=await(await get('')).text();assert.match(html,/Nama &lt;uji&gt;/);assert.doesNotMatch(html,/<uji>/);assert.match(html,new RegExp(`href="/admin/${base}/${id(1)}/edit"`));assert.match(html,/>Ubah<\/a>/);}
 });
});
test('Faculty deletion errors never produce a success response or remove the record',async t=>{
 const {get,post,Model}=await setup(t,'faculties',[{_id:id(1),nama:'Teknik',singkatan:'FT'}]);
 // Failure injection covers error responses only; existing backend has no relationship deletion guard.
 t.mock.method(require('../models/Faculty'),'deleteOne',async()=>{throw new Error('Fakultas masih dipakai program studi.');});
 let r=await post(`/${id(1)}/delete`,{});assert.equal(r.status,500);assert.equal(r.headers.get('location'),null);assert.equal(Model.docs.length,1);
 r=await post('/bulk',{action:'delete',ids:id(1)});assert.equal(r.status,303);assert.match(r.headers.get('location'),/error=/);assert.doesNotMatch(r.headers.get('location'),/success=/);assert.equal(Model.docs.length,1);
 const page=await get(new URL(r.headers.get('location'),'http://fixture.local').search),html=await page.text();assert.equal(page.status,200);assert.match(html,/<div[^>]*data-toast[^>]*role="alert"/);assert.match(html,/<p[^>]*data-toast-message>1 fakultas gagal dihapus<\/p>/);assert.doesNotMatch(html.replace(/<template\b[^>]*>[\s\S]*?<\/template>/g,''),/<div[^>]*data-toast[^>]*role="status"/);
});
test('Profil full-page/partial validation preserves line lists and saves singleton as arrays',async t=>{
 const{Model,get,post}=await setup(t,'profil-akademik',[{...profile}]);
 let r=await get('');assert.equal(r.status,200);assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.match(await r.text(),/data-save-form/);
 r=await post('?partial=1',{judulHalaman:'X',misi:'Misi tetap\nBaris kedua'});assert.equal(r.status,422);const html=await r.text();assert.doesNotMatch(html,/<!DOCTYPE/);assert.match(html,/Misi tetap\nBaris kedua/);
 r=await post('?partial=1',{...profile,misi:'Pertama\nKedua',tugas:'Satu tugas',fungsi:'Satu fungsi'});assert.equal(r.status,200,await r.clone().text());assert.equal((await r.json()).ok,true);assert.equal(Model.docs.length,1);assert.deepEqual(Model.docs[0].misi,['Pertama','Kedua']);
 r=await get('');assert.match(await r.text(),/Pertama\nKedua/);
});
for(const base of ['staff','unit','faculties'])test(`${base}: v2 list, partial form, 422, whitelisted bulk delete`,async t=>{
 const{get,post}=await setup(t,base);
 let r=await get('');assert.equal(r.status,200,await r.clone().text());assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);
 r=await get('/new?partial=1');assert.equal(r.status,200,await r.clone().text());assert.doesNotMatch(await r.text(),/<!DOCTYPE/);
 r=await post('?partial=1',{});assert.equal(r.status,422);assert.match(await r.text(),/aria-invalid="true"/);
 r=await post('/bulk',{action:'activate',ids:id(1)});assert.equal(r.status,303);assert.match(r.headers.get('location'),/error=/);
});
for(const role of ['editor'])test(`Faculty remains superadmin-only for ${role}, including bulk`,async t=>{
 const{get,post}=await setup(t,'faculties',[],role);for(const url of ['','/new','/'+id(1)+'/edit'])assert.equal((await get(url)).status,403);
 for(const url of ['','/bulk','/'+id(1)+'/delete'])assert.equal((await post(url,{action:'delete',ids:id(1)})).status,403);
});
test('Staff hierarchy precedes pagination; explicit sorts and typed filters use the same bulk scope',async t=>{
 const docs=Array.from({length:26},(_,n)=>({_id:id(n+1),nama:`Anggota ${n+1}`,jabatan:'Staf',tingkat:n===25?'wakil-rektor':n===24?undefined:'anggota',nomorUrut:n}));
 const{get,post,Model}=await setup(t,'staff',docs);
 let r=await get('');let html=await r.text();assert.equal(r.status,200,html);assert.ok(html.indexOf('Anggota 26')<html.indexOf('Anggota 1'));assert.doesNotMatch(html,/Anggota 25</);
 r=await get('?page=2');html=await r.text();assert.match(html,/Anggota 25/);assert.doesNotMatch(html,/Anggota 26</);
 r=await get('?sort=nama&dir=desc&tingkat=anggota&q=Anggota');assert.equal(r.status,200);assert.match(await r.text(),/Anggota 9/);
 const leader=docs[25];await post('/bulk',{action:'delete',scope:'filter',tingkat:'wakil-rektor',q:'Anggota'});assert.ok(!Model.docs.includes(leader));assert.equal(Model.docs.length,25);
});
for(const base of ['staff','unit'])test(`${base}: actual upload, edit retention, replacement, single/bulk deletion`,async t=>{
 const{post,Model}=await setup(t,base);const field=base==='staff'?'foto':'img';
 const png=await require('sharp')({create:{width:1000,height:500,channels:3,background:'#ffffff'}}).png().toBuffer();
 const fields=base==='staff'?{nama:'Staf uji',jabatan:'Layanan',tingkat:'anggota',nomorUrut:'2',nip:'INTERNAL-123'}:{nama:'Unit uji',deskripsi:'Layanan unit',link:'https://example.com'};
 const upload=()=>{const body=new FormData();for(const[k,v]of Object.entries(fields))body.set(k,v);body.set(field,new Blob([png],{type:'image/png'}),`f4-test-${randomUUID()}.png`);return body;};
 let r=await post('?partial=1',upload());assert.equal(r.status,200,await r.clone().text());const item=Model.docs[0],old=item[field];await fs.access(path.join(__dirname,'../public',old));
 if(base==='unit'){assert.match(old,/\.webp$/);const meta=await require('sharp')(await fs.readFile(path.join(__dirname,'../public',old))).metadata();assert.equal(meta.width,900);await fs.access(path.join(__dirname,'../public',old.replace('.webp','-thumb.webp')));}
 r=await post(`/${item._id}?partial=1`,fields);assert.equal(r.status,200);assert.equal(item[field],old);
 r=await post(`/${item._id}?partial=1`,upload());assert.equal(r.status,200,await r.clone().text());assert.notEqual(item[field],old);await assert.rejects(fs.access(path.join(__dirname,'../public',old)),{code:'ENOENT'});
 const current=item[field];await post('/bulk',{action:'delete',ids:item._id});assert.equal(Model.docs.length,0);await assert.rejects(fs.access(path.join(__dirname,'../public',current)),{code:'ENOENT'});
 if(base==='unit')for(const file of [old,current])await assert.rejects(fs.access(path.join(__dirname,'../public',file.replace('.webp','-thumb.webp'))),{code:'ENOENT'});
 r=await post('?partial=1',upload());assert.equal(r.status,200);const single=Model.docs[0];await post(`/${single._id}/delete`,{});assert.equal(Model.docs.length,0);await assert.rejects(fs.access(path.join(__dirname,'../public',single[field])),{code:'ENOENT'});
});
test('Unit persistence failure removes converted files and thumbnail',async t=>{
 const{post}=await setup(t,'unit');t.mock.method(require('../models/Unit'),'create',async()=>{throw new Error('Simulated save failure');});
 const body=new FormData();body.set('nama','Unit gagal');const prefix=`f4-test-${randomUUID()}`;
 const png=await require('sharp')({create:{width:2,height:2,channels:3,background:'#ffffff'}}).png().toBuffer();body.set('img',new Blob([png],{type:'image/png'}),prefix+'.png');
 assert.equal((await post('',body)).status,500);const files=await fs.readdir(path.join(__dirname,'../public/uploads/unit'));assert.equal(files.some(f=>f.includes(prefix)),false);
});
test('Unit accepts the advertised WebP upload and removes its generated thumbnail on delete',async t=>{
 const{post,Model}=await setup(t,'unit');const body=new FormData();body.set('nama','Unit WebP');
 const webp=await require('sharp')({create:{width:2,height:2,channels:3,background:'#ffffff'}}).webp().toBuffer();
 body.set('img',new Blob([webp],{type:'image/webp'}),`f4-test-${randomUUID()}.webp`);
 const r=await post('?partial=1',body);assert.equal(r.status,200,await r.clone().text());const item=Model.docs[0];
 await post(`/${item._id}/delete`,{});for(const url of [item.img,item.img.replace('.webp','-thumb.webp')])await assert.rejects(fs.access(path.join(__dirname,'../public',url)),{code:'ENOENT'});
});
test('Faculty duplicate error stays a 422 partial; search and selected/filtered deletion work',async t=>{
 const{get,post,Model}=await setup(t,'faculties',[{_id:id(1),nama:'Teknik (FT)',singkatan:'FT'},{_id:id(2),nama:'Sains',singkatan:'FS'}]);
 let r=await get('?q=%28');assert.equal(r.status,200);assert.match(await r.text(),/Teknik \(FT\)/);
 const real=require('../models/Faculty');const create=real.create;t.mock.method(real,'create',async()=>{throw Object.assign(new Error('duplicate'),{code:11000});});
 r=await post('?partial=1',{nama:'Teknik',singkatan:'FT'});assert.equal(r.status,422);assert.match(await r.text(),/sudah dipakai/);real.create=create;
 await post('/bulk',{action:'delete',scope:'filter',q:'('});assert.equal(Model.docs.length,1);await post('/bulk',{action:'delete',ids:id(2)});assert.equal(Model.docs.length,0);
});
