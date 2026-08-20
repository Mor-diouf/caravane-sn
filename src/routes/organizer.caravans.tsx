import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bus, MapPin, Plus, Search, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { caravanStatusLabels, caravans, fcfa, pct, type Caravan } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/organizer/caravans")({
  head: () => ({
    meta: [
      { title: "Mes caravanes — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Créez, publiez et suivez vos caravanes étudiantes : places vendues, revenus, notes et statuts.",
      },
      { property: "og:title", content: "Mes caravanes — CaravaneHub" },
      {
        property: "og:description",
        content: "Gestion complète du cycle de vie de vos caravanes universitaires.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CaravansPage,
});

const filters = [
  { id: "all", label: "Toutes" },
  { id: "active", label: "En cours" },
  { id: "upcoming", label: "À venir" },
  { id: "completed", label: "Terminées" },
  { id: "cancelled", label: "Annulées" },
] as const;

const statusClass: Record<Caravan["status"], string> = {
  active: "bg-success/10 text-success",
  upcoming: "bg-info/10 text-info",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-danger/10 text-danger",
  full: "bg-warning/12 text-warning",
};

function CaravansPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const rows = useMemo(
    () =>
      caravans.filter(
        (c) =>
          (filter === "all" || c.status === filter) &&
          (c.destination.toLowerCase().includes(query.toLowerCase()) ||
            c.route.toLowerCase().includes(query.toLowerCase())),
      ),
    [filter, query],
  );

  return (
    <>
      <PageHeader
        title="Mes caravanes"
        subtitle="Créez, publiez et suivez chaque départ organisé par votre amicale."
        actions={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-ambient transition-transform active:scale-[0.98]"
          >
            <Plus className="size-4" /> Créer une caravane
          </button>
        }
      />

      <Panel bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/60 p-0.5">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                  filter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="relative ml-auto flex min-w-[220px] items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Rechercher une caravane</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Destination, trajet…"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Bus}
            message="Aucune caravane ne correspond à ce filtre. Créez votre prochaine caravane pour commencer à vendre des places."
            cta={
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Créer ma caravane
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Caravane</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Places</th>
                  <th className="px-5 py-3 font-semibold">Remplissage</th>
                  <th className="px-5 py-3 font-semibold">Revenus</th>
                  <th className="px-5 py-3 font-semibold">Note</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary">
                          <MapPin className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{c.route}</span>
                          <span className="block text-[11px] text-muted-foreground">
                            Réf. {c.id.toUpperCase()}
                          </span>
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{c.date}</td>
                    <td className="px-5 py-4 font-semibold">
                      {c.booked}/{c.capacity}
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex min-w-[120px] items-center gap-2">
                        <ProgressBar value={pct(c.booked, c.capacity)} />
                        <span className="text-xs font-bold">{pct(c.booked, c.capacity)}%</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold">{fcfa(c.revenue)}</td>
                    <td className="px-5 py-4">
                      {c.rating ? (
                        <span className="inline-flex items-center gap-1 font-semibold">
                          {c.rating}
                          <Star className="size-3.5 fill-warning text-warning" />
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-[11px] font-bold",
                          statusClass[c.status],
                        )}
                      >
                        {caravanStatusLabels[c.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Créer une caravane</DialogTitle>
            <DialogDescription>
              Renseignez les informations du départ. Vous pourrez prévisualiser avant publication.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setOpen(false);
              toast.success("Caravane enregistrée en brouillon", {
                description: "Prévisualisez-la puis publiez-la pour ouvrir les réservations.",
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: "Université", placeholder: "UASZ", type: "text" },
                { label: "Destination", placeholder: "Dakar", type: "text" },
                { label: "Date de départ", placeholder: "", type: "date" },
                { label: "Heure de départ", placeholder: "", type: "time" },
                { label: "Lieu de départ", placeholder: "Campus social UASZ", type: "text" },
                { label: "Lieu d'arrivée", placeholder: "Gare routière de Dakar", type: "text" },
                { label: "Nombre de places", placeholder: "70", type: "number" },
                { label: "Prix (FCFA)", placeholder: "8500", type: "number" },
                { label: "Transporteur", placeholder: "Sénégal Tours", type: "text" },
                { label: "Contact", placeholder: "+221 77 000 00 00", type: "tel" },
              ].map((f) => (
                <label key={f.label} className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                    {f.label}
                  </span>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </label>
              ))}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Description
              </span>
              <textarea
                rows={3}
                placeholder="Bus climatisé, Wi-Fi, une pause à Kaolack…"
                className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Enregistrer et prévisualiser
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
