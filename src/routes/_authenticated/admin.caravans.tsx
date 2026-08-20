import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bus, EyeOff, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { AdminButton, Tabs, TonePill } from "@/components/admin/ui";
import { caravans, caravanStatusLabels, fcfa, fmt, pct } from "@/lib/organizer";
import { organizerAccounts, platformKpis } from "@/lib/admin";

export const Route = createFileRoute("/_authenticated/admin/caravans")({
  head: () => ({
    meta: [
      { title: "Caravanes — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Surveillez toutes les caravanes publiées sur la plateforme : remplissage, revenus et visibilité.",
      },
      { property: "og:title", content: "Caravanes — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "Modérez les annonces de caravanes de toutes les amicales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AdminCaravans,
});

type Filter = "all" | "active" | "upcoming" | "completed" | "cancelled";

const owners = organizerAccounts.filter((o) => o.status === "approved");

function AdminCaravans() {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [hidden, setHidden] = useState<string[]>([]);

  const rows = caravans
    .map((c, i) => ({ ...c, owner: owners[i % owners.length]?.name ?? "Amicale UASZ" }))
    .filter((c) => {
      const matchFilter = filter === "all" || c.status === filter;
      const q = query.trim().toLowerCase();
      const matchQuery =
        !q || c.route.toLowerCase().includes(q) || c.owner.toLowerCase().includes(q);
      return matchFilter && matchQuery;
    });

  function toggleHidden(id: string, route: string) {
    const isHidden = hidden.includes(id);
    setHidden((prev) => (isHidden ? prev.filter((x) => x !== id) : [...prev, id]));
    toast.success(isHidden ? `${route} republiée.` : `${route} masquée du catalogue.`);
  }

  return (
    <>
      <PageHeader
        title="Caravanes"
        subtitle="Toutes les annonces publiées par les organisateurs approuvés."
        actions={
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Rechercher une caravane</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Itinéraire ou organisateur…"
              className="h-9 w-full min-w-56 rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Caravanes publiées"
          value={fmt(platformKpis.caravans)}
          secondary={`${platformKpis.activeCaravans} en cours`}
          icon={Bus}
        />
        <KpiCard
          title="Remplissage moyen"
          value={`${platformKpis.fillRate} %`}
          secondary="Toutes universités confondues"
          icon={Bus}
          accent="mint"
        />
        <KpiCard
          title="Annonces masquées"
          value={fmt(hidden.length)}
          secondary="Retirées du catalogue étudiant"
          icon={EyeOff}
          accent="warning"
        />
      </div>

      <div className="py-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Toutes" },
            { value: "active", label: "En cours" },
            { value: "upcoming", label: "À venir" },
            { value: "completed", label: "Terminées" },
            { value: "cancelled", label: "Annulées" },
          ]}
        />
      </div>

      <Panel bodyClassName="p-0">
        {rows.length === 0 ? (
          <EmptyState icon={Bus} message="Aucune caravane ne correspond à ces filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Itinéraire</th>
                  <th className="px-5 py-3 font-bold">Organisateur</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-5 py-3 font-bold">Remplissage</th>
                  <th className="px-5 py-3 font-bold">Revenus</th>
                  <th className="px-5 py-3 font-bold">Statut</th>
                  <th className="px-5 py-3 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-semibold">{c.route}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.owner}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.date}</td>
                    <td className="px-5 py-3">
                      <div className="w-36">
                        <p className="text-xs font-semibold">
                          {c.booked}/{c.capacity} · {pct(c.booked, c.capacity)} %
                        </p>
                        <div className="mt-1">
                          <ProgressBar value={pct(c.booked, c.capacity)} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-semibold">{fcfa(c.revenue)}</td>
                    <td className="px-5 py-3">
                      <TonePill
                        tone={
                          hidden.includes(c.id)
                            ? "neutral"
                            : c.status === "active"
                              ? "success"
                              : c.status === "upcoming"
                                ? "info"
                                : c.status === "cancelled"
                                  ? "danger"
                                  : "neutral"
                        }
                      >
                        {hidden.includes(c.id) ? "Masquée" : caravanStatusLabels[c.status]}
                      </TonePill>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <AdminButton
                          variant={hidden.includes(c.id) ? "success" : "ghost"}
                          onClick={() => toggleHidden(c.id, c.route)}
                        >
                          {hidden.includes(c.id) ? (
                            <>
                              <Eye className="size-3.5" /> Republier
                            </>
                          ) : (
                            <>
                              <EyeOff className="size-3.5" /> Masquer
                            </>
                          )}
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </>
  );
}
