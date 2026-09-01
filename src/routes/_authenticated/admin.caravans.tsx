import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bus, EyeOff, Eye, Loader2, Search, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EmptyState, KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { AdminButton, Tabs, TonePill, type Tone } from "@/components/admin/ui";
import { adminCaravansQuery } from "@/lib/dash-queries";
import { adminSetCaravanHidden, adminUpdateCaravan } from "@/lib/admin.functions";
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
  const [editingCaravan, setEditingCaravan] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    from_label: "",
    to_label: "",
    departure_at: "",
    price_fcfa: 0,
    total_seats: 1,
  });

  const queryClient = useQueryClient();
  const setHiddenFn = useServerFn(adminSetCaravanHidden);
  const updateCaravanFn = useServerFn(adminUpdateCaravan);
  
  const mutation = useMutation({
    mutationFn: (payload: { caravanId: string; hidden: boolean }) => setHiddenFn({ data: payload }),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(vars.hidden ? "Caravane masquée du catalogue." : "Caravane republiée.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { caravanId: string; status?: CaravanStatus; payment_link?: string; from_label?: string; to_label?: string; departure_at?: string; price_fcfa?: number; total_seats?: number }) => updateCaravanFn({ data: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Caravane mise à jour avec succès.");
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

  const published = all.filter((c) => c.status === "published" && !c.hidden).length;
  const hiddenCount = all.filter((c) => c.hidden).length;
  const seats = all.reduce((a, c) => a + c.capacity, 0);
  const booked = all.reduce((a, c) => a + c.booked, 0);

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
          title="Caravanes"
          value={fmt(all.length)}
          secondary={`${published} en ligne`}
          icon={Bus}
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
            { value: "pending", label: "En attente" },
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
                    <td className="px-5 py-3 text-muted-foreground">{c.organizer}</td>
                    <td className="px-5 py-3 text-muted-foreground">{dateTimeFr(c.departureAt)}</td>
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
                      <TonePill tone={c.hidden ? "neutral" : statusTone[c.status]}>
                        {c.hidden ? "Masquée" : statusLabels[c.status]}
                      </TonePill>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {c.status === "pending" && (
                          <AdminButton
                            variant="primary"
                            disabled={updateMutation.isPending}
                            onClick={() => {
                              const link = prompt("Entrez le lien de paiement Wave Business généré pour cette caravane :");
                              if (link !== null) {
                                updateMutation.mutate({ caravanId: c.id, status: "published", payment_link: link });
                              }
                            }}
                          >
                            <Eye className="size-3.5" /> Valider & Lien
                          </AdminButton>
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

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
            <div className="mt-6 flex justify-end gap-3">
              <AdminButton variant="ghost" onClick={() => setEditingCaravan(null)}>
                Annuler
              </AdminButton>
              <AdminButton
                variant="primary"
                disabled={updateMutation.isPending}
                onClick={() => {
                  updateMutation.mutate({
                    caravanId: editingCaravan.id,
                    from_label: editForm.from_label,
                    to_label: editForm.to_label,
                    departure_at: editForm.departure_at ? new Date(editForm.departure_at).toISOString() : undefined,
                    price_fcfa: editForm.price_fcfa,
                    total_seats: editForm.total_seats,
                  });
                  setEditingCaravan(null);
                }}
              >
                Enregistrer
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
