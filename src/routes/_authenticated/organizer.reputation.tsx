import { createFileRoute } from "@tanstack/react-router";
import { Award, MessageSquareQuote, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { Avatar, KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { badges, organization, reviewCriteria, reviews } from "@/lib/organizer";

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
  return (
    <>
      <PageHeader
        title="Avis & réputation"
        subtitle="Ce que les étudiants pensent de vos caravanes, critère par critère."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Note globale" value={`${organization.rating}/5`} secondary={`${organization.reviews} avis vérifiés`} trend="+0.2" icon={Star} accent="warning" />
        <KpiCard title="Taux de recommandation" value="96%" secondary="Étudiants prêts à revoyager" icon={ThumbsUp} accent="mint" />
        <KpiCard title="Badges obtenus" value={String(badges.length)} secondary="Sur 6 disponibles" icon={Award} accent="info" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel title="Notes par critère">
          <ul className="space-y-4">
            {reviewCriteria.map((c) => (
              <li key={c.label}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-semibold">{c.label}</span>
                  <span className="font-bold">{c.score}</span>
                </div>
                <ProgressBar value={(c.score / 5) * 100} tone="mint" />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          className="lg:col-span-2"
          title="Avis vérifiés"
          description="Chaque avis provient d'un billet réellement scanné"
          actions={
            <button
              type="button"
              onClick={() => toast.success("Demande d'avis envoyée à 24 passagers")}
              className="rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted"
            >
              Demander des avis
            </button>
          }
        >
          <ul className="space-y-3">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <Avatar initials={r.initials} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{r.author}</p>
                    <p className="text-xs text-muted-foreground">{r.trip}</p>
                  </div>
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < r.score
                            ? "size-3.5 fill-warning text-warning"
                            : "size-3.5 text-muted-foreground/30"
                        }
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-3 flex gap-2 text-sm text-muted-foreground">
                  <MessageSquareQuote className="mt-0.5 size-4 shrink-0" />
                  {r.text}
                </p>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                  <span className="text-[11px] text-muted-foreground">{r.date}</span>
                  <button
                    type="button"
                    onClick={() => toast.success("Réponse publiée sous l'avis")}
                    className="text-xs font-bold text-primary-accent hover:underline"
                  >
                    Répondre
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4" title="Badges de confiance">
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span
              key={b}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-brand-soft px-3.5 py-2 text-xs font-bold text-primary"
            >
              <Award className="size-3.5" /> {b}
            </span>
          ))}
        </div>
      </Panel>
    </>
  );
}
