import { createPool } from 'mysql2/promise';
import nodemailer from 'nodemailer';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
let pool;
// Persistent, atomic limits shared across Node workers and restarts.
const WINDOW = 15 * 60;
function clientIp(req) { return String(req.socket.remoteAddress || 'unknown'); }
function limitKey(scope, value) { return createHash('sha256').update(scope + ':' + String(value)).digest('hex'); }
async function rateLimited(scope, value, max, windowSeconds = WINDOW) {
 const key = limitKey(scope, value);
 await db().execute(`INSERT INTO auth_rate_limits (limit_key, attempts, window_started_at)
 VALUES (?, 1, NOW()) ON DUPLICATE KEY UPDATE
 attempts = IF(window_started_at <= DATE_SUB(NOW(), INTERVAL ? SECOND), 1, attempts + 1),
 window_started_at = IF(window_started_at <= DATE_SUB(NOW(), INTERVAL ? SECOND), NOW(), window_started_at)`, [key, windowSeconds, windowSeconds]);
 const [rows] = await db().execute('SELECT attempts FROM auth_rate_limits WHERE limit_key=?', [key]);
 return Number(rows[0]?.attempts || 0) > max;
}
async function clearLimit(scope, value) { await db().execute('DELETE FROM auth_rate_limits WHERE limit_key=?', [limitKey(scope,value)]); }
function sameOrigin(req){
 const origin=req.headers.origin;
 if(!origin)return true; // non-browser clients; SameSite cookies still enforced
 try { const u=new URL(origin); const host=req.headers['x-forwarded-host']||req.headers.host; return u.host===host && ['http:','https:'].includes(u.protocol); }catch{return false;}
}

