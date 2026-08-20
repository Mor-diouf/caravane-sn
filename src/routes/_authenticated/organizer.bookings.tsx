import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  EmptyState,
  KpiCard,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/organizer/ui";
import { bookings, fcfa, statusLabels, type Status } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/organizer/bookings")({
  head: () => ({
    meta: [
      { title: "Réservations — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Suivez chaque réservation étudiante : paiement, billet, statut d'embarquement et remboursements.",
      },
      { property: "og:title", content: "Réservations — CaravaneHub" },
      {
        property: "og:description",
        content: "Toutes vos réservations, filtrables par statut et exportables.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingsPage,
});

const tabs: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "paid", label: "Payées" },
  { id: "pending", label: "En attente" },
  { id: "boarded", label: "Embarquées" },
  { id: "cancelled", label: "Annulées" },
  { id: "refunded", label: "Remboursées" },
];

function BookingsPage() {
  const [tab, setTab] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      bookings.filter(
        (b) =>
          (tab === "all" || b.status === tab) &&
          (b.student.toLowerCase().includes(query.toLowerCase()) ||
            b.id.toLowerCase().includes(query.toLowerCase()) ||
            b.ticket.toLowerCase().includes(query.toLowerCase())),
      ),
    [tab, query],
  );

  const total = rows.reduce((acc, b) => acc + b.amount, 0);

  return (
    <>
      <PageHeader
        title="Réservations"
        subtitle="Chaque billet vendu, son paiement et son statut d'embarquement."
        actions={
          <button
            type="button"
            onClick={() => toast.success("Export CSV généré", { description: `${rows.length} réservations exportées.` })}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Download className="size-4" /> Exporter en CSV
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Réservations affichées" value={String(rows.length)} icon={Ticket} />
        <KpiCard title="Montant cumulé" value={fcfa(total)} accent="mint" icon={Ticket} />
        <KpiCard
          title="En attente de paiement"
          value={String(bookings.filter((b) => b.status === "pending").length)}
          accent="warning"
          icon={Ticket}
        />
      </div>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/60 p-0.5">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <label className="relative ml-auto flex min-w-[220px] items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Rechercher une réservation</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, référence, billet…"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Ticket} message="Aucune réservation ne correspond à cette recherche." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Étudiant</th>
                  <th className="px-5 py-3 font-semibold">Destination</th>
                  <th className="px-5 py-3 font-semibold">Places</th>
                  <th className="px-5 py-3 font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Méthode</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Billet</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((b) => (
                  <tr key={b.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <Avatar initials={b.initials} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{b.student}</span>
                          <span className="block text-[11px] text-muted-foreground">{b.id}</span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{b.destination}</td>
                    <td className="px-5 py-3.5">{b.seats}</td>
                    <td className="px-5 py-3.5 font-semibold">{fcfa(b.amount)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.method}</td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.ticket}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {rows.length} réservation(s) · filtre :{" "}
          {tab === "all" ? "toutes" : statusLabels[tab].toLowerCase()}
        </p>
      </Panel>
    </>
  );
}
