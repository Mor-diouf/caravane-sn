import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Check, Scale, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, Tabs, TonePill } from "@/components/admin/ui";
import { disputes as initialDisputes, disputeStatusLabels, type Dispute } from "@/lib/admin";
import { fcfa } from "@/lib/organizer";

export const Route = createFileRoute("/admin/disputes")({
  head: () => ({
    meta: [
      { title: "Litiges — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Arbitrez les litiges entre étudiants et organisateurs : remboursements, annulations, double débit.",
      },
      { property: "og:title", content: "Litiges — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "Centre d'arbitrage des réclamations de la plateforme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DisputesPage,
});

type Filter = "all" | Dispute["status"];

function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>(initialDisputes);
  const [filter, setFilter] = useState<Filter>("all");

  const rows = disputes.filter((d) => filter === "all" || d.status === filter);
  const open = disputes.filter((d) => d.status !== "resolved");
  const exposure = open.reduce((sum, d) => sum + d.amount, 0);

  function decide(d: Dispute, outcome: "refund" | "organizer") {
    setDisputes((prev) => prev.map((x) => (x.id === d.id ? { ...x, status: "resolved" } : x)));
    toast.success(
      outcome === "refund"
        ? `${d.student} sera remboursé de ${fcfa(d.amount)}.`
        : `Litige ${d.id} tranché en faveur de ${d.organizer}.`,
    );
  }

  return (
    <>
      <PageHeader
        title="Litiges"
        subtitle="Votre arbitrage est final : remboursement étudiant ou maintien du paiement."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Litiges ouverts"
          value={String(open.length)}
          secondary="En attente de décision"
          icon={AlertTriangle}
          accent="warning"
        />
        <KpiCard
          title="Montant en jeu"
          value={fcfa(exposure)}
          secondary="Sommes gelées"
          icon={Scale}
          accent="info"
        />
        <KpiCard
          title="Résolus"
          value={String(disputes.filter((d) => d.status === "resolved").length)}
          secondary="Dossiers clôturés"
          icon={Check}
          accent="mint"
        />
      </div>

      <div className="py-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tous" },
            { value: "open", label: "Ouverts" },
            { value: "review", label: "En analyse" },
            { value: "resolved", label: "Résolus" },
          ]}
        />
      </div>

      <Panel bodyClassName="p-0">
        {rows.length === 0 ? (
          <EmptyState icon={Check} message="Aucun litige dans cette catégorie." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-56 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold">{d.id}</span>
                    <TonePill
                      tone={d.status === "open" ? "danger" : d.status === "review" ? "warning" : "success"}
                    >
                      {disputeStatusLabels[d.status]}
                    </TonePill>
                  </div>
                  <p className="mt-1 text-sm font-bold">{d.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.student} vs {d.organizer} · ouvert le {d.opened}
                  </p>
                </div>
                <p className="text-sm font-extrabold">{fcfa(d.amount)}</p>
                {d.status !== "resolved" && (
                  <div className="flex gap-2">
                    <AdminButton variant="success" onClick={() => decide(d, "refund")}>
                      <Undo2 className="size-3.5" /> Rembourser l'étudiant
                    </AdminButton>
                    <AdminButton variant="ghost" onClick={() => decide(d, "organizer")}>
                      <Scale className="size-3.5" /> Trancher pour l'organisateur
                    </AdminButton>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
