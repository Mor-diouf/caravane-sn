import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Award, MessageSquareQuote, Star } from "lucide-react";
import { Avatar, EmptyState, KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { orgReputationQuery } from "@/lib/dash-queries";
import { dateFr, initialsOf } from "@/lib/dash-shared";

export const Route = createFileRoute("/_authenticated/organizer/reputation")({
  head: () => ({
    meta: [
      { title: "Avis & réputation — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Notes détaillées, avis vérifiés des étudiants et badges de confiance de votre amicale.",
      },
      { property: "og:title", content: "Avis & réputation — CaravaneHub" },
      {
        property: "og:description",
        content: "Construisez la confiance des étudiants grâce aux avis vérifiés.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReputationPage,
});

function ReputationPage() {
  const { data, isLoading } = useQuery(orgReputationQuery());
  const distribution = data?.distribution ?? [];
  const reviews = data?.reviews ?? [];

  return (
    <>
      <PageHeader
        title="Avis & réputation"
        subtitle="Ce que les étudiants pensent de vos caravanes."
      />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des avis…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard title="Note globale" value={`${data?.average ?? 0}/5`} secondary={`${data?.total ?? 0} avis vérifiés`} icon={Star} accent="warning" />
            <KpiCard title="Avis publiés" value={String(data?.total ?? 0)} icon={MessageSquareQuote} accent="mint" />
            <KpiCard title="Avis 5 étoiles" value={String(distribution.find((d) => d.score === 5)?.count ?? 0)} icon={Award} accent="info" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <Panel title="Répartition des notes">
              <ul className="space-y-4">
                {distribution.map((d) => (
                  <li key={d.score}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold">{d.score} étoiles</span>
                      <span className="font-bold">{d.count}</span>
                    </div>
                    <ProgressBar value={data?.total ? (d.count / data.total) * 100 : 0} tone="mint" />
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="lg:col-span-2" title="Avis vérifiés" description="Chaque avis provient d'un billet réellement scanné">
              {reviews.length === 0 ? (
                <EmptyState icon={MessageSquareQuote} message="Aucun avis pour l'instant." />
              ) : (
                <ul className="space-y-3">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded-2xl border border-border p-4">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initialsOf(r.author)} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{r.author}</p>
                          <p className="text-xs text-muted-foreground">{r.trip}</p>
                        </div>
                        <span className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={
                                i < r.rating
                                  ? "size-3.5 fill-warning text-warning"
                                  : "size-3.5 text-muted-foreground/30"
                              }
                            />
                          ))}
                        </span>
                      </div>
                      {r.comment && (
                        <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                          <MessageSquareQuote className="mt-0.5 size-4 shrink-0" />
                          {r.comment}
                        </p>
                      )}
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <span className="text-[11px] text-muted-foreground">{dateFr(r.createdAt)}</span>
                        <span className="text-[11px] font-semibold text-muted-foreground">{r.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
