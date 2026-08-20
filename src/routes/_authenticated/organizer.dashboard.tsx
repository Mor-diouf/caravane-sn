import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Bus, CreditCard, Plus, QrCode, Star, Ticket, Wallet } from "lucide-react";
import {
  InsightBanner,
  KpiCard,
  Panel,
  PageHeader,
  ProgressBar,
  Avatar,
} from "@/components/organizer/ui";
import { orgBookingsQuery, orgOverviewQuery } from "@/lib/dash-queries";
import { dateTimeFr, initialsOf, methodLabels } from "@/lib/dash-shared";
import { fcfa } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/organizer/dashboard")({
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

const paymentTone: Record<string, string> = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/12 text-warning",
  failed: "bg-danger/10 text-danger",
};

function DashboardPage() {
  const { data: overview, isLoading } = useQuery(orgOverviewQuery());
  const { data: bookings } = useQuery(orgBookingsQuery());

  const caravans = overview?.caravans ?? [];
  const nextCaravan =
    caravans.find((c) => c.status === "published" && new Date(c.departureAt) > new Date()) ??
    caravans[0];
  const capacity = nextCaravan?.capacity ?? 0;
  const booked = nextCaravan?.booked ?? 0;
  const available = Math.max(0, capacity - booked);
  const occupancy = capacity ? Math.round((booked / capacity) * 100) : 0;

  const recentBookings = (bookings ?? []).slice(0, 6);

  return (
    <>
      <PageHeader
        title={`Bonjour, ${overview?.organizer.name?.split(" ")[0] ?? "Organisateur"} 👋`}
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

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des données…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Caravane active"
              value={nextCaravan?.route.split("→")[1]?.trim() ?? "—"}
              secondary={`${booked} / ${capacity} places`}
              icon={Bus}
            />
            <KpiCard
              title="Réservations"
              value={String(overview?.kpis.bookings ?? 0)}
              secondary={`${overview?.kpis.seatsSold ?? 0} places vendues`}
              icon={Ticket}
              accent="info"
            />
            <KpiCard
              title="Revenus générés"
              value={fcfa(overview?.kpis.revenue ?? 0)}
              secondary={`${overview?.kpis.reviews ?? 0} avis vérifiés`}
              icon={Wallet}
              accent="mint"
            />
            <KpiCard
              title="Note moyenne"
              value={`${overview?.kpis.rating ?? 0}/5`}
              secondary={`${overview?.kpis.reviews ?? 0} avis vérifiés`}
              icon={Star}
              accent="warning"
            />
          </div>

          <div className="mt-4">
            <InsightBanner
              message={`Votre taux de remplissage global est de ${overview?.kpis.fillRate ?? 0}%. ${
                overview?.kpis.upcoming ?? 0
              } caravane(s) à venir.`}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Panel
              className="xl:col-span-2"
              title="Performance"
              description="Revenus et réservations des derniers mois"
              bodyClassName="p-3 sm:p-5"
            >
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={overview?.series ?? []} margin={{ left: -18, right: 8, top: 8 }}>
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
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                    />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
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
                      dataKey="bookings"
                      name="Réservations"
                      stroke="var(--color-mint)"
                      strokeWidth={2}
                      fill="url(#gradOcc)"
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Revenus"
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
                  { label: "Occupées", value: booked, dot: "bg-primary-accent" },
                  { label: "Disponibles", value: available, dot: "bg-muted-foreground/40" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-muted/50 p-3">
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <span className={cn("size-1.5 rounded-full", s.dot)} /> {s.label}
                    </dt>
                    <dd className="mt-0.5 text-lg font-extrabold">{s.value}</dd>
                  </div>
                ))}
              </dl>
              {capacity > 0 && (
                <div className="mt-4 grid grid-cols-10 gap-1.5">
                  {Array.from({ length: capacity }).map((_, i) => (
                    <span
                      key={i}
                      title={`Place ${i + 1}`}
                      className={cn("aspect-square rounded-[5px]", i < booked ? "bg-primary-accent" : "bg-muted")}
                    />
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-3">
            <Panel
              className="xl:col-span-2"
              title="Réservations récentes"
              actions={
                <Link to="/organizer/bookings" className="text-xs font-bold text-primary-accent hover:underline">
                  Tout voir
                </Link>
              }
              bodyClassName="p-0"
            >
              {recentBookings.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucune réservation pour l'instant.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                        <th className="px-5 py-3 font-semibold">Étudiant</th>
                        <th className="px-5 py-3 font-semibold">Trajet</th>
                        <th className="px-5 py-3 font-semibold">Montant</th>
                        <th className="px-5 py-3 font-semibold">Paiement</th>
                        <th className="px-5 py-3 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {recentBookings.map((b) => (
                        <tr key={b.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-5 py-3">
                            <span className="flex items-center gap-3">
                              <Avatar initials={initialsOf(b.student)} />
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">{b.student}</span>
                                <span className="block text-[11px] text-muted-foreground">{b.reference}</span>
                              </span>
                            </span>
                          </td>
                          <td className="px-5 py-3">{b.route}</td>
                          <td className="px-5 py-3 font-semibold">{fcfa(b.amount)}</td>
                          <td className="px-5 py-3">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-bold",
                                paymentTone[b.paymentStatus] ?? "bg-muted text-muted-foreground",
                              )}
                            >
                              {b.method ? methodLabels[b.method] ?? b.method : "—"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-muted-foreground">{dateTimeFr(b.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Activité récente">
              {recentBookings.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Aucune activité récente.</p>
              ) : (
                <ol className="space-y-4">
                  {recentBookings.map((b) => (
                    <li key={b.id} className="flex gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                        <CreditCard className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-tight">Réservation {b.reference}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {b.student} — {fcfa(b.amount)}
                        </span>
                        <span className="block text-[11px] text-muted-foreground/70">{dateTimeFr(b.createdAt)}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
