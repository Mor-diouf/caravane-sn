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
import { BarChart3, Bus, Coins, Loader2, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { EmptyState, InsightBanner, KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { adminAnalyticsQuery, adminOverviewQuery } from "@/lib/dash-queries";
import { fcfa, fmt } from "@/lib/organizer";

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
  const { data: overview, isLoading: overviewLoading } = useQuery(adminOverviewQuery());
  const { data: analytics, isLoading: analyticsLoading } = useQuery(adminAnalyticsQuery());

  const kpis = overview?.kpis;
  const growth = overview?.growth ?? [];
  const destinations = analytics?.destinations ?? [];
  const universities = analytics?.universities ?? [];
  const totalUniversityRevenue = universities.reduce((a, u) => a + u.revenue, 0) || 1;

  const topDestination = destinations[0];
  const insight = topDestination
    ? `L'axe ${topDestination.name} génère ${fcfa(topDestination.revenue)} de revenus, avec un taux de remplissage de ${topDestination.fillRate} %.`
    : "Aucune donnée suffisante pour générer une recommandation pour le moment.";

  return (
    <>
      <PageHeader
        title="Analytics plateforme"
        subtitle="Où la croissance se joue : universités, axes et acquisition."
      />

      <InsightBanner message={insight} />

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Volume traité"
          value={overviewLoading ? "…" : fcfa(kpis?.gmv ?? 0)}
          secondary="Depuis le lancement"
          icon={Coins}
        />
        <KpiCard
          title="Étudiants"
          value={overviewLoading ? "…" : fmt(kpis?.students ?? 0)}
          secondary="Comptes enregistrés"
          icon={Users}
          accent="info"
        />
        <KpiCard
          title="Organisateurs actifs"
          value={overviewLoading ? "…" : fmt(kpis?.organizers ?? 0)}
          secondary="Avec au moins 1 caravane"
          icon={Bus}
          accent="mint"
        />
        <KpiCard
          title="Taux de remplissage"
          value={overviewLoading ? "…" : `${kpis?.fillRate ?? 0} %`}
          secondary="Moyenne plateforme"
          icon={BarChart3}
          accent="warning"
        />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Croissance GMV & commissions" description="Six derniers mois">
          {overviewLoading ? (
            <div className="flex h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </div>
          ) : growth.length === 0 ? (
            <EmptyState icon={BarChart3} message="Pas encore assez de données pour afficher la croissance." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growth} margin={{ left: -12, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={48} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => fcfa(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="gmv"
                    name="GMV"
                    stroke="var(--color-primary)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="commission"
                    name="Commissions"
                    stroke="var(--color-mint)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel title="Revenus par destination">
          {analyticsLoading ? (
            <div className="flex h-72 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </div>
          ) : destinations.length === 0 ? (
            <EmptyState icon={BarChart3} message="Aucune destination avec des ventes pour le moment." />
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={destinations} margin={{ left: -12, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} fontSize={11} width={64} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid var(--color-border)",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => fcfa(value)}
                  />
                  <Bar dataKey="revenue" name="Revenus" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Panel title="Pénétration par université">
          {analyticsLoading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </div>
          ) : universities.length === 0 ? (
            <EmptyState icon={Users} message="Aucune donnée d'université disponible." />
          ) : (
            <ul className="space-y-4">
              {universities.map((u) => {
                const share = Math.round((u.revenue / totalUniversityRevenue) * 100);
                return (
                  <li key={u.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{u.name}</span>
                      <span className="text-muted-foreground">{share} % du volume</span>
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={share} tone="mint" />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Remplissage par destination">
          {analyticsLoading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </div>
          ) : destinations.length === 0 ? (
            <EmptyState icon={BarChart3} message="Aucune destination à afficher." />
          ) : (
            <ul className="space-y-4">
              {destinations.map((d) => (
                <li key={d.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">{d.name}</span>
                    <span className="text-muted-foreground">{d.fillRate} %</span>
                  </div>
                  <div className="mt-1.5">
                    <ProgressBar value={d.fillRate} tone={d.fillRate < 40 ? "warning" : "brand"} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
