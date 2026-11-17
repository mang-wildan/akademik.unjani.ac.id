const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
const {fixture,id}=require('./helpers/adminContentFixture');
const setup=async(t,basePath,docs,role='superadmin')=>{
 const {app,Model}=fixture(t.mock,{basePath,docs,role});const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const root=`http://127.0.0.1:${server.address().port}${basePath==='profile'?'/profile':'/admin/settings'}`;
 return{Model,get:s=>fetch(root+s),post:(s,body)=>fetch(root+s,{method:'POST',body:body instanceof FormData?body:new URLSearchParams(body),redirect:'manual'})};
};
const setting=()=>({_id:id(1),namaSitus:'Akademik',kontakEmail:'old@example.org',quickLinks:[{_id:id(2),label:'Portal <uji>',url:'https://example.org',target:'_self'}],updatedAt:new Date()});
test('Settings v2 keeps existing fields/uploads, returns 422 and invalidates cache after each saved mutation',async t=>{
 const doc=setting(),{get,post}=await setup(t,'settings',[doc]);
 const cache=require('../utils/siteSettingCache'),invalidate=t.mock.method(cache,'invalidate');
 let r=await get('');assert.equal(r.status,200,await r.clone().text());assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);let html=await r.text();assert.match(html,/\/css\/admin.css/);assert.match(html,/Portal &lt;uji&gt;/);assert.doesNotMatch(html,/data-dialog-open/);
 r=await post('',{kontakEmail:'bad'});assert.equal(r.status,422);assert.match(await r.text(),/errorSummary/);assert.equal(invalidate.mock.callCount(),0);assert.equal(doc.kontakEmail,'old@example.org');
 r=await post('',{kontakEmail:'new@example.org',landingVideoUrl:'https://youtu.be/test'});assert.equal(r.status,303);assert.equal(doc.kontakEmail,'new@example.org');assert.equal(doc.updatedBy,id(200));assert.equal(invalidate.mock.callCount(),1);assert.equal(invalidate.mock.calls[0].arguments[0].kontakEmail,'new@example.org');
 r=await post('/quick-links',{label:'Unsafe',url:'javascript:alert(1)',target:'_blank'});assert.equal(r.status,422);html=await r.text();assert.match(html,/border-line" open>/);assert.equal(doc.quickLinks.length,1);
 r=await post('/quick-links',{label:'New',url:'https://example.org/new',target:'_blank'});assert.equal(r.status,303);assert.equal(doc.quickLinks.length,2);assert.equal(invalidate.mock.callCount(),2);
 r=await post('/quick-links/'+id(2)+'/delete',{});assert.equal(r.status,303);assert.equal(doc.quickLinks.length,1);assert.equal(invalidate.mock.callCount(),3);
});
test('Settings rejects editor reads/writes/uploads and quick-link mutations',async t=>{
 const {get,post}=await setup(t,'settings',[setting()],'editor');assert.equal((await get('')).status,403);for(const p of ['','/quick-links','/quick-links/'+id(2)+'/delete'])assert.equal((await post(p,{})).status,403);
});
test('Settings multipart saves valid images and removes a new upload on validation failure',async t=>{
 const doc=setting(),{post}=await setup(t,'settings',[doc]);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp2cAAAAASUVORK5CYII=','base64');
 const upload=email=>{const form=new FormData();form.set('kontakEmail',email);form.set('favicon',new Blob([png],{type:'image/png'}),'f4-final-test.png');return form;};
 const dir=path.join(__dirname,'../public/uploads/settings');const before=await fs.readdir(dir);
 let r=await post('',upload('invalid'));assert.equal(r.status,422);assert.deepEqual(await fs.readdir(dir),before);
 r=await post('',upload('ok@example.org'));assert.equal(r.status,303);assert.match(doc.favicon,/f4-final-test.png$/);const file=path.join(__dirname,'../public',doc.favicon);t.after(()=>fs.unlink(file));assert.ok((await fs.stat(file)).size>0);
});
const me=()=>({_id:id(200),name:'Editor <uji>',email:'me@example.org',role:'editor',isActive:true,createdAt:new Date(),updatedAt:new Date(),password:'NeverEcho',comparePassword:async p=>p==='OldSecret123!'});
test('Profile v2 accessible to editor, edits only own name/email, validates duplicate and never changes role',async t=>{
 const doc=me(),{get,post}=await setup(t,'profile',[doc,{_id:id(1),email:'used@example.org'}],'editor');
 for(const p of ['','/edit','/password']){const r=await get(p);assert.equal(r.status,200,await r.clone().text());assert.match(r.headers.get('content-security-policy'),/script-src 'self'/);assert.doesNotMatch(await r.text(),/NeverEcho/);}
 let r=await post('/edit',{name:'Changed',email:'used@example.org'});assert.equal(r.status,422);assert.equal(doc.name,'Editor <uji>');
 r=await post('/edit',{name:'Changed',email:' NEW@example.org ',role:'superadmin',isActive:'false'});assert.equal(r.status,303);assert.equal(doc.email,'new@example.org');assert.equal(doc.role,'editor');assert.equal(doc.isActive,true);
});
test('Own password requires correct current password and matching new values; no password echo on 422',async t=>{
 const doc=me(),{post}=await setup(t,'profile',[doc],'editor');
 for(const input of [{currentPassword:'wrong',newPassword:'NewSecret123!',confirmPassword:'NewSecret123!'},{currentPassword:'OldSecret123!',newPassword:'NewSecret123!',confirmPassword:'different'}]){
  const r=await post('/password',input);assert.equal(r.status,422);assert.doesNotMatch(await r.text(),/NewSecret123!|OldSecret123!|NeverEcho/);assert.equal(doc.password,'NeverEcho');
 }
 const r=await post('/password',{currentPassword:'OldSecret123!',newPassword:'NewSecret123!',confirmPassword:'NewSecret123!'});assert.equal(r.status,303);assert.equal(doc.password,'NewSecret123!');
});
test('Profile photo multipart upload, removal and forged image rejection retain form v2',async t=>{
 const doc=me(),{post}=await setup(t,'profile',[doc],'editor');const form=new FormData();form.set('name',doc.name);form.set('email',doc.email);form.set('profilePhoto',new Blob(['fake'],{type:'image/png'}),'fake.png');
 let r=await post('/edit',form);assert.equal(r.status,422);assert.match(await r.text(),/errorSummary/);
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jp2cAAAAASUVORK5CYII=','base64');const valid=new FormData();valid.set('name',doc.name);valid.set('email',doc.email);valid.set('profilePhoto',new Blob([png],{type:'image/png'}),'f4-profile-test.png');
 r=await post('/edit',valid);assert.equal(r.status,303);const file=path.join(__dirname,'../public',doc.profilePhoto);t.after(()=>fs.unlink(file));assert.ok((await fs.stat(file)).size>0);
 r=await post('/edit',{name:doc.name,email:doc.email,removeProfilePhoto:'1'});assert.equal(r.status,303);assert.equal(doc.profilePhoto,'');
});
test('Task 8: profile summary serif heading with real links; password errors linked without refilled values',async t=>{
 const doc=me(),{get,post}=await setup(t,'profile',[doc],'editor');
 const html=await(await get('')).text();assert.match(html,/<h2 id="profil-nama" class="[^"]*font-serif/);assert.match(html,/href="\/profile\/edit"/);assert.match(html,/href="\/profile\/password"/);
 const r=await post('/password',{currentPassword:'wrong',newPassword:'NewSecret123!',confirmPassword:'NewSecret123!'});const p=await r.text();
 assert.match(p,/role="alert"[\s\S]*href="#f-currentPassword"/);assert.match(p,/id="f-currentPassword"[^>]*aria-describedby="f-currentPassword-error"[^>]*aria-invalid="true"/);assert.match(p,/id="f-currentPassword-error"/);
 for(const n of ['currentPassword','newPassword','confirmPassword'])assert.match(p,new RegExp(`type="password" id="f-${n}"[^>]*value=""`));
});
test('Task 8: settings sections use serif headings and keep every existing field',async t=>{
 const {get}=await setup(t,'settings',[setting()]);const html=await(await get('')).text();
 for(const h of ['Kontak &amp; Footer','Media Sosial','Gambar','Tautan Cepat (Footer)'])assert.match(html,new RegExp(`<h2 class="[^"]*font-serif[^"]*">${h.replace(/[()]/g,'\\$&')}</h2>`));
 for(const n of ['kontakEmail','kontakTelepon','alamat','jamLayanan','landingFooterDescription','landingVideoUrl','socialFacebook','socialInstagram','socialYoutube','socialTiktok','socialTwitter','socialLinkedin','favicon','strukturOrganisasiImage','label','url','target'])assert.match(html,new RegExp(`name="${n}"`));
});
