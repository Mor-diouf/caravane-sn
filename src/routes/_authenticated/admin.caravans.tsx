import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bus,
  EyeOff,
  Eye,
  Loader2,
  Search,
  Edit2,
  Link as LinkIcon,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EmptyState, KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { AdminButton, Tabs, TonePill, type Tone } from "@/components/admin/ui";
import { adminCaravansQuery } from "@/lib/dash-queries";
import { adminSetCaravanHidden, adminUpdateCaravan, adminDeleteCaravan } from "@/lib/admin.functions";
import { dateTimeFr } from "@/lib/dash-shared";
import { fcfa, fmt, pct } from "@/lib/organizer";

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

type CaravanStatus = "draft" | "pending" | "published" | "full" | "completed" | "cancelled";
type Filter = "all" | CaravanStatus | "hidden";

const statusLabels: Record<CaravanStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  published: "Publiée",
  full: "Complète",
  completed: "Terminée",
  cancelled: "Annulée",
};

const statusTone: Record<CaravanStatus, Tone> = {
  draft: "neutral",
  pending: "warning",
  published: "success",
  full: "info",
  completed: "neutral",
  cancelled: "danger",
};

function AdminCaravans() {
  const { data, isLoading } = useQuery(adminCaravansQuery());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  
  // Edit Caravan details state
  const [editingCaravan, setEditingCaravan] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    from_label: "",
    to_label: "",
    departure_at: "",
    price_fcfa: 0,
    total_seats: 1,
  });

  // Validation & Payment Link state
  const [validatingCaravan, setValidatingCaravan] = useState<any>(null);
  const [validationLink, setValidationLink] = useState("");
  const [linkError, setLinkError] = useState("");

  const queryClient = useQueryClient();
  const setHiddenFn = useServerFn(adminSetCaravanHidden);
  const updateCaravanFn = useServerFn(adminUpdateCaravan);
  const deleteCaravanFn = useServerFn(adminDeleteCaravan);

  const [deletingCaravan, setDeletingCaravan] = useState<any | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (caravanId: string) => deleteCaravanFn({ data: { caravanId } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Voyage supprimé définitivement avec succès");
      setDeletingCaravan(null);
      setEditingCaravan(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });
  
  const mutation = useMutation({
    mutationFn: (payload: { caravanId: string; hidden: boolean }) => setHiddenFn({ data: payload }),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(vars.hidden ? "Caravane masquée du catalogue." : "Caravane republiée.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: {
      caravanId: string;
      status?: CaravanStatus;
      payment_link?: string;
      from_label?: string;
      to_label?: string;
      departure_at?: string;
      price_fcfa?: number;
      total_seats?: number;
    }) => updateCaravanFn({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Caravane mise à jour avec succès.");
      setEditingCaravan(null);
      setValidatingCaravan(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const all = data ?? [];
  const rows = all.filter((c) => {
    const matchFilter =
      filter === "all" ? true : filter === "hidden" ? c.hidden : c.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q || c.route.toLowerCase().includes(q) || c.organizer.toLowerCase().includes(q);
    return matchFilter && matchQuery;
  });

  const pendingCount = all.filter((c) => c.status === "pending").length;
  const published = all.filter((c) => c.status === "published" && !c.hidden).length;
  const hiddenCount = all.filter((c) => c.hidden).length;
  const seats = all.reduce((a, c) => a + c.capacity, 0);
  const booked = all.reduce((a, c) => a + c.booked, 0);

  const openValidationModal = (c: any) => {
    setValidatingCaravan(c);
    setValidationLink(c.paymentLink || "");
    setLinkError("");
  };

  const handleValidateSubmit = (targetStatus?: "published" | "draft") => {
    if (!validatingCaravan) return;
    
    // If validating to publish, link is required
    const trimmedLink = validationLink.trim();
    if (targetStatus === "published" || (!targetStatus && validatingCaravan.status === "pending")) {
      if (!trimmedLink) {
        setLinkError("Veuillez renseigner le lien Wave Business pour valider et mettre en ligne ce voyage.");
        return;
      }
      if (!trimmedLink.startsWith("http://") && !trimmedLink.startsWith("https://")) {
        setLinkError("Le lien doit être une URL valide (commençant par https://).");
        return;
      }
    }

    setLinkError("");
    const payload: {
      caravanId: string;
      status?: CaravanStatus;
      payment_link?: string;
    } = {
      caravanId: validatingCaravan.id,
      payment_link: trimmedLink,
    };
    const resolvedStatus = targetStatus ?? (validatingCaravan.status === "pending" ? ("published" as CaravanStatus) : undefined);
    if (resolvedStatus) {
      payload.status = resolvedStatus;
    }
    updateMutation.mutate(payload);
  };

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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Départs"
          value={fmt(all.length)}
          secondary={`${published} en ligne`}
          icon={Bus}
        />
        <KpiCard
          title="En attente de validation"
          value={fmt(pendingCount)}
          secondary={pendingCount > 0 ? "Nécessitent un lien Wave" : "Toutes traitées"}
          icon={Clock}
          {...(pendingCount > 0 ? { accent: "warning" as const } : {})}
        />
        <KpiCard
          title="Remplissage moyen"
          value={`${pct(booked, seats)} %`}
          secondary="Toutes universités confondues"
          icon={Bus}
          accent="mint"
        />
        <KpiCard
          title="Annonces masquées"
          value={fmt(hiddenCount)}
          secondary="Retirées du catalogue"
          icon={EyeOff}
        />
      </div>

      <div className="py-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Toutes" },
            {
              value: "pending",
              label: pendingCount > 0 ? `En attente (${pendingCount})` : "En attente",
            },
            { value: "published", label: "Publiées" },
            { value: "full", label: "Complètes" },
            { value: "completed", label: "Terminées" },
            { value: "hidden", label: "Masquées" },
          ]}
        />
      </div>

      <Panel bodyClassName="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement des caravanes…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Bus} message="Aucune caravane ne correspond à ces filtres." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Itinéraire</th>
                  <th className="px-5 py-3 font-bold">Organisateur</th>
                  <th className="px-5 py-3 font-bold">Date</th>
                  <th className="px-5 py-3 font-bold">Remplissage</th>
                  <th className="px-5 py-3 font-bold">Revenus</th>
                  <th className="px-5 py-3 font-bold">Statut</th>
                  <th className="px-5 py-3 font-bold">Lien Paiement</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c) => (
                  <tr key={c.id} className={c.status === "pending" ? "bg-amber-500/[0.03]" : undefined}>
                    <td className="px-5 py-3 font-semibold">{c.route}</td>
                    <td className="px-5 py-3 text-muted-foreground">{c.organizer}</td>
                    <td className="px-5 py-3 text-muted-foreground">{dateTimeFr(c.departureAt)}</td>
                    <td className="px-5 py-3">
                      <div className="w-32">
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
                      <TonePill tone={c.hidden ? "neutral" : statusTone[c.status]}>
                        {c.hidden ? "Masquée" : statusLabels[c.status]}
                      </TonePill>
                    </td>
                    <td className="px-5 py-3">
                      {c.paymentLink ? (
                        <a
                          href={c.paymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                          title={c.paymentLink}
                        >
                          <LinkIcon className="size-3" />
                          <span>Wave Actif</span>
                          <ExternalLink className="size-2.5 opacity-70" />
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-medium">
                          <AlertCircle className="size-3 shrink-0" /> Manquant
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2 items-center">
                        {c.status === "pending" ? (
                          <AdminButton
                            variant="primary"
                            disabled={updateMutation.isPending}
                            onClick={() => openValidationModal(c)}
                            className="bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-sm"
                          >
                            <ShieldCheck className="size-3.5" /> Valider & Lien
                          </AdminButton>
                        ) : (
                          <span title="Consulter ou modifier le lien Wave">
                            <AdminButton
                              variant="ghost"
                              onClick={() => openValidationModal(c)}
                            >
                              <LinkIcon className="size-3.5" /> Lien
                            </AdminButton>
                          </span>
                        )}

                        <AdminButton
                          variant="ghost"
                          onClick={() => {
                            setEditingCaravan(c);
                            setEditForm({
                              from_label: c.fromLabel || "",
                              to_label: c.toLabel || "",
                              departure_at: c.departureAt ? new Date(c.departureAt).toISOString().slice(0, 16) : "",
                              price_fcfa: c.price || 0,
                              total_seats: c.capacity || 1,
                            });
                          }}
                        >
                          <Edit2 className="size-3.5" /> Éditer
                        </AdminButton>

                        <AdminButton
                          variant={c.hidden ? "success" : "ghost"}
                          disabled={mutation.isPending}
                          onClick={() =>
                            mutation.mutate({ caravanId: c.id, hidden: !c.hidden })
                          }
                        >
                          {c.hidden ? (
                            <>
                              <Eye className="size-3.5" /> Republier
                            </>
                          ) : (
                            <>
                              <EyeOff className="size-3.5" /> Masquer
                            </>
                          )}
                        </AdminButton>

                        <AdminButton
                          variant="danger"
                          title="Supprimer définitivement ce voyage"
                          onClick={() => setDeletingCaravan(c)}
                        >
                          <Trash2 className="size-3.5" /> Supprimer
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

      {/* Modal: Validation & Ajout du lien de paiement */}
      {validatingCaravan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {validatingCaravan.status === "pending"
                      ? "Valider la caravane et associer le lien"
                      : "Lien de paiement Wave"}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Attribution du lien de paiement Wave Business Merchant
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidatingCaravan(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Recap info */}
            <div className="mb-4 rounded-xl border border-border bg-muted/40 p-3.5 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Trajet :</span>
                <span className="font-bold text-foreground">{validatingCaravan.route}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Organisateur :</span>
                <span className="font-medium text-foreground">{validatingCaravan.organizer}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Départ :</span>
                <span className="font-medium text-foreground">{dateTimeFr(validatingCaravan.departureAt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">Tarif & Places :</span>
                <span className="font-medium text-foreground">
                  {fcfa(validatingCaravan.price)} · {validatingCaravan.capacity} places
                </span>
              </div>
            </div>

            {validatingCaravan.status === "pending" && (
              <div className="mb-4 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400">
                <span className="font-bold">Information :</span> En validant, le statut du voyage passera à{" "}
                <span className="font-bold underline">Publiée</span> et il sera immédiatement visible dans le catalogue étudiant avec redirection Wave.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-foreground">
                  Lien de paiement Wave Business <span className="text-destructive">*</span>
                </label>
                <div className="relative flex items-center">
                  <LinkIcon className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                  <input
                    type="url"
                    value={validationLink}
                    onChange={(e) => {
                      setValidationLink(e.target.value);
                      if (linkError) setLinkError("");
                    }}
                    placeholder="https://pay.wave.com/m/M_..."
                    className="h-10 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40 font-mono"
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Renseignez le lien de paiement généré depuis l'espace Wave Business Merchant King-Bus.
                </p>
                {linkError && (
                  <p className="mt-1 text-xs font-semibold text-destructive">{linkError}</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
              <div className="flex gap-2">
                <AdminButton variant="ghost" onClick={() => setValidatingCaravan(null)}>
                  Annuler
                </AdminButton>
                {validatingCaravan.status === "pending" && (
                  <span title="Renvoyer à l'organisateur en brouillon">
                    <AdminButton
                      variant="ghost"
                      disabled={updateMutation.isPending}
                      onClick={() => handleValidateSubmit("draft")}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Renvoyer en brouillon
                    </AdminButton>
                  </span>
                )}
              </div>
              <AdminButton
                variant="primary"
                disabled={updateMutation.isPending}
                onClick={() => handleValidateSubmit()}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-md"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Enregistrement…
                  </>
                ) : validatingCaravan.status === "pending" ? (
                  <>
                    <ShieldCheck className="size-4" /> Valider & Publier
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" /> Mettre à jour le lien
                  </>
                )}
              </AdminButton>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Édition basique des informations */}
      {editingCaravan && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Éditer la caravane</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Départ</label>
                <input
                  type="text"
                  value={editForm.from_label}
                  onChange={(e) => setEditForm({ ...editForm, from_label: e.target.value })}
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Destination</label>
                <input
                  type="text"
                  value={editForm.to_label}
                  onChange={(e) => setEditForm({ ...editForm, to_label: e.target.value })}
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Date et heure</label>
                <input
                  type="datetime-local"
                  value={editForm.departure_at}
                  onChange={(e) => setEditForm({ ...editForm, departure_at: e.target.value })}
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Prix (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.price_fcfa}
                    onChange={(e) => setEditForm({ ...editForm, price_fcfa: Number(e.target.value) })}
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-muted-foreground">Places totales</label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.total_seats}
                    onChange={(e) => setEditForm({ ...editForm, total_seats: Number(e.target.value) })}
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3">
              <AdminButton
                variant="danger"
                onClick={() => {
                  setDeletingCaravan(editingCaravan);
                }}
              >
                <Trash2 className="size-3.5" /> Supprimer ce voyage
              </AdminButton>
              <div className="flex items-center gap-3">
                <AdminButton variant="ghost" onClick={() => setEditingCaravan(null)}>
                  Annuler
                </AdminButton>
                <AdminButton
                  variant="primary"
                  disabled={updateMutation.isPending}
                  onClick={() => {
                    const payload: {
                      caravanId: string;
                      from_label: string;
                      to_label: string;
                      price_fcfa: number;
                      total_seats: number;
                      departure_at?: string;
                    } = {
                      caravanId: editingCaravan.id,
                      from_label: editForm.from_label,
                      to_label: editForm.to_label,
                      price_fcfa: editForm.price_fcfa,
                      total_seats: editForm.total_seats,
                    };
                    if (editForm.departure_at) {
                      payload.departure_at = new Date(editForm.departure_at).toISOString();
                    }
                    updateMutation.mutate(payload);
                  }}
                >
                  Enregistrer
                </AdminButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmation de suppression définitive admin */}
      {deletingCaravan && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-danger/10 text-danger shrink-0">
                <Trash2 className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">
                  Supprimer ce voyage ?
                </h2>
                <p className="text-xs text-muted-foreground">
                  Cette action est irréversible et supprimera le voyage pour tout le monde.
                </p>
              </div>
            </div>

            <div className="my-3 space-y-3">
              <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Trajet :</span>
                  <span className="font-bold text-foreground">
                    {deletingCaravan.route || `${deletingCaravan.fromLabel || deletingCaravan.from_label} → ${deletingCaravan.toLabel || deletingCaravan.to_label}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Organisateur :</span>
                  <span className="font-medium text-foreground">{deletingCaravan.organizer}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Départ :</span>
                  <span className="font-medium text-foreground">
                    {dateTimeFr(deletingCaravan.departureAt || deletingCaravan.departure_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-muted-foreground">Identifiant :</span>
                  <span className="font-mono text-muted-foreground">
                    {deletingCaravan.id.slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>

              {(deletingCaravan.booked > 0 || (deletingCaravan.capacity - deletingCaravan.seatsLeft > 0)) && (
                <div className="rounded-xl border border-danger/30 bg-danger/10 p-3 text-xs text-danger space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="size-4 shrink-0" />
                    Attention : Réservations enregistrées !
                  </div>
                  <p className="leading-relaxed text-[11px] text-danger/90">
                    Ce voyage compte actuellement{" "}
                    <strong className="underline">
                      {deletingCaravan.booked || (deletingCaravan.capacity - deletingCaravan.seatsLeft)} place(s) réservée(s)
                    </strong>
                    . La suppression supprimera également tous les billets et paiements liés, et sera consignée dans le journal d'audit.
                  </p>
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Confirmez-vous la suppression définitive de ce voyage de la base de données ?
              </p>
            </div>

            <div className="mt-4 flex justify-end gap-2.5 pt-3 border-t border-border">
              <AdminButton
                variant="ghost"
                disabled={deleteMutation.isPending}
                onClick={() => setDeletingCaravan(null)}
              >
                Annuler
              </AdminButton>
              <AdminButton
                variant="danger"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  if (deletingCaravan) {
                    deleteMutation.mutate(deletingCaravan.id);
                  }
                }}
              >
                <Trash2 className="size-3.5" />
                {deleteMutation.isPending ? "Suppression en cours…" : "Supprimer définitivement"}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
