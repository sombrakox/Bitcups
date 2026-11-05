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

export type Product = { id: string; code?: string; name: string; description?: string; image: string };
export type SubTopic = { id: string; name: string; products: Product[] };
export type Category = { id: string; name: string; cover: string; subs: SubTopic[] };

const one = (id: string, name: string, products: Product[]): SubTopic[] => [{ id, name, products }];

export const categories: Category[] = [
  { id: "canecas-porcelana", name: "Canecas de porcelana", cover: mugs, subs: [...vitrine.porcelana, { id: "porcelana-maes", name: "Especial Dia das Mães", products: vitrine.maes }] },
  { id: "aluminio", name: "Alumínio", cover: vitrine.aluminio[0]?.image ?? mugs, subs: one("aluminio-todos", "Canecas e copos de alumínio", vitrine.aluminio) },
  { id: "plastico", name: "Polímero e plástico", cover: polymer, subs: one("plastico-todos", "Canecas e copos de polímero", [
    { id: "caneca-polimero", name: "Caneca de polímero", description: "Leve e resistente, com cores vibrantes.", image: polymer },
    ...vitrine.plastico,
  ]) },
  { id: "copos-termicos", name: "Copos térmicos", cover: cups, subs: one("copos-todos", "Copos térmicos", [
    { id: "copo-termico", name: "Copo térmico personalizado", description: "Variedade de modelos para todas as ocasiões.", image: cups },
    ...vitrine.copos,
  ]) },
  { id: "garrafas-termicas", name: "Garrafas térmicas", cover: bottles, subs: one("garrafas-todos", "Garrafas térmicas", [
    { id: "garrafa-termica", name: "Garrafa térmica personalizada", description: "Mantém sua bebida na temperatura ideal.", image: bottles },
  ]) },
  { id: "sandalias", name: "Sandálias", cover: sandals, subs: one("sandalias-todos", "Sandálias", [
    { id: "sandalia", name: "Sandália personalizada", description: "Conforto e estilo com sua marca ou arte estampada.", image: sandals },
  ]) },
  { id: "camisas", name: "Camisas", cover: shirts, subs: one("camisas-todos", "Camisas", [
    { id: "camisa", name: "Camisa personalizada", description: "Para eventos, empresas e uso pessoal.", image: shirts },
    ...vitrine.camisas,
  ]) },
  { id: "quadros", name: "Quadros", cover: frames, subs: one("quadros-todos", "Quadros", [
    { id: "quadro", name: "Quadro decorativo", description: "Diversos materiais, com estilos e artes únicas.", image: frames },
  ]) },
  { id: "chaveiros", name: "Chaveiros", cover: keychains, subs: one("chaveiros-todos", "Chaveiros", [
    { id: "chaveiro", name: "Chaveiro personalizado", description: "Formatos variados, ideais para lembranças.", image: keychains },
  ]) },
];

export const countOf = (c: Category) => c.subs.reduce((a, s) => a + s.products.length, 0);

export const allProducts: Product[] = categories.flatMap((c) => c.subs.flatMap((s) => s.products));

export const productLabel = (p: Product) => (p.code ? `#${p.code} ${p.name}` : p.name);

export function waLink(text: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
}
