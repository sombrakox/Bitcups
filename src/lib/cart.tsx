import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { allProducts, productLabel } from "./catalog";

type Items = Record<string, number>;
type Ctx = {
  items: Items;
  count: number;
  setQty: (id: string, qty: number) => void;
  add: (id: string, qty?: number) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "bitcups-cart";

export function buildCartMessage(items: Items, name?: string) {
  const lines = Object.entries(items)
    .filter(([, q]) => q > 0)
    .map(([id, q]) => `• ${(() => { const p = allProducts.find((x) => x.id === id); return p ? productLabel(p) : id; })()}: ${q} un.`);
  return [
    "Olá, Bitcups! Gostaria de um orçamento:",
    "",
    ...lines,
    "",
    name ? `Nome: ${name}` : "",
  ]
    .filter((l, i, a) => !(l === "" && i === a.length - 1))
    .join("\n")
    .trim();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Items>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  const save = (next: Items) => {
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const setQty = (id: string, qty: number) => {
    const next = { ...items };
    if (qty <= 0) delete next[id];
    else next[id] = Math.floor(qty);
    save(next);
  };

  const value: Ctx = {
    items,
    count: Object.values(items).reduce((a, b) => a + b, 0),
    setQty,
    add: (id, qty = 1) => setQty(id, (items[id] ?? 0) + qty),
    clear: () => save({}),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
