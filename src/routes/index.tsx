import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Bell, CheckCircle2, Compass, LogIn, QrCode, Search, ShieldCheck, SlidersHorizontal, Smartphone, Sparkle } from "lucide-react";
import { CaravanCard } from "@/components/CaravanCard";
import { BottomNav } from "@/components/BottomNav";
import { UniversityMark } from "@/components/UniversityMark";
import {
  caravansQuery,
  profileQuery,
  universitiesQuery,
  organizersQuery,
} from "@/lib/student-queries";
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
      { title: "Caravane Étudiants — Réservez vos trajets universitaires" },
      {
        name: "description",
        content:
          "Réservez en 2 clics votre place dans les caravanes étudiantes du Sénégal : UASZ, UCAD, UGB, UIDT, UADB. Paiement Wave, Orange Money et billet électronique.",
      },
      { property: "og:title", content: "Caravane Étudiants — Trajets universitaires au Sénégal" },
      {
        property: "og:description",
        content:
          "Trouvez une caravane, payez avec Wave ou Orange Money et embarquez avec votre billet QR.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <p className="text-sm text-muted-foreground">
        Les caravanes n'ont pas pu être chargées. Réessayez dans un instant.
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
  const { data: universities } = useSuspenseQuery(universitiesQuery);
  const { data: organizers } = useSuspenseQuery(organizersQuery);
  const { user } = useAuth();
  const { data: profile } = useQuery(profileQuery);
  const [activeUniversity, setActiveUniversity] = useState<string | null>(null);
  const [activeOrganizer, setActiveOrganizer] = useState<string | null>(null);
  const [activeDestination, setActiveDestination] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"date" | "price_asc" | "seats">("date");
  const [query, setQuery] = useState("");
  const { favorites, toggle } = useStudentFavorites();

  // Liste des villes de destination populaires
  const popularDestinations = useMemo(() => {
    const set = new Set<string>();
    caravanes.forEach((c) => {
      if (c.to) set.add(c.to.trim());
    });
    return Array.from(set);
  }, [caravanes]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = caravanes.filter((c) => {
      const activeUniObj = universities.find((u) => u.id === activeUniversity);
      const matchUni =
        !activeUniversity ||
        c.universityId === activeUniversity ||
        (activeUniObj &&
          (c.from.toLowerCase().includes(activeUniObj.city.toLowerCase()) ||
            c.to.toLowerCase().includes(activeUniObj.city.toLowerCase()) ||
            c.from.toLowerCase().includes(activeUniObj.abbr.toLowerCase()) ||
            c.to.toLowerCase().includes(activeUniObj.abbr.toLowerCase())));
      const matchOrg = !activeOrganizer || c.organizerId === activeOrganizer;
      const matchDest = !activeDestination || c.to.toLowerCase() === activeDestination.toLowerCase();
      const matchQuery =
        !q || `${c.from} ${c.to} ${c.pickup} ${c.organizer}`.toLowerCase().includes(q);
      return matchUni && matchOrg && matchDest && matchQuery;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "seats") return a.seatsLeft - b.seatsLeft;
      return 0; // default order
    });
  }, [activeUniversity, activeOrganizer, activeDestination, sortBy, query, caravanes, universities]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden bg-gradient-primary px-5 pb-12 pt-5 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div className="relative mx-auto max-w-5xl">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img 
                src="/univoyage-logo.jpg" 
                alt="UniVoyage"
                className="size-11 shrink-0 rounded-2xl object-cover shadow-ambient border border-white/20"
              />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium leading-tight text-primary-foreground/70">
                  {user ? `Bonjour, ${profile?.full_name || "Étudiant"}` : "Bienvenue"}
                </p>
                <h1 className="truncate text-[15px] font-extrabold leading-tight tracking-tight">
                  Caravane Étudiants
                </h1>
              </div>
            </div>
            {user ? (
              <Link
                to="/billets"
                aria-label="Mes billets"
                className="relative grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-foreground/15 backdrop-blur transition-colors hover:bg-primary-foreground/25"
              >
                <Bell className="size-5" />
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-secondary-accent" />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex shrink-0 items-center gap-1.5 rounded-2xl bg-primary-foreground/15 px-3 py-2.5 text-xs font-bold backdrop-blur transition-colors hover:bg-primary-foreground/25"
              >
                <LogIn className="size-4" /> Connexion
              </Link>
            )}
          </div>

          <p className="mt-6 max-w-lg text-[22px] font-bold leading-[1.35] tracking-tight sm:text-[28px] sm:leading-[1.3]">
            Trouvez votre prochaine caravane,
            <br className="hidden sm:block" /> payez en deux clics.
          </p>

          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-primary-foreground/20 bg-primary-foreground/12 p-2 backdrop-blur-xl">
            <Search className="ml-2 size-4 shrink-0 text-primary-foreground/70" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une destination…"
              aria-label="Rechercher une destination"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-primary-foreground placeholder:text-primary-foreground/60 focus:outline-none"
            />
            <button
              type="button"
              className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-foreground/20 transition-colors hover:bg-primary-foreground/30"
              aria-label="Filtres"
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-8 max-w-5xl space-y-8 px-5">
        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-lifted">
          <h2 className="text-sm font-bold tracking-tight">Votre université</h2>
          <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
            <li>
              <button
                type="button"
                onClick={() => setActiveUniversity(null)}
                className={cn(
                  "flex h-full w-[76px] flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-[11px] font-semibold transition-all",
                  activeUniversity === null
                    ? "border-primary-accent bg-accent shadow-ambient"
                    : "border-border/70 hover:border-primary-accent/50",
                )}
              >
                Toutes
              </button>
            </li>
            {universities.map((u) => {
              const active = activeUniversity === u.id;
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    title={u.name}
                    onClick={() => setActiveUniversity(active ? null : u.id)}
                    className={cn(
                      "flex w-[76px] flex-col items-center gap-1.5 rounded-2xl border p-2 transition-all",
                      active
                        ? "border-primary-accent bg-accent shadow-ambient"
                        : "border-border/70 hover:border-primary-accent/50",
                    )}
                  >
                    <UniversityMark abbr={u.abbr} active={active} />
                    <span className="w-full truncate text-center text-[11px] font-semibold leading-tight">
                      {u.abbr}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {organizers && organizers.length > 0 && (
            <div className="mt-4 flex items-center justify-between gap-2 border-t pt-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-bold tracking-tight">Organisateur</label>
                <select
                  value={activeOrganizer || ""}
                  onChange={(e) => setActiveOrganizer(e.target.value || null)}
                  className="h-9 w-[180px] sm:w-[220px] rounded-xl border border-border/70 bg-accent px-3 text-xs font-semibold outline-none focus:border-primary-accent focus:ring-2 focus:ring-primary-accent/30"
                >
                  <option value="">Tous les organisateurs</option>
                  {organizers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
              <Link to="/organisateurs" className="text-[11px] font-bold text-primary-accent hover:underline">
                Voir l'annuaire
              </Link>
            </div>
          )}
        </section>

        {/* Quick Destination Filter Pills */}
        {popularDestinations.length > 0 && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Destinations populaires
              </span>
              {activeDestination && (
                <button
                  type="button"
                  onClick={() => setActiveDestination(null)}
                  className="text-xs font-bold text-primary-accent hover:underline"
                >
                  Effacer le filtre
                </button>
              )}
            </div>
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setActiveDestination(null)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all",
                  activeDestination === null
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-border/80 bg-card text-foreground hover:border-primary/50",
                )}
              >
                <span>🌍 Toutes</span>
              </button>
              {popularDestinations.map((dest) => {
                const active = activeDestination === dest;
                return (
                  <button
                    key={dest}
                    type="button"
                    onClick={() => setActiveDestination(active ? null : dest)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-all",
                      active
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "border border-border/80 bg-card text-foreground hover:border-primary/50",
                    )}
                  >
                    <span>📍 {dest}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">Caravanes disponibles</h2>
              <p className="text-xs text-muted-foreground">
                {results.length} trajet{results.length > 1 ? "s" : ""} disponible{results.length > 1 ? "s" : ""}
                {activeDestination ? ` vers ${activeDestination}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Trier les caravanes"
                className="h-9 rounded-xl border border-border/80 bg-card px-3 text-xs font-bold text-foreground shadow-xs outline-none focus:ring-2 focus:ring-primary-accent"
              >
                <option value="date">📅 Départ le plus proche</option>
                <option value="price_asc">💰 Prix croissant</option>
                <option value="seats">⚡ Places restantes</option>
              </select>
            </div>
          </div>

          {results.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card p-8 text-center">
              <p className="text-sm font-semibold text-foreground">Aucune caravane ne correspond à vos critères.</p>
              <p className="mt-1 text-xs text-muted-foreground">Essayez d'effacer les filtres ou de chercher une autre ville.</p>
              <button
                type="button"
                onClick={() => {
                  setActiveUniversity(null);
                  setActiveDestination(null);
                  setActiveOrganizer(null);
                  setQuery("");
                }}
                className="mt-4 inline-flex items-center rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
              >
                Réinitialiser tous les filtres
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

        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary-accent">
                Simple & Rapide
              </p>
              <h2 className="text-base font-extrabold tracking-tight">Comment ça marche ?</h2>
            </div>
            <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-primary-accent">
              3 étapes simples
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: "01",
                icon: Compass,
                title: "Choisissez votre caravane",
                text: "Sélectionnez votre université, la destination et la date de départ idéale.",
                badgeColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                iconBg: "bg-gradient-to-br from-blue-500/20 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
              },
              {
                step: "02",
                icon: Smartphone,
                title: "Payez via Wave",
                text: "Réglez en 1 clic sans frais supplémentaires via votre compte Wave Sénégal.",
                badgeColor: "bg-[#1dc3ec]/15 text-[#0284c7] dark:text-[#38bdf8] border-[#1dc3ec]/30",
                iconBg: "bg-gradient-to-br from-[#1dc3ec]/25 to-[#00aee6]/10 text-[#0284c7] dark:text-[#38bdf8] border-[#1dc3ec]/30",
              },
              {
                step: "03",
                icon: QrCode,
                title: "Embarquez avec votre QR",
                text: "Votre billet électronique est émis en temps réel. Présentez-le au bus.",
                badgeColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                iconBg: "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
              },
            ].map(({ step, icon: Icon, title, text, badgeColor, iconBg }) => (
              <article
                key={step}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-ambient transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lifted"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className={cn("grid size-11 place-items-center rounded-2xl border shadow-sm transition-transform duration-300 group-hover:scale-110", iconBg)}>
                      <Icon className="size-5.5" />
                    </span>
                    <span className={cn("rounded-full border px-2.5 py-0.5 text-[11px] font-black tracking-wider", badgeColor)}>
                      Étape {step}
                    </span>
                  </div>
                  <h3 className="mt-4 text-sm font-extrabold tracking-tight text-foreground">
                    {title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {text}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-primary-accent opacity-80 group-hover:opacity-100 transition-opacity">
                  <span>En savoir plus</span>
                  <CheckCircle2 className="size-3 text-primary-accent" />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-[#1dc3ec]/35 bg-gradient-to-r from-[#1dc3ec]/15 via-card to-[#1dc3ec]/5 p-5 text-foreground shadow-lifted">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-28 shrink-0 rounded-2xl overflow-hidden shadow-md shadow-[#1dc3ec]/20 border border-[#1dc3ec]/40 bg-[#1dc3ec] flex items-center justify-center">
                <img src="/payment/wave.png" alt="Wave Mobile Money" className="size-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-extrabold tracking-tight">Paiement Mobile Money Officiel</h2>
                  <span className="inline-flex items-center rounded-full bg-[#1dc3ec]/20 px-2.5 py-0.5 text-[10px] font-bold text-[#0891b2] dark:text-[#38bdf8]">
                    0% Frais • Instantané
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  Réglez directement via votre compte Wave Sénégal. Vos billets et QR Codes sont validés et émis automatiquement en temps réel.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
