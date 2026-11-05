import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Minus, Plus, Check, Search, ZoomIn, X, Heart, ChevronDown } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { toast } from "sonner";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { categories, countOf, productLabel, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useExpandedPanel } from "@/lib/accordion";

type S = { cat?: string; sub?: string };

export const Route = createFileRoute("/produtos")({
  validateSearch: (s: Record<string, unknown>): S => ({
    ...(typeof s["cat"] === "string" ? { cat: s["cat"] } : {}),
    ...(typeof s["sub"] === "string" ? { sub: s["sub"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Vitrine de produtos personalizados — Bitcups" },
      { name: "description", content: "Mais de 1.400 artes em canecas, copos, garrafas, sandálias, camisas, quadros e chaveiros personalizados." },
      { property: "og:title", content: "Vitrine — Bitcups" },
      { property: "og:description", content: "Catálogo completo por tópicos. Adicione ao carrinho e peça orçamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Produtos,
});

const PAGE = 24;

function Produtos() {
  const { cat, sub } = Route.useSearch();
  const navigate = Route.useNavigate();
  const active = categories.find((c) => c.id === cat) ?? categories[0];
  const activeSub = active?.subs.find((s) => s.id === sub);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [zoom, setZoom] = useState<Product | null>(null);
  const { openId, togglePanel, openPanel } = useExpandedPanel(active?.id ?? null);

  const list = useMemo(() => {
    const base = activeSub ? activeSub.products : (active?.subs ?? []).flatMap((s) => s.products);
    const t = q.trim().toLowerCase();
    return t ? base.filter((p) => productLabel(p).toLowerCase().includes(t)) : base;
  }, [active, activeSub, q]);

  if (!active) return null;

  const go = (s: S) => { setLimit(PAGE); navigate({ search: s, replace: true }); };

  const pickCat = (id: string) => {
    if (id === active.id) { togglePanel(id); return; }
    openPanel(id);
    go({ cat: id });
  };

  return (
    <div className="mx-auto max-w-7xl px-3 py-8 md:px-4 md:py-12">
      <div data-reveal="fade-down">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Vitrine Bitcups</p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-5xl">Nossos produtos</h1>
      </div>

      <div className="mt-6 flex gap-3 md:gap-8">
        <aside data-reveal="slide-left" className="w-[108px] shrink-0 md:w-64">
          <nav className="sticky top-[120px] max-h-[calc(100vh-140px)] overflow-y-auto rounded-lg bg-premium p-1.5 text-premium-foreground shadow-card md:top-[92px] md:p-3">
            <p className="hidden px-3 pb-3 pt-1 text-xs font-semibold uppercase tracking-widest opacity-60 md:block">Categorias</p>
            <ul className="space-y-1">
              {categories.map((c) => {
                const on = c.id === active.id;
                const open = openId === c.id;
                return (
                  <li key={c.id}>
                    <Button
                      variant="ghost"
                      aria-pressed={on}
                      aria-expanded={c.subs.length > 1 ? open : undefined}
                      onClick={() => pickCat(c.id)}
                      className={`category-selector h-auto whitespace-normal flex w-full flex-col items-center gap-1.5 rounded-md p-2 text-center text-[11px] font-semibold leading-tight transition md:flex-row md:gap-3 md:text-left md:text-sm ${
                        on ? "bg-accent text-accent-foreground" : "text-premium-foreground/75 hover:bg-premium-foreground/10 hover:text-premium-foreground"
                      }`}
                    >
                      <img src={c.cover} alt="" className="h-11 w-11 rounded-lg object-cover md:h-9 md:w-9" />
                      <span className="flex-1">{c.name}</span>
                      <span className="hidden text-xs opacity-60 md:inline">{countOf(c)}</span>
                      {c.subs.length > 1 && <ChevronDown className={`hidden h-4 w-4 transition-transform md:block ${open ? "rotate-180" : ""}`} />}
                    </Button>
                    {open && c.subs.length > 1 && (
                      <ul className="subtopic-list mb-2 mt-1 space-y-0.5 border-l border-premium-foreground/15 pl-1.5 md:ml-4 md:pl-2">
                        {[{ id: undefined, name: "Todas", n: countOf(c) }, ...c.subs.map((s) => ({ id: s.id as string | undefined, name: s.name, n: s.products.length }))].map((s) => {
                          const sel = (activeSub?.id ?? undefined) === s.id;
                          return (
                            <li key={s.id ?? "all"}>
                              <Button
                                variant="ghost"
                                aria-pressed={sel}
                                onClick={() => go(s.id ? { cat: c.id, sub: s.id } : { cat: c.id })}
                                className={`h-auto w-full justify-between whitespace-normal rounded-md px-2 py-1.5 text-left text-[11px] font-medium leading-tight md:text-sm ${
                                  sel ? "bg-premium-foreground/15 text-accent" : "text-premium-foreground/70 hover:bg-premium-foreground/10 hover:text-premium-foreground"
                                }`}
                              >
                                <span>{s.name}</span>
                                <span className="hidden text-xs opacity-60 md:inline">{s.n}</span>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2 border-b pb-3">
            <h2 className="text-xl font-bold md:text-3xl">{active.name}</h2>
            <span className="shrink-0 text-xs text-muted-foreground">{list.length} {list.length === 1 ? "item" : "itens"}</span>
          </div>

          {activeSub && <p className="mt-2 text-sm font-semibold text-muted-foreground">{activeSub.name}</p>}

          <label className="mt-3 flex items-center gap-2 rounded-full border bg-card px-4 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Buscar por nome ou código…" className="w-full bg-transparent text-sm outline-none" />
          </label>

          <div key={`${active.id}-${activeSub?.id ?? "all"}`} className="product-grid mt-4 grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {list.slice(0, limit).map((p) => (
              <ProductCard key={p.id} p={p} onZoom={() => setZoom(p)} />
            ))}
          </div>
          {list.length === 0 && <p className="mt-10 text-center text-muted-foreground">Nenhum produto encontrado.</p>}
          {list.length > limit && (
            <Button variant="default" onClick={() => setLimit(limit + PAGE)} className="mx-auto mt-8 block h-auto rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground">
              Ver mais ({list.length - limit} restantes)
            </Button>
          )}
        </section>
      </div>

      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="max-w-3xl overflow-hidden p-0 [&>button]:hidden">
          <DialogTitle className="sr-only">{zoom ? productLabel(zoom) : ""}</DialogTitle>
          {zoom && (
            <>
              <TransformWrapper minScale={1} maxScale={5} doubleClick={{ mode: "toggle", step: 2 }}>
                <TransformComponent wrapperClass="!w-full bg-muted" contentClass="!w-full">
                  <img src={zoom.image} alt={zoom.name} className="max-h-[75vh] w-full object-contain" />
                </TransformComponent>
              </TransformWrapper>
              <div className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold">{productLabel(zoom)}</p>
                  <p className="text-xs text-muted-foreground">Use dois dedos, a roda do mouse ou dois toques para dar zoom.</p>
                </div>
                <Button variant="secondary" size="icon" aria-label="Fechar" onClick={() => setZoom(null)} className="rounded-md"><X className="h-4 w-4" /></Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProductCard({ p, onZoom }: { p: Product; onZoom: () => void }) {
  const { add, items } = useCart();
  const fav = useFavorites();
  const liked = fav.has(p.id);
  const [qty, setQty] = useState(1);
  const inCart = items[p.id] ?? 0;
  return (
    <div className="product-card relative flex flex-col overflow-hidden rounded-lg bg-card">
      <Button
        variant="ghost"
        size="icon"
        aria-pressed={liked}
        aria-label={liked ? `Remover ${p.name} dos favoritos` : `Salvar ${p.name} nos favoritos`}
        onClick={() => { fav.toggle(p.id); if (!liked) toast.success("Salvo nos favoritos"); }}
        className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full bg-background/90 hover:bg-background"
      >
        <Heart key={String(liked)} className={`h-4 w-4 ${liked ? "heart-pop fill-destructive text-destructive" : ""}`} />
      </Button>
      <Button variant="ghost" onClick={onZoom} className="group relative block h-auto overflow-hidden rounded-none bg-muted p-0 hover:bg-muted" aria-label={`Ampliar ${p.name}`}>
        <img src={p.image} alt={p.name} loading="lazy" className="product-photo aspect-square w-full object-cover" />
        <span className="absolute bottom-2 right-2 rounded-full bg-background/90 p-1.5"><ZoomIn className="h-4 w-4" /></span>
      </Button>
      <div className="flex flex-1 flex-col p-2.5 md:p-4">
        {p.code && <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">#{p.code}</p>}
        <h3 className="line-clamp-2 text-xs font-bold md:text-sm">{p.name}</h3>
        {p.description && <p className="mt-1 line-clamp-2 hidden text-xs text-muted-foreground md:block">{p.description}</p>}
        <div className="flex-1" />
        {inCart > 0 && (
          <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-whatsapp"><Check className="h-3 w-3" /> {inCart} no carrinho</p>
        )}
        <div className="mt-2 flex items-center justify-between rounded-full border">
          <Button variant="ghost" size="icon" aria-label="Diminuir" className="h-8 w-8 shrink-0 rounded-full p-1.5" onClick={() => setQty(Math.max(1, qty - 1))}><Minus className="h-3.5 w-3.5" /></Button>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="min-w-0 w-8 bg-transparent text-center text-sm font-semibold outline-none" />
          <Button variant="ghost" size="icon" aria-label="Aumentar" className="h-8 w-8 shrink-0 rounded-full p-1.5" onClick={() => setQty(qty + 1)}><Plus className="h-3.5 w-3.5" /></Button>
        </div>
        <Button
          variant="premium"
          onClick={() => { add(p.id, qty); toast.success(`${qty}× ${productLabel(p)} adicionado`); setQty(1); }}
          className="mt-2 h-auto rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground md:text-sm"
        >
          Adicionar
        </Button>
      </div>
    </div>
  );
}
