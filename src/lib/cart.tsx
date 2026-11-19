import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { allProducts, productLabel } from "./catalog";
import { useAuthSession } from "./auth-session";

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
  const { user, status } = useAuthSession();
  const [items, setItems] = useState<Items>({});
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const generation = useRef(0);
  const itemsRef = useRef<Items>({});
  const writeQueue = useRef<Promise<unknown>>(Promise.resolve());
  const activeUserId = status === 'authenticated' ? user?.id ?? null : null;

  useEffect(() => {
    const current = ++generation.current;
    itemsRef.current = {};
    setItems({});
    setLoadedFor(null);
    if (activeUserId === null) return;
    void (async () => {
      try {
        const response = await fetch('/api/saved/cart', { credentials: 'same-origin', cache: 'no-store' });
        if (!response.ok) throw new Error('Falha ao carregar carrinho');
        const data = await response.json();
        if (current !== generation.current) return;
        const next: Items = data.items ?? {};
        itemsRef.current = next;
        setItems(next);
        setLoadedFor(activeUserId);
      } catch (error) {
        if (current === generation.current) console.error('Carrinho: não foi possível carregar os dados', error);
      }
    })();
  }, [activeUserId]);

  const save = (next: Items) => {
    if (activeUserId === null || loadedFor !== activeUserId) return;
    itemsRef.current = next;
    setItems(next);
    const snapshot = { ...next };
    // Serialize writes to avoid an older response overwriting a newer cart.
    writeQueue.current = writeQueue.current.catch(() => {}).then(async () => {
      const response = await fetch('/api/saved/cart', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: snapshot }),
      });
      if (!response.ok) throw new Error('Falha ao salvar carrinho');
    }).catch(error => console.error(error));
  };

  const setQty = (id: string, qty: number) => {
    const next = { ...itemsRef.current };
    if (qty <= 0) delete next[id];
    else next[id] = Math.floor(qty);
    save(next);
  };

  const value: Ctx = {
    items,
    count: Object.values(items).reduce((a, b) => a + b, 0),
    setQty,
    add: (id, qty = 1) => setQty(id, (itemsRef.current[id] ?? 0) + qty),
    clear: () => save({}),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}
