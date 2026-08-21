import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  BadgeCheck,
  Bus,
  Coins,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { KpiCard, PageHeader, Panel, ProgressBar, Avatar } from "@/components/organizer/ui";
import { AdminButton, TonePill } from "@/components/admin/ui";
import { useQuery } from "@tanstack/react-query";
import { adminOverviewQuery } from "@/lib/dash-queries";
import {
  adminActivity,
  disputes,
  disputeStatusLabels,
  organizerAccounts,
  organizerStatusLabels,
  organizerStatusTone,
  payouts,
  payoutStatusLabels,
  platformGrowth,
  platformKpis,
  systemHealth,
  universitySplit,
} from "@/lib/admin";
import { fcfa, fmt } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Vue plateforme — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Supervisez toute la plateforme Caravane Étudiants : organisateurs, volume de réservations, commissions et litiges.",
      },
      { property: "og:title", content: "Vue plateforme — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "Le centre de contrôle du propriétaire de la plateforme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminDashboard,
});

const ranges = ["30 jours", "90 jours", "12 mois"] as const;

function AdminDashboard() {
  const [range, setRange] = useState<(typeof ranges)[number]>("90 jours");
  const { data: overview, isLoading } = useQuery(adminOverviewQuery());

  const kpis = overview?.kpis;
  const growthChartData = overview?.growth?.length ? overview.growth : platformGrowth;
  const pendingOrgs = overview?.pending?.length
    ? overview.pending.map((p) => ({
        id: p.id,
        name: p.name,
        university: "Formulaire en attente",
        documents: [],
        verifiedCount: 0,
        requestedAt: new Date(p.createdAt).toLocaleDateString("fr-FR"),
        status: "pending" as const,
        initials: p.name.substring(0, 2).toUpperCase(),
      }))
    : organizerAccounts.filter((o) => o.status === "pending");

  const openDisputes = disputes.filter((d) => d.status !== "resolved");
  const pendingPayouts = payouts.filter((p) => p.status !== "paid");
  const pendingCount = kpis?.pendingOrganizers ?? pendingOrgs.length;

  return (
    <>
      <PageHeader
        title="Vue plateforme"
        subtitle="Tout ce qui se passe sur Caravane Étudiants, en un seul écran."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-xl border border-border bg-card p-1">
              {ranges.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                    range === r
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
            <Link
              to="/admin/organizers"
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90"
            >
              <BadgeCheck className="size-3.5" /> Traiter les demandes ({pendingCount})
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Volume total (GMV)"
          value={fcfa(kpis?.gmv ?? platformKpis.gmv)}
          secondary={`${fmt(kpis?.bookings ?? platformKpis.bookings)} réservations`}
          trend={platformKpis.gmvTrend}
          icon={Coins}
        />
        <KpiCard
          title="Commissions"
          value={fcfa(kpis?.commission ?? platformKpis.commission)}
          secondary="Revenus de la plateforme"
          trend={platformKpis.commissionTrend}
          icon={Wallet}
          accent="mint"
        />
        <KpiCard
          title="Étudiants inscrits"
          value={fmt(kpis?.students ?? platformKpis.students)}
          secondary={`${kpis?.organizers ?? platformKpis.organizers} organisateurs actifs`}
          trend={platformKpis.studentsTrend}
          icon={Users}
          accent="info"
        />
        <KpiCard
          title="Caravanes publiées"
          value={fmt(kpis?.caravans ?? platformKpis.caravans)}
          secondary={`${kpis?.activeCaravans ?? platformKpis.activeCaravans} en cours · ${kpis?.fillRate ?? platformKpis.fillRate} % de remplissage`}
          trend={platformKpis.organizersTrend}
          icon={Bus}
          accent="warning"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Croissance de la plateforme"
          description="Volume traité et commissions encaissées"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthChartData} margin={{ left: -12, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="comGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-mint)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-mint)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area
                  type="monotone"
                  dataKey="gmv"
                  name="Volume"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  fill="url(#gmvGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="commission"
                  name="Commissions"
                  stroke="var(--color-mint)"
                  strokeWidth={2}
                  fill="url(#comGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Demandes d'organisateur" description="Vous seul validez ces comptes" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {pendingOrgs.map((o) => (
              <li key={o.id} className="flex items-start gap-3 px-5 py-4">
                <Avatar initials={o.initials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{o.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.university}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/80">
                    Demande enregistrée le {o.requestedAt}
                  </p>
                </div>
                <TonePill tone={organizerStatusTone[o.status]}>
                  {organizerStatusLabels[o.status]}
                </TonePill>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-5 py-4">
            <Link
              to="/admin/organizers"
              className="text-xs font-bold text-primary hover:underline"
            >
              Ouvrir la file de validation →
            </Link>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Parts de marché par université">
          <ul className="space-y-4">
            {universitySplit.map((u) => (
              <li key={u.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{u.name}</span>
                  <span className="text-muted-foreground">{fcfa(u.revenue)}</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={u.value} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Retraits à traiter" description="Versements demandés par les organisateurs" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {pendingPayouts.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-5 py-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary">
                  <Wallet className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{p.organizer}</p>
                  <p className="text-xs text-muted-foreground">
                    {fcfa(p.amount)} · {p.method}
                  </p>
                </div>
                <TonePill tone={p.status === "requested" ? "warning" : "info"}>
                  {payoutStatusLabels[p.status]}
                </TonePill>
              </li>
            ))}
          </ul>
          <div className="border-t border-border px-5 py-4">
            <Link to="/admin/finance" className="text-xs font-bold text-primary hover:underline">
              Gérer les finances →
            </Link>
          </div>
        </Panel>

        <Panel title="Santé du système">
          <ul className="space-y-3">
            {systemHealth.map((s) => (
              <li key={s.label} className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    s.status === "ok" ? "bg-success" : "bg-warning",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">{s.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-danger/5 p-3">
            <AlertTriangle className="size-4 shrink-0 text-danger" />
            <p className="text-xs text-muted-foreground">
              {openDisputes.length} litige(s) ouvert(s) nécessitent votre arbitrage.
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Litiges récents" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Référence</th>
                  <th className="px-5 py-3 font-bold">Étudiant</th>
                  <th className="px-5 py-3 font-bold">Organisateur</th>
                  <th className="px-5 py-3 font-bold">Montant</th>
                  <th className="px-5 py-3 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {disputes.map((d) => (
                  <tr key={d.id}>
                    <td className="px-5 py-3 font-mono text-xs font-bold">{d.id}</td>
                    <td className="px-5 py-3">{d.student}</td>
                    <td className="px-5 py-3 text-muted-foreground">{d.organizer}</td>
                    <td className="px-5 py-3 font-semibold">{fcfa(d.amount)}</td>
                    <td className="px-5 py-3">
                      <TonePill
                        tone={
                          d.status === "open" ? "danger" : d.status === "review" ? "warning" : "success"
                        }
                      >
                        {disputeStatusLabels[d.status]}
                      </TonePill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-4">
            <Link to="/admin/disputes" className="text-xs font-bold text-primary hover:underline">
              Tous les litiges →
            </Link>
          </div>
        </Panel>

        <Panel title="Activité plateforme" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {adminActivity.map((a) => (
              <li key={a.id} className="flex gap-3 px-5 py-3.5">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    a.tone === "success" && "bg-success",
                    a.tone === "warning" && "bg-warning",
                    a.tone === "info" && "bg-info",
                    a.tone === "danger" && "bg-danger",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{a.title}</span>
                  <span className="block text-xs text-muted-foreground">{a.detail}</span>
                  <span className="block text-[11px] text-muted-foreground/70">{a.time}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-4">
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint/12 text-mint">
                <TrendingUp className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold">Prochaine action recommandée</p>
                <p className="text-sm text-muted-foreground">
                  Approuver l'Amicale UGB ouvrirait l'axe Saint-Louis → Dakar, estimé à 240 000 FCFA
                  de volume mensuel.
                </p>
              </div>
            </div>
            <AdminButton>
              <BadgeCheck className="size-3.5" /> Voir le dossier
            </AdminButton>
          </div>
        </Panel>
      </div>
    </>
  );
}
