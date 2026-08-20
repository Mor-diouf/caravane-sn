import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bus, MapPin, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { orgCaravansQuery } from "@/lib/dash-queries";
import { organizerSaveCaravan, organizerSetCaravanStatus } from "@/lib/organizer.functions";
import { dateTimeFr } from "@/lib/dash-shared";
import { fcfa, pct } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/organizer/caravans")({
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

type CaravanStatus = "draft" | "published" | "full" | "completed" | "cancelled";

const filters = [
  { id: "all", label: "Toutes" },
  { id: "published", label: "Publiées" },
  { id: "draft", label: "Brouillons" },
  { id: "completed", label: "Terminées" },
  { id: "cancelled", label: "Annulées" },
] as const;

const statusClass: Record<CaravanStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  published: "bg-success/10 text-success",
  full: "bg-warning/12 text-warning",
  completed: "bg-info/10 text-info",
  cancelled: "bg-danger/10 text-danger",
};

const statusLabel: Record<CaravanStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
  full: "Complète",
  completed: "Terminée",
  cancelled: "Annulée",
};

const emptyForm = {
  id: undefined as string | undefined,
  from_label: "",
  to_label: "",
  departure_at: "",
  pickup: "",
  dropoff: "",
  price_fcfa: "",
  total_seats: "",
  amenities: "",
  about: "",
  status: "draft" as CaravanStatus,
};

