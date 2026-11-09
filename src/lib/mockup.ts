/**
 * Motor de prévias da arte no produto (canvas 2D, sem dependências).
 *
 * Fluxo: a arte do cliente é posicionada numa "área de impressão" plana (ArtLayout) e
 * depois projetada no produto: caneca = envolta no cilindro, camisa = estampa no peito.
 * Tudo roda no navegador; nenhuma imagem é enviada para servidor.
 */

export type ProductId = "porcelana" | "aluminio" | "camisa";

export interface Swatch { id: string; name: string; color: string }

export interface ProductSpec {
  id: ProductId;
  name: string;
  blurb: string;
  /** Área de impressão em centímetros (medida de referência, confirmada no orçamento). */
  area: { w: number; h: number };
  areaLabel: string;
  swatchLabel: string;
  swatches: Swatch[];
  /** Só canecas: diâmetro em cm. Define quanto da arte fica de frente para quem olha. */
  diameter?: number;
}

export const PRODUCTS: ProductSpec[] = [
  {
    id: "porcelana",
    name: "Caneca de porcelana",
    blurb: "Porcelana branca brilhante, com a arte envolvendo a caneca.",
    area: { w: 20, h: 8.5 },
    areaLabel: "20 × 8,5 cm",
    swatchLabel: "Cor da alça e do interior",
    diameter: 8.1,
    swatches: [
      { id: "branca", name: "Branca", color: "#ffffff" },
      { id: "preta", name: "Preta", color: "#1c1c1f" },
      { id: "azul", name: "Azul", color: "#1f55c4" },
      { id: "vermelha", name: "Vermelha", color: "#cf2b31" },
      { id: "rosa", name: "Rosa", color: "#ee82ad" },
      { id: "amarela", name: "Amarela", color: "#f4c20d" },
      { id: "verde", name: "Verde", color: "#1f9d57" },
    ],
  },
  {
    id: "aluminio",
    name: "Caneca de alumínio",
    blurb: "Acabamento metálico resistente, com a arte impressa no corpo.",
    area: { w: 18, h: 7.5 },
    areaLabel: "18 × 7,5 cm",
    swatchLabel: "Cor do alumínio",
    diameter: 7.5,
    swatches: [
      { id: "prata", name: "Prata", color: "#c4c9cf" },
      { id: "dourado", name: "Dourado", color: "#d4af5a" },
      { id: "preto", name: "Preto", color: "#34363a" },
      { id: "azul", name: "Azul", color: "#2f63b5" },
      { id: "vermelho", name: "Vermelho", color: "#c63a3a" },
    ],
  },
  {
    id: "camisa",
    name: "Camisa",
    blurb: "Camisa de malha, com a estampa no peito.",
    area: { w: 29.7, h: 42 },
    areaLabel: "até 29,7 × 42 cm",
    swatchLabel: "Cor da camisa",
    swatches: [
      { id: "branca", name: "Branca", color: "#f6f6f4" },
      { id: "preta", name: "Preta", color: "#1d1d20" },
      { id: "cinza", name: "Cinza mescla", color: "#9a9da3" },
      { id: "marinho", name: "Azul marinho", color: "#1d2c52" },
      { id: "vermelha", name: "Vermelha", color: "#c42b33" },
      { id: "verde", name: "Verde", color: "#2c7a4b" },
      { id: "amarela", name: "Amarela", color: "#f1c40f" },
    ],
  },
];

export const getProduct = (id: ProductId): ProductSpec => PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0]!;

/* ------------------------------------------------------------------ */
/* Arte e posicionamento                                               */
/* ------------------------------------------------------------------ */

export type ArtSource = HTMLImageElement | HTMLCanvasElement | ImageBitmap;

export interface ArtLayout {
  /** Centro da arte, 0–1 dentro da área de impressão. */
  cx: number;
  cy: number;
  /** Largura da arte como fração da largura da área. */
  width: number;
  /** Graus. */
  rotation: number;
  flip: boolean;
}

export const sourceSize = (src: ArtSource): { w: number; h: number } =>
  src instanceof HTMLImageElement ? { w: src.naturalWidth, h: src.naturalHeight } : { w: src.width, h: src.height };

/** Posição inicial: arte inteira, centralizada, ocupando cerca de 80% da área. */
export function fitLayout(src: ArtSource, product: ProductSpec): ArtLayout {
  const { w, h } = sourceSize(src);
  const ratio = h / Math.max(1, w); // altura/largura da arte
  const areaRatio = product.area.h / product.area.w;
  const width = Math.min(0.8, (0.8 * areaRatio) / Math.max(0.0001, ratio));
  return { cx: 0.5, cy: 0.5, width, rotation: 0, flip: false };
}

/** Tamanho (px) e ângulo da arte dentro de uma área de `aw × ah` px. */
export function artBox(src: ArtSource, layout: ArtLayout, aw: number) {
  const { w, h } = sourceSize(src);
  const bw = layout.width * aw;
  return { w: bw, h: bw * (h / Math.max(1, w)) };
}

