import { createFileRoute } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Coins, Download, Wallet, Percent } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, TonePill } from "@/components/admin/ui";
import { adminFinanceQuery, adminOverviewQuery } from "@/lib/dash-queries";
import { adminSetPayoutStatus, adminCaravanBalances } from "@/lib/admin.functions";
import { dateTimeFr, methodLabels } from "@/lib/dash-shared";
import { PaymentMark } from "@/components/PaymentMark";
import { fcfa } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/finance")({
  head: () => ({
    meta: [
      { title: "Finances — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Commissions, transactions mobile money et versements aux organisateurs de la plateforme.",
      },
      { property: "og:title", content: "Finances — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "Suivez chaque franc CFA qui transite sur Caravane Étudiants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FinancePage,
});

const pieColors = [
  "var(--color-primary)",
  "var(--color-mint)",
  "var(--color-info)",
  "var(--color-warning)",
  "var(--color-muted-foreground)",
];

const paymentStatusLabels: Record<string, string> = {
  paid: "Versé",
  pending: "En attente",
  refunded: "Remboursé",
  failed: "Échoué",
};

const payoutStatusLabels: Record<string, string> = {
  requested: "Demandé",
  approved: "Approuvé",
  paid: "Payé",
  rejected: "Rejeté",
};

function FinancePage() {
  const { data: finance, isLoading } = useQuery(adminFinanceQuery());
  const { data: overview } = useQuery(adminOverviewQuery());
  const { data: caravanBalances } = useQuery({
    queryKey: ["admin", "caravanBalances"],
    queryFn: () => adminCaravanBalances(),
  });

  const payments = finance?.payments ?? [];
  const payouts = finance?.payouts ?? [];
  const universitySplit = finance?.universitySplit ?? [];
  const growth = overview?.growth ?? [];
  const kpis = overview?.kpis;

  const queryClient = useQueryClient();
  const setPayoutStatusFn = useServerFn(adminSetPayoutStatus);
  const mutation = useMutation({
    mutationFn: setPayoutStatusFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  function approve(p: (typeof payouts)[number]) {
    mutation.mutate(
      { data: { payoutId: p.id, status: "paid" } },
      { onSuccess: () => toast.success(`Versement de ${fcfa(p.amount)} validé pour ${p.organizer}.`) },
    );
  }

  function exportCsv() {
    toast.success("Export comptable CSV généré.");
  }

  const pendingPayouts = payouts.filter((p) => p.status !== "paid");

  return (
    <>
      <PageHeader
        title="Finances"
        subtitle="Commissions plateforme, transactions et versements organisateurs."
        actions={
          <AdminButton variant="ghost" onClick={exportCsv}>
            <Download className="size-3.5" /> Export comptable
          </AdminButton>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Volume traité"
          value={isLoading ? "…" : fcfa(kpis?.gmv ?? 0)}
          secondary="Depuis le lancement"
          icon={Coins}
        />
        <KpiCard
          title="Commissions encaissées"
          value={isLoading ? "…" : fcfa(kpis?.commission ?? 0)}
          secondary="Revenus de la plateforme"
          icon={Percent}
          accent="mint"
        />
        <KpiCard
          title="Versements en attente"
          value={fcfa(pendingPayouts.reduce((sum, p) => sum + p.amount, 0))}
          secondary={`${pendingPayouts.length} demandes`}
          icon={Wallet}
          accent="warning"
        />
        <KpiCard
          title="Litiges financiers"
          value={String(kpis?.disputes ?? 0)}
          secondary="À arbitrer"
          icon={Coins}
          accent="info"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Commissions mensuelles">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={growth} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={64} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => fcfa(value)}
                />
                <Bar
                  dataKey="commission"
                  name="Commissions"
                  fill="var(--color-primary)"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Répartition par université">
          {universitySplit.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">Aucune donnée disponible.</p>
          ) : (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={universitySplit}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={2}
                    >
                      {universitySplit.map((u, i) => (
                        <Cell key={u.name} fill={pieColors[i % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--color-border)",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => `${value} %`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 space-y-2">
                {universitySplit.map((u, i) => (
                  <li key={u.name} className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: pieColors[i % pieColors.length] }}
                    />
                    <span className="flex-1 font-semibold">{u.name}</span>
                    <span className="text-muted-foreground">{fcfa(u.revenue)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Demandes de versement" bodyClassName="p-0">
          {payouts.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">Aucune demande.</p>
          ) : (
            <ul className="divide-y divide-border">
              {payouts.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-40 flex-1">
                    <p className="text-sm font-bold">{p.organizer}</p>
                    {p.caravanRoute && (
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{p.caravanRoute}</p>
                    )}
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {fcfa(p.amount)} &middot;
                      <PaymentMark method={p.method.toLowerCase() as any} className="h-6 w-auto min-w-[2.5rem] shadow-none border-none bg-transparent" />
                      &middot; {dateTimeFr(p.requestedAt)}
                    </p>
                    {p.status === "requested" && p.availableBalance !== null && (
                      <p className="mt-1 text-xs text-info font-medium">
                        Solde disponible : {fcfa(p.availableBalance)}
                      </p>
                    )}
                  </div>
                  <TonePill
                    tone={p.status === "paid" ? "success" : p.status === "approved" ? "info" : "warning"}
                  >
                    {payoutStatusLabels[p.status] ?? p.status}
                  </TonePill>
                  {p.status !== "paid" && (
                    <AdminButton onClick={() => approve(p)}>Valider</AdminButton>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Dernières transactions" bodyClassName="p-0">
          {payments.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">Aucune transaction.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-bold">Réf.</th>
                    <th className="px-5 py-3 font-bold">Organisateur</th>
                    <th className="px-5 py-3 font-bold">Montant</th>
                    <th className="px-5 py-3 font-bold">Commission</th>
                    <th className="px-5 py-3 font-bold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((t) => (
                    <tr key={t.id}>
                      <td className="px-5 py-3 font-mono text-xs font-bold">{t.reference}</td>
                      <td className="px-5 py-3 text-muted-foreground">{t.organizer}</td>
                      <td className="px-5 py-3 font-semibold">{fcfa(t.amount)}</td>
                      <td className="px-5 py-3 text-mint">{fcfa(t.commission)}</td>
                      <td className="px-5 py-3">
                        <TonePill
                          tone={
                            t.status === "paid"
                              ? "success"
                              : t.status === "pending"
                                ? "warning"
                                : t.status === "failed"
                                  ? "danger"
                                  : "neutral"
                          }
                        >
                          {paymentStatusLabels[t.status] ?? t.status}
                        </TonePill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4">
        <Panel title="Soldes par Caravane (Vue globale)" bodyClassName="p-0">
          {!caravanBalances || caravanBalances.length === 0 ? (
            <p className="px-5 py-8 text-center text-xs text-muted-foreground">Aucune caravane disponible.</p>
          ) : (
            <div className="overflow-x-auto max-h-96">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-bold">Trajet</th>
                    <th className="px-5 py-3 font-bold">Organisateur</th>
                    <th className="px-5 py-3 font-bold text-right">Net généré</th>
                    <th className="px-5 py-3 font-bold text-right">Retraits (Payés)</th>
                    <th className="px-5 py-3 font-bold text-right">Solde disponible</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {caravanBalances.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3 font-medium text-xs">{c.route}</td>
                      <td className="px-5 py-3 text-muted-foreground">{c.organizer}</td>
                      <td className="px-5 py-3 font-semibold text-right">{fcfa(c.net)}</td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{fcfa(c.paidPayouts)}</td>
                      <td className="px-5 py-3 font-bold text-info text-right">{fcfa(c.available)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}
