import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade e termos de uso — Bitcups" },
      { name: "description", content: "Como a Bitcups trata seus dados (LGPD) e as regras sobre artes e imagens enviadas para personalização." },
      { property: "og:title", content: "Privacidade e termos — Bitcups" },
      { property: "og:description", content: "Transparência no uso dos seus dados e das suas artes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Privacidade,
});

function Privacidade() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-12 leading-relaxed">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Transparência</p>
      <h1 className="mt-1 text-4xl font-extrabold">Privacidade e termos de uso</h1>

      <h2 className="mt-10 text-xl font-bold">1. Quais dados usamos</h2>
      <p className="mt-2 text-muted-foreground">Nome, produtos escolhidos, quantidades, descrição do projeto e as imagens que você decidir enviar. Esses dados só saem do seu aparelho quando você toca em enviar, indo diretamente para o WhatsApp oficial da Bitcups.</p>

      <h2 className="mt-8 text-xl font-bold">2. Para que usamos</h2>
      <p className="mt-2 text-muted-foreground">Exclusivamente para elaborar seu orçamento, produzir o pedido e falar com você sobre ele (LGPD, art. 7º, V). Não vendemos nem compartilhamos seus dados com terceiros para publicidade.</p>

      <h2 className="mt-8 text-xl font-bold">3. Armazenamento no seu aparelho</h2>
      <p className="mt-2 text-muted-foreground">O carrinho e os favoritos ficam guardados apenas no seu navegador para você não perder a seleção. Você pode apagá-los a qualquer momento limpando a lista ou os dados do navegador.</p>

      <h2 className="mt-8 text-xl font-bold">4. Seus direitos</h2>
      <p className="mt-2 text-muted-foreground">Você pode pedir acesso, correção ou exclusão dos seus dados e das imagens enviadas pelo e-mail debitcups@gmail.com ou pelo WhatsApp (71) 98260-2013.</p>

      <h2 className="mt-8 text-xl font-bold">5. Artes e direitos autorais</h2>
      <p className="mt-2 text-muted-foreground">Ao enviar logotipos, fotos, personagens ou marcas, você declara ter a titularidade ou autorização de uso desse material e assume a responsabilidade por ele. A Bitcups pode recusar artes que violem direitos de terceiros. As artes da vitrine pertencem à Bitcups ou a seus respectivos titulares e não podem ser reproduzidas sem autorização.</p>
    </article>
  );
}
