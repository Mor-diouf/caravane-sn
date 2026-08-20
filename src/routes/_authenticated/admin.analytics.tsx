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
import { BarChart3, Bus, Coins, Users } from "lucide-react";
import { InsightBanner, KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { platformGrowth, platformKpis, universitySplit } from "@/lib/admin";
import { destinationPerformance, fcfa, fmt } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Analyse avancée de la plateforme : croissance, axes les plus rentables et adoption par université.",
      },
      { property: "og:title", content: "Analytics — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "Comprenez la croissance de Caravane Étudiants axe par axe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <>
      <PageHeader
        title="Analytics plateforme"
        subtitle="Où la croissance se joue : universités, axes et acquisition."
      />

      <InsightBanner message="L'axe Ziguinchor → Dakar génère 34 % du volume total. Ouvrir Saint-Louis → Dakar pourrait ajouter 18 % de GMV mensuel." />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Croissance GMV"
          value={platformKpis.gmvTrend}
          secondary="vs mois précédent"
          icon={Coins}
        />
        <KpiCard
          title="Nouveaux étudiants"
          value={fmt(624)}
          secondary="Ce mois-ci"
          trend={platformKpis.studentsTrend}
          icon={Users}
          accent="info"
        />
        <KpiCard
          title="Organisateurs actifs"
          value={fmt(platformKpis.organizers)}
          secondary="Avec au moins 1 caravane"
          trend={platformKpis.organizersTrend}
          icon={Bus}
          accent="mint"
        />
        <KpiCard
          title="Taux de remplissage"
          value={`${platformKpis.fillRate} %`}
          secondary="Moyenne plateforme"
          icon={BarChart3}
          accent="warning"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Adoption étudiante" description="Comptes cumulés et organisateurs">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={platformGrowth} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="etudiants"
                  name="Étudiants"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="organisateurs"
                  name="Organisateurs"
                  stroke="var(--color-mint)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Revenus par destination">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={destinationPerformance} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                <XAxis dataKey="destination" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} width={64} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                  formatter={(value: number) => fcfa(value)}
                />
                <Bar dataKey="revenus" name="Revenus" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Pénétration par université">
          <ul className="space-y-4">
            {universitySplit.map((u) => (
              <li key={u.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{u.name}</span>
                  <span className="text-muted-foreground">{u.value} % du volume</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar value={u.value * 2} tone="mint" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Remplissage par destination">
          <ul className="space-y-4">
            {destinationPerformance.map((d) => (
              <li key={d.destination}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{d.destination}</span>
                  <span className="text-muted-foreground">{d.remplissage} %</span>
                </div>
                <div className="mt-1.5">
                  <ProgressBar
                    value={d.remplissage}
                    tone={d.remplissage < 40 ? "warning" : "brand"}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
