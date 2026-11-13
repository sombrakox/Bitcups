import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "@tanstack/react-router";
import { Coffee, CupSoda, Download, ImagePlus, MessageCircle, Shirt, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { waLink } from "@/lib/catalog";
import {
  PREVIEW_H, PREVIEW_W, PRODUCTS, artBox, drawArt, effectiveDpi, fitLayout, getProduct, luminance, qualityOf,
  renderFlat, renderPreview, visibleFraction,
  type ArtLayout, type ProductId, type ProductSpec,
} from "@/lib/mockup";

const ACCEPTED = /^image\/(png|jpeg|webp)$/;
const MAX_BYTES = 25 * 1024 * 1024;
const ICONS = { porcelana: Coffee, aluminio: CupSoda, camisa: Shirt } as const;

interface Art { img: HTMLImageElement; file: File; url: string }
type Pt = { x: number; y: number };
type Drag =
  | { kind: "move"; start: Pt; cx: number; cy: number }
  | { kind: "scale"; d0: number; w0: number }
  | { kind: "rotate" }
  | { kind: "pinch"; d0: number; a0: number; w0: number; r0: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
const dist = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);

/** Posição (px do canvas) do centro e das alças da caixa de seleção da arte. */
function handlesOf(art: Art, layout: ArtLayout, W: number, H: number, dpr: number) {
  const box = artBox(art.img, layout, W);
  const c = { x: layout.cx * W, y: layout.cy * H };
  const a = (layout.rotation * Math.PI) / 180;
  const at = (lx: number, ly: number): Pt => ({ x: c.x + lx * Math.cos(a) - ly * Math.sin(a), y: c.y + lx * Math.sin(a) + ly * Math.cos(a) });
  return { c, box, scale: at(box.w / 2, box.h / 2), rotate: at(0, -box.h / 2 - 30 * dpr), at };
}

/* ------------------------------------------------------------------ */
/* Editor plano (área de impressão)                                    */
/* ------------------------------------------------------------------ */

function ArtEditor({ product, color, art, layout, setLayout, onFile }: {
  product: ProductSpec; color: string; art: Art | null; layout: ArtLayout;
  setLayout: (fn: (l: ArtLayout) => ArtLayout) => void; onFile: (f: File) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const pointers = useRef(new Map<number, Pt>());
  const drag = useRef<Drag | null>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [snap, setSnap] = useState({ x: false, y: false });
  const [over, setOver] = useState(false);
  const aspect = product.area.w / product.area.h;
  const dpr = typeof window === "undefined" ? 1 : Math.min(2, window.devicePixelRatio || 1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspect]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.w) return;
    const W = Math.round(size.w * dpr);
    const H = Math.round(size.h * dpr);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fundo: camisa mostra a cor da peça; canecas mostram xadrez (transparência).
    if (product.id === "camisa") {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, W, H);
    } else {
      const cell = 14 * dpr;
      for (let y = 0; y * cell < H; y++) for (let x = 0; x * cell < W; x++) {
        ctx.fillStyle = (x + y) % 2 ? "#e6e6e8" : "#f5f5f6";
        ctx.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    if (art) drawArt(ctx, art.img, layout, W, H);

    const dark = product.id === "camisa" && luminance(color) < 0.5;
    const ink = dark ? "rgba(255,255,255,0.7)" : "rgba(20,20,30,0.55)";

    // Caneca: parte que fica atrás (não aparece de frente)
    const vf = visibleFraction(product);
    if (product.diameter && vf < 1) {
      const edge = ((1 - vf) / 2) * W;
      ctx.fillStyle = "rgba(25,25,40,0.14)";
      ctx.fillRect(0, 0, edge, H);
      ctx.fillRect(W - edge, 0, edge, H);
      ctx.strokeStyle = "rgba(25,25,40,0.45)";
      ctx.setLineDash([6 * dpr, 5 * dpr]);
      ctx.lineWidth = dpr;
      for (const x of [edge, W - edge]) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      ctx.setLineDash([]);
      ctx.fillStyle = "rgba(25,25,40,0.6)";
      ctx.font = `600 ${10.5 * dpr}px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("atrás", edge / 2, H - 8 * dpr);
      ctx.fillText("atrás", W - edge / 2, H - 8 * dpr);
      ctx.fillText("visível de frente", W / 2, H - 8 * dpr);
    }

    // Guias de centro
    ctx.setLineDash([4 * dpr, 6 * dpr]);
    ctx.lineWidth = dpr;
    ctx.strokeStyle = dark ? "rgba(255,255,255,0.25)" : "rgba(20,20,30,0.2)";
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
    ctx.setLineDash([]);
    if (snap.x || snap.y) {
      ctx.strokeStyle = "#e11d8f";
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      if (snap.x) { ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); }
      if (snap.y) { ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); }
      ctx.stroke();
    }

    // Caixa de seleção
    if (art) {
      const h = handlesOf(art, layout, W, H, dpr);
      const corners = [h.at(-h.box.w / 2, -h.box.h / 2), h.at(h.box.w / 2, -h.box.h / 2), h.at(h.box.w / 2, h.box.h / 2), h.at(-h.box.w / 2, h.box.h / 2)];
      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 1.5 * dpr;
      ctx.beginPath();
      corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.closePath();
      ctx.stroke();
      const top = h.at(0, -h.box.h / 2);
      ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(h.rotate.x, h.rotate.y); ctx.stroke();
      for (const p of [h.scale, h.rotate]) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8 * dpr, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.stroke();
      }
    }
    void ink;
  }, [size, art, layout, color, product, snap, dpr]);

  const toCanvas = (e: ReactPointerEvent<HTMLCanvasElement>): Pt => {
    const c = e.currentTarget;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const onDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!art) return;
    const canvas = e.currentTarget;
    canvas.setPointerCapture(e.pointerId);
    const p = toCanvas(e);
    pointers.current.set(e.pointerId, p);
    const l = layoutRef.current;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [Pt, Pt];
      drag.current = { kind: "pinch", d0: dist(a, b) || 1, a0: Math.atan2(b.y - a.y, b.x - a.x), w0: l.width, r0: l.rotation };
      return;
    }
    const h = handlesOf(art, l, canvas.width, canvas.height, dpr);
    const hit = 16 * dpr;
    if (dist(p, h.scale) < hit) drag.current = { kind: "scale", d0: dist(p, h.c) || 1, w0: l.width };
    else if (dist(p, h.rotate) < hit) drag.current = { kind: "rotate" };
    else drag.current = { kind: "move", start: p, cx: l.cx, cy: l.cy };
  };

  const onMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const d = drag.current;
    if (!d || !art) return;
    const canvas = e.currentTarget;
    const p = toCanvas(e);
    pointers.current.set(e.pointerId, p);
    const W = canvas.width;
    const H = canvas.height;
    if (d.kind === "move") {
      let cx = clamp(d.cx + (p.x - d.start.x) / W, 0, 1);
      let cy = clamp(d.cy + (p.y - d.start.y) / H, 0, 1);
      const sx = Math.abs(cx - 0.5) < 0.015;
      const sy = Math.abs(cy - 0.5) < 0.015;
      if (sx) cx = 0.5;
      if (sy) cy = 0.5;
      setSnap((s) => (s.x === sx && s.y === sy ? s : { x: sx, y: sy }));
      setLayout((l) => ({ ...l, cx, cy }));
    } else if (d.kind === "scale") {
      const c = { x: layoutRef.current.cx * W, y: layoutRef.current.cy * H };
      setLayout((l) => ({ ...l, width: clamp((d.w0 * dist(p, c)) / d.d0, 0.04, 2) }));
    } else if (d.kind === "rotate") {
      const c = { x: layoutRef.current.cx * W, y: layoutRef.current.cy * H };
      let deg = (Math.atan2(p.y - c.y, p.x - c.x) * 180) / Math.PI + 90;
      if (deg > 180) deg -= 360;
      const near = Math.round(deg / 90) * 90;
      if (Math.abs(deg - near) < 4) deg = near;
      setLayout((l) => ({ ...l, rotation: deg }));
    } else if (d.kind === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()] as [Pt, Pt];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      setLayout((l) => ({ ...l, width: clamp((d.w0 * dist(a, b)) / d.d0, 0.04, 2), rotation: d.r0 + ((angle - d.a0) * 180) / Math.PI }));
    }
  };

  const onUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size === 0) drag.current = null;
    else if (drag.current?.kind === "pinch") drag.current = null;
    setSnap({ x: false, y: false });
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    const f = e.dataTransfer.files[0];
    if (f) onFile(f);
  };

  // Largura máxima para áreas muito altas (camisa) não ocuparem a tela toda.
  const maxW = aspect < 1 ? `${Math.round(440 * aspect)}px` : "100%";

  return (
    <div
      ref={wrapRef}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
      className={`relative mx-auto w-full overflow-hidden rounded-lg border-2 border-dashed bg-muted transition-colors ${over ? "border-accent" : "border-border"}`}
      style={{ aspectRatio: `${product.area.w} / ${product.area.h}`, maxWidth: maxW }}
    >
      <canvas
        ref={canvasRef}
        className={art ? "cursor-grab touch-none active:cursor-grabbing" : ""}
        // Posição fixada no próprio elemento: o canvas nunca participa do fluxo, então o tamanho
        // da caixa depende só do aspect-ratio e o ResizeObserver não entra em loop.
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        aria-label="Área de impressão: arraste a arte para posicionar"
      />
      {!art && (
        <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-2 bg-background/70 p-4 text-center backdrop-blur-[1px] hover:bg-background/50">
          <ImagePlus className="h-9 w-9 text-accent" />
          <span className="font-semibold">Escolha ou solte aqui a sua arte</span>
          <span className="text-xs text-muted-foreground">PNG, JPG ou WEBP · de preferência PNG com fundo transparente</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
        </label>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export function ArtStudio() {
  const [productId, setProductId] = useState<ProductId>("porcelana");
  const [swatches, setSwatches] = useState<Record<ProductId, string>>({ porcelana: "branca", aluminio: "prata", camisa: "branca" });
  const [art, setArt] = useState<Art | null>(null);
  const [layout, setLayoutState] = useState<ArtLayout>({ cx: 0.5, cy: 0.5, width: 0.8, rotation: 0, flip: false });
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");
  const [rights, setRights] = useState(false);
  const [consent, setConsent] = useState(false);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const urlRef = useRef<string | null>(null);

  const product = getProduct(productId);
  const swatch = product.swatches.find((s) => s.id === swatches[productId]) ?? product.swatches[0]!;
  const setLayout = useCallback((fn: (l: ArtLayout) => ArtLayout) => setLayoutState(fn), []);

  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);

  // Prévia ao vivo
  useEffect(() => {
    const canvas = previewRef.current;
    if (!canvas) return;
    const frame = requestAnimationFrame(() => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      renderPreview(ctx, productId, swatch.color, renderFlat(art?.img ?? null, layout, product));
    });
    return () => cancelAnimationFrame(frame);
  }, [productId, swatch.color, art, layout, product]);

  function loadFile(file: File) {
    if (!ACCEPTED.test(file.type) || file.size > MAX_BYTES) {
      toast.error("Use uma imagem PNG, JPG ou WEBP de até 25 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = url;
      setArt({ img, file, url });
      setLayoutState(fitLayout(img, product));
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast.error("Não foi possível abrir essa imagem."); };
    img.src = url;
  }

  function chooseProduct(id: ProductId) {
    setProductId(id);
    if (art) setLayoutState(fitLayout(art.img, getProduct(id)));
  }

  const dpi = art ? effectiveDpi(art.img, layout, product) : 0;
  const quality = art ? qualityOf(dpi) : null;
  const artCm = useMemo(() => {
    if (!art) return null;
    const box = artBox(art.img, layout, product.area.w);
    return { w: box.w, h: box.h };
  }, [art, layout, product]);

  const message = [
    "Olá, Bitcups! Montei uma prévia no estúdio do site e gostaria de um orçamento:",
    `Produto: ${product.name}`,
    `${product.swatchLabel}: ${swatch.name}`,
    `Área de impressão: ${product.areaLabel}`,
    artCm && `Tamanho da arte: ${fmt(artCm.w)} × ${fmt(artCm.h)} cm`,
    name && `Nome: ${name}`,
    qty && `Quantidade: ${qty}`,
    "(Prévia e arte original em anexo)",
  ].filter(Boolean).join("\n");

  function previewFile(): File | null {
    const canvas = previewRef.current;
    if (!canvas) return null;
    const bin = atob(canvas.toDataURL("image/png").split(",")[1] ?? "");
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], `bitcups-previa-${productId}.png`, { type: "image/png" });
  }

  function download(file: File) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function send() {
    const preview = previewFile();
    const files = [preview, art?.file].filter((f): f is File => !!f);
    if (files.length && navigator.canShare?.({ files })) {
      navigator.share({ files, text: message }).catch((e: unknown) => {
        if ((e as Error).name !== "AbortError") window.open(waLink(message), "_blank");
      });
      return;
    }
    if (preview) download(preview);
    window.open(waLink(message), "_blank");
    toast.info("Baixamos a prévia. Anexe a prévia e a sua arte original na conversa do WhatsApp.");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      <div data-reveal="fade-down" className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Estúdio Bitcups</p>
        <h1 className="mt-1 text-3xl font-extrabold md:text-5xl">Veja sua arte no produto</h1>
        <p className="mt-3 text-muted-foreground">Envie a sua imagem, posicione na área de impressão e confira como vai ficar antes de pedir. Sua imagem fica no seu aparelho até você enviar o orçamento.</p>
      </div>

      <div data-stagger="70" role="tablist" aria-label="Produto" className="mt-8 grid grid-cols-3 gap-3 md:max-w-2xl">
        {PRODUCTS.map((p) => {
          const Icon = ICONS[p.id];
          const active = p.id === productId;
          return (
            <button key={p.id} role="tab" aria-selected={active} onClick={() => chooseProduct(p.id)}
              className={`flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-center text-sm font-semibold transition ${active ? "border-accent bg-accent/10 text-foreground shadow-card" : "border-border bg-card text-muted-foreground hover:border-accent/60"}`}>
              <Icon className="h-6 w-6" />
              <span className="leading-tight">{p.name}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        <section data-reveal="zoom" className="lg:sticky lg:top-28 lg:self-start" aria-label="Prévia">
          <div className="relative overflow-hidden rounded-xl border bg-card shadow-card">
            <canvas ref={previewRef} width={PREVIEW_W} height={PREVIEW_H} className="block h-auto w-full" role="img"
              aria-label={`Prévia de ${product.name} com a sua arte`} />
            {!art && (
              <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-sm font-medium text-foreground/60">Envie sua arte para vê-la aqui</p>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">{product.blurb}</p>
            <Button variant="outline" size="sm" disabled={!art} onClick={() => { const f = previewFile(); if (f) download(f); }}>
              <Download /> Baixar prévia
            </Button>
          </div>
        </section>

        <section data-reveal="slide-right" className="space-y-6 rounded-xl border bg-card p-5 shadow-card" aria-label="Personalização">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide">1 · {product.swatchLabel}</h2>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {product.swatches.map((s) => (
                <button key={s.id} aria-label={s.name} title={s.name} aria-pressed={s.id === swatch.id}
                  onClick={() => setSwatches((cur) => ({ ...cur, [productId]: s.id }))}
                  className={`h-9 w-9 rounded-full border-2 transition hover:scale-110 ${s.id === swatch.id ? "border-accent ring-2 ring-accent/40" : "border-border"}`}
                  style={{ backgroundColor: s.color }} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{swatch.name} · cores sujeitas à disponibilidade, confirmamos no orçamento.</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wide">2 · Posicione a arte</h2>
              <span className="text-xs text-muted-foreground">Área: {product.areaLabel}</span>
            </div>
            <div className="mt-3">
              <ArtEditor product={product} color={swatch.color} art={art} layout={layout} setLayout={setLayout} onFile={loadFile} />
            </div>
            {product.diameter && <p className="mt-2 text-xs text-muted-foreground">A faixa clara do centro é o que aparece de frente; o restante dá a volta na caneca.</p>}

            {art && (
              <div className="mt-4 space-y-4">
                <label className="block text-sm font-semibold">Tamanho · {Math.round(layout.width * 100)}% da área
                  <input type="range" min={4} max={200} value={Math.round(layout.width * 100)} aria-label="Tamanho da arte"
                    onChange={(e) => setLayout((l) => ({ ...l, width: Number(e.target.value) / 100 }))} className="mt-1 w-full accent-primary" />
                </label>
                <label className="block text-sm font-semibold">Giro · {Math.round(layout.rotation)}°
                  <input type="range" min={-180} max={180} value={Math.round(layout.rotation)} aria-label="Giro da arte"
                    onChange={(e) => setLayout((l) => ({ ...l, rotation: Number(e.target.value) }))} className="mt-1 w-full accent-primary" />
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => setLayout((l) => ({ ...l, cx: 0.5, cy: 0.5 }))}>Centralizar</Button>
                  <Button variant="outline" size="sm" onClick={() => setLayoutState(fitLayout(art.img, product))}>Ajustar à área</Button>
                  <Button variant="outline" size="sm" onClick={() => setLayout((l) => ({ ...l, width: 1, cx: 0.5 }))}>Largura total</Button>
                  <Button variant="outline" size="sm" onClick={() => setLayout((l) => ({ ...l, flip: !l.flip }))}>Espelhar</Button>
                  <Button variant="outline" size="sm" onClick={() => { setArt(null); if (urlRef.current) { URL.revokeObjectURL(urlRef.current); urlRef.current = null; } }}><Trash2 /> Trocar arte</Button>
                </div>
                {quality && artCm && (
                  <div className={`rounded-md border px-3 py-2 text-sm ${quality === "baixa" ? "border-destructive/50 bg-destructive/10" : "border-accent/40 bg-accent/10"}`} role="status">
                    <p className="font-semibold">Qualidade de impressão: {quality} ({Math.round(dpi)} dpi)</p>
                    <p className="text-xs text-muted-foreground">
                      Arte com {fmt(artCm.w)} × {fmt(artCm.h)} cm.
                      {quality === "baixa" ? " Nesse tamanho a imagem pode ficar serrilhada: reduza o tamanho ou envie um arquivo maior." : " Boa resolução para este tamanho."}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide">3 · Peça seu orçamento</h2>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold">Seu nome
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="block text-sm font-semibold">Quantidade
                <input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 w-full rounded-md border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-ring" /></label>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <span>Declaro ter os direitos ou a autorização de uso das imagens, logotipos e marcas enviados para personalização.</span>
            </label>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
              <span>Concordo com o uso dos meus dados apenas para elaborar o orçamento, conforme a <Link to="/privacidade" className="font-semibold underline">política de privacidade</Link>.</span>
            </label>
            <Button variant="whatsapp" onClick={send} disabled={!art || !rights || !consent} className="btn-glow h-auto w-full whitespace-normal px-6 py-4">
              <MessageCircle className="h-5 w-5" /> Pedir orçamento no WhatsApp
            </Button>
            <p className="text-center text-xs text-muted-foreground">No celular, a prévia e a arte vão juntas. No computador, baixamos a prévia para você anexar na conversa.</p>
            <p className="text-center text-xs text-muted-foreground">Prévia ilustrativa: cores, medidas e posição final são confirmadas pela equipe antes da produção.</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export type { ProductSpec };
