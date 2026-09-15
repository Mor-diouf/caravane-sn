import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import {
  Armchair,
  Bell,
  Briefcase,
  Bus,
  CheckCircle2,
  ChevronRight,
  Clock,
  LogIn,
  MapPin,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Users,
  Wifi,
} from "lucide-react";
import { CaravanCard } from "@/components/CaravanCard";
import { BottomNav } from "@/components/BottomNav";
import { BusConfigurator } from "@/features/bus-configurator";
import {
  caravansQuery,
  profileQuery,
  universitiesQuery,
} from "@/lib/student-queries";
import { accessQuery } from "@/lib/dash-queries";
import { useStudentFavorites } from "@/hooks/use-student-favorites";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(caravansQuery),
      context.queryClient.ensureQueryData(universitiesQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "KING-BUS 2.0 — Plateforme Officielle de Réservation" },
      {
        name: "description",
        content:
          "Voyagez avec confort, voyagez avec classe. Réservez votre billet de bus Dakar ⇄ Ziguinchor en quelques clics. Paiement sécurisé Wave, Orange Money et CB. Assistance WhatsApp : 78 188 01 02.",
      },
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
  }),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <p className="text-sm text-muted-foreground">
        Les départs King-Bus n'ont pas pu être chargés. Réessayez dans un instant.
      </p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <p className="text-sm text-muted-foreground">Page introuvable.</p>
    </div>
  ),
  component: Index,
});

