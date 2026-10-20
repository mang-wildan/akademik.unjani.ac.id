const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const express=require('express');
const root=path.join(__dirname,'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);

test('legacy admin views/classes are removed and every static EJS include still resolves',()=>{
 for(const file of ['views/layouts/admin.ejs','views/dev/admin.ejs','views/components/richtext-field.ejs'])assert.equal(fs.existsSync(path.join(root,file)),false,file);
 for(const file of walk(path.join(root,'views')).filter(p=>p.endsWith('.ejs'))){
  const text=fs.readFileSync(file,'utf8').replace(/<%#[\s\S]*?%>/g,'');
  for(const [,include]of text.matchAll(/include\(['"]([^'"]+)['"]/g)){
   assert.equal(fs.existsSync(path.resolve(path.dirname(file),include+'.ejs')),true,`${file}: ${include}`);
  }
 }
 const code=[...walk(path.join(root,'controllers')),...walk(path.join(root,'routes'))].map(p=>fs.readFileSync(p,'utf8')).join('\n');
 assert.doesNotMatch(code,/layouts\/admin['"]/);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'assets/css/app.css'),'utf8'),/admin-nav-link/);
});

test('central CSP covers admin redirects, denials, errors and 404s while preserving profile/dashboard and public policy',async t=>{
 const source=fs.readFileSync(path.join(root,'server.js'),'utf8');
 const registrations=source.match(/^app\.use\([^\n]+strictCsp\);$/gm)||[];
 assert.equal(registrations.length,1);
 assert.ok(source.indexOf(registrations[0])<source.indexOf('app.use(express.static'));
 assert.ok(source.indexOf(registrations[0])<source.indexOf('app.use(verifyOrigin'));
 for(const file of walk(path.join(root,'routes')).filter(p=>path.basename(p)!=='devRoutes.js'))assert.doesNotMatch(fs.readFileSync(file,'utf8'),/strictCsp/,file);
 const app=express();
 vm.runInNewContext(registrations[0],{app,strictCsp:require('../middleware/strictCsp')});
 app.get('/admin',(_req,res)=>res.redirect('/admin/dashboard'));
 app.get('/admin/forbidden',(_req,res)=>res.sendStatus(403));
 app.get('/admin/error',(_req,_res,next)=>next(new Error('test')));
 app.get(['/profile','/dashboard','/admin/dashboard','/admin/new-module','/','/administrator'],(_req,res)=>res.send('OK'));
 app.use((_req,res)=>res.sendStatus(404));
 app.use((err,req,res,next)=>res.sendStatus(500));
 const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));t.after(()=>server.close());
 const base=`http://127.0.0.1:${server.address().port}`;
 for(const [route,status]of [['/admin',302],['/admin/forbidden',403],['/admin/error',500],['/admin/not-found',404],['/admin/dashboard',200],['/admin/new-module',200],['/profile',200],['/dashboard',200]]){
  const res=await fetch(base+route,{redirect:'manual'});assert.equal(res.status,status,route);assert.match(res.headers.get('content-security-policy'),/script-src 'self'/,route);
 }
 for(const route of ['/','/administrator'])assert.equal((await fetch(base+route)).headers.get('content-security-policy'),null,route);
});
