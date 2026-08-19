import { createFileRoute, Link } from "@tanstack/react-router";
import { BottomNav } from "@/components/BottomNav";
import { CaravanCard } from "@/components/CaravanCard";
import { caravanes } from "@/lib/caravanes";
import { useFavorites } from "@/hooks/use-local-store";

export const Route = createFileRoute("/favoris")({
  head: () => ({
    meta: [
      { title: "Mes caravanes favorites — Caravane Étudiants" },
      {
        name: "description",
        content:
          "Vos trajets universitaires enregistrés pour réserver plus vite lors du prochain départ.",
      },
      { property: "og:title", content: "Favoris — Caravane Étudiants" },
      {
        property: "og:description",
        content: "Retrouvez les caravanes étudiantes que vous avez enregistrées.",
      },
    ],
  }),
  component: Favoris,
});

function Favoris() {
  const { favorites, toggle } = useFavorites();
  const list = caravanes.filter((c) => favorites.includes(c.id));

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="bg-gradient-primary px-5 pb-12 pt-8 text-primary-foreground">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-extrabold tracking-tight">Favoris</h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            {list.length} caravane{list.length > 1 ? "s" : ""} enregistrée
            {list.length > 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-5xl px-5">
        {list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-ambient">
            <p className="text-sm text-muted-foreground">Aucun favori pour l'instant.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lifted"
            >
              Parcourir les caravanes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {list.map((c) => (
              <CaravanCard key={c.id} caravane={c} favorite onToggleFavorite={toggle} />
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
