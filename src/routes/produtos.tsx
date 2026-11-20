import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Check, Search, ZoomIn, X, Heart, ChevronDown } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { toast } from "sonner";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { categories, countOf, productLabel, useManagedProducts, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/cart";
import { useExpandedPanel } from "@/lib/accordion";

type S = { cat?: string; sub?: string; topic?: string };

export const Route = createFileRoute("/produtos")({
  validateSearch: (s: Record<string, unknown>): S => ({
    ...(typeof s["cat"] === "string" ? { cat: s["cat"] } : {}),
    ...(typeof s["sub"] === "string" ? { sub: s["sub"] } : {}),
    ...(typeof s["topic"] === "string" ? { topic: s["topic"] } : {}),
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
  const { cat, sub, topic } = Route.useSearch();
  const managed = useManagedProducts();
  const [bestIds,setBestIds]=useState<string[]>([]);
  useEffect(()=>{fetch('/api/store/best-sellers').then(r=>r.ok?r.json():Promise.reject()).then(d=>setBestIds((d.products||[]).map((p:{id:string})=>p.id))).catch(()=>{})},[]);
  const visibleCategories = useMemo(() => {
    const known = new Set(managed.map(p => p.image));
    const mapped = categories.map(c => ({...c, subs: c.subs.map(s => ({...s, products: [
      ...s.products.filter(p => !known.has(p.image)),
      ...managed.filter(p => p.category === `${c.id}/${s.id}`),
    ]}))}));
    const productMap = new Map([...categories.flatMap(c=>c.subs.flatMap(s=>s.products)),...managed].map(p=>[p.id,p]));
    const bestProducts = bestIds.map(id=>productMap.get(id)).filter((p):p is Product=>Boolean(p));
    return [...mapped,{id:'mais-vendidos',name:'Mais vendidos',cover:bestProducts[0]?.image||categories[0]?.cover || "/favicon.png",subs:[{id:'mais-vendidos-todos',name:'Produtos mais vendidos',products:bestProducts}]}];
  }, [managed,bestIds]);
  const navigate = Route.useNavigate();
  const active = visibleCategories.find((c) => c.id === cat) ?? visibleCategories[0];
  const activeSub = active?.subs.find((s) => s.id === sub);
  const activeTopic = activeSub?.topics?.find((t) => t.id === topic);
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [zoom, setZoom] = useState<Product | null>(null);
  const { openId, togglePanel, openPanel } = useExpandedPanel(active?.id ?? null);
  const [sidebarSubOpen, setSidebarSubOpen] = useState<string | null>(sub ?? null);
  useEffect(() => { setSidebarSubOpen(sub ?? null); }, [cat, sub]);

  const list = useMemo(() => {
    const base = activeTopic ? activeTopic.products : activeSub ? activeSub.products : (active?.subs ?? []).flatMap((s) => s.products);
    const t = q.trim().toLowerCase();
    return t ? base.filter((p) => productLabel(p).toLowerCase().includes(t)) : base;
  }, [active, activeSub, activeTopic, q]);

  if (!active) return null;

  const go = (s: S) => { setLimit(PAGE); navigate({ search: s, replace: true }); };

  const pickCat = (id: string) => {
    if (id === active.id) { togglePanel(id); return; }
    openPanel(id);
    go({ cat: id });
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl px-3 py-8 md:px-4 md:py-12">
      <div data-reveal="fade-down">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Vitrine Bitcups</p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-5xl">Nossos produtos</h1>
      </div>

      <div className="mt-4 flex min-w-0 flex-row items-start gap-2 sm:gap-4 md:gap-8">
        <aside data-reveal="slide-left" className="w-[116px] min-w-0 shrink-0 sm:w-44 md:w-64">
          <nav className="sticky top-2 max-h-[calc(100dvh-20px)] overflow-y-auto rounded-lg bg-premium p-2 text-premium-foreground shadow-card md:sticky md:top-[92px] md:max-h-[calc(100vh-110px)] md:p-3">
            <p className="hidden px-3 pb-3 pt-1 text-xs font-semibold uppercase tracking-widest opacity-60 md:block">Categorias</p>
            <ul className="space-y-1">
              {visibleCategories.map((c) => {
                const on = c.id === active.id;
                const open = openId === c.id;
                return (
                  <li key={c.id}>
                    <Button
                      variant="ghost"
                      aria-pressed={on}
                      aria-expanded={c.subs.length > 1 ? open : undefined}
                      onClick={() => pickCat(c.id)}
                      className={`category-selector flex h-auto w-full items-center gap-1 rounded-md p-1 text-left text-[10px] font-semibold leading-tight whitespace-normal transition sm:gap-2 sm:p-2 sm:text-sm ${
                        on ? "bg-accent text-accent-foreground" : "text-premium-foreground/75 hover:bg-premium-foreground/10 hover:text-premium-foreground"
                      }`}
                    >
                      <img src={c.cover} alt="" className="h-7 w-7 shrink-0 rounded-lg object-cover sm:h-9 sm:w-9" />
                      <span className="min-w-0 flex-1 break-words">{c.name}</span>
                      <span className="hidden text-xs opacity-60 md:inline">{countOf(c)}</span>
                      {c.subs.length > 1 && <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />}
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
                                onClick={() => {
                                  if (!s.id) { setSidebarSubOpen(null); go({cat:c.id}); }
                                  else if (activeSub?.id === s.id && sidebarSubOpen === s.id) {
                                    setSidebarSubOpen(null); go({cat:c.id});
                                  } else { setSidebarSubOpen(s.id); go({cat:c.id,sub:s.id}); }
                                }}
                                className={`h-auto w-full justify-between whitespace-normal break-words rounded-md px-1 py-1.5 text-left text-[10px] sm:px-2 sm:text-[11px] font-medium leading-tight md:text-sm ${
                                  sel ? "bg-premium-foreground/15 text-accent" : "text-premium-foreground/70 hover:bg-premium-foreground/10 hover:text-premium-foreground"
                                }`}
                              >
                                <span>{s.name}</span>
                                <span className="hidden text-xs opacity-60 md:inline">{s.n}</span>
                              </Button>
                              {sel && sidebarSubOpen === s.id && activeSub?.topics && (
                                <ul className="ml-2 mt-1 space-y-0.5 border-l border-accent/40 pl-2">
                                  {activeSub.topics.map((t) => (
                                    <li key={t.id}>
                                      <Button
                                        variant="ghost"
                                        aria-pressed={activeTopic?.id === t.id}
                                        onClick={() => go(activeTopic?.id === t.id ? {cat:c.id,sub:s.id!} : {cat:c.id,sub:s.id!,topic:t.id})}
                                        className={`h-auto w-full justify-between whitespace-normal break-words rounded-md px-1 py-1.5 text-left text-[10px] sm:px-2 sm:text-[11px] leading-tight md:text-sm ${activeTopic?.id === t.id ? 'bg-accent text-accent-foreground' : 'text-premium-foreground/75 hover:bg-premium-foreground/10 hover:text-premium-foreground'}`}
                                      >
                                        <span>{t.name}</span><span className="hidden text-xs opacity-60 md:inline">{t.products.length}</span>
                                      </Button>
                                    </li>
                                  ))}
                                </ul>
                              )}
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
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3">
            <h2 className="text-base font-bold sm:text-xl md:text-3xl">{active.name}</h2>
            <span className="shrink-0 text-xs text-muted-foreground">{list.length} {list.length === 1 ? "item" : "itens"}</span>
          </div>

          {activeSub && <p className="mt-2 text-sm font-semibold text-muted-foreground">{activeSub.name}{activeTopic ? ` / ${activeTopic.name}` : ""}</p>}

          <label className="mt-3 flex min-w-0 items-center gap-1 rounded-full border bg-card px-2 py-2.5 sm:gap-2 sm:px-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(PAGE); }} placeholder="Buscar por nome ou código…" className="min-w-0 w-full bg-transparent text-xs outline-none sm:text-sm" />
          </label>

          <div key={`${active.id}-${activeSub?.id ?? "all"}-${activeTopic?.id ?? "all"}`} className="product-grid mt-4 grid grid-cols-1 gap-2 min-[500px]:grid-cols-2 md:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
