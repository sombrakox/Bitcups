import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { allProducts, productLabel, waLink } from "@/lib/catalog";
import { buildFavoritesMessage, useFavorites } from "@/lib/favorites";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Meus favoritos — Bitcups" },
      { name: "description", content: "Produtos que você salvou na vitrine Bitcups. Envie a seleção pelo WhatsApp para orçamento." },
      { property: "og:title", content: "Favoritos — Bitcups" },
      { property: "og:description", content: "Salve produtos e peça orçamento pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Favoritos,
});

function Favoritos() {
  const { ids, toggle, clear } = useFavorites();
  const { add } = useCart();
  const list = ids.map((id) => allProducts.find((p) => p.id === id)).filter((p) => !!p);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Sua seleção</p>
      <h1 className="mt-1 text-4xl font-extrabold">Favoritos</h1>

      {list.length === 0 ? (
        <div className="mt-10 rounded-lg border bg-card p-10 text-center">
          <Heart className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">Você ainda não salvou nenhum produto.</p>
          <Button asChild variant="premium" className="mt-6"><Link to="/produtos">Explorar a vitrine</Link></Button>
        </div>
      ) : (
        <>
          <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {list.map((p) => (
              <li key={p.id} className="product-card flex flex-col overflow-hidden rounded-lg bg-card">
                <img src={p.image} alt={p.name} loading="lazy" className="aspect-square w-full object-cover" />
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <p className="line-clamp-2 text-xs font-bold md:text-sm">{productLabel(p)}</p>
                  <div className="flex-1" />
                  <div className="flex gap-2">
                    <Button variant="premium" className="h-9 flex-1 text-xs" onClick={() => { add(p.id, 1); toast.success("Adicionado ao carrinho"); }}>
                      <ShoppingCart className="h-3.5 w-3.5" /> Carrinho
                    </Button>
                    <Button variant="secondary" size="icon" aria-label="Remover dos favoritos" className="h-9 w-9" onClick={() => toggle(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="whatsapp" className="h-auto flex-1 py-4">
              <a href={waLink(buildFavoritesMessage(ids))} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5" /> Enviar favoritos no WhatsApp ({list.length})
              </a>
            </Button>
            <Button variant="secondary" className="h-auto py-4" onClick={clear}>Limpar lista</Button>
          </div>
        </>
      )}
    </div>
  );
}
