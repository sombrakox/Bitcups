import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  const ready = useRef(false);
  const signedIn = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    let stopped=false;
    const sync=async()=>{
      try{
        const me=await fetch('/api/auth/me',{credentials:'same-origin'}).then(r=>r.json());
        if(stopped||!me.user){signedIn.current=false;ready.current=true;return;}
        const remote=await fetch('/api/saved/cart',{credentials:'same-origin'}).then(r=>r.ok?r.json():null);
        if(stopped||!remote)return;
        const local:Items=JSON.parse(localStorage.getItem(KEY)||'{}');
        const merged:Items={...remote.items,...local};
        signedIn.current=true;ready.current=true;setItems(merged);localStorage.setItem(KEY,JSON.stringify(merged));
        await fetch('/api/saved/cart',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({items:merged})});
      }catch{ready.current=true;}
    };sync();return()=>{stopped=true};
  },[]);
  useEffect(()=>{
    if(!ready.current||!signedIn.current)return;
    const timer=setTimeout(()=>{fetch('/api/saved/cart',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({items})}).catch(()=>{});},500);
    return()=>clearTimeout(timer);
  },[items]);
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
