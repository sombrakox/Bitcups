import { db,authenticated,json,body } from './auth-api.mjs';
import { randomUUID } from 'node:crypto';
import legacyCatalog from './legacy-catalog.json' with { type: 'json' };
const uploadBase=()=>resolve(process.env.UPLOAD_DIR||join(process.cwd(),'uploads'));

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
const sameOrigin=req=>{const origin=req.headers.origin;if(!origin)return true;try{return new URL(origin).host===(req.headers['x-forwarded-host']||req.headers.host)}catch{return false}};
const validString=(v,n)=>typeof v==='string'&&v.trim().length>0&&v.length<=n;
export async function handleStoreApi(req,res,path){if(!path.startsWith('/api/store/'))return false;
 try{
 if(!['GET','POST','PATCH','DELETE'].includes(req.method))return json(res,405,{error:'Método inválido'}),true;
 if(req.method!=='GET'&&!sameOrigin(req))return json(res,403,{error:'Origem inválida'}),true;
 const user=await authenticated(req);
 if(path==='/api/store/projects'&&req.method==='POST'){
  if(!user)return json(res,401,{error:'Entre na sua conta para enviar o projeto.'}),true;
  const x=await body(req);if(!validString(x.name,160)||!validString(x.product,120)||!validString(x.description,4000)||!Number.isInteger(Number(x.quantity))||Number(x.quantity)<1||Number(x.quantity)>10000||x.rights!==true||x.consent!==true)return json(res,400,{error:'Preencha os dados e autorizações.'}),true;
  const [r]=await db().execute('INSERT INTO projects(user_id,customer_name,description) VALUES(?,?,?)',[user.id,x.name.trim(),`Produto: ${x.product} | Quantidade: ${x.quantity}\n${x.description.trim()}`]);return json(res,201,{id:r.insertId}),true;
 }
 const fileUpload=path.match(/^\/api\/store\/projects\/(\d+)\/file$/);
 if(fileUpload&&req.method==='POST'){
  if(!user)return json(res,401,{error:'Faça login'}),true;
  const [projects]=await db().execute('SELECT id FROM projects WHERE id=? AND user_id=?',[fileUpload[1],user.id]);if(!projects.length)return json(res,404,{error:'Projeto não encontrado'}),true;
  const [cnt]=await db().execute('SELECT COUNT(*) AS total FROM project_files WHERE project_id=?',[fileUpload[1]]);if(cnt[0].total>=5)return json(res,400,{error:'Limite de 5 arquivos por projeto'}),true;
  const mime=String(req.headers['content-type']||'').split(';')[0];if(!['image/jpeg','image/png','image/webp','application/pdf'].includes(mime))return json(res,415,{error:'Formato não permitido'}),true;
  const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>8*1024*1024)return json(res,413,{error:'Arquivo acima de 8 MB'}),true;chunks.push(chunk)}const bytes=Buffer.concat(chunks);
  const valid=mime==='image/jpeg'?bytes.subarray(0,3).equals(Buffer.from([255,216,255])):mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):mime==='image/webp'?bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP':bytes.toString('ascii',0,5)==='%PDF-';
  if(!valid)return json(res,415,{error:'Arquivo inválido'}),true;
  const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'}[mime];const folder=join(uploadBase(),'projects');await mkdir(folder,{recursive:true});const filename=randomUUID()+'.'+ext;await writeFile(join(folder,filename),bytes,{flag:'wx',mode:0o600});
  await db().execute('INSERT INTO project_files(project_id,stored_path,original_name,mime_type,size_bytes) VALUES(?,?,?,?,?)',[fileUpload[1],`projects/${filename}`,String(req.headers['x-file-name']||'arquivo').slice(0,255),mime,bytes.length]);return json(res,201,{ok:true}),true;
 }
 if(path==='/api/store/my-projects'&&req.method==='GET'){
  if(!user)return json(res,401,{error:'Faça login'}),true;
  const [rows]=await db().execute('SELECT id,customer_name,description,status,created_at FROM projects WHERE user_id=? ORDER BY id DESC LIMIT 100',[user.id]);return json(res,200,{projects:rows}),true;
 }

 if(path==='/api/store/products'&&req.method==='GET'){
  const [rows]=await db().execute('SELECT id,name,description,price_cents,category,image_path,active FROM products WHERE active=1 ORDER BY id DESC LIMIT 5000');return json(res,200,{products:rows}),true;
 }
 if(path==='/api/store/order'&&req.method==='POST'){
  const x=await body(req);if(!validString(x.name,160)||!validString(x.phone,32)||!Array.isArray(x.items)||x.items.length<1||x.items.length>40)return json(res,400,{error:'Pedido inválido'}),true;
  const ids=x.items.map(i=>Number(i.productId));if(ids.some(n=>!Number.isSafeInteger(n)||n<=0))return json(res,400,{error:'Produtos inválidos'}),true;
  const conn=await db().getConnection();try{await conn.beginTransaction();const items=[];let total=0;
   for(const item of x.items){const qty=Number(item.quantity);if(!Number.isSafeInteger(qty)||qty<1||qty>100)throw new Error('Quantidade inválida');
    const [p]=await conn.execute('SELECT id,name,price_cents FROM products WHERE id=? AND active=1 LIMIT 1',[item.productId]);if(!p.length)throw new Error('Produto indisponível');total+=p[0].price_cents*qty;items.push({product:p[0],qty});}
   const [r]=await conn.execute('INSERT INTO orders(user_id,guest_name,guest_phone,total_cents) VALUES(?,?,?,?)',[user?.id||null,x.name.trim(),x.phone.trim(),total]);
   for(const i of items)await conn.execute('INSERT INTO order_items(order_id,product_id,product_name,quantity,unit_price_cents) VALUES(?,?,?,?,?)',[r.insertId,i.product.id,i.product.name,i.qty,i.product.price_cents]);
   await conn.commit();return json(res,201,{orderId:r.insertId,status:'awaiting_confirmation',totalCents:total}),true;
  }catch(e){await conn.rollback();return json(res,400,{error:'Verifique os produtos e quantidades'}),true;}finally{conn.release();}
 }
 if(path==='/api/store/quote'&&req.method==='POST'){
  const x=await body(req);
  const name=String(x.name||'').trim(),phone=String(x.phone||'').trim();
  if(!validString(name,160)||!/^\+?[0-9 ()-]{8,25}$/.test(phone)||!Array.isArray(x.items)||x.items.length<1||x.items.length>40)
   return json(res,400,{error:'Informe nome, telefone e itens válidos'}),true;
  const lines=[];
  for(const item of x.items){
   const id=String(item.id||'');const label=String(item.name||'').trim();const quantity=Number(item.quantity);
   if(!/^[a-zA-Z0-9_-]{1,120}$/.test(id)||!validString(label,200)||!Number.isSafeInteger(quantity)||quantity<1||quantity>100)
    return json(res,400,{error:'Item inválido'}),true;
   if(id.startsWith('db-')) {
     const dbId=Number(id.slice(3));
     if(!Number.isSafeInteger(dbId)||dbId<1)return json(res,400,{error:'Produto inválido'}),true;
     const [dbRows]=await db().execute('SELECT id,name,price_cents FROM products WHERE id=? AND active=1 LIMIT 1',[dbId]);
     if(!dbRows.length)return json(res,400,{error:'Produto indisponível'}),true;
     lines.push({id,label:dbRows[0].name,quantity,dbId,price:dbRows[0].price_cents});
   } else lines.push({id,label,quantity,dbId:null,price:0});
  }
  const conn=await db().getConnection();
  try{await conn.beginTransaction();
   const total=lines.reduce((sum,item)=>sum+item.price*item.quantity,0);
   const [result]=await conn.execute('INSERT INTO orders(user_id,guest_name,guest_phone,total_cents) VALUES(?,?,?,?)',[user?.id||null,name,phone,total]);
   for(const item of lines)await conn.execute('INSERT INTO order_items(order_id,product_id,product_name,quantity,unit_price_cents) VALUES(?,?,?,?,?)',[result.insertId,item.dbId,`${item.label.slice(0,65)} [${item.id}]`,item.quantity,item.price]);
   await conn.commit();return json(res,201,{orderId:result.insertId,status:'awaiting_confirmation'}),true;
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
 }
 if(!user||user.role!=='admin')return json(res,403,{error:'Acesso restrito ao administrador'}),true;
 if(path==='/api/store/admin/import-legacy'&&req.method==='POST'){
  const conn=await db().getConnection();let imported=0;
  try{await conn.beginTransaction();const [existing]=await conn.execute('SELECT image_path FROM products');const seen=new Set(existing.map(x=>x.image_path));
   for(const item of legacyCatalog){if(seen.has(item.image_path))continue;await conn.execute('INSERT INTO products(name,description,price_cents,category,image_path,active) VALUES(?,?,?,?,?,1)',[item.name,item.description,item.price_cents,item.category,item.image_path]);seen.add(item.image_path);imported++;}
   await conn.commit();return json(res,200,{imported}),true;
  }catch(err){await conn.rollback();throw err}finally{conn.release()}
 }
 if(path==='/api/store/admin/projects'&&req.method==='GET'){
  const [rows]=await db().execute('SELECT id,user_id,customer_name,description,status,created_at FROM projects ORDER BY id DESC LIMIT 300');
  const ids=rows.map(x=>x.id);let files=[];if(ids.length){const placeholders=ids.map(()=>'?').join(',');[files]=await db().execute(`SELECT id,project_id,original_name,mime_type FROM project_files WHERE project_id IN (${placeholders})`,ids)}
  return json(res,200,{projects:rows.map(x=>({...x,files:files.filter(f=>f.project_id===x.id)}))}),true;
 }
 const projectStatus=path.match(/^\/api\/store\/admin\/projects\/(\d+)$/);
 if(projectStatus&&req.method==='PATCH'){
  const x=await body(req);if(!['received','reviewing','approved','in_production','completed'].includes(x.status))return json(res,400,{error:'Status inválido'}),true;
  await db().execute('UPDATE projects SET status=? WHERE id=?',[x.status,projectStatus[1]]);return json(res,200,{ok:true}),true;
 }
 const projectFile=path.match(/^\/api\/store\/admin\/project-file\/(\d+)$/);
 if(projectFile&&req.method==='GET'){
  const [rows]=await db().execute('SELECT stored_path,mime_type FROM project_files WHERE id=?',[projectFile[1]]);if(!rows.length)return json(res,404,{error:'Arquivo não encontrado'}),true;
  const file=resolve(uploadBase(),rows[0].stored_path);if(!file.startsWith(uploadBase()+sep))return json(res,403,{error:'Acesso negado'}),true;
  try{const bytes=await readFile(file);res.writeHead(200,{'content-type':rows[0].mime_type,'content-length':bytes.length,'x-content-type-options':'nosniff','content-disposition':'inline','cache-control':'no-store'});res.end(bytes);return true;}catch{return json(res,404,{error:'Arquivo indisponível'}),true}
 }
 if(path==='/api/store/admin/upload-image'&&req.method==='POST'){
  const mime=String(req.headers['content-type']||'').split(';')[0].toLowerCase();
  if(!['image/jpeg','image/png','image/webp'].includes(mime))return json(res,415,{error:'Formato de imagem não permitido'}),true;
  const chunks=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>5*1024*1024)return json(res,413,{error:'Imagem maior que 5 MB'}),true;chunks.push(chunk);}
  const bytes=Buffer.concat(chunks);
  const jpeg=bytes.length>3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  const png=bytes.length>8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp=bytes.length>12&&bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
  if(!bytes.length||!((mime==='image/jpeg'&&jpeg)||(mime==='image/png'&&png)||(mime==='image/webp'&&webp)))return json(res,415,{error:'Arquivo não é uma imagem válida'}),true;
  const ext=mime==='image/jpeg'?'jpg':mime==='image/png'?'png':'webp';
  const folder=join(uploadBase(),'products');await mkdir(folder,{recursive:true});
  const filename=randomUUID()+'.'+ext;await writeFile(join(folder,filename),bytes,{flag:'wx',mode:0o600});
  return json(res,201,{path:'/uploads/products/'+filename}),true;
 }
 if(path==='/api/store/admin/products'&&req.method==='GET'){
  const [rows]=await db().execute('SELECT * FROM products ORDER BY id DESC LIMIT 5000');return json(res,200,{products:rows}),true;
 }
 if(path==='/api/store/admin/products'&&req.method==='POST'){
  const x=await body(req);if(!validString(x.name,200)||!Number.isSafeInteger(Number(x.price_cents))||Number(x.price_cents)<0||Number(x.price_cents)>100000000)return json(res,400,{error:'Produto inválido'}),true;
  const [r]=await db().execute('INSERT INTO products(name,description,price_cents,category,image_path,active) VALUES(?,?,?,?,?,?)',[x.name.trim(),String(x.description||'').slice(0,5000),Number(x.price_cents),String(x.category||'').slice(0,120),String(x.image_path||'').slice(0,500),x.active===false?0:1]);return json(res,201,{id:r.insertId}),true;
 }
 const m=path.match(/^\/api\/store\/admin\/products\/(\d+)$/);
 if(m&&req.method==='PATCH'){
  const x=await body(req);if(!validString(x.name,200)||!Number.isSafeInteger(Number(x.price_cents))||Number(x.price_cents)<0||Number(x.price_cents)>100000000)return json(res,400,{error:'Produto inválido'}),true;
  await db().execute('UPDATE products SET name=?,description=?,price_cents=?,category=?,image_path=?,active=? WHERE id=?',[x.name.trim(),String(x.description||'').slice(0,5000),Number(x.price_cents),String(x.category||'').slice(0,120),String(x.image_path||'').slice(0,500),x.active===false?0:1,m[1]]);return json(res,200,{ok:true}),true;
 }
 if(m&&req.method==='DELETE'){await db().execute('UPDATE products SET active=0 WHERE id=?',[m[1]]);return json(res,200,{ok:true}),true;}
 const permanent=path.match(/^\/api\/store\/admin\/products\/(\d+)\/permanent$/);
 if(permanent&&req.method==='DELETE'){
  const x=await body(req);
  if(x.confirm!=='EXCLUIR DEFINITIVAMENTE')return json(res,400,{error:'Confirmação obrigatória'}),true;
  const conn=await db().getConnection();
  try{await conn.beginTransaction();
   const [rows]=await conn.execute('SELECT id,name,image_path FROM products WHERE id=? FOR UPDATE',[permanent[1]]);
   if(!rows.length){await conn.rollback();return json(res,404,{error:'Produto não encontrado'}),true;}
   const [orders]=await conn.execute('SELECT COUNT(*) AS total FROM order_items WHERE product_id=?',[permanent[1]]);
   if(orders[0].total>0){await conn.rollback();return json(res,409,{error:'Este produto tem pedidos registrados. Para preservar o histórico, desative-o em vez de excluir definitivamente.'}),true;}
   await conn.execute('DELETE FROM products WHERE id=?',[permanent[1]]);
   await conn.commit();return json(res,200,{ok:true}),true;
  }catch(e){await conn.rollback();throw e}finally{conn.release()}
 }

 if(path==='/api/store/admin/orders'&&req.method==='GET'){
  const [rows]=await db().execute('SELECT id,user_id,guest_name,guest_phone,status,total_cents,created_at FROM orders ORDER BY id DESC LIMIT 200');return json(res,200,{orders:rows}),true;
 }
 const order=path.match(/^\/api\/store\/admin\/orders\/(\d+)$/);
 if(order&&req.method==='PATCH'){const x=await body(req);if(!['awaiting_confirmation','confirmed','in_production','completed','cancelled'].includes(x.status))return json(res,400,{error:'Status inválido'}),true;await db().execute('UPDATE orders SET status=? WHERE id=?',[x.status,order[1]]);return json(res,200,{ok:true}),true;}
 return json(res,404,{error:'Rota não encontrada'}),true;
 }catch(e){console.error('Store API:',e.message);return json(res,500,{error:'Erro no servidor'}),true;}
}
