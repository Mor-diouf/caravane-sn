import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Bus,
  MapPin,
  Plus,
  Search,
  Monitor,
  Plug,
  Snowflake,
  Wifi,
  FileText,
  Download,
  Clock,
  AlertCircle,
  Trash2,
  Sparkles,
  Navigation,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { orgCaravansQuery, orgBookingsQuery } from "@/lib/dash-queries";
import { organizerSaveCaravan, organizerSetCaravanStatus } from "@/lib/organizer.functions";
import { dateTimeFr } from "@/lib/dash-shared";
import { fcfa, pct } from "@/lib/organizer";
import { cn } from "@/lib/utils";
import { exportPassengerManifestPdf } from "@/lib/pdf-export";
import type { IntermediateStop } from "@/lib/student-shared";

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

type CaravanStatus = "draft" | "pending" | "published" | "full" | "completed" | "cancelled";

const filters = [
  { id: "all", label: "Toutes" },
  { id: "pending", label: "En attente" },
  { id: "published", label: "Publiées" },
  { id: "draft", label: "Brouillons" },
  { id: "cancelled", label: "Annulées" },
] as const;

const statusClass: Record<CaravanStatus, string> = {
  draft: "bg-neutral-800 text-neutral-400",
  pending: "bg-warning/15 text-warning border border-warning/30",
  published: "bg-success/10 text-success",
  full: "bg-warning/12 text-warning",
  completed: "bg-info/10 text-info",
  cancelled: "bg-danger/10 text-danger",
};

const statusLabel: Record<CaravanStatus, string> = {
  draft: "Brouillon",
  pending: "En attente de validation",
  published: "Publiée",
  full: "Complète",
  completed: "Terminée",
  cancelled: "Annulée",
};

const amenityMap = {
  ac: { icon: Snowflake, label: "Climatisation" },
  wifi: { icon: Wifi, label: "Wi-Fi" },
  usb: { icon: Plug, label: "Prises USB" },
  video: { icon: Monitor, label: "Vidéo" },
} as const;

const emptyForm = {
  id: undefined as string | undefined,
  from_label: "",
  to_label: "",
  departure_at: "",
  pickup: "",
  dropoff: "",
  price_fcfa: "",
  total_seats: "",
  amenities: [] as string[],
  about: "",
  status: "pending" as CaravanStatus,
  stops: [] as IntermediateStop[],
};

