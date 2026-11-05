import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useExpandedPanel } from "@/lib/accordion";

describe("acordeão de categorias", () => {
  it("fecha a categoria aberta quando ela é clicada de novo e reabre na terceira vez", () => {
    const { result } = renderHook(() => useExpandedPanel("canecas-porcelana"));

    expect(result.current.openId).toBe("canecas-porcelana");

    act(() => result.current.togglePanel("canecas-porcelana"));
    expect(result.current.openId).toBeNull();

    act(() => result.current.togglePanel("canecas-porcelana"));
    expect(result.current.openId).toBe("canecas-porcelana");
  });

  it("abre a categoria escolhida e mantém a que a URL selecionou", () => {
    const { result, rerender } = renderHook(
      ({ sel }) => useExpandedPanel(sel),
      { initialProps: { sel: "canecas-porcelana" as string | null } },
    );

    act(() => result.current.openPanel("quadros"));
    expect(result.current.openId).toBe("quadros");

    rerender({ sel: "quadros" });
    expect(result.current.openId).toBe("quadros");
  });
});
