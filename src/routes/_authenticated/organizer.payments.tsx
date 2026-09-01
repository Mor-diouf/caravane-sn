import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
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
import { ArrowDownToLine, Undo2, Wallet, History } from "lucide-react";
import { toast } from "sonner";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/organizer/ui";
import { PaymentMark } from "@/components/PaymentMark";
import { orgPaymentsQuery } from "@/lib/dash-queries";
import { organizerRequestPayout } from "@/lib/organizer.functions";
import { fcfa, monthlySeries as mockMonthlySeries } from "@/lib/organizer";
import { cn } from "@/lib/utils";
import { dateTimeFr } from "@/lib/dash-shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/organizer/payments")({
  head: () => ({
    meta: [
      { title: "Paiements — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Suivi des encaissements Wave, Orange Money et Free Money, commissions, soldes et retraits.",
      },
      { property: "og:title", content: "Paiements — CaravaneHub" },
      {
        property: "og:description",
        content: "Vos revenus mobile money, prêts à être retirés en un clic.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PaymentsPage,
});

const colors = ["var(--color-info)", "var(--color-warning)", "var(--color-mint)", "var(--color-primary-accent)"];

function WithdrawModal({
  net,
  caravanId,
  caravanRoute,
  isPending,
  onWithdraw,
}: {
  net: number;
  caravanId: string;
  caravanRoute: string;
  isPending: boolean;
  onWithdraw: (amount: number, method: "wave" | "orange" | "free", caravanId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"wave" | "orange" | "free">("wave");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={net <= 0 || isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-ambient hover:opacity-90 disabled:opacity-50 transition-all active:scale-[0.98]"
        >
          <ArrowDownToLine className="size-4" /> {isPending ? "En cours..." : "Demander un retrait"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Retrait pour {caravanRoute}</DialogTitle>
          <DialogDescription>
            Transférez les gains de cette caravane vers votre compte mobile money.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-info/20 bg-info/5 p-4">
            <span className="text-sm font-semibold text-info">Montant retirable</span>
            <span className="text-2xl font-extrabold text-info">{fcfa(net)}</span>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-semibold text-foreground">Méthode de réception</label>
            <div className="grid grid-cols-3 gap-3">
              {(["wave", "orange", "free"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "flex flex-col items-center gap-3 rounded-xl border-2 p-3 transition-all",
                    method === m
                      ? "border-primary-accent bg-primary-accent/5"
                      : "border-border hover:border-border/80 hover:bg-muted/30"
                  )}
                >
                  <PaymentMark method={m as any} className="h-7 w-auto shadow-none border-none bg-transparent" />
                  <span className="text-xs font-bold capitalize">{m}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              onWithdraw(net, method, caravanId);
              setOpen(false);
            }}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90"
          >
            {isPending ? "Traitement..." : "Confirmer le retrait"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PaymentsPage() {
  const queryClient = useQueryClient();
  const { data: dbPayments, isLoading } = useQuery({ ...orgPaymentsQuery(), refetchInterval: 10000 });
  const requestPayoutFn = useServerFn(organizerRequestPayout);

  const payoutMutation = useMutation({
    mutationFn: (payload: { amount: number; method: "wave" | "orange" | "free"; caravanId: string }) =>
      requestPayoutFn({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Demande de retrait envoyée", {
        description: "Les fonds arrivent sous 24 h ouvrées sur votre compte mobile money.",
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const gross = dbPayments?.totals?.gross ?? 0;
  const commission = dbPayments?.totals?.commission ?? 0;
  const net = dbPayments?.totals?.net ?? 0;
  const available = dbPayments?.totals?.available ?? 0;

  const splitData = (dbPayments?.byMethod ?? []).map((m) => ({
    name: m.method.toUpperCase(),
    amount: m.amount,
    value: gross ? Math.round((m.amount / gross) * 100) : 0,
  }));

  const paymentList = (dbPayments?.payments ?? []).map((p) => ({
    id: p.reference || p.id.substring(0, 8),
    student: p.student,
    method: p.method ? p.method.toUpperCase() : "WAVE",
    amount: p.amount,
    status: (p.status === "paid" ? "paid" : "pending") as "paid" | "pending",
    date: new Date(p.date).toLocaleDateString("fr-FR"),
  }));

  const payoutList = dbPayments?.payouts ?? [];
  const caravanBalances = dbPayments?.caravanBalances ?? [];

  return (
    <>
      <PageHeader
        title="Finances & Portefeuille"
        subtitle="Suivez vos encaissements, vos commissions et retirez vos gains par caravane sur Wave/Orange Money."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Encaissements bruts" value={fcfa(gross)} trend="+18%" icon={Wallet} accent="mint" />
        <KpiCard title="Commission globale" value={fcfa(commission)} secondary="Revenus de la plateforme" icon={Wallet} />
        <KpiCard title="Solde total disponible" value={fcfa(available)} secondary="Toutes caravanes confondues" icon={Wallet} accent="info" />
        <KpiCard title="Remboursements" value={fcfa(0)} secondary="0 dossier" icon={Undo2} accent="warning" />
      </div>

      <div className="mt-4">
        <Panel title="Soldes par caravane" description="Effectuez vos retraits spécifiquement pour chaque trajet" bodyClassName="p-0">
          {caravanBalances.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
              <Wallet className="size-8 mb-3 opacity-50" />
              <p className="text-sm">Aucune donnée financière pour vos caravanes.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-card">
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-4 font-semibold">Trajet</th>
                    <th className="px-5 py-4 font-semibold text-right">Encaissements</th>
                    <th className="px-5 py-4 font-semibold text-right">Net généré</th>
                    <th className="px-5 py-4 font-semibold text-right">Solde Retirable</th>
                    <th className="px-5 py-4 font-semibold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {caravanBalances.map((c) => (
                    <tr key={c.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-4 font-semibold">{c.route}</td>
                      <td className="px-5 py-4 text-right text-muted-foreground">{fcfa(c.gross)}</td>
                      <td className="px-5 py-4 text-right font-medium">{fcfa(c.net)}</td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-bold text-info">{fcfa(c.available)}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <WithdrawModal
                          net={c.available}
                          caravanId={c.id}
                          caravanRoute={c.route}
                          isPending={payoutMutation.isPending}
                          onWithdraw={(amount, method, caravanId) => payoutMutation.mutate({ amount, method, caravanId })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Revenus mensuels" description="Encaissements des 6 derniers mois">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMonthlySeries} margin={{ left: -6, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickFormatter={(v: number) => `${v / 1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip
                  formatter={(v: number) => fcfa(v)}
                  contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-card)" }}
                />
                <Bar dataKey="revenus" name="Revenus" radius={[8, 8, 0, 0]} fill="var(--color-primary-accent)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Répartition par méthode">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={splitData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
                  {splitData.map((entry, i) => (
                    <Cell key={entry.name} fill={colors[i % colors.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => `${v}%`}
                  contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-card)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {splitData.map((m, i) => (
              <li key={m.name} className="flex items-center gap-2">
                <span className="size-2.5 rounded-full" style={{ background: colors[i % colors.length] }} />
                <span className="flex-1">{m.name}</span>
                <span className="font-semibold">{m.value}%</span>
                <span className="text-xs text-muted-foreground">{fcfa(m.amount)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {/* Historique des Retraits */}
        <Panel
          title="Historique des retraits"
          description="Suivez l'état de vos demandes de virement"
          bodyClassName="p-0"
        >
          {payoutList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
              <History className="size-8 mb-3 opacity-50" />
              <p className="text-sm">Aucun retrait effectué pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Trajet</th>
                    <th className="px-5 py-3 font-semibold">Méthode</th>
                    <th className="px-5 py-3 font-semibold">Montant</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payoutList.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3 font-medium text-xs">
                        {p.caravanRoute}
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        <PaymentMark method={p.method as any} className="h-6 w-auto shadow-none border-none bg-transparent" />
                      </td>
                      <td className="px-5 py-3 font-bold">{fcfa(p.amount)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {dateTimeFr(p.requestedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            p.status === "paid"
                              ? "bg-success/15 text-success"
                              : "bg-warning/15 text-warning"
                          )}
                        >
                          {p.status === "paid" ? "Traité" : "En attente"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Historique des Réservations/Transactions */}
        <Panel title="Dernières transactions" description="Détail des ventes de billets" bodyClassName="p-0">
          {paymentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
              <Wallet className="size-8 mb-3 opacity-50" />
              <p className="text-sm">Aucune transaction pour le moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="sticky top-0 bg-card z-10">
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-5 py-3 font-semibold">Référence</th>
                    <th className="px-5 py-3 font-semibold">Étudiant</th>
                    <th className="px-5 py-3 font-semibold">Montant</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paymentList.slice(0, 10).map((b) => (
                    <tr key={b.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3 font-mono text-xs">{b.id}</td>
                      <td className="px-5 py-3 font-semibold">{b.student}</td>
                      <td className="px-5 py-3 font-bold text-mint">{fcfa(b.amount)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{b.date}</td>
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