export function drawArt(ctx: CanvasRenderingContext2D, src: ArtSource, layout: ArtLayout, aw: number, ah: number) {
  const box = artBox(src, layout, aw);
  ctx.save();
  ctx.translate(layout.cx * aw, layout.cy * ah);
  ctx.rotate((layout.rotation * Math.PI) / 180);
  if (layout.flip) ctx.scale(-1, 1);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, -box.w / 2, -box.h / 2, box.w, box.h);
  ctx.restore();
}

/** Resolução efetiva de impressão em dpi (300 = excelente, abaixo de ~100 fica serrilhado). */
export function effectiveDpi(src: ArtSource, layout: ArtLayout, product: ProductSpec): number {
  const { w } = sourceSize(src);
  const widthCm = layout.width * product.area.w;
  return widthCm > 0 ? w / (widthCm / 2.54) : 0;
}

export type Quality = "excelente" | "boa" | "baixa";
export const qualityOf = (dpi: number): Quality => (dpi >= 180 ? "excelente" : dpi >= 110 ? "boa" : "baixa");

/** Caneca: fração da largura da arte que fica visível de frente (±90°). 1 = tudo visível. */
export function visibleFraction(product: ProductSpec): number {
  if (!product.diameter) return 1;
  const halfSpan = product.area.w / product.diameter; // rad (±)
  return Math.min(1, Math.PI / 2 / halfSpan);
}

const TEXTURE_PX_PER_CM = 40;

/** Renderiza só a arte, em fundo transparente, no tamanho da área de impressão. */
export function renderFlat(src: ArtSource | null, layout: ArtLayout, product: ProductSpec): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(product.area.w * TEXTURE_PX_PER_CM);
  canvas.height = Math.round(product.area.h * TEXTURE_PX_PER_CM);
  const ctx = canvas.getContext("2d");
  if (ctx && src) drawArt(ctx, src, layout, canvas.width, canvas.height);
  return canvas;
}

/* ------------------------------------------------------------------ */
/* Utilidades de cor e desenho                                         */
/* ------------------------------------------------------------------ */

type RGB = readonly [number, number, number];

function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** amt < 0 escurece, amt > 0 clareia (−1…1). */
export function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const mix = (c: number) => Math.round((target - c) * p + c);
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

export const luminance = (hex: string): number => {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
};

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return [c, c.getContext("2d")!];
}

/** Faixa de luz com bordas suaves em todos os lados (reflexo). */
function softStreak(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number, color = "255,255,255") {
  const [c, g] = makeCanvas(w, h);
  const horizontal = g.createLinearGradient(0, 0, w, 0);
  horizontal.addColorStop(0, `rgba(${color},0)`);
  horizontal.addColorStop(0.5, `rgba(${color},${alpha})`);
  horizontal.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = horizontal;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "destination-in";
  const vertical = g.createLinearGradient(0, 0, 0, h);
  vertical.addColorStop(0, "rgba(0,0,0,0)");
  vertical.addColorStop(0.12, "rgba(0,0,0,1)");
  vertical.addColorStop(0.88, "rgba(0,0,0,1)");
  vertical.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = vertical;
  g.fillRect(0, 0, w, h);
  ctx.drawImage(c, x, y);
}

/** Mancha elíptica suave (sombras e dobras de tecido). */
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, rgba: string, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(rx, ry);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, rgba);
  g.addColorStop(1, rgba.replace(/[\d.]+\)$/, "0)"));
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Cenário                                                             */
/* ------------------------------------------------------------------ */

export const PREVIEW_W = 1000;
export const PREVIEW_H = 960;

