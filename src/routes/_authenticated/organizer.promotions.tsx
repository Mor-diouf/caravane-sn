import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BadgePercent, Megaphone, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, KpiCard, PageHeader, Panel, ProBadge } from "@/components/organizer/ui";
import { orgOverviewQuery } from "@/lib/dash-queries";
import { dateFr } from "@/lib/dash-shared";
import { fcfa, pct } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/organizer/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Créez des codes promo, mettez vos caravanes en avant et envoyez des campagnes WhatsApp aux étudiants.",
      },
      { property: "og:title", content: "Promotions — CaravaneHub" },
      {
        property: "og:description",
        content: "Remplissez vos places restantes avec des campagnes ciblées.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PromotionsPage,
});

const soonToast = () =>
  toast.info("Bientôt disponible", { description: "Cette fonctionnalité arrive prochainement." });

function PromotionsPage() {
  const { data: overview, isLoading } = useQuery(orgOverviewQuery());
  const [message, setMessage] = useState(
    "Salut ! Il reste des places pour ta prochaine caravane. Réserve vite sur CaravaneHub.",
  );

  const caravans = overview?.caravans ?? [];
  const upcoming = caravans.filter(
    (c) => c.status === "published" && new Date(c.departureAt) > new Date(),
  );
  const seatsAvailable = upcoming.reduce((a, c) => a + Math.max(0, c.capacity - c.booked), 0);
  const toFill = [...upcoming].sort(
    (a, b) => pct(a.booked, a.capacity || 1) - pct(b.booked, b.capacity || 1),
  );

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Promotions <ProBadge />
          </span>
        }
        subtitle="Boostez la visibilité de vos caravanes et remplissez les dernières places."
        actions={
          <button
            type="button"
            onClick={soonToast}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-ambient"
          >
            <Sparkles className="size-4" /> Mettre en avant
          </button>
        }
      />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des données…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard title="Caravanes à venir" value={String(upcoming.length)} icon={Megaphone} accent="info" />
            <KpiCard title="Places disponibles" value={String(seatsAvailable)} icon={BadgePercent} accent="warning" />
            <KpiCard title="Codes promo actifs" value="Bientôt disponible" icon={BadgePercent} accent="mint" />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Caravanes à mettre en avant" description="Trajets à venir triés par remplissage" bodyClassName="p-0">
              {toFill.length === 0 ? (
                <EmptyState icon={Megaphone} message="Aucune caravane à venir pour l'instant." />
              ) : (
                <ul className="divide-y divide-border">
                  {toFill.slice(0, 5).map((c) => (
                    <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{c.route}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {dateFr(c.departureAt)} · {c.booked}/{c.capacity} places ({pct(c.booked, c.capacity || 1)}%)
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={soonToast}
                        className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-bold hover:bg-muted"
                      >
                        Mettre en avant
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t border-border p-4">
                <button
                  type="button"
                  onClick={soonToast}
                  className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted"
                >
                  + Créer un code promo (bientôt disponible)
                </button>
              </div>
            </Panel>

            <Panel title="Campagne WhatsApp" description="Fonctionnalité bientôt disponible">
              <textarea
                rows={5}
                value={message}
                maxLength={500}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
              <p className="mt-1 text-right text-[11px] text-muted-foreground">
                {message.length}/500 caractères
              </p>
              <button
                type="button"
                onClick={soonToast}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-bold text-primary-foreground"
              >
                <Send className="size-4" /> Programmer l'envoi
              </button>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
