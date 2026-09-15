import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Bus, ChevronLeft, Phone, Star, Info } from "lucide-react";
import { organizerQuery } from "@/lib/student-queries";
import { CaravanCard } from "@/components/CaravanCard";
import { OrganizerLogo } from "@/components/OrganizerLogo";

export const Route = createFileRoute("/organisateurs/$id")({
  head: ({ loaderData }: { loaderData?: any }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Partenaire"} — CaravaneHub` },
      { name: "description", content: loaderData?.slogan ?? "Découvrez les caravanes de cet organisateur." },
    ],
  }),
  loader: async ({ context, params: { id } }) => {
    try {
      const data: any = await context.queryClient.ensureQueryData(organizerQuery(id));
      if (!data) throw notFound();
      return { name: data.name, slogan: data.slogan };
    } catch {
      throw notFound();
    }
  },
  component: OrganizerProfile,
});

function OrganizerProfile() {
  const { id } = Route.useParams();
  const { data: org } = useSuspenseQuery(organizerQuery(id));

  if (!org) return null;

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface-blur backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/organisateurs"
            aria-label="Retour aux partenaires"
            className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card transition-colors hover:bg-accent"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-extrabold tracking-tight">{org.name}</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 pt-6 sm:px-6">
        {/* Profile Card */}
        <section className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card p-6 shadow-sm">
          <div className="absolute -right-16 -top-20 size-56 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          
          <div className="relative flex flex-col sm:flex-row gap-6 items-start sm:items-center">
            <OrganizerLogo
              url={org.logoUrl}
              name={org.name}
              className="size-24 rounded-[2rem]"
              iconClassName="size-10"
            />
            
            <div className="flex-1 min-w-0 space-y-2">
              <h1 className="text-2xl font-extrabold tracking-tight">{org.name}</h1>
              {org.slogan && (
                <p className="text-sm font-medium text-muted-foreground">{org.slogan}</p>
              )}
              {org.rating > 0 && (
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-600">
                  <Star className="size-3.5 fill-current" />
                  {org.rating} / 5
                </div>
              )}
            </div>
            
            {org.supportPhone && (
              <div className="flex shrink-0 items-center gap-2 rounded-xl bg-accent px-4 py-3 shadow-ambient">
                <div className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Phone className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Assistance
                  </p>
                  <p className="text-sm font-black">{org.supportPhone}</p>
                </div>
              </div>
            )}
          </div>
          
          {org.description && (
            <div className="mt-6 rounded-2xl bg-accent/50 p-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="size-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{org.description}</p>
              </div>
            </div>
          )}
        </section>

        {/* Caravans List */}
        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-extrabold tracking-tight">Prochains départs</h2>
            <span className="text-xs font-medium text-muted-foreground">
              {org.caravans.length} trajet{org.caravans.length > 1 ? "s" : ""}
            </span>
          </div>
          
          {org.caravans.length === 0 ? (
            <div className="rounded-[2rem] border border-border/70 bg-card p-12 text-center text-muted-foreground">
              Aucune caravane prévue pour le moment.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {org.caravans.map((caravane: any) => (
                <CaravanCard key={caravane.id} caravane={caravane} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
