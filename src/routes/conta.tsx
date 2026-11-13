import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { useAuthSession } from '@/lib/auth-session';

export const Route = createFileRoute('/conta')({ component: Conta });

function Conta() {
  const navigate = useNavigate();
  const { user, status, refresh, logout } = useAuthSession();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [projects,setProjects]=useState<{id:number;description:string;status:string;created_at:string}[]>([]);
  useEffect(()=>{if(!user)return;let live=true;fetch('/api/store/my-projects',{credentials:'same-origin'}).then(r=>r.ok?r.json():Promise.reject()).then(d=>{if(live)setProjects(d.projects||[])}).catch(()=>{});return()=>{live=false}},[user]);

  async function leave() {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await logout();
      await navigate({ to: '/login', replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível sair.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto max-w-3xl px-5 py-12">
    <h1 className="text-3xl font-bold">Minha conta</h1>
    {status === 'checking' ? <p className="mt-5">Verificando sua sessão...</p> :
     status === 'unavailable' ? <div className="mt-5 space-y-3"><p role="alert">Não foi possível consultar sua sessão agora. Sua conta não foi desconectada.</p><button type="button" onClick={() => void refresh()} className="rounded-md border px-4 py-2">Tentar novamente</button></div> :
     user ? <section className="mt-6 space-y-4">
       <p>Olá, {user.name}!</p>
       <p>E-mail: {user.email}</p>
       <p className="text-sm text-muted-foreground">Acesse a loja e o carrinho normalmente. Você continuará conectado até sair, expirar a sessão ou ocorrer uma invalidação de segurança.</p>
       <div className="rounded-2xl border p-5"><h2 className="text-lg font-bold">Meus projetos enviados</h2><p className="mt-1 text-sm text-muted-foreground">Acompanhe o andamento dos seus projetos personalizados.</p>{projects.length===0?<p className="mt-4 text-sm">Nenhum projeto enviado.</p>:<div className="mt-4 space-y-3">{projects.map(pr=><div key={pr.id} className="rounded-xl bg-muted p-3"><strong>Projeto #{pr.id}</strong><p className="mt-1 text-sm whitespace-pre-wrap">{pr.description}</p><p className="mt-1 text-xs font-semibold">{({'received':'Recebido','reviewing':'Em análise','approved':'Aprovado','in_production':'Em produção','completed':'Concluído'} as Record<string,string>)[pr.status]||pr.status}</p></div>)}</div>}<Link to="/projeto" className="mt-4 inline-block text-sm font-semibold underline">Enviar novo projeto</Link></div>
       {user.role==='admin'&&<Link to="/admin" className="inline-flex rounded-xl bg-[#191816] px-4 py-3 font-bold text-[#e8c46d]">Painel administrativo</Link>}
       {error && <p role="alert" className="text-red-600">{error}</p>}
       <button type="button" disabled={busy} onClick={() => void leave()} className="rounded-md border px-4 py-2 disabled:opacity-50">{busy ? 'Saindo...' : 'Sair da conta'}</button>
     </section> : <p className="mt-5">Você não está conectado. <Link to="/login" className="underline">Entrar</Link> ou <Link to="/cadastro" className="underline">criar conta</Link>.</p>}
  </main>;
}
