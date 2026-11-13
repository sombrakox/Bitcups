import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
export const Route = createFileRoute('/cadastro')({ component: AuthPage });
function AuthPage(){
 const navigate=useNavigate(); const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [terms,setTerms]=useState(false);const [error,setError]=useState('');const [loading,setLoading]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setError('');setLoading(true);try{
  const res=await fetch('/api/auth/register',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({name,email,password,acceptTerms:terms})});
  const data=await res.json();if(!res.ok)throw new Error(data.error||'Não foi possível continuar');await navigate({to:'/conta'});
 }catch(err){setError(err instanceof Error?err.message:'Erro inesperado');}finally{setLoading(false);}}
 return <main className="mx-auto max-w-md px-5 py-12"><h1 className="text-3xl font-bold">Criar minha conta</h1><p className="mt-2 text-sm text-muted-foreground">O cadastro é opcional. Você pode continuar comprando sem conta.</p><form onSubmit={submit} className="mt-7 space-y-4">
 <label className="block text-sm">Nome completo<input required minLength={2} maxLength={160} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-3" /></label>
 <label className="block text-sm">E-mail<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-3" /></label>
 <label className="block text-sm">Senha<input type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-1 w-full rounded-md border bg-background p-3" /></label>
 <label className="flex items-start gap-2 text-sm"><input type="checkbox" required checked={terms} onChange={e=>setTerms(e.target.checked)} className="mt-1"/><span>Li e aceito os <Link to="/termos" className="underline">Termos de Uso</Link> e a <Link to="/privacidade" className="underline">Política de Privacidade</Link>.</span></label>
 {error&&<p role="alert" className="text-sm text-red-600">{error}</p>}
 <button type="submit" disabled={loading} className="w-full rounded-md bg-primary p-3 font-bold text-primary-foreground disabled:opacity-50">{loading?'Aguarde...':'Criar minha conta'}</button></form><p className="mt-5 text-sm"><Link to="/login" className="underline">Já tem uma conta? Entrar</Link></p><p className="mt-3 text-sm"><Link to="/" className="underline">Continuar sem cadastro</Link></p></main>;
}
