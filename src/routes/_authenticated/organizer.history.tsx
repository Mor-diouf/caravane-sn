import { createFileRoute } from "@tanstack/react-router";
import { History, Star } from "lucide-react";
import { KpiCard, PageHeader, Panel, ProBadge, ProgressBar } from "@/components/organizer/ui";
import { caravans, fcfa, pct } from "@/lib/organizer";

export const Route = createFileRoute("/organizer/history")({
  head: () => ({
    meta: [
      { title: "Historique des caravanes — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Archive complète de vos caravanes passées : remplissage, revenus et satisfaction des étudiants.",
      },
      { property: "og:title", content: "Historique des caravanes — CaravaneHub" },
      {
        property: "og:description",
        content: "Comparez vos départs passés pour améliorer les prochains.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const past = caravans.filter((c) => c.status === "completed" || c.status === "cancelled");
  const revenue = past.reduce((a, c) => a + c.revenue, 0);

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Historique <ProBadge />
          </span>
        }
        subtitle="Toutes vos caravanes archivées, avec leurs performances."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Caravanes réalisées" value={String(past.length)} icon={History} />
        <KpiCard title="Revenus historiques" value={fcfa(revenue)} icon={History} accent="mint" />
        <KpiCard title="Note moyenne" value="4,8/5" icon={Star} accent="warning" />
      </div>

      <Panel className="mt-4" title="Archive" bodyClassName="p-0">
        <ul className="divide-y divide-border">
          {past.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
              <div className="min-w-[180px] flex-1">
                <p className="font-semibold">{c.route}</p>
                <p className="text-xs text-muted-foreground">{c.date}</p>
              </div>
              <div className="min-w-[160px] flex-1">
                <ProgressBar value={pct(c.booked, c.capacity)} tone={c.status === "cancelled" ? "warning" : "brand"} />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {c.booked}/{c.capacity} places · {pct(c.booked, c.capacity)}%
                </p>
              </div>
              <p className="w-28 text-right font-semibold">{fcfa(c.revenue)}</p>
              <p className="w-16 text-right text-sm font-semibold">
                {c.rating ? `${c.rating}★` : "—"}
              </p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
