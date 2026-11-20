import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2, MessageCircle } from "lucide-react";
import { allProducts, useManagedProducts, productLabel, waLink } from "@/lib/catalog";
import { buildCartMessage, useCart } from "@/lib/cart";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho de orçamento — Bitcups" },
      { name: "description", content: "Revise produtos e quantidades e envie seu pedido de orçamento pelo WhatsApp." },
      { property: "og:title", content: "Carrinho — Bitcups" },
      { property: "og:description", content: "Envie seu orçamento pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Carrinho,
});

function Carrinho() {
  const { items, setQty, clear, count } = useCart();
  const managed = useManagedProducts();
  const catalog = useMemo(() => [...allProducts, ...managed], [managed]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [documentType,setDocumentType]=useState<'pf'|'pj'>('pf');
  const [document,setDocument]=useState('');
  const [company,setCompany]=useState('');
  const [zip,setZip]=useState('');
  const [street,setStreet]=useState('');
  const [number,setNumber]=useState('');
  const [complement,setComplement]=useState('');
  const [neighborhood,setNeighborhood]=useState('');
  const [city,setCity]=useState('');
  const [state,setState]=useState('BA');
  const [notes,setNotes]=useState('');
  const [busy, setBusy] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const rows = Object.entries(items)
    .map(([id, q]) => ({ p: catalog.find((x) => x.id === id), q }))
    .filter((r): r is { p: (typeof allProducts)[number]; q: number } => Boolean(r.p));

  async function finishOrder() {
    if (busy) return;
    if (!name.trim() || !/^\+?[0-9 ()-]{8,25}$/.test(phone.trim()) || !privacy) {
      toast.error("Informe nome, telefone e aceite a política de privacidade."); return;
    }
    const digits=document.replace(/\D/g,'');
    if(digits.length!==(documentType==='pj'?14:11)|| !/^\d{5}-?\d{3}$/.test(zip.trim()) || !street.trim() || !number.trim() || !neighborhood.trim() || !city.trim() || !/^[A-Za-z]{2}$/.test(state.trim())){
      toast.error('Preencha CPF/CNPJ e endereço de entrega completo.'); return;
    }
    setBusy(true);
    try {
      const response = await fetch('/api/store/quote', {method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({name:name.trim(),phone:phone.trim(),customerDetails:{documentType,document:digits,company,zip,street,number,complement,neighborhood,city,state,notes},items:rows.map(({p,q})=>({id:p.id,name:productLabel(p),quantity:q}))})});
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível registrar o pedido');
      const message = `${buildCartMessage(items, name)}\nTelefone: ${phone.trim()}\n${documentType==='pj'?'CNPJ':'CPF'}: ${digits}\n${company?'Empresa: '+company+'\n':''}Entrega: ${street}, ${number}${complement?', '+complement:''} - ${neighborhood}, ${city}/${state.toUpperCase()} - CEP ${zip}\n${notes?'Observações: '+notes+'\n':''}Número do pedido: #${result.orderId}\nAguardando confirmação pelo WhatsApp.`;
      const link = waLink(message);
      const opened = window.open(link,'_blank','noopener,noreferrer');
      if (!opened) { window.location.href = link; }
      toast.success(`Pedido #${result.orderId} registrado. Envie a mensagem no WhatsApp para confirmar.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Erro ao registrar pedido'); }
    finally {setBusy(false);}
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 data-reveal="fade-down" className="text-4xl font-extrabold">Carrinho</h1>
      {rows.length === 0 ? (
        <div data-reveal="zoom" className="mt-8 rounded-lg bg-card p-10 text-center shadow-card">
          <p className="text-muted-foreground">Seu carrinho está vazio.</p>
          <Link to="/produtos" className="mt-4 inline-block rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground">Ver produtos</Link>
        </div>
      ) : (
        <>
          <ul data-stagger="70" className="mt-6 space-y-3">
            {rows.map(({ p, q }) => (
              <li key={p.id} className="flex items-center gap-3 rounded-lg bg-card p-3 shadow-card">
                <img src={p.image} alt={p.name} className="h-16 w-16 rounded-md object-cover" />
                <p className="min-w-0 flex-1 text-sm font-semibold">{productLabel(p)}</p>
                <div className="flex items-center rounded-full border">
                  <Button variant="ghost" size="icon" aria-label="Diminuir" className="p-2" onClick={() => setQty(p.id, q - 1)}><Minus className="h-4 w-4" /></Button>
                  <input type="number" min={1} value={q} onChange={(e) => setQty(p.id, Number(e.target.value) || 1)} className="w-12 bg-transparent text-center text-sm font-semibold outline-none" />
                  <Button variant="ghost" size="icon" aria-label="Aumentar" className="p-2" onClick={() => setQty(p.id, q + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
                <Button variant="ghost" size="icon" aria-label="Remover" className="p-2 text-destructive" onClick={() => setQty(p.id, 0)}><Trash2 className="h-4 w-4" /></Button>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-right text-sm text-muted-foreground">{count} itens · <Button variant="link" className="h-auto p-0 underline" onClick={clear}>esvaziar</Button></p>
          <div data-reveal className="mt-6 rounded-lg bg-card p-5 shadow-card">
            <label className="text-sm font-semibold" htmlFor="checkout-name">Seu nome</label>
            <input id="checkout-name" required maxLength={160} value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
            <label className="mt-3 block text-sm font-semibold" htmlFor="checkout-phone">WhatsApp para contato</label>
            <input id="checkout-phone" required type="tel" maxLength={25} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(71) 99999-9999" className="mt-2 w-full rounded-md border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-ring" />
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Tipo de cliente<select className="mt-2 w-full rounded-md border bg-background px-4 py-3" value={documentType} onChange={e=>{setDocumentType(e.target.value as 'pf'|'pj');setDocument('')}}><option value="pf">Pessoa física</option><option value="pj">Pessoa jurídica</option></select></label>
              <label className="block text-sm font-semibold">{documentType==='pj'?'CNPJ':'CPF'}<input required inputMode="numeric" autoComplete="off" maxLength={18} value={document} onChange={e=>setDocument(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3" placeholder={documentType==='pj'?'00.000.000/0000-00':'000.000.000-00'}/></label>
              <label className="block text-sm font-semibold sm:col-span-2">Nome da empresa (opcional)<input maxLength={160} value={company} onChange={e=>setCompany(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
              <label className="block text-sm font-semibold">CEP<input required inputMode="numeric" maxLength={9} value={zip} onChange={e=>setZip(e.target.value)} placeholder="00000-000" className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
              <label className="block text-sm font-semibold">Estado (UF)<input required maxLength={2} value={state} onChange={e=>setState(e.target.value.toUpperCase())} className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
              <label className="block text-sm font-semibold sm:col-span-2">Rua / Avenida<input required maxLength={200} value={street} onChange={e=>setStreet(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
              <label className="block text-sm font-semibold">Número<input required maxLength={20} value={number} onChange={e=>setNumber(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
              <label className="block text-sm font-semibold">Complemento (opcional)<input maxLength={120} value={complement} onChange={e=>setComplement(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
              <label className="block text-sm font-semibold">Bairro<input required maxLength={120} value={neighborhood} onChange={e=>setNeighborhood(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
              <label className="block text-sm font-semibold">Cidade<input required maxLength={120} value={city} onChange={e=>setCity(e.target.value)} className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
              <label className="block text-sm font-semibold sm:col-span-2">Observações da entrega (opcional)<textarea maxLength={1000} value={notes} onChange={e=>setNotes(e.target.value)} rows={3} className="mt-2 w-full rounded-md border bg-background px-4 py-3"/></label>
            </div>
            <label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={privacy} onChange={e=>setPrivacy(e.target.checked)} /> Autorizo o uso dos dados para atendimento deste orçamento, conforme a <Link to="/privacidade" className="underline">Política de Privacidade</Link>.</label>
            <Button type="button" disabled={busy || !privacy} onClick={finishOrder} variant="whatsapp" className="btn-glow mt-4 h-auto w-full whitespace-normal py-4">
              <MessageCircle className="h-5 w-5" /> {busy ? 'Registrando pedido...' : 'Registrar pedido e continuar no WhatsApp'}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">O pedido será registrado como aguardando confirmação. O envio da mensagem pelo WhatsApp deve ser concluído por você.</p>
          </div>
        </>
      )}
    </div>
  );
}
