import * as React from "react";
import mugs from "@/assets/product-mugs.png";
import polymer from "@/assets/product-polymer-mug.png";
import keychains from "@/assets/product-keychains.png";
import frames from "@/assets/product-frames.jpg";
import shirts from "@/assets/product-shirts.jpg";
import sandals from "@/assets/product-sandals.jpg";
import cups from "@/assets/product-cups.png";
import bottles from "@/assets/product-bottles.jpg";
import vitrine from "@/data/vitrine.json";

export const WHATSAPP_NUMBER = "5571982602013";

export type Product = { id: string; code?: string; name: string; description?: string; image: string; category?: string };
export type SubTopic = { id: string; name: string; products: Product[] };
export type Category = { id: string; name: string; cover: string; subs: SubTopic[] };

const one = (id: string, name: string, products: Product[]): SubTopic[] => [{ id, name, products }];

const legacy = (items: Product[], predicate: (p: Product) => boolean) => items.filter(predicate);
const matches = (p: Product, expression: RegExp) => expression.test(`${p.name} ${p.description || ''}`.toLowerCase());
const allOld = [
  ...vitrine.porcelana.flatMap(s => s.products), ...vitrine.maes,
  ...vitrine.aluminio, ...vitrine.plastico, ...vitrine.copos, ...vitrine.camisas,
];
const uniqueOld = Array.from(new Map(allOld.map(p => [p.id, p])).values());
const old = (pattern: RegExp) => legacy(uniqueOld, p => matches(p, pattern));
const sub = (id: string, name: string, products: Product[] = []): SubTopic => ({id,name,products});

export const categories: Category[] = [
  {id:'canecas',name:'Canecas',cover:mugs,subs:[
    sub('porcelana','Porcelana',[...vitrine.porcelana.flatMap(s=>s.products)]),
    sub('polimero','Polímero',[{id:'caneca-polimero',name:'Caneca de polímero',image:polymer},...old(/caneca.*pol[ií]mero/)]),
    sub('vidro','Vidro',old(/caneca.*vidro/)),
    sub('aluminio','Alumínio',old(/caneca.*alum[ií]nio/)),
    sub('plastico','Plástico',old(/caneca.*pl[aá]stic/)),
  ]},
  {id:'copos',name:'Copos',cover:cups,subs:[
    sub('plastico','Copos plásticos',old(/copo.*pl[aá]stic/)),
    sub('vidro','Copos de vidro',old(/copo.*vidro/)),
    sub('aluminio','Copos de alumínio',old(/copo.*alum[ií]nio/)),
    sub('termicos','Copos térmicos',[{id:'copo-termico',name:'Copo térmico personalizado',image:cups},...vitrine.copos]),
  ]},
  {id:'garrafas-squeezes',name:'Garrafas e Squeezes',cover:bottles,subs:[
    sub('termicas','Garrafas térmicas',[{id:'garrafa-termica',name:'Garrafa térmica personalizada',image:bottles}]),
    sub('inox','Garrafas de inox'),sub('squeezes-plasticos','Squeezes plásticos'),sub('plasticas','Garrafas plásticas'),
  ]},
  {id:'vestuario',name:'Vestuário',cover:shirts,subs:[
    sub('camisas-basicas','Camisas básicas',[{id:'camisa',name:'Camisa personalizada',image:shirts},...vitrine.camisas]),
    sub('camisas-polo','Camisas polo'),sub('sandalias','Sandálias',[{id:'sandalia',name:'Sandália personalizada',image:sandals}]),
  ]},
  {id:'chaveiros-acessorios',name:'Chaveiros e Acessórios',cover:keychains,subs:[
    sub('aco-inox','Chaveiros de aço inox'),sub('polimero','Chaveiros de polímero'),sub('mdf','Chaveiros MDF'),
    sub('acrilicos','Chaveiros acrílicos'),sub('outros','Outros acessórios',[{id:'chaveiro',name:'Chaveiro personalizado',image:keychains}]),
  ]},
  {id:'quadros-decoracao',name:'Quadros e Decoração',cover:frames,subs:[
    sub('quadros-mdf','Quadros MDF',[{id:'quadro',name:'Quadro decorativo',image:frames}]),
    sub('azulejos','Azulejos personalizados'),sub('almofadas','Almofadas'),
  ]},
  {id:'kits-presentes',name:'Kits e Presentes',cover:mugs,subs:[
    sub('dia-das-maes','Dia das Mães',vitrine.maes),sub('dia-dos-pais','Dia dos Pais'),
    sub('dia-dos-namorados','Dia dos Namorados'),sub('natal-ano-novo','Natal e Ano Novo'),
    sub('kit-personalizado','Kit personalizado'),
  ]},
];

// Compatibilidade com categorias antigas no banco, sem apagar produtos existentes.
export function normalizeCategory(value: string, name = ''): string {
  if (categories.some(c => c.subs.some(s => `${c.id}/${s.id}` === value))) return value;
  const oldCategory = value.toLowerCase(); const n = name.toLowerCase();
  if (oldCategory.includes('porcelana')) return 'canecas/porcelana';
  if (oldCategory.includes('aluminio')) return n.includes('copo') ? 'copos/aluminio' : 'canecas/aluminio';
  if (oldCategory.includes('plastico')) return n.includes('copo') ? 'copos/plastico' : 'canecas/polimero';
  if (oldCategory.includes('copos-termicos')) return 'copos/termicos';
  if (oldCategory.includes('garrafas')) return 'garrafas-squeezes/termicas';
  if (oldCategory.includes('sandalias')) return 'vestuario/sandalias';
  if (oldCategory.includes('camisas')) return 'vestuario/camisas-basicas';
  if (oldCategory.includes('quadros')) return 'quadros-decoracao/quadros-mdf';
  if (oldCategory.includes('chaveiros')) return 'chaveiros-acessorios/outros';
  return value;
}

export const countOf = (c: Category) => c.subs.reduce((a, s) => a + s.products.length, 0);

export const allProducts: Product[] = categories.flatMap((c) => c.subs.flatMap((s) => s.products));

export const productLabel = (p: Product) => (p.code ? `#${p.code} ${p.name}` : p.name);

export function waLink(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}

// Produtos administrados no MySQL são adicionados à vitrine no cliente.
export function useManagedProducts() {
  const [products, setProducts] = React.useState<Product[]>([]);
  React.useEffect(() => {
    let active = true;
    fetch('/api/store/products', { credentials: 'same-origin' })
      .then(r => { if (!r.ok) throw new Error('Catálogo indisponível'); return r.json(); })
      .then(data => { if (active && Array.isArray(data.products)) setProducts(data.products.map((p: any) => ({
        id: `db-${p.id}`, name: String(p.name), description: String(p.description || ''),
        image: String(p.image_path || '/favicon.png'), category: normalizeCategory(String(p.category || ''), String(p.name)),
      }))); })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return products;
}
