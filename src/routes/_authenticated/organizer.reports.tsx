import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, KpiCard, PageHeader, Panel, ProBadge } from "@/components/organizer/ui";
import { orgOverviewQuery } from "@/lib/dash-queries";
import { dateFr } from "@/lib/dash-shared";
import { fcfa, pct } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/organizer/reports")({
  head: () => ({
    meta: [
      { title: "Rapports — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Générez des rapports financiers et opérationnels prêts à présenter à votre amicale ou à l'université.",
      },
      { property: "og:title", content: "Rapports — CaravaneHub" },
      {
        property: "og:description",
        content: "Exports PDF et CSV de votre activité de transport étudiant.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const { data: overview, isLoading } = useQuery(orgOverviewQuery());
  const caravans = overview?.caravans ?? [];
  const revenue = overview?.kpis.revenue ?? 0;
  const seats = overview?.kpis.seatsSold ?? 0;
  const commissionRate = overview?.organizer.commissionRate ?? 0.08;

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Rapports <ProBadge />
          </span>
        }
        subtitle="Des documents propres pour vos réunions et vos partenaires."
        actions={
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Printer className="size-4" /> Imprimer
          </button>
        }
      />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des données…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard title="Chiffre d'affaires" value={fcfa(revenue)} secondary="6 derniers mois" icon={FileText} accent="mint" />
            <KpiCard title="Places vendues" value={String(seats)} icon={FileText} accent="info" />
            <KpiCard title="Caravanes organisées" value={String(caravans.length)} icon={FileText} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {[
              { title: "Rapport financier mensuel", detail: "Revenus, commissions, remboursements et solde net.", icon: FileSpreadsheet },
              { title: "Rapport opérationnel", detail: "Remplissage, ponctualité et incidents par caravane.", icon: FileText },
              { title: "Rapport de satisfaction", detail: "Notes par critère et verbatims des étudiants.", icon: FileText },
            ].map((r) => (
              <Panel key={r.title} title={r.title} description={r.detail}>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toast.success(`${r.title} généré en PDF`)}
                    className="flex-1 rounded-xl bg-gradient-primary py-2.5 text-sm font-bold text-primary-foreground"
                  >
                    PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => toast.success(`${r.title} exporté en CSV`)}
                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-muted"
                  >
                    CSV
                  </button>
                </div>
              </Panel>
            ))}
          </div>

          <Panel className="mt-4" title="Synthèse par caravane" bodyClassName="p-0">
            {caravans.length === 0 ? (
              <EmptyState icon={FileText} message="Aucune caravane à synthétiser pour l'instant." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="px-5 py-3 font-semibold">Caravane</th>
                      <th className="px-5 py-3 font-semibold">Date</th>
                      <th className="px-5 py-3 font-semibold">Remplissage</th>
                      <th className="px-5 py-3 font-semibold">Revenus</th>
                      <th className="px-5 py-3 font-semibold">Commission ({Math.round(commissionRate * 100)}%)</th>
                      <th className="px-5 py-3 font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {caravans.map((c) => {
                      const commission = Math.round(c.revenue * commissionRate);
                      return (
                        <tr key={c.id} className="hover:bg-muted/40">
                          <td className="px-5 py-3.5 font-semibold">{c.route}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{dateFr(c.departureAt)}</td>
                          <td className="px-5 py-3.5">{pct(c.booked, c.capacity)}%</td>
                          <td className="px-5 py-3.5">{fcfa(c.revenue)}</td>
                          <td className="px-5 py-3.5 text-muted-foreground">{fcfa(commission)}</td>
                          <td className="px-5 py-3.5 font-bold">{fcfa(c.revenue - commission)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
