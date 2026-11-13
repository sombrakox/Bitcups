import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState, type FormEvent } from 'react';
import { useAuthSession } from '@/lib/auth-session';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, ShoppingBag } from 'lucide-react';
import logo from '@/assets/logo-bitcups.png';

export const Route = createFileRoute('/login')({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { status, refresh } = useAuthSession();
  useEffect(() => {
    if (status === 'authenticated') void navigate({ to: '/conta', replace: true });
  }, [status, navigate]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Não foi possível entrar. Tente novamente.');
      await refresh();
      await navigate({ to: '/conta', replace: true });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'authenticated' || status === 'checking') {
    return <main className="mx-auto max-w-3xl px-5 py-16" role="status">{status === 'checking' ? 'Verificando sua sessão...' : 'Abrindo sua conta...'}</main>;
  }

  return (
    <main className="relative isolate overflow-hidden bg-background px-4 py-10 sm:py-16">
      <div aria-hidden="true" className="pointer-events-none absolute -left-28 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-premium p-10 text-premium-foreground lg:flex">
          <div aria-hidden="true" className="absolute -right-20 top-20 h-64 w-64 rounded-full border border-primary/30 bg-primary/10 blur-2xl" />
          <div className="relative">
            <img src={logo} alt="BitCups" className="h-20 max-w-[210px] object-contain object-left" />
            <p className="mt-14 text-xs font-semibold uppercase tracking-[0.25em] text-primary">Sua experiência personalizada</p>
            <h2 className="mt-4 max-w-xs font-display text-4xl font-bold leading-tight">Tudo o que você ama, em um só lugar.</h2>
            <p className="mt-5 max-w-sm text-sm leading-7 text-premium-foreground/70">Entre na sua conta para acessar seus favoritos, acompanhar suas solicitações e continuar de onde parou.</p>
          </div>
          <div className="relative flex items-center gap-3 rounded-2xl border border-premium-foreground/15 bg-premium-foreground/5 p-4 text-sm">
            <ShieldCheck className="h-6 w-6 shrink-0 text-primary" />
            <span>Seu acesso é protegido. Nunca compartilhe sua senha.</span>
          </div>
        </aside>

        <section className="px-6 py-10 sm:px-12 sm:py-14">
          <div className="mb-8 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-foreground"><LockKeyhole className="h-3.5 w-3.5" /> Área do cliente</span>
            <Link to="/" className="text-sm font-medium text-muted-foreground transition hover:text-foreground">Voltar à loja</Link>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Bem-vindo de volta!</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">Entre com seu e-mail e senha para acessar sua conta BitCups.</p>
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-semibold">E-mail</label>
              <div className="relative">
                <Mail aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input id="login-email" type="email" required maxLength={254} autoComplete="email" placeholder="seuemail@exemplo.com" value={email} onChange={event => setEmail(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="login-password" className="text-sm font-semibold">Senha</label>
                <Link to="/esqueci-senha" className="text-xs font-semibold text-foreground underline decoration-primary underline-offset-4 hover:text-primary">Esqueci minha senha</Link>
              </div>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-background pl-12 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-muted-foreground hover:text-foreground">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground shadow-lg shadow-primary/10 transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait disabled:opacity-60">{loading ? 'Entrando...' : 'Entrar na minha conta'}{!loading && <ArrowRight className="h-4 w-4" />}</button>
          </form>
          <div className="mt-7 border-t border-border pt-6 text-center text-sm text-muted-foreground">Ainda não tem conta? <Link to="/cadastro" className="font-bold text-foreground underline decoration-primary underline-offset-4">Cadastre-se gratuitamente</Link></div>
          <Link to="/" className="mt-5 flex items-center justify-center gap-2 text-center text-sm font-medium text-muted-foreground transition hover:text-foreground"><ShoppingBag className="h-4 w-4" /> Continuar comprando sem cadastro</Link>
        </section>
      </div>
    </main>
  );
}
