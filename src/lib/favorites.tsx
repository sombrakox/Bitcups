import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { allProducts, productLabel } from "./catalog";

type Ctx = { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => void; clear: () => void };
const FavContext = createContext<Ctx | null>(null);
const KEY = "bitcups-favoritos";

export function buildFavoritesMessage(ids: string[]) {
  const lines = ids.map((id) => {
    const p = allProducts.find((x) => x.id === id);
    return `• ${p ? productLabel(p) : id}`;
  });
  return ["Olá, Bitcups! Separei estes favoritos e gostaria de um orçamento:", "", ...lines].join("\n");
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);
  const save = (next: string[]) => {
    setIds(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  const value: Ctx = {
    ids,
    has: (id) => ids.includes(id),
    toggle: (id) => save(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]),
    clear: () => save([]),
  };
  return <FavContext.Provider value={value}>{children}</FavContext.Provider>;
}

export function useFavorites() {
  const c = useContext(FavContext);
  if (!c) throw new Error("useFavorites must be used within FavoritesProvider");
  return c;
}