function drawStage(ctx: CanvasRenderingContext2D, floorY: number) {
  const wall = ctx.createLinearGradient(0, 0, 0, PREVIEW_H);
  wall.addColorStop(0, "#f7f5f1");
  wall.addColorStop(0.7, "#ece8e1");
  wall.addColorStop(1, "#e2ddd4");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

  const floor = ctx.createLinearGradient(0, floorY - 40, 0, PREVIEW_H);
  floor.addColorStop(0, "rgba(120,108,92,0)");
  floor.addColorStop(0.18, "rgba(120,108,92,0.10)");
  floor.addColorStop(1, "rgba(120,108,92,0.20)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, floorY - 40, PREVIEW_W, PREVIEW_H - floorY + 40);

  const vignette = ctx.createRadialGradient(PREVIEW_W / 2, PREVIEW_H * 0.46, PREVIEW_H * 0.35, PREVIEW_W / 2, PREVIEW_H * 0.46, PREVIEW_H * 0.85);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(60,48,30,0.16)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
}

function contactShadow(ctx: CanvasRenderingContext2D, cx: number, y: number, rx: number, ry: number) {
  blob(ctx, cx + 18, y, rx * 1.18, ry * 1.5, 0, "rgba(40,30,20,0.40)");
  blob(ctx, cx, y - 2, rx * 0.98, ry * 0.85, 0, "rgba(20,14,8,0.55)");
}

/* ------------------------------------------------------------------ */
/* Canecas                                                             */
/* ------------------------------------------------------------------ */

interface MugGeo { cx: number; R: number; T: number; B: number; ry: number }

function bodyPath(ctx: CanvasRenderingContext2D, g: MugGeo) {
  ctx.beginPath();
  ctx.moveTo(g.cx - g.R, g.T);
  ctx.lineTo(g.cx - g.R, g.B);
  ctx.ellipse(g.cx, g.B, g.R, g.ry, 0, Math.PI, 0, true);
  ctx.lineTo(g.cx + g.R, g.T);
  ctx.ellipse(g.cx, g.T, g.R, g.ry, 0, 0, Math.PI, false);
  ctx.closePath();
}

/** Projeta a arte plana no cilindro: colunas de 1px, comprimidas perto das bordas. */
function wrapArt(ctx: CanvasRenderingContext2D, flat: CanvasImageSource & { width: number; height: number }, product: ProductSpec, g: MugGeo, areaH: number, opacity: number) {
  const half = product.area.w / (product.diameter ?? 8); // ±rad cobertos pela arte
  const x0 = Math.round(g.cx - g.R);
  const cols = Math.round(g.R * 2);
  const top = g.T + ((g.B - g.T) - areaH) / 2;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.imageSmoothingQuality = "high";
  for (let i = 0; i < cols; i++) {
    const a1 = Math.asin(Math.max(-1, Math.min(1, (i / cols) * 2 - 1)));
    const a2 = Math.asin(Math.max(-1, Math.min(1, ((i + 1) / cols) * 2 - 1)));
    const t1 = (a1 + half) / (2 * half);
    const t2 = (a2 + half) / (2 * half);
    if (t2 <= 0 || t1 >= 1) continue;
    const sx = Math.max(0, t1) * flat.width;
    const sw = Math.max(0.5, (Math.min(1, t2) - Math.max(0, t1)) * flat.width);
    const dy = g.ry * Math.cos((a1 + a2) / 2);
    ctx.drawImage(flat, sx, 0, sw, flat.height, x0 + i, top + dy, 1, areaH);
  }
  ctx.restore();
}

function drawPorcelain(ctx: CanvasRenderingContext2D, product: ProductSpec, color: string, flat: HTMLCanvasElement) {
  const ppc = 72;
  const R = (product.diameter! / 2) * ppc;
  const g: MugGeo = { cx: 410, R, T: 190, B: 190 + 600, ry: R * 0.2 };
  const areaH = product.area.h * ppc;
  const rim = shade(color, color === "#ffffff" ? 0 : 0);

  drawStage(ctx, g.B + g.ry);
  contactShadow(ctx, g.cx + 40, g.B + g.ry - 6, g.R * 1.25, g.ry * 0.7);

  // Alça (atrás do corpo)
  const hx = g.cx + g.R - 14;
  const y1 = g.T + 120;
  const y2 = g.T + 470;
  const handle = new Path2D();
  handle.moveTo(hx, y1);
  handle.bezierCurveTo(hx + 215, y1 - 25, hx + 225, y2 + 25, hx, y2);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 58;
  ctx.strokeStyle = shade(color, color === "#ffffff" ? -0.3 : -0.14);
  ctx.stroke(handle);
  ctx.lineWidth = 46;
  const hGrad = ctx.createLinearGradient(hx, 0, hx + 225, 0);
  hGrad.addColorStop(0, shade(color, color === "#ffffff" ? -0.1 : -0.18));
  hGrad.addColorStop(0.45, color);
  hGrad.addColorStop(1, shade(color, color === "#ffffff" ? -0.14 : -0.22));
  ctx.strokeStyle = hGrad;
  ctx.stroke(handle);
  ctx.lineWidth = 14;
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.translate(-5, -6);
  ctx.stroke(handle);
  ctx.restore();
  // sombra interna da alça sobre o corpo
  blob(ctx, hx - 6, (y1 + y2) / 2, 26, 200, 0, "rgba(0,0,0,0.25)");

  // Corpo
  ctx.save();
  bodyPath(ctx, g);
  ctx.clip();
  const base = ctx.createLinearGradient(g.cx - g.R, 0, g.cx + g.R, 0);
  base.addColorStop(0, "#e2e4e8");
  base.addColorStop(0.12, "#f3f4f6");
  base.addColorStop(0.35, "#ffffff");
  base.addColorStop(0.7, "#fafafb");
  base.addColorStop(1, "#d6d9de");
  ctx.fillStyle = base;
  ctx.fillRect(g.cx - g.R, g.T - g.ry, g.R * 2, g.B - g.T + g.ry * 2);

  wrapArt(ctx, flat, product, g, areaH, 1);

  // Sombreamento cilíndrico por cima da arte
  ctx.globalCompositeOperation = "multiply";
  const cyl = ctx.createLinearGradient(g.cx - g.R, 0, g.cx + g.R, 0);
  cyl.addColorStop(0, "#a9aeb7");
  cyl.addColorStop(0.08, "#d4d8dd");
  cyl.addColorStop(0.24, "#fafafb");
  cyl.addColorStop(0.5, "#ffffff");
  cyl.addColorStop(0.8, "#f0f1f3");
  cyl.addColorStop(0.94, "#cfd2d8");
  cyl.addColorStop(1, "#9ea3ac");
  ctx.fillStyle = cyl;
  ctx.fillRect(g.cx - g.R, g.T - g.ry, g.R * 2, g.B - g.T + g.ry * 2);
  const bottom = ctx.createLinearGradient(0, g.B - 120, 0, g.B + g.ry);
  bottom.addColorStop(0, "#ffffff");
  bottom.addColorStop(1, "#dcdfe3");
  ctx.fillStyle = bottom;
  ctx.fillRect(g.cx - g.R, g.B - 120, g.R * 2, 120 + g.ry);
  ctx.globalCompositeOperation = "source-over";

  // Brilhos (porcelana é muito brilhante)
  softStreak(ctx, g.cx - g.R * 0.62, g.T + 40, g.R * 0.2, g.B - g.T - 60, 0.7);
  softStreak(ctx, g.cx - g.R * 0.3, g.T + 70, g.R * 0.06, g.B - g.T - 140, 0.35);
  softStreak(ctx, g.cx + g.R * 0.66, g.T + 60, g.R * 0.12, g.B - g.T - 110, 0.38);
  ctx.restore();

  // Abertura e borda
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(g.cx, g.T, g.R, g.ry, 0, 0, Math.PI * 2);
  const rimGrad = ctx.createLinearGradient(g.cx - g.R, 0, g.cx + g.R, 0);
  rimGrad.addColorStop(0, "#d3d6db");
  rimGrad.addColorStop(0.35, "#ffffff");
  rimGrad.addColorStop(0.7, "#f4f5f6");
  rimGrad.addColorStop(1, "#c2c6cc");
  ctx.fillStyle = rimGrad;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(90,96,108,0.35)";
  ctx.stroke();
  ctx.restore();

  const inR = g.R - 13;
  const inRy = g.ry * (inR / g.R) - 2;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(g.cx, g.T + 2, inR, inRy, 0, 0, Math.PI * 2);
  ctx.clip();
  const inner = ctx.createLinearGradient(0, g.T - inRy, 0, g.T + inRy + 2);
  inner.addColorStop(0, shade(color === "#ffffff" ? "#b9bdc4" : color, color === "#ffffff" ? 0 : -0.45));
  inner.addColorStop(0.55, shade(color === "#ffffff" ? "#e6e8eb" : color, color === "#ffffff" ? 0 : -0.15));
  inner.addColorStop(1, color === "#ffffff" ? "#f7f8f9" : shade(color, 0.05));
  ctx.fillStyle = inner;
  ctx.fillRect(g.cx - inR, g.T - inRy, inR * 2, inRy * 2 + 6);
  blob(ctx, g.cx, g.T + inRy * 0.75, inR * 0.7, inRy * 0.4, 0, "rgba(255,255,255,0.45)");
  ctx.restore();
  void rim;
}

function drawAluminum(ctx: CanvasRenderingContext2D, product: ProductSpec, color: string, flat: HTMLCanvasElement) {
  const ppc = 76;
  const R = (product.diameter! / 2) * ppc;
  const g: MugGeo = { cx: 430, R, T: 200, B: 200 + 590, ry: R * 0.17 };
  const areaH = product.area.h * ppc;

  drawStage(ctx, g.B + g.ry);
  contactShadow(ctx, g.cx + 30, g.B + g.ry - 6, g.R * 1.15, g.ry * 0.7);

  // Alça de alumínio
  const hx = g.cx + g.R - 10;
  const y1 = g.T + 100;
  const y2 = g.T + 450;
  const handle = new Path2D();
  handle.moveTo(hx, y1);
  handle.bezierCurveTo(hx + 150, y1 - 10, hx + 160, y2 + 10, hx, y2);
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineWidth = 50;
  ctx.strokeStyle = shade(color, -0.55);
  ctx.stroke(handle);
  const hg = ctx.createLinearGradient(hx, 0, hx + 160, 0);
  hg.addColorStop(0, shade(color, -0.15));
  hg.addColorStop(0.5, shade(color, 0.3));
  hg.addColorStop(1, shade(color, -0.3));
  ctx.lineWidth = 40;
  ctx.strokeStyle = hg;
  ctx.stroke(handle);
  ctx.lineWidth = 9;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.translate(-4, -5);
  ctx.stroke(handle);
  ctx.restore();

  // Corpo
  ctx.save();
  bodyPath(ctx, g);
  ctx.clip();
  const x0 = g.cx - g.R;
  const metal = ctx.createLinearGradient(x0, 0, g.cx + g.R, 0);
  const stops: Array<[number, number]> = [[0, -0.42], [0.07, -0.14], [0.2, 0.3], [0.3, 0.1], [0.48, 0.36], [0.62, 0.06], [0.8, -0.1], [0.93, -0.34], [1, -0.5]];
  for (const [o, a] of stops) metal.addColorStop(o, shade(color, a));
  ctx.fillStyle = metal;
  ctx.fillRect(x0, g.T - g.ry, g.R * 2, g.B - g.T + g.ry * 2);

  wrapArt(ctx, flat, product, g, areaH, 0.97);

  // Reflexos metálicos por cima da arte (overlay: cinza 50% não altera)
  ctx.globalCompositeOperation = "overlay";
  const refl = ctx.createLinearGradient(x0, 0, g.cx + g.R, 0);
  const rs: Array<[number, string]> = [[0, "#222"], [0.08, "#555"], [0.22, "#e8e8e8"], [0.36, "#8d8d8d"], [0.5, "#f0f0f0"], [0.68, "#7a7a7a"], [0.86, "#4a4a4a"], [1, "#1c1c1c"]];
  for (const [o, c] of rs) refl.addColorStop(o, c);
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = refl;
  ctx.fillRect(x0, g.T - g.ry, g.R * 2, g.B - g.T + g.ry * 2);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  softStreak(ctx, g.cx - g.R * 0.5, g.T + 30, g.R * 0.12, g.B - g.T - 50, 0.5);
  softStreak(ctx, g.cx + g.R * 0.45, g.T + 40, g.R * 0.08, g.B - g.T - 70, 0.3);

  // Frisos de fabricação (topo e base)
  ctx.lineWidth = 2;
  for (const [yy, a] of [[g.T + 22, 0.28], [g.T + 30, 0.14], [g.B - 26, 0.26], [g.B - 34, 0.12]] as const) {
    ctx.strokeStyle = `rgba(0,0,0,${a})`;
    ctx.beginPath();
    ctx.ellipse(g.cx, yy, g.R, g.ry, 0, 0, Math.PI, false);
    ctx.stroke();
  }
  ctx.restore();

  // Borda enrolada + interior
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(g.cx, g.T, g.R, g.ry, 0, 0, Math.PI * 2);
  const rimG = ctx.createLinearGradient(x0, 0, g.cx + g.R, 0);
  for (const [o, a] of [[0, -0.35], [0.25, 0.35], [0.5, 0.1], [0.75, 0.3], [1, -0.4]] as const) rimG.addColorStop(o, shade(color, a));
  ctx.fillStyle = rimG;
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.stroke();
  ctx.restore();

  const inR = g.R - 11;
  const inRy = g.ry * (inR / g.R) - 1.5;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(g.cx, g.T + 1.5, inR, inRy, 0, 0, Math.PI * 2);
  ctx.clip();
  const inner = ctx.createLinearGradient(0, g.T - inRy, 0, g.T + inRy);
  inner.addColorStop(0, "#26292e");
  inner.addColorStop(0.5, "#4b5057");
  inner.addColorStop(1, "#8c9198");
  ctx.fillStyle = inner;
  ctx.fillRect(g.cx - inR, g.T - inRy, inR * 2, inRy * 2 + 4);
  blob(ctx, g.cx - inR * 0.2, g.T + inRy * 0.8, inR * 0.55, inRy * 0.35, 0, "rgba(255,255,255,0.28)");
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Camisa                                                              */
/* ------------------------------------------------------------------ */

const L = (x: number) => x;
const Rr = (x: number) => 1000 - x;

function shirtPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  // pescoço traseiro → ombro esquerdo
  ctx.moveTo(L(392), 122);
  ctx.quadraticCurveTo(L(300), 138, L(214), 182);
  // manga esquerda (externa)
  ctx.bezierCurveTo(L(160), 210, L(100), 330, L(66), 420);
  // barra da manga
  ctx.quadraticCurveTo(L(124), 452, L(190), 482);
  // axila e lateral
  ctx.bezierCurveTo(L(222), 468, L(250), 450, L(262), 424);
  ctx.bezierCurveTo(L(276), 560, L(262), 740, L(258), 892);
  // barra do corpo
  ctx.quadraticCurveTo(500, 922, Rr(258), 892);
  ctx.bezierCurveTo(Rr(262), 740, Rr(276), 560, Rr(262), 424);
  ctx.bezierCurveTo(Rr(250), 450, Rr(222), 468, Rr(190), 482);
  ctx.quadraticCurveTo(Rr(124), 452, Rr(66), 420);
  ctx.bezierCurveTo(Rr(100), 330, Rr(160), 210, Rr(214), 182);
  ctx.quadraticCurveTo(Rr(300), 138, Rr(392), 122);
  // gola traseira
  ctx.bezierCurveTo(Rr(420), 96, L(420), 96, L(392), 122);
  ctx.closePath();
}

function neckFront(ctx: CanvasRenderingContext2D) {
  ctx.moveTo(392, 122);
  ctx.bezierCurveTo(396, 200, 440, 246, 500, 246);
  ctx.bezierCurveTo(560, 246, 604, 200, 608, 122);
}

let noiseCache: HTMLCanvasElement | null = null;
function fabricNoise(): HTMLCanvasElement {
  if (noiseCache) return noiseCache;
  const [c, g] = makeCanvas(192, 192);
  const img = g.createImageData(192, 192);
  let seed = 1337;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 110 + Math.floor(rnd() * 70);
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  noiseCache = c;
  return c;
}

/** Posição da área de impressão na camisa (px do canvas). */
export function shirtAreaRect(product: ProductSpec) {
  const upc = 9.2; // px por cm
  const w = product.area.w * upc;
  const h = product.area.h * upc;
  return { x: 500 - w / 2, y: 288, w, h };
}

function drawShirt(ctx: CanvasRenderingContext2D, product: ProductSpec, color: string, flat: HTMLCanvasElement) {
  drawStage(ctx, 930);
  contactShadow(ctx, 500, 918, 270, 22);
  const dark = luminance(color) < 0.45;

  ctx.save();
  shirtPath(ctx);
  ctx.clip();

  // Base
  const base = ctx.createLinearGradient(0, 100, 0, 920);
  base.addColorStop(0, shade(color, 0.06));
  base.addColorStop(1, shade(color, -0.09));
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);

  // Estampa (opaca, como impressão DTF)
  const a = shirtAreaRect(product);
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.x, a.y, a.w, a.h);
  ctx.clip();
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = dark ? 0.97 : 0.95;
  ctx.drawImage(flat, a.x, a.y, a.w, a.h);
  ctx.restore();

  // Luz e sombra do tecido (por cima da estampa, para integrar)
  ctx.globalCompositeOperation = "multiply";
  const sides = ctx.createLinearGradient(60, 0, 940, 0);
  sides.addColorStop(0, "rgba(120,120,128,0.0)");
  sides.addColorStop(0.2, "#e4e4e7");
  sides.addColorStop(0.3, "#fbfbfc");
  sides.addColorStop(0.5, "#ffffff");
  sides.addColorStop(0.7, "#fbfbfc");
  sides.addColorStop(0.8, "#e4e4e7");
  sides.addColorStop(1, "rgba(120,120,128,0.0)");
  ctx.fillStyle = sides;
  ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
  // dobras (bem suaves em tecido claro para não parecer sujeira)
  const k = dark ? 1 : 0.3;
  blob(ctx, 330, 520, 40, 150, -0.12, "rgba(40,40,60,0.42)", k);
  blob(ctx, 676, 540, 36, 160, 0.1, "rgba(40,40,60,0.34)", k);
  blob(ctx, 500, 880, 260, 40, 0, "rgba(40,40,60,0.40)", dark ? 1 : 0.45);
  blob(ctx, 420, 760, 70, 120, 0.25, "rgba(40,40,60,0.18)", k);
  blob(ctx, 610, 700, 60, 110, -0.25, "rgba(40,40,60,0.16)", k);
  // sombra das mangas e axilas
  blob(ctx, 268, 440, 70, 60, 0.6, "rgba(30,30,50,0.55)", dark ? 1 : 0.45);
  blob(ctx, 732, 440, 70, 60, -0.6, "rgba(30,30,50,0.55)", dark ? 1 : 0.45);
  blob(ctx, 140, 330, 60, 130, 0.45, "rgba(30,30,50,0.2)", k);
  blob(ctx, 860, 330, 60, 130, -0.45, "rgba(30,30,50,0.2)", k);
  ctx.globalCompositeOperation = "source-over";

  // Realces nas dobras
  blob(ctx, 392, 560, 36, 130, -0.1, dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.7)");
  blob(ctx, 600, 480, 30, 110, 0.12, dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.6)");
  blob(ctx, 170, 300, 34, 90, 0.5, dark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.5)");
  blob(ctx, 830, 300, 34, 90, -0.5, dark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.5)");

  // Textura do tecido
  ctx.globalCompositeOperation = "soft-light";
  ctx.globalAlpha = dark ? 0.55 : 0.4;
  ctx.fillStyle = ctx.createPattern(fabricNoise(), "repeat")!;
  ctx.fillRect(0, 0, PREVIEW_W, PREVIEW_H);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  // Interior da gola (parte de trás da camisa)
  ctx.beginPath();
  ctx.moveTo(392, 122);
  ctx.bezierCurveTo(420, 96, 580, 96, 608, 122);
  ctx.bezierCurveTo(604, 200, 560, 246, 500, 246);
  ctx.bezierCurveTo(440, 246, 396, 200, 392, 122);
  ctx.closePath();
  const inside = ctx.createLinearGradient(0, 96, 0, 246);
  inside.addColorStop(0, shade(color, -0.55));
  inside.addColorStop(1, shade(color, -0.28));
  ctx.fillStyle = inside;
  ctx.fill();
  ctx.restore();

  // Gola canelada
  ctx.save();
  ctx.lineCap = "round";
  ctx.beginPath();
  neckFront(ctx);
  ctx.lineWidth = 26;
  ctx.strokeStyle = shade(color, dark ? 0.1 : -0.1);
  ctx.stroke();
  ctx.lineWidth = 22;
  ctx.strokeStyle = shade(color, dark ? 0.04 : -0.02);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.16)";
  ctx.translate(0, 13);
  ctx.beginPath();
  neckFront(ctx);
  ctx.stroke();
  ctx.restore();

  // Contorno e costuras
  ctx.save();
  shirtPath(ctx);
  ctx.lineWidth = 1.6;
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.22)";
  ctx.stroke();
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = dark ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.14)";
  for (const [x1, y1, x2, y2] of [[124, 454, 190, 484], [Rr(124), 454, Rr(190), 484]] as const) {
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 7);
    ctx.lineTo(x2, y2 - 7);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(264, 884);
  ctx.quadraticCurveTo(500, 912, Rr(264), 884);
  ctx.stroke();
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Fotos reais (base das prévias)                                      */
/* ------------------------------------------------------------------ */

