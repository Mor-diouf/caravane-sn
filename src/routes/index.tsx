import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bell, LogIn, Search, ShieldCheck, SlidersHorizontal, Sparkle } from "lucide-react";
import { CaravanCard } from "@/components/CaravanCard";
import { BottomNav } from "@/components/BottomNav";
import { UniversityMark } from "@/components/UniversityMark";
import { caravansQuery, universitiesQuery } from "@/lib/student-queries";
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
  const [activeUniversity, setActiveUniversity] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { favorites, toggle } = useStudentFavorites();
  const { user } = useAuth();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return caravanes.filter((c) => {
      const matchUni = !activeUniversity || c.universityId === activeUniversity;
      const matchQuery =
        !q || `${c.from} ${c.to} ${c.pickup} ${c.organizer}`.toLowerCase().includes(q);
      return matchUni && matchQuery;
    });
  }, [activeUniversity, query, caravanes]);

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
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-foreground/15 text-base font-black backdrop-blur">
                CÉ
              </span>
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium leading-tight text-primary-foreground/70">
                  {user ? `Bonjour, ${user.email?.split("@")[0]}` : "Bienvenue"}
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
        </section>

        <section>
          <div className="flex items-baseline justify-between">
            <h2 className="text-base font-extrabold tracking-tight">Caravanes disponibles</h2>
            <span className="text-xs font-medium text-muted-foreground">
              {results.length} trajet{results.length > 1 ? "s" : ""}
            </span>
          </div>

          {results.length === 0 ? (
            <p className="mt-6 rounded-3xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Aucune caravane ne correspond à votre recherche.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-3">
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

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Sparkle, title: "Choisissez", text: "Votre université et votre destination" },
            { icon: ShieldCheck, title: "Payez", text: "Wave, Orange Money ou Free Money" },
            { icon: Bell, title: "Voyagez", text: "Billet électronique avec QR code" },
          ].map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-3xl border border-border/70 bg-card p-5 shadow-ambient"
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-accent text-primary-accent">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{text}</p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-lifted">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-6 shrink-0 text-secondary-accent" />
            <div>
              <h2 className="text-sm font-extrabold">Paiement sécurisé avec PayTech</h2>
              <p className="mt-1 text-xs text-primary-foreground/80">
                Orange Money • Wave • Free Money — 100% sécurisé et instantané.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