export function db() { if (!pool) { for (const k of ['DB_HOST','DB_USER','DB_NAME','DB_PASSWORD']) if (!process.env[k]) throw new Error(`Configure ${k} no ambiente`); pool=createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,connectionLimit:5}); } return pool; }
const hashToken=t=>createHash('sha256').update(t).digest('hex');
export const json=(res,status,obj,extra={})=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store',...extra});res.end(JSON.stringify(obj));};
export async function body(req){let bytes=0;const parts=[];for await(const part of req){bytes+=part.length;if(bytes>12000)throw new Error('Requisição muito grande');parts.push(part);}return JSON.parse(Buffer.concat(parts).toString('utf8'));}
export async function passwordHash(password,salt){return (await scrypt(password,salt,64)).toString('hex');}
export async function authenticated(req){const cookie=String(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('bitcups_session='));if(!cookie)return null;const token=cookie.slice(16);if(!/^[a-f0-9]{64}$/.test(token))return null;const [rows]=await db().execute('SELECT u.id,u.name,u.email,u.role FROM auth_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at > NOW() LIMIT 1',[hashToken(token)]);return rows[0]||null;}
function setCookie(res,token,req){const secure=process.env.NODE_ENV==='production'||req.headers['x-forwarded-proto']==='https';return `bitcups_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800${secure?'; Secure':''}`;}
export async function handleAuthApi(req,res,pathname){if(!pathname.startsWith('/api/auth/'))return false;try{
 if(req.method==='POST'&&!sameOrigin(req))return json(res,403,{error:'Origem não autorizada'}),true;
 if(!['GET','POST'].includes(req.method))return json(res,405,{error:'Método não permitido'}),true;
 if(pathname==='/api/auth/me'&&req.method==='GET'){return json(res,200,{user:await authenticated(req)}),true;}
 if(pathname==='/api/auth/logout'&&req.method==='POST'){const token=String(req.headers.cookie||'').match(/(?:^|;\s*)bitcups_session=([a-f0-9]{64})/)?.[1];if(token)await db().execute('DELETE FROM auth_sessions WHERE token_hash=?',[hashToken(token)]);return json(res,200,{ok:true},{'set-cookie':'bitcups_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0'}),true;}
 if(pathname==='/api/auth/admin/recovery-link'&&req.method==='POST'){
  const admin=await authenticated(req);
  if(!admin||admin.role!=='admin')return json(res,403,{error:'Acesso restrito ao administrador'}),true;
  if(await rateLimited('admin-recovery-user',String(admin.id),10,3600))return json(res,429,{error:'Limite de recuperações atingido. Aguarde.'}),true;
  const input=await body(req);
  const email=String(input.email||'').trim().toLowerCase();
  if(email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json(res,400,{error:'E-mail inválido'}),true;
  if(input.identityVerified!==true)return json(res,400,{error:'Confirme a verificação da identidade fora do site antes de gerar o link'}),true;
  const [users]=await db().execute('SELECT id FROM users WHERE email=? AND role=\'customer\' LIMIT 1',[email]);
  if(!users.length)return json(res,404,{error:'Conta de cliente não encontrada. Confira o e-mail informado.'}),true;
  const userId=users[0].id;
  const token=randomBytes(32).toString('hex');
  const conn=await db().getConnection();
  try {
   await conn.beginTransaction();
   await conn.execute('DELETE FROM password_resets WHERE user_id=?',[userId]);
   await conn.execute('INSERT INTO password_resets(token_hash,user_id,expires_at) VALUES(?,?,DATE_ADD(NOW(), INTERVAL 15 MINUTE))',[hashToken(token),userId]);
   await conn.execute('INSERT INTO admin_recovery_audit(admin_user_id,target_user_id,action) VALUES(?,?,?)',[admin.id,userId,'issued']);
   await conn.commit();
  }catch(err){await conn.rollback();throw err;}finally{conn.release();}
  // Use the current request origin, not an untrusted forwarded host, to build a link.
  // APP_URL is mandatory in production, and must be the actual site origin.
  const base=process.env.APP_URL;
  if(!base)return json(res,500,{error:'Configure APP_URL no .env (ex.: http://localhost:10000)'}),true;
  let link;try{const u=new URL(base);if(!['https:','http:'].includes(u.protocol))throw Error();if(process.env.NODE_ENV==='production'&&u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw Error();link=new URL('/redefinir-senha',u);link.searchParams.set('token',token);}catch{return json(res,500,{error:'APP_URL inválida ou insegura'}),true;}
  return json(res,200,{link:link.toString(),expiresInMinutes:15,message:'Link criado. Compartilhe somente após verificar a identidade do cliente.'}),true;
 }
 if(pathname==='/api/auth/forgot-password'&&req.method==='POST')return json(res,410,{error:'A recuperação agora é feita com auxílio do administrador.'}),true;
 if(pathname==='/api/auth/reset-password'&&req.method==='POST'){
  if(await rateLimited('reset-submit',clientIp(req),15,3600))return json(res,429,{error:'Muitas tentativas'}),true;
  const input=await body(req);const token=String(input.token||'');const password=String(input.password||'');
  if(!/^[a-f0-9]{64}$/.test(token)||password.length<12||password.length>128)return json(res,400,{error:'Token ou senha inválidos'}),true;
  const conn=await db().getConnection();try{
   await conn.beginTransaction();const [rows]=await conn.execute('SELECT user_id FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>NOW() FOR UPDATE',[hashToken(token)]);
   if(!rows.length){await conn.rollback();return json(res,400,{error:'Link inválido ou expirado'}),true;}
   const salt=randomBytes(16).toString('hex');const hashed=await passwordHash(password,salt);
   await conn.execute('UPDATE users SET password_hash=? WHERE id=?',[`scrypt:${salt}:${hashed}`,rows[0].user_id]);
   await conn.execute('DELETE FROM auth_sessions WHERE user_id=?',[rows[0].user_id]);
   await conn.execute('DELETE FROM password_resets WHERE user_id=?',[rows[0].user_id]);
   await conn.commit();return json(res,200,{message:'Senha redefinida. Faça login novamente.'}),true;
  }catch(e){await conn.rollback();throw e;}finally{conn.release();}
 }
 if(!['/api/auth/register','/api/auth/login'].includes(pathname)||req.method!=='POST')return json(res,404,{error:'Não encontrado'}),true;
 const ip=clientIp(req);if(await rateLimited('login-ip',ip,20))return json(res,429,{error:'Muitas tentativas. Aguarde 15 minutos.'},{'retry-after':'900'}),true;
 const input=await body(req);const email=String(input.email||'').trim().toLowerCase(),password=String(input.password||'');if(email.length>254||!/^\S+@\S+\.\S+$/.test(email)||password.length<12||password.length>128)return json(res,400,{error:'Informe e-mail válido e senha de 12 a 128 caracteres'}),true;
 if(pathname==='/api/auth/login' && await rateLimited('login-account',email,8))return json(res,429,{error:'Muitas tentativas para esta conta. Aguarde 15 minutos.'},{'retry-after':'900'}),true;
 if(pathname==='/api/auth/register'){
  if(input.acceptTerms!==true)return json(res,400,{error:'É necessário aceitar os Termos de Uso e a Política de Privacidade'}),true;
  const name=String(input.name||'').trim();if(name.length<2||name.length>160)return json(res,400,{error:'Informe um nome válido'}),true;
  const salt=randomBytes(16).toString('hex');const hashed=await passwordHash(password,salt);try{await db().execute('INSERT INTO users (name,email,password_hash,role) VALUES (?,?,?,?)',[name,email,`scrypt:${salt}:${hashed}`,'customer']);}catch(e){if(e.code==='ER_DUP_ENTRY')return json(res,409,{error:'E-mail já cadastrado'}),true;throw e;}
 }
 const [rows]=await db().execute('SELECT id,name,email,role,password_hash FROM users WHERE email=? LIMIT 1',[email]);const user=rows[0];if(!user)return json(res,401,{error:'Credenciais inválidas'}),true;
 const parts=user.password_hash.split(':');if(parts.length!==3||parts[0]!=='scrypt')return json(res,401,{error:'Conta requer atualização de senha'}),true;
 const candidate=Buffer.from(await passwordHash(password,parts[1]),'hex'),expected=Buffer.from(parts[2],'hex');if(candidate.length!==expected.length||!timingSafeEqual(candidate,expected))return json(res,401,{error:'Credenciais inválidas'}),true;
 if(pathname==='/api/auth/login') await clearLimit('login-account',email);const token=randomBytes(32).toString('hex');await db().execute('INSERT INTO auth_sessions (token_hash,user_id,expires_at) VALUES (?,?,DATE_ADD(NOW(), INTERVAL 7 DAY))',[hashToken(token),user.id]);return json(res,200,{user:{id:user.id,name:user.name,email:user.email,role:user.role}},{'set-cookie':setCookie(res,token,req)}),true;
 }catch(e){console.error('Auth API error:',e.message);return json(res,500,{error:'Falha ao processar solicitação'}),true;}}
