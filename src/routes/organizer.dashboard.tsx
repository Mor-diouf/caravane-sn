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
  Bus,
  CreditCard,
  Plus,
  QrCode,
  Star,
  Ticket,
  Undo2,
  UserPlus,
  Wallet,
} from "lucide-react";
import {
  InsightBanner,
  KpiCard,
  Panel,
  PageHeader,
  ProgressBar,
  StatusPill,
  Avatar,
} from "@/components/organizer/ui";
import {
  activeCaravan,
  activity,
  bookings,
  fcfa,
  insights,
  organization,
  performanceSeries,
} from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/organizer/dashboard")({
  head: () => ({
    meta: [
      { title: "Vue d'ensemble — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Pilotez vos caravanes universitaires : réservations, revenus, remplissage et avis étudiants en temps réel.",
      },
      { property: "og:title", content: "Vue d'ensemble — CaravaneHub" },
      {
        property: "og:description",
        content: "Le centre de commande de votre activité de caravanes étudiantes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const ranges = ["7 jours", "30 jours", "90 jours"] as const;

const activityIcon = {
  booking: UserPlus,
  payment: CreditCard,
  review: Star,
  scan: QrCode,
  refund: Undo2,
} as const;

function DashboardPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>("7 jours");
  const occupancy = Math.round((activeCaravan.booked / activeCaravan.capacity) * 100);
  const available = activeCaravan.capacity - activeCaravan.booked - activeCaravan.pending;

  return (
    <>
      <PageHeader
        title={`Bonjour, ${organization.owner.name.split(" ")[0]} 👋`}
        subtitle="Voici la performance de votre activité aujourd'hui."
        actions={
          <>
            <Link
              to="/organizer/bookings"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <Ticket className="size-4" /> Voir les réservations
            </Link>
            <Link
              to="/organizer/scanner"
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
            >
              <QrCode className="size-4" /> Scanner un billet
            </Link>
            <Link
              to="/organizer/caravans"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-ambient transition-transform active:scale-[0.98]"
            >
              <Plus className="size-4" /> Créer une caravane
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Caravane active"
          value={activeCaravan.destination}
          secondary={`${activeCaravan.booked} / ${activeCaravan.capacity} places`}
          trend={activeCaravan.occupancyTrend}
          icon={Bus}
        />
        <KpiCard
          title="Réservations"
          value={String(activeCaravan.booked)}
          secondary={`sur ${activeCaravan.capacity} places`}
          trend="+12%"
          icon={Ticket}
          accent="info"
        />
        <KpiCard
          title="Revenus générés"
          value={fcfa(activeCaravan.revenue)}
          secondary="52 billets confirmés"
          trend="+21%"
          icon={Wallet}
          accent="mint"
        />
        <KpiCard
          title="Note moyenne"
          value={`${organization.rating}/5`}
          secondary={`${organization.reviews} avis vérifiés`}
          trend="+0.2"
          icon={Star}
          accent="warning"
        />
      </div>

      <div className="mt-4">
        <InsightBanner message={insights[2]} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Performance de la caravane"
          description={`${activeCaravan.route} · ${activeCaravan.date}`}
          actions={
            <div className="flex rounded-xl border border-border bg-muted/60 p-0.5">
              {ranges.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    range === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          }
          bodyClassName="p-3 sm:p-5"
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceSeries} margin={{ left: -18, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gradRes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-info)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-info)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-mint)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--color-mint)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 14,
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                    background: "var(--color-card)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="occupation"
                  name="Remplissage (%)"
                  stroke="var(--color-mint)"
                  strokeWidth={2}
                  fill="url(#gradOcc)"
                />
                <Area
                  type="monotone"
                  dataKey="reservations"
                  name="Réservations"
                  stroke="var(--color-info)"
                  strokeWidth={2.5}
                  fill="url(#gradRes)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="État des places" description={`${occupancy}% de remplissage`}>
          <ProgressBar value={occupancy} />
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "Occupées", value: activeCaravan.booked, dot: "bg-primary-accent" },
              { label: "En attente", value: activeCaravan.pending, dot: "bg-warning" },
              { label: "Disponibles", value: available, dot: "bg-muted-foreground/40" },
              { label: "Annulées", value: activeCaravan.cancelled, dot: "bg-danger" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/50 p-3">
                <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <span className={cn("size-1.5 rounded-full", s.dot)} /> {s.label}
                </dt>
                <dd className="mt-0.5 text-lg font-extrabold">{s.value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 grid grid-cols-10 gap-1.5">
            {Array.from({ length: activeCaravan.capacity }).map((_, i) => (
              <span
                key={i}
                title={`Place ${i + 1}`}
                className={cn(
                  "aspect-square rounded-[5px]",
                  i < activeCaravan.booked
                    ? "bg-primary-accent"
                    : i < activeCaravan.booked + activeCaravan.pending
                      ? "bg-warning"
                      : "bg-muted",
                )}
              />
            ))}
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Réservations récentes"
          actions={
            <Link
              to="/organizer/bookings"
              className="text-xs font-bold text-primary-accent hover:underline"
            >
              Tout voir
            </Link>
          }
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Étudiant</th>
                  <th className="px-5 py-3 font-semibold">Destination</th>
                  <th className="px-5 py-3 font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Paiement</th>
                  <th className="px-5 py-3 font-semibold">Billet</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bookings.slice(0, 6).map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-3">
                        <Avatar initials={b.initials} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{b.student}</span>
                          <span className="block text-[11px] text-muted-foreground">{b.id}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3">{b.destination}</td>
                    <td className="px-5 py-3 font-semibold">{fcfa(b.amount)}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{b.ticket}</td>
                    <td className="px-5 py-3 text-muted-foreground">{b.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Activité récente">
          <ol className="space-y-4">
            {activity.map((event) => {
              const Icon = activityIcon[event.kind];
              return (
                <li key={event.id} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">{event.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {event.detail}
                    </span>
                    <span className="block text-[11px] text-muted-foreground/70">{event.time}</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>
    </>
  );
}
