import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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
  const ready=useRef(false);
  const signedIn=useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(()=>{
    let stopped=false;
    const sync=async()=>{
      try{
        const me=await fetch('/api/auth/me',{credentials:'same-origin'}).then(r=>r.json());
        if(stopped||!me.user){ready.current=true;signedIn.current=false;return;}
        const remote=await fetch('/api/saved/favorites',{credentials:'same-origin'}).then(r=>r.ok?r.json():null);
        if(stopped||!remote)return;
        const local:string[]=JSON.parse(localStorage.getItem(KEY)||'[]');
        const merged=[...new Set([...remote.ids,...local])];
        signedIn.current=true;ready.current=true;setIds(merged);localStorage.setItem(KEY,JSON.stringify(merged));
        await fetch('/api/saved/favorites',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({ids:merged})});
      }catch{ready.current=true;}
    };sync();return()=>{stopped=true};
  },[]);
  useEffect(()=>{
    if(!ready.current||!signedIn.current)return;
    const timer=setTimeout(()=>{fetch('/api/saved/favorites',{method:'PUT',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({ids})}).catch(()=>{});},500);
    return()=>clearTimeout(timer);
  },[ids]);
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
