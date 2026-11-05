import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ImagePlus, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { categories, waLink } from "@/lib/catalog";

export const Route = createFileRoute("/projeto")({
  head: () => ({
    meta: [
      { title: "Enviar projeto — Bitcups" },
      { name: "description", content: "Anexe a foto da sua arte ou ideia e envie direto para o WhatsApp da Bitcups." },
      { property: "og:title", content: "Envie seu projeto — Bitcups" },
      { property: "og:description", content: "Mande sua arte e receba um orçamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Projeto,
});

function Projeto() {
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [product, setProduct] = useState("");
  const [qty, setQty] = useState("");
  const [desc, setDesc] = useState("");
  const [rights, setRights] = useState(false);
  const [consent, setConsent] = useState(false);

  const message = [
    "Olá, Bitcups! Quero enviar um projeto:",
    name && `Nome: ${name}`,
    product && `Produto: ${product}`,
    qty && `Quantidade: ${qty}`,
    desc && `Detalhes: ${desc}`,
    files.length ? `(${files.length} foto(s) do projeto em anexo)` : "",
  ].filter(Boolean).join("\n");

  async function send() {
    if (files.length && typeof navigator !== "undefined" && navigator.canShare?.({ files })) {
      try {
        await navigator.share({ files, text: message });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
      }
    }
    window.open(waLink(message), "_blank");
    if (files.length) toast.info("Anexe a foto na conversa do WhatsApp que abriu.");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div data-reveal="fade-down">
        <h1 className="text-4xl font-extrabold">Enviar projeto</h1>
        <p className="mt-2 text-muted-foreground">Tem uma foto ou arte? Anexe aqui e envie direto para nosso WhatsApp.</p>
      </div>

      <div data-reveal="zoom" className="mt-8 space-y-4 rounded-lg bg-card p-5 shadow-card">
        <label className="project-upload flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-8 text-center text-muted-foreground hover:border-accent">
          <ImagePlus className="h-8 w-8" />
          <span className="font-semibold text-foreground">Toque para anexar fotos</span>
          <span className="text-xs">JPG, PNG ou PDF</span>
          <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              const ok = picked.filter((f) => /^(image\/(jpeg|png|webp)|application\/pdf)$/.test(f.type) && f.size <= 25 * 1024 * 1024);
              if (ok.length < picked.length) toast.error("Alguns arquivos foram ignorados: use JPG, PNG, WEBP ou PDF de até 25 MB.");
              setFiles([...files, ...ok].slice(0, 10));
            }} />
        </label>
        {files.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {files.map((f, i) => (
              <div key={i} className="relative">
                {f.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(f)} alt={f.name} className="aspect-square w-full rounded-lg object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center rounded-lg bg-muted p-2 text-xs">{f.name}</div>
                )}
                <Button variant="default" size="icon" aria-label="Remover" onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 h-6 w-6 rounded-full p-1"><X className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        )}
        <Field label="Seu nome"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Produto">
            <select value={product} onChange={(e) => setProduct(e.target.value)} className={inputCls}>
              <option value="">Selecione</option>
              {categories.map((c) => <option key={c.id}>{c.name}</option>)}
              <option>Outro</option>
            </select>
          </Field>
          <Field label="Quantidade"><input type="number" min={1} value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Descreva sua ideia"><textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} className={inputCls} /></Field>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
          <span>Declaro ter os direitos ou a autorização de uso das imagens, logotipos e marcas enviados para personalização.</span>
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-primary" />
          <span>Concordo com o uso dos meus dados apenas para elaborar o orçamento, conforme a <Link to="/privacidade" className="font-semibold underline">política de privacidade</Link>.</span>
        </label>
        <Button variant="whatsapp" onClick={send} disabled={!rights || !consent} className="btn-glow h-auto w-full whitespace-normal px-6 py-4">
          <MessageCircle className="h-5 w-5" /> Enviar para o WhatsApp
        </Button>
        <p className="text-center text-xs text-muted-foreground">No celular, as fotos vão junto. No computador, anexe a foto na conversa que abrir.</p>
      </div>
    </div>
  );
}

const inputCls = "mt-1 w-full rounded-md border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold">{label}{children}</label>;
}
