import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { CaravanCard } from "@/components/CaravanCard";
import { caravansQuery } from "@/lib/student-queries";
import { useStudentFavorites } from "@/hooks/use-student-favorites";

export const Route = createFileRoute("/_authenticated/favoris")({
  head: () => ({
    meta: [
      { title: "Mes caravanes favorites — Caravane Étudiants" },
      {
        name: "description",
        content:
          "Vos trajets universitaires enregistrés en favoris, prêts à être réservés en deux clics.",
      },
      { property: "og:title", content: "Mes favoris — Caravane Étudiants" },
      {
        property: "og:description",
        content: "Retrouvez les caravanes que vous avez enregistrées.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Favoris,
});

function Favoris() {
  const { data: caravanes, isLoading } = useQuery(caravansQuery);
  const { favorites, toggle } = useStudentFavorites();
  const saved = (caravanes ?? []).filter((c) => favorites.includes(c.id));

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden bg-gradient-primary px-5 pb-14 pt-6 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
            Enregistrés
          </p>
          <h1 className="mt-2 text-[22px] font-extrabold leading-tight tracking-tight">
            Mes favoris
          </h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            {saved.length} caravane{saved.length > 1 ? "s" : ""} enregistrée
            {saved.length > 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-8 max-w-5xl px-5">
        {isLoading ? (
          <div className="grid place-items-center rounded-3xl border border-border/70 bg-card p-12 shadow-ambient">
            <Loader2 className="size-5 animate-spin text-primary-accent" />
          </div>
        ) : saved.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-ambient">
            <p className="text-sm text-muted-foreground">
              Aucun favori pour le moment. Touchez le cœur d'une caravane pour l'enregistrer.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lifted"
            >
              Explorer les caravanes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {saved.map((c) => (
              <CaravanCard key={c.id} caravane={c} favorite onToggleFavorite={toggle} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
