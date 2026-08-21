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
import { KpiCard, PageHeader, Panel, Avatar } from "@/components/organizer/ui";
import { AdminButton, TonePill } from "@/components/admin/ui";
import { PaymentMark } from "@/components/PaymentMark";
import { useQuery } from "@tanstack/react-query";
import { adminOverviewQuery } from "@/lib/dash-queries";
import {
  organizerStatusLabels,
  organizerStatusTone,
  payoutStatusLabels,
  disputeStatusLabels,
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
  const { data: overview } = useQuery(adminOverviewQuery());

  const kpis = overview?.kpis;
  const growthChartData = overview?.growth ?? [];
  const pendingOrgs = (overview?.pending ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    university: "Formulaire en attente",
    requestedAt: new Date(p.createdAt).toLocaleDateString("fr-FR"),
    status: "pending" as const,
    initials: p.name.substring(0, 2).toUpperCase(),
  }));

  const recentDisputes = overview?.recentDisputes ?? [];
  const recentPayouts = (overview?.recentPayouts ?? []).filter((p) => p.status !== "paid");
  const activityFeed = overview?.activity ?? [];
  const pendingCount = kpis?.pendingOrganizers ?? 0;
  const openDisputeCount = kpis?.disputes ?? 0;

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
          value={fcfa(kpis?.gmv ?? 0)}
          secondary={`${fmt(kpis?.bookings ?? 0)} réservations`}
          icon={Coins}
        />
        <KpiCard
          title="Commissions"
          value={fcfa(kpis?.commission ?? 0)}
          secondary="Revenus de la plateforme"
          icon={Wallet}
          accent="mint"
        />
        <KpiCard
          title="Étudiants inscrits"
          value={fmt(kpis?.students ?? 0)}
          secondary={`${kpis?.organizers ?? 0} organisateurs actifs`}
          icon={Users}
          accent="info"
        />
        <KpiCard
          title="Caravanes publiées"
          value={fmt(kpis?.caravans ?? 0)}
          secondary={`${kpis?.activeCaravans ?? 0} en cours · ${kpis?.fillRate ?? 0} % de remplissage`}
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
            {growthChartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Aucune donnée de paiement pour le moment.
              </div>
            ) : (
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
                  <Area type="monotone" dataKey="gmv" name="Volume" stroke="var(--color-primary)" strokeWidth={2} fill="url(#gmvGrad)" />
                  <Area type="monotone" dataKey="commission" name="Commissions" stroke="var(--color-mint)" strokeWidth={2} fill="url(#comGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Demandes d'organisateur" description="Vous seul validez ces comptes" bodyClassName="p-0">
          {pendingOrgs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Aucune demande en attente.</p>
          ) : (
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
          )}
          <div className="border-t border-border px-5 py-4">
            <Link to="/admin/organizers" className="text-xs font-bold text-primary hover:underline">
              Ouvrir la file de validation →
            </Link>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel title="Retraits à traiter" description="Versements demandés par les organisateurs" bodyClassName="p-0">
          {recentPayouts.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Aucun retrait en attente.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentPayouts.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary">
                    <Wallet className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.organizer}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      {fcfa(p.amount)} &middot;
                      <PaymentMark method={p.method.toLowerCase() as any} className="size-4 shadow-none border-none bg-transparent" />
                    </p>
                  </div>
                  <TonePill tone={p.status === "requested" ? "warning" : "info"}>
                    {payoutStatusLabels[p.status] ?? p.status}
                  </TonePill>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-border px-5 py-4">
            <Link to="/admin/finance" className="text-xs font-bold text-primary hover:underline">
              Gérer les finances →
            </Link>
          </div>
        </Panel>

        <Panel title="Santé du système">
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", openDisputeCount === 0 ? "bg-success" : "bg-warning")} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Litiges</span>
                <span className="block text-xs text-muted-foreground">
                  {openDisputeCount === 0 ? "Aucun litige ouvert" : `${openDisputeCount} litige(s) en cours`}
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-success" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Base de données</span>
                <span className="block text-xs text-muted-foreground">Supabase connecté</span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1.5 size-2 shrink-0 rounded-full bg-success" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Paiements</span>
                <span className="block text-xs text-muted-foreground">
                  {(kpis?.pendingPayouts ?? 0) === 0
                    ? "Aucun retrait en attente"
                    : `${kpis?.pendingPayouts} retrait(s) · ${fcfa(kpis?.pendingPayoutAmount ?? 0)}`}
                </span>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", (kpis?.blocked ?? 0) > 0 ? "bg-warning" : "bg-success")} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold">Utilisateurs bloqués</span>
                <span className="block text-xs text-muted-foreground">
                  {(kpis?.blocked ?? 0) === 0 ? "Aucun compte bloqué" : `${kpis?.blocked} compte(s) bloqué(s)`}
                </span>
              </span>
            </li>
          </ul>
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-danger/5 p-3">
            <AlertTriangle className="size-4 shrink-0 text-danger" />
            <p className="text-xs text-muted-foreground">
              {openDisputeCount} litige(s) ouvert(s) nécessitent votre arbitrage.
            </p>
          </div>
        </Panel>

        <Panel title="Activité plateforme" bodyClassName="p-0">
          {activityFeed.length === 0 ? (
            <p className="px-5 py-6 text-sm text-muted-foreground">Aucune activité récente enregistrée.</p>
          ) : (
            <ul className="divide-y divide-border">
              {activityFeed.map((a) => (
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
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Litiges récents" bodyClassName="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Référence</th>
                  <th className="px-5 py-3 font-bold">Sujet</th>
                  <th className="px-5 py-3 font-bold">Montant</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-5 py-3 font-bold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-sm text-muted-foreground">
                      Aucun litige pour le moment.
                    </td>
                  </tr>
                ) : (
                  recentDisputes.map((d) => (
                    <tr key={d.id}>
                      <td className="px-5 py-3 font-mono text-xs font-bold">{d.id}</td>
                      <td className="px-5 py-3">{d.subject}</td>
                      <td className="px-5 py-3 font-semibold">{fcfa(d.amount)}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {new Date(d.createdAt).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="px-5 py-3">
                        <TonePill
                          tone={
                            d.status === "open" ? "danger" : d.status === "review" ? "warning" : "success"
                          }
                        >
                          {(disputeStatusLabels as Record<string, string>)[d.status] ?? d.status}
                        </TonePill>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-5 py-4">
            <Link to="/admin/disputes" className="text-xs font-bold text-primary hover:underline">
              Tous les litiges →
            </Link>
          </div>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint/12 text-mint">
                <TrendingUp className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold">Synthèse</p>
                <p className="text-sm text-muted-foreground">
                  {(kpis?.bookings ?? 0) === 0
                    ? "Aucune réservation encore. Créez des caravanes pour démarrer."
                    : `${fmt(kpis?.bookings ?? 0)} réservations pour ${fcfa(kpis?.gmv ?? 0)} de volume total.`}
                </p>
              </div>
            </div>
            <Link to="/admin/organizers">
              <AdminButton>
                <BadgeCheck className="size-3.5" /> Voir les organisateurs
              </AdminButton>
            </Link>
          </div>
        </Panel>
      </div>
    </>
  );
}
