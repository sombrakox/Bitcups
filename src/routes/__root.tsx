
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth-session";
import { FavoritesProvider } from "@/lib/favorites";
import { SiteHeader, SiteFooter } from "@/components/SiteHeader";
import { Toaster } from "@/components/ui/sonner";
import { MotionSurface } from "@/components/MotionSurface";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          Página não encontrada
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, {
      boundary: "tanstack_root_error_component",
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Não foi possível carregar esta página
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ocorreu um erro. Tente novamente ou volte à página inicial.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Bitcups — Brindes personalizados",
      },
      {
        name: "description",
        content:
          "Monte seu carrinho e receba um orçamento de brindes personalizados com a Bitcups.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        property: "og:site_name",
        content: "Bitcups",
      },
      {
        property: "og:locale",
        content: "pt_BR",
      },
      {
        property: "og:title",
        content: "Bitcups — Brindes personalizados",
      },
      {
        property: "og:description",
        content:
          "Monte seu carrinho e receba um orçamento de brindes personalizados com a Bitcups.",
      },
      {
        property: "og:url",
        content: "https://bitcups.onrender.com/",
      },
      {
        property: "og:image",
        content: "https://bitcups.onrender.com/bitcups-preview.png?v=5",
      },
      {
        property: "og:image:secure_url",
        content: "https://bitcups.onrender.com/bitcups-preview.png?v=5",
      },
      {
        property: "og:image:type",
        content: "image/png",
      },
      {
        property: "og:image:width",
        content: "1200",
      },
      {
        property: "og:image:height",
        content: "630",
      },
      {
        property: "og:image:alt",
        content: "Bitcups — Brindes personalizados",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
      {
        name: "twitter:title",
        content: "Bitcups — Brindes personalizados",
      },
      {
        name: "twitter:description",
        content:
          "Monte seu carrinho e receba um orçamento de brindes personalizados com a Bitcups.",
      },
      {
        name: "twitter:image",
        content: "https://bitcups.onrender.com/bitcups-preview.png?v=5",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href:
          "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap",
      },
      {
        rel: "icon",
        href: "/favicon.ico?v=5",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        rel: "icon",
        href: "/favicon.png?v=5",
        type: "image/png",
        sizes: "512x512",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png?v=5",
        sizes: "180x180",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <SiteHeader />

          <main>
            <MotionSurface>
              <Outlet />
            </MotionSurface>
          </main>

          <SiteFooter />

          <a
            className="floating-whatsapp"
            href="https://wa.me/5571982602013?text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20Bitcups"
            target="_blank"
            rel="noreferrer"
            aria-label="Fale com a Bitcups pelo WhatsApp"
            title="Fale com a Bitcups pelo WhatsApp"
          >
            <MessageCircle aria-hidden="true" />
            <span className="floating-whatsapp-label">
              Fale conosco
            </span>
          </a>

          <Toaster position="top-center" />
        </FavoritesProvider>
      </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