function CaravansPage() {
  const queryClient = useQueryClient();
  const { data: caravans, isLoading } = useQuery(orgCaravansQuery());
  const saveCaravanFn = useServerFn(organizerSaveCaravan);
  const setStatusFn = useServerFn(organizerSetCaravanStatus);

  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const saveMutation = useMutation({
    mutationFn: (data: Parameters<typeof organizerSaveCaravan>[0]["data"]) =>
      saveCaravanFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Caravane enregistrée");
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (data: Parameters<typeof organizerSetCaravanStatus>[0]["data"]) =>
      setStatusFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Statut mis à jour");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = useMemo(
    () =>
      (caravans ?? []).filter(
        (c) =>
          (filter === "all" || c.status === filter) &&
          (`${c.from_label} ${c.to_label}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [caravans, filter, query],
  );

  const openCreate = () => {
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: NonNullable<typeof caravans>[number]) => {
    setForm({
      id: c.id,
      from_label: c.from_label,
      to_label: c.to_label,
      departure_at: c.departure_at ? c.departure_at.slice(0, 16) : "",
      pickup: c.pickup ?? "",
      dropoff: c.dropoff ?? "",
      price_fcfa: String(c.price_fcfa ?? ""),
      total_seats: String(c.total_seats ?? ""),
      amenities: (c.amenities ?? []).join(", "),
      about: c.about ?? "",
      status: c.status as CaravanStatus,
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.from_label || !form.to_label || !form.departure_at) {
      toast.error("Merci de compléter les champs obligatoires");
      return;
    }
    saveMutation.mutate({
      id: form.id,
      from_label: form.from_label,
      to_label: form.to_label,
      departure_at: new Date(form.departure_at).toISOString(),
      pickup: form.pickup,
      dropoff: form.dropoff,
      price_fcfa: Number(form.price_fcfa) || 0,
      total_seats: Number(form.total_seats) || 1,
      amenities: form.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      about: form.about,
      status: form.status,
    });
  };

  return (
    <>
      <PageHeader
        title="Mes caravanes"
        subtitle="Créez, publiez et suivez chaque départ organisé par votre amicale."
        actions={
          <button
            type="button"
            onClick={openCreate}
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

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Chargement des caravanes…</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Bus}
            message="Aucune caravane ne correspond à ce filtre. Créez votre prochaine caravane pour commencer à vendre des places."
            cta={
              <button
                type="button"
                onClick={openCreate}
                className="rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"
              >
                Créer ma caravane
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Caravane</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Places</th>
                  <th className="px-5 py-3 font-semibold">Remplissage</th>
                  <th className="px-5 py-3 font-semibold">Prix</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => {
                  const booked = c.total_seats - c.seats_left;
                  return (
                    <tr key={c.id} className="transition-colors hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-primary">
                            <MapPin className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="block truncate font-semibold hover:underline"
                            >
                              {c.from_label} → {c.to_label}
                            </button>
                            <span className="block text-[11px] text-muted-foreground">
                              Réf. {c.id.slice(0, 8).toUpperCase()}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{dateTimeFr(c.departure_at)}</td>
                      <td className="px-5 py-4 font-semibold">
                        {booked}/{c.total_seats}
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex min-w-[120px] items-center gap-2">
                          <ProgressBar value={pct(booked, c.total_seats)} />
                          <span className="text-xs font-bold">{pct(booked, c.total_seats)}%</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold">{fcfa(c.price_fcfa)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-bold",
                            statusClass[c.status as CaravanStatus],
                          )}
                        >
                          {statusLabel[c.status as CaravanStatus]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          {c.status === "draft" ? (
                            <button
                              type="button"
                              onClick={() =>
                                statusMutation.mutate({ caravanId: c.id, status: "published" })
                              }
                              className="text-xs font-bold text-primary-accent hover:underline"
                            >
                              Publier
                            </button>
                          ) : c.status === "published" ? (
                            <button
                              type="button"
                              onClick={() =>
                                statusMutation.mutate({
                                  caravanId: c.id,
                                  hidden: !c.is_hidden,
                                })
                              }
                              className="text-xs font-bold text-muted-foreground hover:underline"
                            >
                              {c.is_hidden ? "Afficher" : "Masquer"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">
              {form.id ? "Modifier la caravane" : "Créer une caravane"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du départ. Vous pourrez publier une fois prêt.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Départ</span>
                <input
                  value={form.from_label}
                  onChange={(e) => setForm((f) => ({ ...f, from_label: e.target.value }))}
                  placeholder="Ziguinchor"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Destination</span>
                <input
                  value={form.to_label}
                  onChange={(e) => setForm((f) => ({ ...f, to_label: e.target.value }))}
                  placeholder="Dakar"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Date et heure de départ</span>
                <input
                  type="datetime-local"
                  value={form.departure_at}
                  onChange={(e) => setForm((f) => ({ ...f, departure_at: e.target.value }))}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Nombre de places</span>
                <input
                  type="number"
                  value={form.total_seats}
                  onChange={(e) => setForm((f) => ({ ...f, total_seats: e.target.value }))}
                  placeholder="70"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Lieu de départ</span>
                <input
                  value={form.pickup}
                  onChange={(e) => setForm((f) => ({ ...f, pickup: e.target.value }))}
                  placeholder="Campus social UASZ"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Lieu d'arrivée</span>
                <input
                  value={form.dropoff}
                  onChange={(e) => setForm((f) => ({ ...f, dropoff: e.target.value }))}
                  placeholder="Gare routière de Dakar"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Prix (FCFA)</span>
                <input
                  type="number"
                  value={form.price_fcfa}
                  onChange={(e) => setForm((f) => ({ ...f, price_fcfa: e.target.value }))}
                  placeholder="8500"
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Statut</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CaravanStatus }))}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publiée</option>
                  <option value="completed">Terminée</option>
                  <option value="cancelled">Annulée</option>
                </select>
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Équipements (séparés par des virgules)
              </span>
              <input
                value={form.amenities}
                onChange={(e) => setForm((f) => ({ ...f, amenities: e.target.value }))}
                placeholder="Climatisation, Wi-Fi, Pause à Kaolack"
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Description</span>
              <textarea
                rows={3}
                value={form.about}
                onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
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
                disabled={saveMutation.isPending}
                className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
              >
                {saveMutation.isPending ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
