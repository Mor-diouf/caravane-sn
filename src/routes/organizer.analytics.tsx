import { createFileRoute } from "@tanstack/react-router";
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
import { Gauge, TrendingUp, Users, Wallet } from "lucide-react";
import { InsightBanner, KpiCard, PageHeader, Panel, ProBadge, ProgressBar } from "@/components/organizer/ui";
import { destinationPerformance, fcfa, insights, monthlySeries } from "@/lib/organizer";

export const Route = createFileRoute("/organizer/analytics")({
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
  const revenue = monthlySeries.reduce((a, m) => a + m.revenus, 0);
  const avgOcc = Math.round(monthlySeries.reduce((a, m) => a + m.occupation, 0) / monthlySeries.length);

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Revenus 6 mois" value={fcfa(revenue)} trend="+23%" icon={Wallet} accent="mint" />
        <KpiCard title="Remplissage moyen" value={`${avgOcc}%`} trend="+6 pts" icon={Gauge} accent="info" />
        <KpiCard title="Réservations" value="268" trend="+15%" icon={Users} />
        <KpiCard title="Panier moyen" value={fcfa(7900)} trend="+3%" icon={TrendingUp} accent="warning" />
      </div>

      <div className="mt-4">
        <InsightBanner message={insights[4]!} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Évolution des réservations" description="Tendance mensuelle">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlySeries} margin={{ left: -18, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-card)" }} />
                <Line type="monotone" dataKey="reservations" name="Réservations" stroke="var(--color-primary-accent)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="occupation" name="Remplissage (%)" stroke="var(--color-mint)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Revenus par destination">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destinationPerformance} layout="vertical" margin={{ left: 12, right: 16 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--color-border)" horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => `${v / 1000}k`} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis type="category" dataKey="destination" width={70} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }} />
                <Tooltip formatter={(v: number) => fcfa(v)} contentStyle={{ borderRadius: 14, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-card)" }} />
                <Bar dataKey="revenus" name="Revenus" radius={[0, 8, 8, 0]} fill="var(--color-info)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel className="mt-4" title="Taux de remplissage par destination">
        <ul className="grid gap-4 sm:grid-cols-2">
          {destinationPerformance.map((d) => (
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
      </Panel>
    </>
  );
}
