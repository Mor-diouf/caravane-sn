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
import { ArrowDownToLine, Undo2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { KpiCard, PageHeader, Panel, StatusPill } from "@/components/organizer/ui";
import { bookings, fcfa, monthlySeries, paymentMethodSplit } from "@/lib/organizer";

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

function PaymentsPage() {
  const gross = paymentMethodSplit.reduce((a, m) => a + m.amount, 0);
  const commission = Math.round(gross * 0.03);

  return (
    <>
      <PageHeader
        title="Paiements"
        subtitle="Encaissements mobile money, commissions et retraits vers votre compte."
        actions={
          <button
            type="button"
            onClick={() =>
              toast.success("Demande de retrait envoyée", {
                description: "Les fonds arrivent sous 24 h ouvrées sur votre compte Wave.",
              })
            }
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-ambient"
          >
            <ArrowDownToLine className="size-4" /> Demander un retrait
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Encaissements bruts" value={fcfa(gross)} trend="+18%" icon={Wallet} accent="mint" />
        <KpiCard title="Commission plateforme" value={fcfa(commission)} secondary="3% par billet" icon={Wallet} />
        <KpiCard title="Solde disponible" value={fcfa(gross - commission)} secondary="Retirable maintenant" icon={Wallet} accent="info" />
        <KpiCard title="Remboursements" value={fcfa(8500)} secondary="1 dossier traité" icon={Undo2} accent="warning" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Revenus mensuels" description="Encaissements des 6 derniers mois">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySeries} margin={{ left: -6, right: 8, top: 8 }}>
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
                <Pie data={paymentMethodSplit} dataKey="value" nameKey="name" innerRadius={52} outerRadius={80} paddingAngle={3}>
                  {paymentMethodSplit.map((entry, i) => (
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
            {paymentMethodSplit.map((m, i) => (
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

      <Panel className="mt-4" title="Transactions" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Référence</th>
                <th className="px-5 py-3 font-semibold">Étudiant</th>
                <th className="px-5 py-3 font-semibold">Méthode</th>
                <th className="px-5 py-3 font-semibold">Montant</th>
                <th className="px-5 py-3 font-semibold">Statut</th>
                <th className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-muted/40">
                  <td className="px-5 py-3.5 font-mono text-xs">{b.id}</td>
                  <td className="px-5 py-3.5 font-semibold">{b.student}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{b.method}</td>
                  <td className="px-5 py-3.5 font-semibold">{fcfa(b.amount)}</td>
                  <td className="px-5 py-3.5">
                    <StatusPill status={b.status} />
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{b.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
