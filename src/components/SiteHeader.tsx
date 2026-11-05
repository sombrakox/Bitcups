import { Link } from "@tanstack/react-router";
import { ShoppingCart } from "lucide-react";
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

export function SiteHeader() {
  const { count } = useCart();
  return (
    <header className="premium-header sticky top-0 z-40 border-b border-primary-foreground/10 bg-premium/95 text-premium-foreground backdrop-blur-xl">
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
              className="nav-link px-4 py-3 text-sm font-medium text-premium-foreground/70 transition hover:text-premium-foreground"
              activeProps={{ className: "text-premium-foreground" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <Button asChild variant="premium" className="ml-auto h-10 rounded-md px-4 md:ml-0"><Link
          to="/carrinho"
        >
          <ShoppingCart className="h-4 w-4" />
          Carrinho
          {count > 0 && (
              <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{count}</span>
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
      </nav>
    </header>
  );
}

export function SiteFooter() {
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
          <Link to="/privacidade" className="block underline-offset-4 hover:underline">Privacidade e termos de uso</Link>
        </div>
      </div>
    </footer>
  );
}
