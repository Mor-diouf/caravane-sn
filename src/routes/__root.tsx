import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "../components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BusConfigurator } from "@/features/bus-configurator";


function NotFoundComponent() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
  }, []);

  const isTestBus = isClient && typeof window !== "undefined" && window.location.pathname.includes("test-bus");

  if (isTestBus) {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex flex-col text-slate-100">
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>Studio KING-BUS (Test Indépendant) :</strong> Configurez et glissez vos sièges librement.
            </span>
          </div>
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
          >
            ← Retour à l'accueil
          </Link>
        </div>
        <div className="flex-1">
          <BusConfigurator />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "KING-BUS 2.0 — Plateforme Officielle de Réservation" },
      {
        name: "description",
        content:
          "Voyagez avec confort, voyagez avec classe. Réservez votre billet de bus Dakar ⇄ Ziguinchor en quelques clics. Paiement sécurisé Wave, Orange Money et CB.",
      },
      { name: "author", content: "KING-BUS 2.0" },
      { property: "og:site_name", content: "KING-BUS 2.0" },
      { property: "og:title", content: "KING-BUS 2.0 — Voyagez avec confort et classe" },
      {
        property: "og:description",
        content:
          "Départs quotidiens Dakar ⇄ Ziguinchor. Bus climatisés, confort maximal, sécurité assurée et billet électronique immédiat.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
      { property: "og:image:secure_url", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "800" },
      { property: "og:image:height", content: "800" },
      { property: "og:image:alt", content: "Logo Officiel KING-BUS 2.0" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "KING-BUS 2.0 — Voyagez avec confort et classe" },
      {
        name: "twitter:description",
        content:
          "Départs quotidiens Dakar ⇄ Ziguinchor. Bus climatisés, confort maximal, sécurité assurée et billet électronique immédiat.",
      },
      { name: "twitter:image", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "icon", href: "/images/king-bus/logo.jpg", type: "image/jpeg" },
      { rel: "apple-touch-icon", href: "/images/king-bus/logo.jpg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
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

  // Supprime activement le badge Lovable du DOM dès son injection
  useEffect(() => {
    const removeLovableElements = () => {
      const selectors = [
        "#lovable-badge",
        '[id*="lovable-badge"]',
        '[id^="lovable"]',
        '[class*="lovable-badge"]',
        '[data-lovable-badge]',
        'a[href*="lovable.dev"]',
        'a[href*="lovable.app"]',
      ];
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => {
          el.remove();
        });
      });
    };

    removeLovableElements();
    const observer = new MutationObserver(removeLovableElements);
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}