function CaravansPage() {
  const queryClient = useQueryClient();
  const { data: caravans, isLoading } = useQuery(orgCaravansQuery());
  const { data: dbBookings } = useQuery(orgBookingsQuery());
  const saveCaravanFn = useServerFn(organizerSaveCaravan);
  const setStatusFn = useServerFn(organizerSetCaravanStatus);

  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const saveMutation = useMutation({
    mutationFn: (data: {
      id?: string | undefined;
      from_label: string;
      to_label: string;
      departure_at: string;
      pickup: string;
      dropoff: string;
      price_fcfa: number;
      total_seats: number;
      amenities?: string[] | undefined;
      about?: string | undefined;
      image_url?: string | undefined;
      status?: "draft" | "pending" | "published" | "full" | "completed" | "cancelled";
      stops?: IntermediateStop[];
    }) => saveCaravanFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success(
        form.status === "draft"
          ? "Brouillon enregistré"
          : "Voyage soumis avec succès pour validation par le super admin"
      );
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const statusMutation = useMutation({
    mutationFn: (data: { caravanId: string; status?: "draft" | "pending" | "published" | "full" | "completed" | "cancelled"; hidden?: boolean }) =>
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
      amenities: c.amenities ?? [],
      about: (c as any).cleanAbout ?? c.about ?? "",
      status: c.status as CaravanStatus,
      stops: ((c as any).stops || []) as IntermediateStop[],
    });
    setOpen(true);
  };

  const submit = (e: React.FormEvent, targetStatus?: "draft" | "pending") => {
    e.preventDefault();
    if (!form.from_label || !form.to_label || !form.departure_at) {
      toast.error("Merci de compléter les champs obligatoires");
      return;
    }
    const resolvedStatus =
      targetStatus ??
      ((!form.id || form.status === "draft") ? "pending" : form.status);

    saveMutation.mutate({
      id: form.id,
      from_label: form.from_label,
      to_label: form.to_label,
      departure_at: new Date(form.departure_at).toISOString(),
      pickup: form.pickup,
      dropoff: form.dropoff,
      price_fcfa: Number(form.price_fcfa) || 0,
      total_seats: Number(form.total_seats) || 1,
      amenities: form.amenities,
      about: form.about,
      status: resolvedStatus,
      stops: form.stops,
    });
  };

  return (
    <>
      <PageHeader
        title="Lignes & Départs de Bus"
        subtitle="Programmez, publiez et gérez les trajets officiels King-Bus (Dakar ⇄ Ziguinchor, VIP Nuit, etc.)."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 px-4 py-2.5 text-sm font-black text-black shadow-md hover:brightness-110 active:scale-[0.98]"
          >
            <Plus className="size-4" /> Programmer un voyage bus
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
                            {(c as any).stops && (c as any).stops.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full mt-1 w-fit">
                                <Navigation className="size-2.5" />
                                {(c as any).stops.length} escale{(c as any).stops.length > 1 ? "s" : ""} ({(c as any).stops.map((s: any) => s.city).join(", ")})
                              </span>
                            )}
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
                        <span className="flex flex-col gap-0.5">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold w-fit",
                              statusClass[c.status as CaravanStatus],
                            )}
                          >
                            {c.status === "pending" && <Clock className="size-3" />}
                            {statusLabel[c.status as CaravanStatus]}
                          </span>
                          {c.status === "pending" && (
                            <span className="text-[10px] font-medium text-amber-500">
                              Lien de paiement en attente
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          {c.status === "draft" ? (
                            <button
                              type="button"
                              onClick={() =>
                                statusMutation.mutate({ caravanId: c.id, status: "pending" })
                              }
                              className="text-xs font-bold text-primary-accent hover:underline"
                            >
                              Soumettre
                            </button>
                          ) : c.status === "pending" ? (
                            <button
                              type="button"
                              onClick={() => openEdit(c)}
                              className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                            >
                              Modifier
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

                          <button
                            type="button"
                            onClick={() => {
                              const caravanBookings = (dbBookings ?? []).filter((b) => b.caravanId === c.id);
                              if (caravanBookings.length === 0) {
                                toast.info("Aucun passager inscrit pour cette caravane pour l'instant.");
                                return;
                              }
                              exportPassengerManifestPdf({
                                organizerName: "Espace Organisateur",
                                caravanTitle: `${c.from_label} ➔ ${c.to_label}`,
                                departureDate: dateTimeFr(c.departure_at),
                                pickupLocation: c.pickup,
                                passengers: caravanBookings.map((b) => ({
                                  name: b.student || "Étudiant",
                                  phone: b.phone || "—",
                                  university: b.university || "—",
                                  pickupStop: (b as any).pickupStop || undefined,
                                  reference: b.reference,
                                  seats: b.seats,
                                  amount: b.amount,
                                  paymentStatus: b.paymentStatus,
                                  status: b.status,
                                })),
                              });
                              toast.success("Manifeste PDF généré !", {
                                description: `${caravanBookings.length} passagers exportés pour ${c.from_label} ➔ ${c.to_label}.`,
                              });
                            }}
                            title="Télécharger le manifeste PDF des passagers pour ce car"
                            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1 text-xs font-bold text-foreground shadow-2xs hover:bg-muted"
                          >
                            <FileText className="size-3 text-primary" /> PDF
                          </button>
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
              {form.id ? "Modifier le voyage" : "Programmer un nouveau voyage"}
            </DialogTitle>
            <DialogDescription>
              Renseignez les informations du trajet. Votre voyage sera transmis à l'administration pour validation et association du lien de paiement officiel Wave Business.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2.5">
            <Clock className="size-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Circuit de validation :</span> Tout voyage créé doit être validé par le super administrateur avec l'attribution du lien de paiement Wave avant d'apparaître publiquement sur la plateforme.
            </div>
          </div>

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
            </div>

            {/* ── Escales & Tarifs par tronçon ── */}
            <div className="rounded-2xl border border-border/80 bg-muted/20 p-4 space-y-3.5 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold tracking-tight text-foreground flex items-center gap-1.5">
                    <Navigation className="size-4 text-amber-500" />
                    Escales & Tarifs par tronçon (Optionnel)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Permettez aux passagers de monter en cours de route avec un tarif adapté (ex: Fatick à 9 000 FCFA pour Dakar ➔ Ziguinchor).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newStop: IntermediateStop = {
                      id: `stop-${Date.now()}`,
                      city: "",
                      pickup: "",
                      price_fcfa: Math.max(0, (Number(form.price_fcfa) || 10000) - 2000),
                    };
                    setForm((f) => ({ ...f, stops: [...f.stops, newStop] }));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-all"
                >
                  <Plus className="size-3.5" />
                  Ajouter une escale
                </button>
              </div>

              {/* Quick Presets for Senegal */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Sparkles className="size-3 text-amber-500" /> Raccourcis Sénégal :
                </span>
                {[
                  { city: "Fatick", pickup: "Rond-point Fatick / Station", price_fcfa: 9000 },
                  { city: "Kaolack", pickup: "Garage Nioro / Station Total", price_fcfa: 8000 },
                  { city: "Mbour", pickup: "Croisement Saly / Mbour", price_fcfa: 10500 },
                ].map((preset) => (
                  <button
                    key={preset.city}
                    type="button"
                    onClick={() => {
                      if (form.stops.some((s) => s.city.toLowerCase() === preset.city.toLowerCase())) {
                        toast.info(`L'escale ${preset.city} est déjà ajoutée.`);
                        return;
                      }
                      setForm((f) => ({
                        ...f,
                        stops: [
                          ...f.stops,
                          {
                            id: `stop-${Date.now()}-${preset.city.toLowerCase()}`,
                            city: preset.city,
                            pickup: preset.pickup,
                            price_fcfa: preset.price_fcfa,
                          },
                        ],
                      }));
                      toast.success(`Escale ${preset.city} (${preset.price_fcfa.toLocaleString("fr-FR")} F) ajoutée !`);
                    }}
                    className="text-[11px] font-medium rounded-lg border border-border bg-card px-2.5 py-1 hover:border-amber-500/60 hover:text-amber-600 transition-all"
                  >
                    + {preset.city} ({preset.price_fcfa.toLocaleString("fr-FR")} F)
                  </button>
                ))}
              </div>

              {/* Configured stops list */}
              {form.stops.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 p-3.5 text-center text-xs text-muted-foreground">
                  Aucune escale intermédiaire configurée pour ce départ. Les passagers paieront le tarif plein ({form.price_fcfa || "0"} FCFA).
                </div>
              ) : (
                <div className="space-y-2.5">
                  {form.stops.map((stop, index) => (
                    <div
                      key={stop.id}
                      className="rounded-xl border border-border bg-card p-3 space-y-2.5 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          Escale #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setForm((f) => ({
                              ...f,
                              stops: f.stops.filter((s) => s.id !== stop.id),
                            }))
                          }
                          className="text-xs text-danger hover:underline flex items-center gap-1 font-medium"
                          title="Supprimer cette escale"
                        >
                          <Trash2 className="size-3" /> Supprimer
                        </button>
                      </div>

                      <div className="grid gap-2.5 sm:grid-cols-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Ville étape
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Fatick"
                            value={stop.city}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((f) => ({
                                ...f,
                                stops: f.stops.map((s) => (s.id === stop.id ? { ...s, city: val } : s)),
                              }));
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Lieu de montée
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Rond-point Fatick"
                            value={stop.pickup}
                            onChange={(e) => {
                              const val = e.target.value;
                              setForm((f) => ({
                                ...f,
                                stops: f.stops.map((s) => (s.id === stop.id ? { ...s, pickup: val } : s)),
                              }));
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Tarif depuis cet arrêt (FCFA)
                          </label>
                          <input
                            type="number"
                            placeholder="Ex: 9000"
                            value={stop.price_fcfa || ""}
                            onChange={(e) => {
                              const val = Number(e.target.value) || 0;
                              setForm((f) => ({
                                ...f,
                                stops: f.stops.map((s) => (s.id === stop.id ? { ...s, price_fcfa: val } : s)),
                              }));
                            }}
                            className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Équipements
              </span>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(amenityMap) as Array<keyof typeof amenityMap>).map((key) => {
                  const { icon: Icon, label } = amenityMap[key];
                  const active = form.amenities.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({
                          ...f,
                          amenities: active
                            ? f.amenities.filter((a) => a !== key)
                            : [...f.amenities, key],
                        }))
                      }
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                        active
                          ? "border-primary-accent bg-primary-accent/10 text-primary-accent"
                          : "border-border bg-card text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      <Icon className="size-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
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
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted"
              >
                Annuler
              </button>
              <div className="flex items-center gap-2">
                {(!form.id || form.status === "draft") && (
                  <button
                    type="button"
                    disabled={saveMutation.isPending}
                    onClick={(e) => submit(e, "draft")}
                    className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted"
                  >
                    Enregistrer en brouillon
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md hover:opacity-95 active:scale-[0.98] disabled:opacity-60"
                >
                  {saveMutation.isPending
                    ? "Traitement…"
                    : (!form.id || form.status === "draft"
                      ? "Soumettre pour validation"
                      : form.status === "pending"
                        ? "Mettre à jour la demande"
                        : "Enregistrer les modifications")}
                </button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
