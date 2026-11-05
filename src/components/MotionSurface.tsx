import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

/**
 * Progressive, lightweight motion layer. Uses native IntersectionObserver/CSS
 * instead of a runtime animation dependency, keeping the catalog fast.
 */
export function MotionSurface({ children }: { children: ReactNode }) {
  const path = useLocation({ select: (location) => location.pathname });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const surface = ref.current;
    if (!surface) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const selectors = [
      "[data-reveal]",
      ".product-card",
      ".category-tile",
      ".contact-card",
      ".contact-social",
      ".contact-map-wrap",
      ".project-upload",
      ".portfolio-item",
      ".photo-card",
      ".feature-card",
      ".benefit-card",
    ].join(",");

    const targets = Array.from(surface.querySelectorAll<HTMLElement>(selectors));
    const groups = new Map<Element, HTMLElement[]>();

    targets.forEach((element) => {
      // Do not overwrite a custom reveal delay set by the page.
      if (!element.style.getPropertyValue("--reveal-delay")) {
        const parent = element.closest(".product-grid, .grid, .category-grid, .contact-grid");
        if (parent) {
          const siblings = groups.get(parent) ?? [];
          siblings.push(element);
          groups.set(parent, siblings);
        } else {
          element.style.setProperty("--reveal-delay", "0ms");
        }
      }
    });

    groups.forEach((items) => {
      items.forEach((element, index) => {
        if (!element.style.getPropertyValue("--reveal-delay")) {
          element.style.setProperty("--reveal-delay", `${Math.min(index, 7) * 65}ms`);
        }
      });
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((element) => element.setAttribute("data-motion", "visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.setAttribute("data-motion", "visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -4% 0px" });

    const register = (element: HTMLElement) => {
      if (element.dataset.motion === "visible" || element.dataset.motion === "pending") return;
      if (element.getBoundingClientRect().top <= window.innerHeight * 0.88) {
        element.setAttribute("data-motion", "visible");
      } else {
        element.setAttribute("data-motion", "pending");
        observer.observe(element);
      }
    };
    targets.forEach(register);
    // Product filtering and pagination insert cards after initial mount.
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches(selectors)) register(node);
          node.querySelectorAll<HTMLElement>(selectors).forEach(register);
        });
      }
    });
    mutationObserver.observe(surface, { childList: true, subtree: true });
    return () => { observer.disconnect(); mutationObserver.disconnect(); };
  }, [path]);

  useEffect(() => {
    const surface = ref.current;
    const updateProgress = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      doc.style.setProperty("--scroll-progress", `${progress * 100}%`);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !surface) return;
      const hero = surface.querySelector<HTMLElement>(".hero-photo");
      if (hero) {
        const rect = hero.getBoundingClientRect();
        const progressY = Math.max(-1, Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height)));
        hero.style.setProperty("--hero-scroll-y", `${progressY * 18}px`);
      }
    };

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [path]);

  useEffect(() => {
    const surface = ref.current;
    if (!surface || window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.matchMedia("(hover: none)").matches) return;
    const hero = surface.querySelector<HTMLElement>(".bg-premium");
    if (!hero) return;

    let frame = 0;
    const onMove = (event: PointerEvent) => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 4;
        hero.style.setProperty("--hero-pointer-x", `${x}px`);
        hero.style.setProperty("--hero-pointer-y", `${y}px`);
      });
    };
    const reset = () => {
      hero.style.setProperty("--hero-pointer-x", "0px");
      hero.style.setProperty("--hero-pointer-y", "0px");
    };

    hero.addEventListener("pointermove", onMove, { passive: true });
    hero.addEventListener("pointerleave", reset);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", reset);
    };
  }, [path]);

  return <div ref={ref} key={path} className="page-transition">{children}</div>;
}
