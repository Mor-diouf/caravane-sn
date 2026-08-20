import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Gauge, TrendingUp, Users, Wallet } from "lucide-react";
import { EmptyState, InsightBanner, KpiCard, PageHeader, Panel, ProBadge, ProgressBar } from "@/components/organizer/ui";
import { orgOverviewQuery } from "@/lib/dash-queries";
import { fcfa } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/organizer/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Analyse avancée de vos caravanes : revenus, remplissage moyen, meilleures destinations et prévisions.",
      },
      { property: "og:title", content: "Analytics — CaravaneHub" },
      {
        property: "og:description",
        content: "Décisions basées sur les données pour remplir chaque bus.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: overview, isLoading } = useQuery(orgOverviewQuery());

  const caravans = overview?.caravans ?? [];
  const series = overview?.series ?? [];
  const revenue = overview?.kpis.revenue ?? 0;
  const bookings = overview?.kpis.bookings ?? 0;
  const avgBasket = bookings ? Math.round(revenue / bookings) : 0;

  const byDestination = new Map<string, { revenue: number; capacity: number; booked: number }>();
  for (const c of caravans) {
    const destination = c.route.split("→")[1]?.trim() ?? c.route;
    const cur = byDestination.get(destination) ?? { revenue: 0, capacity: 0, booked: 0 };
    cur.revenue += c.revenue;
    cur.capacity += c.capacity;
    cur.booked += c.booked;
    byDestination.set(destination, cur);
  }
  const destinations = [...byDestination.entries()]
    .map(([destination, v]) => ({
      destination,
      revenus: v.revenue,
      remplissage: v.capacity ? Math.round((v.booked / v.capacity) * 100) : 0,
    }))
    .sort((a, b) => b.revenus - a.revenus);

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Analytics <ProBadge />
          </span>
        }
        subtitle="Comprendre ce qui remplit vos bus, et anticiper la suite."
      />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des données…</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard title="Revenus 6 mois" value={fcfa(revenue)} icon={Wallet} accent="mint" />
            <KpiCard title="Remplissage moyen" value={`${overview?.kpis.fillRate ?? 0}%`} icon={Gauge} accent="info" />
            <KpiCard title="Réservations" value={String(bookings)} icon={Users} />
            <KpiCard title="Panier moyen" value={fcfa(avgBasket)} icon={TrendingUp} accent="warning" />
          </div>

          <div className="mt-4">
            <InsightBanner
              message={`Votre taux de remplissage moyen est de ${overview?.kpis.fillRate ?? 0}%. ${
                overview?.kpis.upcoming ?? 0
              } caravane(s) à venir sur ${caravans.length} au total.`}
            />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Panel title="Évolution des réservations" description="Tendance mensuelle">
              {series.length === 0 ? (
                <EmptyState icon={BarChart3} message="Pas assez de données pour tracer une tendance." />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={series} margin={{ left: -18, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                      <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                      <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-card)" }} />
                      <Line type="monotone" dataKey="bookings" name="Réservations" stroke="var(--color-primary-accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="revenue" name="Revenus" stroke="var(--color-mint)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <Panel title="Revenus par destination">
              {destinations.length === 0 ? (
                <EmptyState icon={BarChart3} message="Aucune caravane pour l'instant." />
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={destinations} layout="vertical" margin={{ left: 12, right: 16 }}>
                      <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v: number) => `${v / 1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                      <YAxis type="category" dataKey="destination" width={70} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                      <Tooltip formatter={(v: number) => fcfa(v)} contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-card)" }} />
                      <Bar dataKey="revenus" name="Revenus" radius={[0, 8, 8, 0]} fill="var(--color-info)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>
          </div>

          <Panel className="mt-4" title="Taux de remplissage par destination">
            {destinations.length === 0 ? (
              <EmptyState icon={Gauge} message="Aucune caravane pour l'instant." />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {destinations.map((d) => (
                  <li key={d.destination}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-semibold">{d.destination}</span>
                      <span className="text-muted-foreground">
                        {d.remplissage}% · {fcfa(d.revenus)}
                      </span>
                    </div>
                    <ProgressBar value={d.remplissage} tone={d.remplissage < 50 ? "warning" : "brand"} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </>
  );
}