interface PhotoAsset {
  w: number;
  h: number;
  base: ImageData;
  /** Máscara 0–255 do que pode ser recolorido (camisa inteira / alça e interior da caneca). */
  mask: Uint8ClampedArray;
  /** Luminância de cada pixel. */
  lum: Float32Array;
  /** Referência de "branco iluminado" no corpo e na região recolorível. */
  lrefBody: number;
  lrefMask: number;
  tinted: Map<string, ImageData>;
}

const photos: Partial<Record<ProductId, PhotoAsset>> = {};
let photosPromise: Promise<void> | null = null;

export const hasPhoto = (id: ProductId): boolean => !!photos[id];

/** Tamanho (px) da prévia: o da foto quando existe, senão o do desenho. */
export function previewSize(id: ProductId): { w: number; h: number } {
  const a = photos[id];
  return a ? { w: a.w, h: a.h } : { w: PREVIEW_W, h: PREVIEW_H };
}

const loadImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar ${url}`));
    img.src = url;
  });

function pixels(img: HTMLImageElement): ImageData {
  const [, g] = makeCanvas(img.naturalWidth, img.naturalHeight);
  g.drawImage(img, 0, 0);
  return g.getImageData(0, 0, img.naturalWidth, img.naturalHeight);
}

function percentile(values: number[], q: number): number {
  if (!values.length) return 255;
  values.sort((a, b) => a - b);
  return values[Math.min(values.length - 1, Math.floor(values.length * q))]!;
}

async function buildAsset(photoUrl: string, maskUrl: string, body: { x0: number; y0: number; x1: number; y1: number } | null): Promise<PhotoAsset> {
  const [photo, maskImg] = await Promise.all([loadImage(photoUrl), loadImage(maskUrl)]);
  const base = pixels(photo);
  const maskPx = pixels(maskImg);
  const w = base.width;
  const h = base.height;
  const mask = new Uint8ClampedArray(w * h);
  const lum = new Float32Array(w * h);
  const bodyVals: number[] = [];
  const maskVals: number[] = [];
  for (let y = 0, p = 0; y < h; y++) {
    for (let x = 0; x < w; x++, p++) {
      const i = p * 4;
      lum[p] = 0.299 * base.data[i]! + 0.587 * base.data[i + 1]! + 0.114 * base.data[i + 2]!;
      mask[p] = maskPx.data[i]!;
      if ((x + y) % 5 === 0) {
        if (mask[p]! > 200) maskVals.push(lum[p]!);
        if (body && x >= body.x0 && x < body.x1 && y >= body.y0 && y < body.y1) bodyVals.push(lum[p]!);
      }
    }
  }
  const lrefMask = percentile(maskVals, 0.95);
  return { w, h, base, mask, lum, lrefMask, lrefBody: body ? percentile(bodyVals, 0.95) : lrefMask, tinted: new Map() };
}

/** Carrega as fotos de /mockups. Se alguma falhar, o produto continua com o desenho. */
export function loadPhotos(baseUrl = "/mockups/"): Promise<void> {
  photosPromise ??= (async () => {
    const jobs: Array<[ProductId, () => Promise<PhotoAsset>]> = [
      ["porcelana", () => buildAsset(`${baseUrl}caneca-porcelana.jpg`, `${baseUrl}caneca-porcelana-mask.png`, { x0: 262, y0: 300, x1: 586, y1: 650 })],
      ["camisa", () => buildAsset(`${baseUrl}camisa.jpg`, `${baseUrl}camisa-mask.png`, null)],
    ];
    await Promise.all(jobs.map(async ([id, make]) => {
      try { photos[id] = await make(); } catch { /* usa o desenho como reserva */ }
    }));
  })();
  return photosPromise;
}

/** Recolore a região da máscara mantendo as luzes e dobras da foto (cache por cor). */
function recolored(a: PhotoAsset, hex: string, k: number, spec: number): ImageData {
  const key = `${hex}|${k}|${spec}`;
  const cached = a.tinted.get(key);
  if (cached) return cached;
  const [cr, cg, cb] = hexToRgb(hex);
  const out = new ImageData(new Uint8ClampedArray(a.base.data), a.w, a.h);
  const d = out.data;
  for (let p = 0, i = 0; p < a.w * a.h; p++, i += 4) {
    const m = a.mask[p]! / 255;
    if (m < 0.004) continue;
    const ratio = a.lum[p]! / a.lrefMask;
    const f = Math.min(1.12, Math.max(0.15, 1 + (ratio - 1) * k));
    const hi = Math.max(0, ratio - 0.97) * spec * 255;
    d[i] = d[i]! * (1 - m) + Math.min(255, cr * f + hi) * m;
    d[i + 1] = d[i + 1]! * (1 - m) + Math.min(255, cg * f + hi) * m;
    d[i + 2] = d[i + 2]! * (1 - m) + Math.min(255, cb * f + hi) * m;
  }
  a.tinted.set(key, out);
  return out;
}

let scratch: HTMLCanvasElement | null = null;
function scratchCanvas(w: number, h: number): CanvasRenderingContext2D {
  if (!scratch) scratch = document.createElement("canvas");
  if (scratch.width !== w || scratch.height !== h) { scratch.width = w; scratch.height = h; } else scratch.getContext("2d")!.clearRect(0, 0, w, h);
  return scratch.getContext("2d", { willReadFrequently: true })!;
}

/** Aplica a arte sobre a foto usando a luz da própria foto (sombras escurecem, brilhos clareiam). */
function blendArt(out: ImageData, art: ImageData, ox: number, oy: number, a: PhotoAsset, k: number, spec: number) {
  const d = out.data;
  const s = art.data;
  for (let y = 0; y < art.height; y++) {
    for (let x = 0; x < art.width; x++) {
      const si = (y * art.width + x) * 4;
      const al = s[si + 3]! / 255;
      if (al < 0.004) continue;
      const p = (oy + y) * a.w + (ox + x);
      const ratio = a.lum[p]! / a.lrefBody;
      const f = 1 + (ratio - 1) * k;
      const hi = Math.max(0, ratio - 1) * spec * 255;
      const i = p * 4;
      d[i] = d[i]! * (1 - al) + Math.min(255, s[si]! * f + hi) * al;
      d[i + 1] = d[i + 1]! * (1 - al) + Math.min(255, s[si + 1]! * f + hi) * al;
      d[i + 2] = d[i + 2]! * (1 - al) + Math.min(255, s[si + 2]! * f + hi) * al;
    }
  }
}

/** Geometria da caneca da foto (medida nas bordas da imagem). */
const MUG_PHOTO = { cx: 423.75, R: 166.25, topC: 264, topRy: 19, botC: 644, botRy: 48, v0: 0.0525, v1: 0.9475 };

function wrapArtPhoto(ctx: CanvasRenderingContext2D, flat: HTMLCanvasElement, product: ProductSpec) {
  const g = MUG_PHOTO;
  const half = product.area.w / (product.diameter ?? 8);
  const x0 = Math.round(g.cx - g.R);
  const cols = Math.round(g.R * 2);
  ctx.imageSmoothingQuality = "high";
  for (let i = 0; i < cols; i++) {
    const a1 = Math.asin(Math.max(-1, Math.min(1, (i / cols) * 2 - 1)));
    const a2 = Math.asin(Math.max(-1, Math.min(1, ((i + 1) / cols) * 2 - 1)));
    const t1 = (a1 + half) / (2 * half);
    const t2 = (a2 + half) / (2 * half);
    if (t2 <= 0 || t1 >= 1) continue;
    const sx = Math.max(0, t1) * flat.width;
    const sw = Math.max(0.5, (Math.min(1, t2) - Math.max(0, t1)) * flat.width);
    const c = Math.cos((a1 + a2) / 2);
    const yT = g.topC + g.topRy * c;
    const yB = g.botC + g.botRy * c;
    const y0 = yT + g.v0 * (yB - yT);
    const y1 = yT + g.v1 * (yB - yT);
    ctx.drawImage(flat, sx, 0, sw, flat.height, x0 + i, y0, 1, y1 - y0);
  }
}

/** Área de impressão na foto da camisa (px da foto). */
export function shirtPhotoArea(product: ProductSpec) {
  const upc = 11.4; // px por cm (corpo da camisa ≈ 570 px para ~50 cm)
  const w = product.area.w * upc;
  return { x: 615 - w / 2, y: 335, w, h: product.area.h * upc };
}

function drawPhoto(ctx: CanvasRenderingContext2D, id: ProductId, product: ProductSpec, color: string, flat: HTMLCanvasElement) {
  const a = photos[id]!;
  let base = a.base;
  if (id === "porcelana" && color.toLowerCase() !== "#ffffff") base = recolored(a, color, 1.5, 0.9);
  if (id === "camisa" && luminance(color) < 0.93) base = recolored(a, color, luminance(color) < 0.45 ? 2.6 : 1.7, 0);
  const out = new ImageData(new Uint8ClampedArray(base.data), a.w, a.h);

  const layer = scratchCanvas(a.w, a.h);
  let rx: number, ry: number, rw: number, rh: number;
  if (id === "porcelana") {
    wrapArtPhoto(layer, flat, product);
    rx = 255; ry = 270; rw = 340; rh = 440;
  } else {
    const r = shirtPhotoArea(product);
    layer.imageSmoothingQuality = "high";
    layer.drawImage(flat, r.x, r.y, r.w, r.h);
    rx = Math.max(0, Math.floor(r.x)); ry = Math.max(0, Math.floor(r.y));
    rw = Math.min(a.w - rx, Math.ceil(r.w) + 1); rh = Math.min(a.h - ry, Math.ceil(r.h) + 1);
  }
  const art = layer.getImageData(rx, ry, rw, rh);
  blendArt(out, art, rx, ry, a, id === "porcelana" ? 0.55 : 1.7, id === "porcelana" ? 1.1 : 0);
  ctx.putImageData(out, 0, 0);
}

/* ------------------------------------------------------------------ */
/* API                                                                 */
/* ------------------------------------------------------------------ */

/** Desenha a prévia completa a partir da arte plana (tamanho: previewSize). */
export function renderPreview(ctx: CanvasRenderingContext2D, productId: ProductId, color: string, flat: HTMLCanvasElement) {
  const product = getProduct(productId);
  const size = previewSize(productId);
  const canvas = ctx.canvas;
  if (canvas.width !== size.w || canvas.height !== size.h) { canvas.width = size.w; canvas.height = size.h; }
  ctx.clearRect(0, 0, size.w, size.h);
  if (photos[productId]) { drawPhoto(ctx, productId, product, color, flat); return; }
  if (productId === "porcelana") drawPorcelain(ctx, product, color, flat);
  else if (productId === "aluminio") drawAluminum(ctx, product, color, flat);
  else drawShirt(ctx, product, color, flat);
}
