const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {randomUUID}=require('node:crypto');
const {fixture,id}=require('./helpers/adminContentFixture');
const faculty={_id:id(100),nama:'Teknik <uji>',singkatan:'FT'},other={_id:id(101),nama:'Sains',singkatan:'FS'};
const setup=async(t,docs=[],role='superadmin')=>{
 const{app,Model}=fixture(t.mock,{basePath:'program-studi',docs,role,references:{Faculty:[faculty,other]}});
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}/admin/program-studi`;
 return{Model,get:s=>fetch(base+s),post:(s,body)=>fetch(base+s,{method:'POST',body:body instanceof FormData?body:new URLSearchParams(body),redirect:'manual'})};
};
const csv=text=>{const body=new FormData();body.set('csv',new Blob([text],{type:'text/csv'}),`f4-05-${randomUUID()}.csv`);return body;};
test('Program Studi v2 searches literal text, filters faculty, sorts/paginates and exposes a partial form',async t=>{
 const docs=Array.from({length:26},(_,n)=>({_id:id(n+1),nama:`Prodi (${String(n).padStart(2,'0')})`,singkatan:'PD'+n,fakultas:faculty._id}));
 const{get,Model}=await setup(t,docs);let r=await get('?q=%28&sort=nama&dir=desc&page=2&fakultas='+faculty._id);
 assert.equal(r.status,200,await r.clone().text());assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);const html=await r.text();assert.match(html,/Prodi \(00\)/);assert.doesNotMatch(html,/Prodi \(25\)<\/a>/);assert.match(html,/Teknik &lt;uji&gt;/);
 assert.equal(Model.calls.at(-1)[1].fakultas,faculty._id);assert.equal(Model.calls.at(-1)[1].$or[0].nama.$regex,'\\(');
 r=await get('/new?partial=1');assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.doesNotMatch(await r.text(),/<!DOCTYPE/);
});
test('Program Studi partial create/update validates master references and supports no-file CRUD',async t=>{
 const{Model,get,post}=await setup(t);let r=await post('?partial=1',{nama:'IF',singkatan:'IF',fakultas:id(999)});assert.equal(r.status,422);assert.match(await r.text(),/Fakultas tidak ditemukan/);assert.equal(Model.docs.length,0);
 r=await post('?partial=1',{nama:'Informatika',singkatan:'IF',fakultas:faculty._id});assert.equal(r.status,200);assert.equal((await r.json()).ok,true);const item=Model.docs[0];
 r=await get(`/${item._id}/edit?partial=1`);assert.equal(r.status,200);assert.match(await r.text(),new RegExp(`value="${faculty._id}" selected`));
 r=await post(`/${item._id}?partial=1`,{nama:'IF baru',singkatan:'IF',fakultas:id(999)});assert.equal(r.status,422);assert.equal(item.nama,'Informatika');
 r=await post(`/${item._id}?partial=1`,{nama:'IF baru',singkatan:'IF',fakultas:other._id});assert.equal(r.status,200);assert.equal(item.fakultas,other._id);
 r=await post(`/${item._id}/delete`,{});assert.equal(r.status,303);assert.equal(Model.docs.length,0);
});
test('Bulk rejects unknown actions and uses exactly the list faculty/search filters',async t=>{
 const{Model,post}=await setup(t,[{_id:id(1),nama:'Teknik (IF)',singkatan:'IF',fakultas:faculty._id},{_id:id(2),nama:'Sains',singkatan:'SA',fakultas:other._id}]);
 let r=await post('/bulk',{action:'activate',ids:id(1)});assert.equal(r.status,303);assert.match(r.headers.get('location'),/error=/);assert.equal(Model.docs.length,2);
 r=await post('/bulk',{action:'delete',scope:'filter',q:'(',fakultas:faculty._id});assert.equal(r.status,303);assert.equal(Model.docs.length,1);assert.equal(Model.docs[0]._id,id(2));assert.match(r.headers.get('location'),/fakultas=/);
 await post('/bulk',{action:'delete',ids:id(2)});assert.equal(Model.docs.length,0);
});
test('Editor cannot list, edit, create, bulk delete or import Program Studi',async t=>{
 const{get,post}=await setup(t,[],'editor');for(const route of ['','/new','/'+id(1)+'/edit'])assert.equal((await get(route)).status,403);
 for(const route of ['','/'+id(1),'/bulk','/import','/'+id(1)+'/delete'])assert.equal((await post(route,{})).status,403);
});
test('CSV import retains v2 list/filter context, matches faculties and rejects invalid rows without inserts',async t=>{
 const{Model,post}=await setup(t);let r=await post('/import?fakultas='+faculty._id,{});assert.equal(r.status,422);assert.match(await r.text(),/File CSV wajib/);
 r=await post('/import',csv('nama,singkatan,fakultas\nProdi (,PD,FT\n'));assert.equal(r.status,303,await r.clone().text());assert.equal(Model.docs.length,1);
 r=await post('/import',csv('nama,singkatan,fakultas\nProdi (,PD,FT\nBaru,BR,FT\n'));assert.equal(r.status,422);assert.match(await r.text(),/sudah ada/);assert.equal(Model.docs.length,1);
 for(const text of ['nama,singkatan,fakultas\n','nama,singkatan,fakultas\nBaru,BR,Tidak ada\n','nama,singkatan,fakultas\nBaru,BR,FT\nbaru,BR,FT\n',`nama,singkatan,fakultas\n${'X'.repeat(161)},XX,FT\n`]){
  r=await post('/import',csv(text));assert.equal(r.status,422,await r.clone().text());assert.equal(Model.docs.length,1);
 }
 r=await post('/import',csv('nama,singkatan,fakultas\nProgram Sains,SA,FS\n'));assert.equal(r.status,303);assert.equal(Model.docs.length,2);
 const remaining=await fs.readdir(path.join(__dirname,'../public/uploads/program-studi-import'));assert.equal(remaining.some(f=>f.includes('f4-05-')),false);
});
