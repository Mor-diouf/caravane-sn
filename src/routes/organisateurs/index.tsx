import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bus, ChevronLeft, Star } from "lucide-react";
import { organizersQuery } from "@/lib/student-queries";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/organisateurs/")({
  head: () => ({
    meta: [
      { title: "Nos Partenaires — CaravaneHub" },
      { name: "description", content: "Découvrez les amicales et organisateurs partenaires." },
    ],
  }),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(organizersQuery);
  },
  component: OrganizersIndex,
});

function OrganizersIndex() {
  const { data: organizers } = useSuspenseQuery(organizersQuery);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-blur backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            aria-label="Retour à l'accueil"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold tracking-tight">Nos Partenaires</h1>
            <p className="truncate text-xs font-medium text-muted-foreground">
              Découvrez les amicales et organisateurs
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 pt-6 sm:px-6">
        {organizers.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Aucun partenaire pour le moment.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {organizers.map((org) => (
              <Link
                key={org.id}
                to="/organisateurs/$id"
                params={{ id: org.id }}
                className="group flex flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-primary-accent/50 hover:shadow-lifted"
              >
                <div className="flex items-center gap-4">
                  {org.logoUrl ? (
                    <img
                      src={org.logoUrl}
                      alt={org.name}
                      className="size-14 shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-border"
                    />
                  ) : (
                    <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20">
                      <Bus className="size-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-extrabold tracking-tight group-hover:text-primary-accent transition-colors">
                      {org.name}
                    </h2>
                    {org.slogan && (
                      <p className="truncate text-xs font-medium text-muted-foreground mt-0.5">
                        {org.slogan}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                    <Bus className="size-3.5" />
                    <span>
                      {org.activeCaravansCount} caravane{org.activeCaravansCount > 1 ? "s" : ""}
                    </span>
                  </div>
                  {org.rating > 0 && (
                    <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-600">
                      <Star className="size-3.5 fill-current" />
                      {org.rating}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
