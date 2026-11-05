import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Upload, ShoppingCart, ArrowUpRight, Crown, Phone, Mail, MapPin, Clock, Instagram, Facebook, MessageCircle, ExternalLink } from "lucide-react";
import hero from "@/assets/hero-background.jpg";
import heroLogo from "@/assets/logo-bitcups-hero.png";
import { categories } from "@/lib/catalog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bitcups — Brindes personalizados em Salvador" },
      { name: "description", content: "Canecas, copos, camisas, quadros e chaveiros personalizados. Monte seu orçamento e envie pelo WhatsApp." },
      { property: "og:title", content: "Bitcups — Brindes personalizados" },
      { property: "og:description", content: "Monte seu carrinho e receba orçamento pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="relative overflow-hidden bg-premium">
        <img src={hero} alt="Canecas, copos térmicos, garrafas, camisas e sandálias personalizados Bitcups" className="hero-photo absolute inset-0 h-full w-full object-cover object-right" />
        <div className="absolute inset-0 bg-hero" />
        <div className="bitcups-hero-aura" aria-hidden="true" />
        <div className="bitcups-hero-orbit bitcups-hero-orbit-one" aria-hidden="true" />
        <div className="bitcups-hero-orbit bitcups-hero-orbit-two" aria-hidden="true" />
        <div className="bitcups-hero-spark bitcups-hero-spark-one" aria-hidden="true" />
        <div className="bitcups-hero-spark bitcups-hero-spark-two" aria-hidden="true" />
        <div className="hero-copy relative mx-auto max-w-7xl px-5 py-16 text-hero-foreground md:px-8 md:py-20">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase text-accent"><span className="editorial-line" />Personalizados em Salvador</p>
          <h1 className="mt-6">
            <img src={heroLogo} alt="Bitcups" className="h-auto w-64 drop-shadow-2xl md:w-96" />
          </h1>
          <p className="mt-6 max-w-sm font-display text-2xl font-semibold leading-snug md:text-3xl">Sua ideia. Sua marca.<br />Um presente único.</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-hero-muted">
            Canecas, térmicos, camisas e muito mais. Personalizados para marcar momentos e transformar ideias em lembranças.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="premium" className="h-12 px-6"><Link to="/produtos">
              Ver vitrine <ArrowRight className="h-4 w-4" />
            </Link></Button>
            <Button asChild variant="hero" className="h-12 px-6"><Link to="/projeto">Enviar meu projeto <Upload /></Link></Button>
          </div>
        </div>
      </section>

      <section data-reveal className="bitcups-collections relative mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase text-muted-foreground">Feitos para você</p><h2 className="mt-2 text-3xl font-bold md:text-4xl">Explore as coleções</h2></div>
          <Button asChild variant="link" className="px-0"><Link to="/produtos">Ver todos os produtos <ArrowUpRight /></Link></Button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/produtos"
              search={{ cat: c.id }}
              className="category-tile group overflow-hidden rounded-lg border bg-card"
            >
              <img src={c.cover} alt={c.name} loading="lazy" className="aspect-square w-full object-cover transition group-hover:scale-105" />
              <div className="flex items-center justify-between gap-2 p-3 md:p-4"><p className="text-sm font-semibold">{c.name}</p><ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" /></div>
            </Link>
          ))}
        </div>
      </section>

      <section data-reveal className="bitcups-services relative overflow-hidden border-y bg-secondary">
       <div className="mx-auto grid max-w-7xl md:grid-cols-2">
        <Link to="/carrinho" className="group px-5 py-10 transition-colors hover:bg-muted md:px-8 md:py-14">
          <ShoppingCart className="h-8 w-8 text-accent" />
          <h3 className="mt-4 text-2xl font-bold">Monte seu orçamento</h3>
           <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">Escolha os produtos que combinam com você e solicite seu orçamento.</p>
           <ArrowRight className="mt-6 h-5 w-5 transition-transform group-hover:translate-x-2" />
        </Link>
        <Link to="/projeto" className="group border-t px-5 py-10 transition-colors hover:bg-muted md:border-l md:border-t-0 md:px-8 md:py-14">
          <Upload className="h-8 w-8" />
          <h3 className="mt-4 text-2xl font-bold">Tem uma arte pronta?</h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">Sua criação merece sair do papel. Envie a sua arte e vamos conversar.</p>
          <ArrowRight className="mt-6 h-5 w-5 transition-transform group-hover:translate-x-2" />
        </Link>
       </div>
      </section>

      <section data-reveal className="bitcups-story relative mx-auto max-w-3xl px-5 pb-2 pt-16 text-center md:pt-20">
        <Crown className="mx-auto h-9 w-9 text-muted-foreground" strokeWidth={1.25} />
        <p className="mt-5 text-xs font-semibold uppercase text-muted-foreground">Nossa essência</p>
        <h2 className="mt-3 text-3xl font-bold md:text-4xl">Cada detalhe tem uma história.</h2>
        <p className="mt-5 leading-relaxed text-muted-foreground">
          Nascemos inspirados no pixel art: pequenos fragmentos que se unem para formar algo completo. “Bit” é o fragmento, “Cups” é o produto, e a coroa quebrada simboliza a reconstrução de um novo caminho. Hoje operamos com mentalidade de fábrica, processos definidos e foco total em qualidade.
        </p>
      </section>

      <section data-reveal className="bitcups-instagram relative isolate overflow-hidden px-5 py-16 text-center text-white md:py-24" aria-labelledby="instagram-heading">
        <div className="bitcups-instagram-glow" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Instagram className="mx-auto h-11 w-11" aria-hidden="true" />
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-white/80">Novidades e inspirações</p>
          <h2 id="instagram-heading" className="mt-3 text-3xl font-extrabold md:text-5xl">Sua próxima ideia começa aqui.</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">Acompanhe nossas criações, novidades e produtos personalizados no Instagram.</p>
          <a className="instagram-follow mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-white px-7 py-3 font-bold text-slate-900 shadow-xl" href="https://instagram.com/debitcups" target="_blank" rel="noopener noreferrer"><Instagram className="h-5 w-5" /> Seguir @debitcups <ArrowUpRight className="h-4 w-4" /></a>
        </div>
      </section>

      <section id="contato" data-reveal className="bitcups-contact-animated contact-section mx-auto max-w-7xl scroll-mt-28 px-5 py-16 md:px-8 md:py-20">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="inline-flex rounded-full bg-accent/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-foreground">Fale com a Bitcups</p>
          <h2 className="mt-4 text-3xl font-bold md:text-5xl">Vamos tirar sua ideia <span className="text-orange-500">do papel?</span></h2>
          <p className="mt-4 text-muted-foreground">Solicite um orçamento ou tire suas dúvidas. Estamos prontos para atender você.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            <a className="contact-card group" href="tel:+5571982602013"><span className="contact-icon"><Phone /></span><span><small>Telefone / WhatsApp</small><strong>(71) 98260-2013</strong></span><ExternalLink className="contact-arrow" /></a>
            <a className="contact-card group" href="mailto:debitcups@gmail.com"><span className="contact-icon"><Mail /></span><span><small>E-mail</small><strong>debitcups@gmail.com</strong></span><ExternalLink className="contact-arrow" /></a>
            <a className="contact-card group" href="https://www.google.com/maps/search/?api=1&query=40310-595%2C+Caixa+D%27Agua%2C+Salvador%2C+BA" target="_blank" rel="noreferrer"><span className="contact-icon"><MapPin /></span><span><small>Endereço</small><strong>Caixa d’Água, Salvador – BA<br/>CEP 40310-595</strong></span><ExternalLink className="contact-arrow" /></a>
            <div className="contact-card"><span className="contact-icon"><Clock /></span><span><small>Horário de funcionamento</small><strong>Seg–Sex: 7h30 às 17h30<br/>Sáb: 7h30 às 12h</strong></span></div>
            <div className="contact-social sm:col-span-2">
              <h3 className="font-display text-lg font-bold">Acompanhe nossas redes</h3>
              <div className="mt-4 flex flex-wrap gap-3">
                <a className="social-chip" href="https://instagram.com/debitcups" target="_blank" rel="noreferrer"><Instagram /> Instagram <span>@debitcups</span></a>
                <a className="social-chip" href="https://facebook.com/Bitcups" target="_blank" rel="noreferrer"><Facebook /> Facebook <span>Bitcups</span></a>
              </div>
            </div>
            <a className="contact-whatsapp sm:col-span-2" href="https://wa.me/5571982602013?text=Olá%2C%20vim%20pelo%20site%20da%20Bitcups%20e%20gostaria%20de%20um%20orçamento." target="_blank" rel="noreferrer"><MessageCircle /> <span><strong>Chamar no WhatsApp</strong><small>Converse com nossa equipe e solicite seu orçamento</small></span><ArrowRight className="ml-auto" /></a>
          </div>
          <div className="contact-map-wrap">
            <iframe title="Localização da Bitcups no Google Maps" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://maps.google.com/maps?q=40310-595%2C%20Caixa%20D%27Agua%2C%20Salvador%2C%20BA&t=&z=15&ie=UTF8&iwloc=&output=embed" />
            <a className="map-open" href="https://www.google.com/maps/search/?api=1&query=40310-595%2C+Caixa+D%27Agua%2C+Salvador%2C+BA" target="_blank" rel="noreferrer"><MapPin /> Abrir no Google Maps <ExternalLink /></a>
          </div>
        </div>
      </section>

    </>
  );
}