function Index() {
  const { data: caravanes } = useSuspenseQuery(caravansQuery);
  const { user } = useAuth();
  const { data: profile } = useQuery({
    ...profileQuery,
    enabled: !!user,
  });
  const { data: access } = useQuery({
    ...accessQuery(),
    enabled: !!user,
  });

  const canAccessKingBus = Boolean(
    access?.isAdmin || access?.isOrganizer || access?.roles?.includes("organizer")
  );

  const [selectedRoute, setSelectedRoute] = useState<string>("all");
  const [query, setQuery] = useState("");
  const { favorites, toggle } = useStudentFavorites();
  const [showBusStudio, setShowBusStudio] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("studio") === "true";
    }
    return false;
  });

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = caravanes.filter((c) => {
      let matchRoute = true;
      if (selectedRoute === "dkr-zig") {
        matchRoute = c.from.toLowerCase().includes("dakar") && c.to.toLowerCase().includes("ziguinchor");
      } else if (selectedRoute === "zig-dkr") {
        matchRoute = c.from.toLowerCase().includes("ziguinchor") && c.to.toLowerCase().includes("dakar");
      } else if (selectedRoute === "vip") {
        matchRoute = c.time.includes("20:") || c.about.toLowerCase().includes("vip") || c.id.includes("nuit");
      } else if (selectedRoute === "cap") {
        matchRoute = c.to.toLowerCase().includes("cap");
      }

      const matchQuery =
        !q ||
        `${c.from} ${c.to} ${c.pickup} ${c.dropoff} ${c.organizer} ${c.date} ${c.time}`.toLowerCase().includes(q);

      return matchRoute && matchQuery;
    });

    return filtered.sort((a, b) => {
      const timeA = `${a.date} ${a.time || "00:00"}`;
      const timeB = `${b.date} ${b.time || "00:00"}`;
      return timeA.localeCompare(timeB);
    });
  }, [selectedRoute, query, caravanes]);

  if (showBusStudio) {
    return (
      <div className="min-h-screen bg-[#0b0d12] flex flex-col">
        {/* Barre de retour et mode test */}
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-300 sticky top-0 z-50 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>Mode Studio KING-BUS Actif :</strong> Configurez visuellement votre bus.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowBusStudio(false)}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors cursor-pointer"
          >
            ← Fermer le Studio (Retour au site)
          </button>
        </div>
        <div className="flex-1">
          <BusConfigurator />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground selection:bg-primary selection:text-primary-foreground">

      {/* Hero Header Section */}
      <header className="relative overflow-hidden bg-gradient-to-b from-[#090d16] via-[#0f172a] to-[#0a0f1d] px-5 pb-16 pt-6 text-white shadow-2xl">
        {/* Background glow effects */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full bg-amber-500/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-5xl">
          {/* Top Bar: Logo & User Status */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img
                src="/images/king-bus/logo.jpg"
                alt="Logo KING-BUS 2.0"
                className="size-12 shrink-0 rounded-2xl object-cover shadow-lg border border-primary/40 bg-white"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                    KING-BUS <span className="text-primary text-xs font-extrabold px-1.5 py-0.5 rounded bg-primary/20 border border-primary/30">2.0</span>
                  </h1>
                </div>
                <p className="text-[11px] font-medium tracking-wide text-white/70">
                  Confort et Sécurité • Dakar ⇄ Ziguinchor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="https://wa.me/221781880102?text=Bonjour%20King-Bus,%20je%20souhaite%20des%20informations"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
              >
                <Phone className="size-3.5" /> 78 188 01 02
              </a>

              {canAccessKingBus && (
                <Link
                  to="/organizer/dashboard"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-black text-white border border-white/15 hover:bg-white/20 transition-all backdrop-blur"
                  title="Accéder au Portail Exploitation King-Bus"
                >
                  <Bus className="size-3.5 text-primary" />
                  <span className="hidden sm:inline">Espace King-Bus</span>
                  <span className="sm:hidden">Staff</span>
                </Link>
              )}

              {/* Bouton de test Studio Bus */}
              {canAccessKingBus && (
                <button
                  type="button"
                  onClick={() => setShowBusStudio(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-2 text-xs font-black text-slate-950 shadow-md hover:from-amber-400 hover:to-orange-400 transition-all cursor-pointer"
                  title="Tester le Studio de configuration de bus"
                >
                  <Armchair className="size-3.5 text-slate-950" />
                  <span className="hidden sm:inline">Studio Bus</span>
                  <span className="sm:hidden">Studio</span>
                </button>
              )}

              {user ? (
                <Link
                  to="/billets"
                  aria-label="Mes billets"
                  className="relative grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 backdrop-blur transition-colors hover:bg-white/20 border border-white/10"
                >
                  <Bell className="size-5 text-white" />
                  <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary animate-ping" />
                </Link>
              ) : (
                <Link
                  to="/auth"
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-black text-black transition-all hover:brightness-110 shadow-md"
                >
                  <LogIn className="size-3.5" /> Connexion
                </Link>
              )}
            </div>
          </div>

          {/* Slogan & Title */}
          <div className="mt-8 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wider uppercase text-primary border border-primary/20">
              <Sparkles className="size-3.5" /> Le choix des voyageurs exigeants
            </span>
            <h2 className="mt-3 text-2xl sm:text-4xl font-black leading-tight tracking-tight text-white">
              Voyagez avec confort, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">
                voyagez avec classe.
              </span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-white/70 max-w-lg">
              Plateforme officielle de réservation en ligne King-Bus. Départs quotidiens sur la ligne Dakar ⇄ Ziguinchor avec climatisation, confort et sécurité assurée.
            </p>
          </div>

          {/* Sleek Compact Search Bar in Header */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 max-w-2xl">
            <div className="relative flex-1 w-full flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3.5 text-white backdrop-blur-xl focus-within:border-primary focus-within:bg-white/15 transition-all shadow-xl">
              <Search className="size-5 text-primary shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher une destination, une gare (ex: Dakar, Ziguinchor)..."
                className="w-full bg-transparent text-sm font-medium text-white placeholder:text-white/60 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="text-xs text-white/60 hover:text-white px-2 py-0.5"
                >
                  ✕
                </button>
              )}
            </div>
            <a
              href="#departures"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 px-6 py-3.5 text-sm font-black text-black shadow-lg shadow-primary/20 hover:brightness-110 active:scale-98 transition-all shrink-0"
            >
              <span>Voir les départs</span>
              <ChevronRight className="size-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-5xl space-y-12 px-5 pt-8 relative z-10">

        {/* Section: Departures List with Integrated Search & Filter Controls */}
        <section id="departures" className="space-y-4">
          {/* Header Row: Title & "Départ le plus proche" Sort Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                  Départs King-Bus disponibles
                </h2>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {results.length} bus disponible{results.length > 1 ? "s" : ""} en temps réel • Réservation immédiate
              </p>
            </div>

            {/* Sort indicator: "Départ le plus proche" */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-xs">
                <Clock className="size-3.5 text-primary" />
                <span>Départ le plus proche</span>
              </span>
            </div>
          </div>

          {/* Clean Segmented Direction Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: "all", label: "Tous les trajets" },
              { id: "dkr-zig", label: "Dakar ➔ Ziguinchor" },
              { id: "zig-dkr", label: "Ziguinchor ➔ Dakar" },
            ].map((route) => {
              const active = selectedRoute === route.id;
              return (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => setSelectedRoute(route.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all",
                    active
                      ? "bg-primary text-black shadow-md"
                      : "border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:border-primary/50",
                  )}
                >
                  <Bus className="size-3.5" />
                  <span>{route.label}</span>
                </button>
              );
            })}
          </div>

          {results.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
              <p className="text-base font-bold text-foreground">
                Aucun bus programmé pour cette sélection.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                King-Bus opère quotidiennement entre Dakar et Ziguinchor. Essayez d'inverser les villes ou d'afficher toutes les gares.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedRoute("all");
                  setQuery("");
                }}
                className="mt-4 inline-flex items-center rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-black shadow-md hover:brightness-110 transition-all"
              >
                Afficher tous les départs King-Bus
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((c) => (
                <CaravanCard
                  key={c.id}
                  caravane={c}
                  favorite={favorites.includes(c.id)}
                  onToggleFavorite={toggle}
                />
              ))}
            </div>
          )}
        </section>

        {/* Section: Pourquoi choisir King-Bus (Épuré, Simple & Pro) */}
        <section className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-lifted">
          <div className="text-center max-w-lg mx-auto mb-6">
            <span className="text-[11px] font-black uppercase tracking-wider text-primary">
              Services & Confort
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-1">
              Pourquoi choisir King-Bus ?
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
            {[
              {
                icon: Armchair,
                title: "Confort maximal",
                subtitle: "Sièges spacieux & inclinables",
              },
              {
                icon: ShieldCheck,
                title: "Sécurité assurée",
                subtitle: "Chauffeurs pros & suivi GPS",
              },
              {
                icon: Snowflake,
                title: "Climatisation",
                subtitle: "Température régulée à bord",
              },
              {
                icon: Briefcase,
                title: "Bagages inclus",
                subtitle: "25 kg en soute sécurisée",
              },
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-muted/40 border border-border/60 hover:border-primary/50 hover:bg-muted/70 transition-all"
                >
                  <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 mb-3 shadow-xs">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-sm font-extrabold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground font-medium">
                    {item.subtitle}
                  </p>
                </div>
              );
            })}
          </div>
        </section>


        {/* Section: Paiement Officiel Wave Sécurisé */}
        <section className="rounded-3xl border border-[#1dc3ec]/35 bg-gradient-to-r from-[#1dc3ec]/10 via-card to-[#1dc3ec]/5 p-6 sm:p-7 shadow-lifted">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1dc3ec]/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#0284c7] dark:text-[#38bdf8] border border-[#1dc3ec]/30">
                  <ShieldCheck className="size-3" /> Partenaire Paiement Officiel
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full">
                  0 FCFA de frais
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black tracking-tight text-foreground">
                Paiement 100% sécurisé avec Wave
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Réglez votre place de bus en un instant depuis votre application Wave Sénégal. Votre billet électronique avec QR Code est généré et disponible immédiatement.
              </p>
            </div>

            {/* Official Wave Badge Card */}
            <div className="flex shrink-0 items-center gap-3.5 rounded-2xl bg-white dark:bg-card/90 border border-[#1dc3ec]/40 px-5 py-3.5 shadow-md">
              <img
                src="/payment/wave.png"
                alt="Wave Sénégal - Paiement Officiel"
                className="h-10 w-auto rounded-lg object-contain"
              />
              <div className="border-l border-border/80 pl-3.5">
                <p className="text-xs font-black text-foreground flex items-center gap-1">
                  <span>Wave Sénégal</span>
                  <CheckCircle2 className="size-3.5 text-[#1dc3ec]" />
                </p>
                <p className="text-[10px] font-semibold text-muted-foreground">
                  Instantané & Sans Frais
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Bouton Flottant d'accès rapide au Studio de configuration */}
      {canAccessKingBus && (
        <button
          type="button"
          onClick={() => setShowBusStudio(true)}
          className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-xs font-black text-slate-950 shadow-2xl border-2 border-amber-400/80 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <Armchair className="size-4 text-slate-950" />
          <span>Studio KING-BUS</span>
        </button>
      )}

      <BottomNav />
    </div>
  );
}
