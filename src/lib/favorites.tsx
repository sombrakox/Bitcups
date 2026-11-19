import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { allProducts, productLabel } from "./catalog";
import { useAuthSession } from "./auth-session";

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
  const { user, status } = useAuthSession();
  const [ids, setIds] = useState<string[]>([]);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const generation = useRef(0);
  const idsRef = useRef<string[]>([]);
  const writeQueue = useRef<Promise<unknown>>(Promise.resolve());
  const activeUserId = status === 'authenticated' ? user?.id ?? null : null;

  useEffect(() => {
    const current = ++generation.current;
    idsRef.current = [];
    setIds([]);
    setLoadedFor(null);
    if (activeUserId === null) return;
    void (async () => {
      try {
        const response = await fetch('/api/saved/favorites', { credentials: 'same-origin', cache: 'no-store' });
        if (!response.ok) throw new Error('Falha ao carregar favoritos');
        const data = await response.json();
        if (current !== generation.current) return;
        const next: string[] = Array.isArray(data.ids) ? data.ids : [];
        idsRef.current = next;
        setIds(next);
        setLoadedFor(activeUserId);
      } catch (error) {
        if (current === generation.current) console.error('Favoritos: não foi possível carregar os dados', error);
      }
    })();
  }, [activeUserId]);

  const save = (next: string[]) => {
    if (activeUserId === null || loadedFor !== activeUserId) return;
    idsRef.current = next;
    setIds(next);
    const snapshot = [...next];
    writeQueue.current = writeQueue.current.catch(() => {}).then(async () => {
      const response = await fetch('/api/saved/favorites', {
        method: 'PUT', credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids: snapshot }),
      });
      if (!response.ok) throw new Error('Falha ao salvar favoritos');
    }).catch(error => console.error(error));
  };

  const value: Ctx = {
    ids,
    has: (id) => ids.includes(id),
    toggle: (id) => save(idsRef.current.includes(id) ? idsRef.current.filter((x) => x !== id) : [...idsRef.current, id]),
    clear: () => save([]),
  };
  return <FavContext.Provider value={value}>{children}</FavContext.Provider>;
}

export function useFavorites() {
  const c = useContext(FavContext);
  if (!c) throw new Error("useFavorites must be used within FavoritesProvider");
  return c;
}
