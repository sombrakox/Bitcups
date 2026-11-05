import { describe, expect, it } from "vitest";
import { allProducts, productLabel } from "@/lib/catalog";
import { buildFavoritesMessage } from "@/lib/favorites";

describe("mensagem de favoritos", () => {
  it("lista cada produto favorito para orçamento", () => {
    const [a, b] = allProducts;
    const msg = buildFavoritesMessage([a!.id, b!.id]);
    expect(msg).toContain(`• ${productLabel(a!)}`);
    expect(msg).toContain(`• ${productLabel(b!)}`);
  });
});
