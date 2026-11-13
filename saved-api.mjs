import { db, authenticated, json, body } from './auth-api.mjs';
const sameOrigin=req=>{const o=req.headers.origin;if(!o)return true;try{return new URL(o).host===(req.headers['x-forwarded-host']||req.headers.host)}catch{return false}};
const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9_-]{1,120}$/.test(id);
export async function handleSavedApi(req,res,path){
 if(!['/api/saved/cart','/api/saved/favorites'].includes(path))return false;
 try{
  if(!['GET','PUT'].includes(req.method))return json(res,405,{error:'Método não permitido'}),true;
  if(req.method==='PUT'&&!sameOrigin(req))return json(res,403,{error:'Origem inválida'}),true;
  const user=await authenticated(req);
  if(!user)return json(res,401,{error:'Faça login para sincronizar'}),true;
  if(path==='/api/saved/cart'){
   if(req.method==='GET'){const [rows]=await db().execute('SELECT catalog_id,quantity FROM customer_cart WHERE user_id=?',[user.id]);return json(res,200,{items:Object.fromEntries(rows.map(r=>[r.catalog_id,r.quantity]))}),true;}
   const data=await body(req);const entries=Object.entries(data.items||{});
   if(!data.items||typeof data.items!=='object'||Array.isArray(data.items)||entries.length>150||entries.some(([id,qty])=>!validId(id)||!Number.isSafeInteger(qty)||qty<1||qty>100))return json(res,400,{error:'Carrinho inválido'}),true;
   const conn=await db().getConnection();try{await conn.beginTransaction();await conn.execute('DELETE FROM customer_cart WHERE user_id=?',[user.id]);for(const [id,qty] of entries)await conn.execute('INSERT INTO customer_cart(user_id,catalog_id,quantity) VALUES(?,?,?)',[user.id,id,qty]);await conn.commit();}catch(e){await conn.rollback();throw e;}finally{conn.release();}
   return json(res,200,{ok:true}),true;
  }
  if(req.method==='GET'){const [rows]=await db().execute('SELECT catalog_id FROM customer_favorites WHERE user_id=?',[user.id]);return json(res,200,{ids:rows.map(r=>r.catalog_id)}),true;}
  const data=await body(req);if(!Array.isArray(data.ids)||data.ids.length>150||data.ids.some(id=>!validId(id)))return json(res,400,{error:'Favoritos inválidos'}),true;
  const conn=await db().getConnection();try{await conn.beginTransaction();await conn.execute('DELETE FROM customer_favorites WHERE user_id=?',[user.id]);for(const id of new Set(data.ids))await conn.execute('INSERT INTO customer_favorites(user_id,catalog_id) VALUES(?,?)',[user.id,id]);await conn.commit();}catch(e){await conn.rollback();throw e;}finally{conn.release();}
  return json(res,200,{ok:true}),true;
 }catch(e){console.error('Saved API:',e.message);return json(res,500,{error:'Erro no servidor'}),true;}
}
