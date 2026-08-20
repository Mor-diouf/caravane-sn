import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Check, Loader2, Scale, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EmptyState, KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, Tabs, TonePill } from "@/components/admin/ui";
import { adminDisputesQuery } from "@/lib/dash-queries";
import { adminResolveDispute } from "@/lib/admin.functions";
import { dateFr } from "@/lib/dash-shared";
import { fcfa } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/admin/disputes")({
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

type DisputeStatus = "open" | "investigating" | "resolved" | "rejected";
type Filter = "all" | DisputeStatus;

const disputeStatusLabels: Record<DisputeStatus, string> = {
  open: "Ouvert",
  investigating: "En analyse",
  resolved: "Résolu",
  rejected: "Rejeté",
};

function DisputesPage() {
  const { data: disputes, isLoading } = useQuery(adminDisputesQuery());
  const [filter, setFilter] = useState<Filter>("all");

  const all = disputes ?? [];
  const rows = all.filter((d) => filter === "all" || d.status === filter);
  const open = all.filter((d) => d.status !== "resolved" && d.status !== "rejected");
  const exposure = open.reduce((sum, d) => sum + d.amount, 0);

  const queryClient = useQueryClient();
  const resolveDisputeFn = useServerFn(adminResolveDispute);
  const mutation = useMutation({
    mutationFn: resolveDisputeFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "disputes"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  function decide(d: (typeof all)[number], outcome: "refund" | "organizer") {
    mutation.mutate(
      {
        data:
          outcome === "refund"
            ? { disputeId: d.id, status: "resolved", refund: d.amount }
            : { disputeId: d.id, status: "rejected" },
      },
      {
        onSuccess: () =>
          toast.success(
            outcome === "refund"
              ? `${d.student} sera remboursé de ${fcfa(d.amount)}.`
              : `Litige tranché en faveur de ${d.organizer}.`,
          ),
      },
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
          value={isLoading ? "…" : String(open.length)}
          secondary="En attente de décision"
          icon={AlertTriangle}
          accent="warning"
        />
        <KpiCard
          title="Montant en jeu"
          value={isLoading ? "…" : fcfa(exposure)}
          secondary="Sommes gelées"
          icon={Scale}
          accent="info"
        />
        <KpiCard
          title="Résolus"
          value={isLoading ? "…" : String(all.filter((d) => d.status === "resolved").length)}
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
            { value: "investigating", label: "En analyse" },
            { value: "resolved", label: "Résolus" },
          ]}
        />
      </div>

      <Panel bodyClassName="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Check} message="Aucun litige dans cette catégorie." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-56 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold">{d.reference}</span>
                    <TonePill
                      tone={
                        d.status === "open"
                          ? "danger"
                          : d.status === "investigating"
                            ? "warning"
                            : d.status === "resolved"
                              ? "success"
                              : "neutral"
                      }
                    >
                      {disputeStatusLabels[d.status as DisputeStatus] ?? d.status}
                    </TonePill>
                  </div>
                  <p className="mt-1 text-sm font-bold">{d.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.student} vs {d.organizer} · ouvert le {dateFr(d.createdAt)}
                  </p>
                </div>
                <p className="text-sm font-extrabold">{fcfa(d.amount)}</p>
                {d.status !== "resolved" && d.status !== "rejected" && (
                  <div className="flex gap-2">
                    <AdminButton
                      variant="success"
                      disabled={mutation.isPending}
                      onClick={() => decide(d, "refund")}
                    >
                      <Undo2 className="size-3.5" /> Rembourser l'étudiant
                    </AdminButton>
                    <AdminButton
                      variant="ghost"
                      disabled={mutation.isPending}
                      onClick={() => decide(d, "organizer")}
                    >
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
