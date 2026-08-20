import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, MessageCircle, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, EmptyState, KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { fcfa, passengers } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/organizer/passengers")({
  head: () => ({
    meta: [
      { title: "Passagers — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Annuaire des étudiants transportés : université, historique de voyages, dépenses et contact WhatsApp.",
      },
      { property: "og:title", content: "Passagers — CaravaneHub" },
      {
        property: "og:description",
        content: "Votre base d'étudiants fidèles, prête pour vos campagnes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PassengersPage,
});

function PassengersPage() {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () =>
      passengers.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.university.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  const totalSpent = passengers.reduce((a, p) => a + p.spent, 0);
  const loyal = passengers.filter((p) => p.trips >= 3).length;

  return (
    <>
      <PageHeader
        title="Passagers"
        subtitle="L'annuaire des étudiants qui voyagent avec votre amicale."
        actions={
          <button
            type="button"
            onClick={() => toast.success("Annuaire exporté", { description: `${rows.length} passagers.` })}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Download className="size-4" /> Exporter
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Passagers uniques" value={String(passengers.length)} icon={Users} />
        <KpiCard title="Étudiants fidèles" value={`${loyal}`} secondary="3 voyages ou plus" accent="info" icon={Users} />
        <KpiCard title="Dépenses cumulées" value={fcfa(totalSpent)} accent="mint" icon={Users} />
      </div>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <label className="relative flex w-full max-w-sm items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Rechercher un passager</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom ou université…"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Users} message="Aucun passager trouvé pour cette recherche." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar initials={p.initials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.university} · {p.phone}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">{p.trips}</p>
                  <p className="text-[11px] text-muted-foreground">voyages</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{fcfa(p.spent)}</p>
                  <p className="text-[11px] text-muted-foreground">dernier : {p.lastTrip}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${p.phone.replace(/\s/g, "")}`}
                    className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                    aria-label={`Appeler ${p.name}`}
                  >
                    <Phone className="size-4" />
                  </a>
                  <a
                    href={`https://wa.me/${p.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid size-9 place-items-center rounded-xl border border-border text-success hover:bg-muted"
                    aria-label={`Écrire à ${p.name} sur WhatsApp`}
                  >
                    <MessageCircle className="size-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
