import { useEffect, useState } from "react";
import { useAuthSession } from "@/lib/auth-session";
import { Link } from "@tanstack/react-router";
import { ShoppingCart, UserRound, ShieldCheck, LayoutDashboard } from "lucide-react";
import logo from "@/assets/logo-bitcups.png";
import { useCart } from "@/lib/cart";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Início" },
  { to: "/produtos", label: "Vitrine" },
  { to: "/projeto", label: "Enviar projeto" },
  { to: "/#contato", label: "Contato" },
  { to: "/favoritos", label: "Favoritos" },
] as const;

/** True once the page has been scrolled a little; throttled to one update per frame. */
function useScrolled(threshold = 12) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => { frame = 0; setScrolled(window.scrollY > threshold); };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);
  return scrolled;
}

export function SiteHeader() {
  const { count } = useCart();
  const scrolled = useScrolled();
  const { status, user } = useAuthSession();
  // Unknown or temporarily unavailable sessions open the account page,
  // which checks authentication without accidentally presenting login.
  const signedIn = status !== 'guest';
  return (
    <header data-scrolled={scrolled} className="premium-header sticky top-0 z-40 border-b border-primary-foreground/10 bg-premium/95 text-premium-foreground backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-5 py-2 md:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="Bitcups" className="brand-logo" />
        </Link>
        <nav className="hidden flex-1 justify-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: true }}
              className="nav-link relative rounded-xl border border-transparent px-4 py-3 text-sm font-semibold tracking-wide text-premium-foreground/75 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c7a65b]/35 hover:bg-[#c7a65b]/10 hover:text-[#e8c46d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d5b768]"
              activeProps={{ className: "text-premium-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Link to={user?.role==='admin'?'/admin':'/admin/login'} className="hidden items-center gap-1.5 rounded-xl border border-[#c7a65b]/40 px-3 py-2 text-xs font-bold text-[#e8c46d] transition hover:bg-[#c7a65b]/15 md:inline-flex">{user?.role==='admin'?<LayoutDashboard size={16}/>:<ShieldCheck size={16}/>} {user?.role==='admin'?'Painel administrativo':'Admin'}</Link>
        <Link to={signedIn ? "/conta" : "/login"} aria-label={signedIn ? "Minha conta" : "Entrar"} className="ml-auto inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 text-sm font-bold text-premium-foreground transition hover:bg-primary hover:text-primary-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary md:ml-0 md:px-4">
          <UserRound className="h-4 w-4" /> <span className="hidden sm:inline">{signedIn ? "Minha conta" : "Entrar"}</span><span className="sm:hidden">{signedIn ? "Conta" : "Entrar"}</span>
        </Link>
        <Button asChild variant="premium" className="h-10 rounded-md px-3 sm:px-4"><Link
          to="/carrinho"
        >
          <ShoppingCart className="h-4 w-4" />
          Carrinho
          {count > 0 && (
              <span key={count} className="cart-badge rounded-full bg-primary px-2 text-xs text-primary-foreground">{count}</span>
          )}
        </Link></Button>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-4 pb-2 md:hidden">
        {nav.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            activeOptions={{ exact: true }}
            className="nav-link whitespace-nowrap px-3 py-2 text-sm font-medium text-premium-foreground/70"
            activeProps={{ className: "text-accent" }}
          >
            {n.label}
          </Link>
        ))}
        <Link to={user?.role==='admin'?'/admin':'/admin/login'} className="nav-link flex shrink-0 items-center gap-1 rounded-lg border border-[#c7a65b]/40 px-3 py-2 text-xs font-bold text-[#e8c46d]"><ShieldCheck size={14}/>{user?.role==='admin'?'Painel':'Admin'}</Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  const { status } = useAuthSession();
  const signedIn = status !== 'guest';
  return (
    <footer className="mt-20 border-t border-primary-foreground/10 bg-premium text-premium-foreground">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 text-sm md:grid-cols-3 md:px-8">
        <div>
          <p className="font-display text-xl font-bold">Bitcups</p>
          <p className="mt-2 opacity-70">Brindes personalizados · Salvador - BA</p>
        </div>
        <div className="space-y-1 opacity-90">
          <p>(71) 98260-2013</p>
          <p>debitcups@gmail.com</p>
          <p>Seg-Sex 7:30–17:30 · Sáb 7:30–12:00</p>
        </div>
        <div className="space-y-1">
          <a className="block underline-offset-4 hover:underline" href="https://instagram.com/debitcups" target="_blank" rel="noreferrer">Instagram @debitcups</a>
          <a className="block underline-offset-4 hover:underline" href="https://facebook.com/Bitcups" target="_blank" rel="noreferrer">Facebook</a>
          <Link to="/privacidade" className="block underline-offset-4 hover:underline">Privacidade</Link>
          <Link to="/termos" className="block underline-offset-4 hover:underline">Termos de Uso</Link>
          <Link to={signedIn ? "/conta" : "/login"} className="block underline-offset-4 hover:underline">Minha conta</Link>
        </div>
      </div>
    </footer>
  );
}
