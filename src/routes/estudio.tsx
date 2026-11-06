import { createFileRoute } from "@tanstack/react-router";
import { ArtStudio } from "@/components/ArtStudio";

export const Route = createFileRoute("/estudio")({
  head: () => ({
    meta: [
      { title: "Estúdio — veja sua arte no produto — Bitcups" },
      { name: "description", content: "Envie sua arte e veja como ela fica na caneca de porcelana, na caneca de alumínio e na camisa antes de pedir o orçamento." },
      { property: "og:title", content: "Veja sua arte no produto — Bitcups" },
      { property: "og:description", content: "Prévia da sua arte em canecas e camisas personalizadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArtStudio,
});
