import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { allProducts, productLabel, waLink } from "@/lib/catalog";
import { buildCartMessage, useCart } from "@/lib/cart";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho de orçamento — Bitcups" },
      { name: "description", content: "Revise produtos e quantidades e envie seu pedido de orçamento pelo WhatsApp." },
      { property: "og:title", content: "Carrinho — Bitcups" },
      { property: "og:description", content: "Envie seu orçamento pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Carrinho,
});

function Carrinho() {
  const { items, setQty, clear, count } = useCart();
  const [name, setName] = useState("");
  const rows = Object.entries(items)
    .map(([id, q]) => ({ p: allProducts.find((x) => x.id === id), q }))
    .filter((r): r is { p: (typeof allProducts)[number]; q: number } => Boolean(r.p));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-4xl font-extrabold">Carrinho</h1>
      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg bg-card p-10 text-center shadow-card">
          <p className="text-muted-foreground">Seu carrinho está vazio.</p>
          <Link to="/produtos" className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Ver produtos</Link>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-3">
            {rows.map(({ p, q }) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card">
                <img src={p.image} alt={p.name} className="h-16 w-16 rounded-md object-cover" />
                <p className="min-w-0 flex-1 text-sm font-semibold">{productLabel(p)}</p>
                <div className="flex items-center rounded-full border">
                  <Button variant="ghost" size="icon" aria-label="Diminuir" className="p-2" onClick={() => setQty(p.id, q - 1)}><Minus className="h-4 w-4" /></Button>
                  <input type="number" min={1} value={q} onChange={(e) => setQty(p.id, Number(e.target.value) || 1)} className="w-12 bg-transparent text-center text-sm font-semibold outline-none" />
                  <Button variant="ghost" size="icon" aria-label="Aumentar" className="p-2" onClick={() => setQty(p.id, q + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
                <Button variant="ghost" size="icon" aria-label="Remover" className="p-2 text-destructive" onClick={() => setQty(p.id, 0)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-sm text-muted-foreground">{count} itens · <Button variant="link" className="h-auto p-0 underline" onClick={clear}>esvaziar</Button></p>
          <div className="mt-6 rounded-lg bg-card p-5 shadow-card">
            <label className="text-sm font-semibold">Seu nome (opcional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
            <Button asChild variant="whatsapp" className="mt-4 h-auto w-full whitespace-normal py-4"><a
              href={waLink(buildCartMessage(items, name))}
              target="_blank"
              rel="noreferrer"
              
            >
              <MessageCircle className="h-5 w-5" /> Enviar orçamento no WhatsApp
            </a></Button>
          </div>
        </>
      )}
    </div>
  );
}
