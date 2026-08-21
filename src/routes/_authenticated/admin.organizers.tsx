import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BadgeCheck, Ban, Check, FileCheck2, Loader2, RotateCcw, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Avatar, EmptyState, PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, Tabs, TonePill, type Tone } from "@/components/admin/ui";
import { adminOrganizersQuery } from "@/lib/dash-queries";
import { adminSetOrganizerStatus } from "@/lib/admin.functions";
import { dateFr, initialsOf } from "@/lib/dash-shared";
import { fcfa } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/admin/organizers")({
  head: () => ({
    meta: [
      { title: "Organisateurs — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Accordez, suspendez ou retirez le statut d'organisateur des amicales universitaires sénégalaises.",
      },
      { property: "og:title", content: "Organisateurs — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "File de validation des comptes organisateurs de la plateforme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrganizersPage,
});

type OrganizerStatus = "pending" | "approved" | "suspended" | "rejected";
type Filter = "all" | OrganizerStatus;

const statusLabels: Record<OrganizerStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  suspended: "Suspendu",
  rejected: "Refusé",
};

const statusTone: Record<OrganizerStatus, Tone> = {
  pending: "warning",
  approved: "success",
  suspended: "danger",
  rejected: "neutral",
};

function OrganizersPage() {
  const { data, isLoading } = useQuery(adminOrganizersQuery());
  const [filter, setFilter] = useState<Filter>("pending");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const setStatusFn = useServerFn(adminSetOrganizerStatus);
  const mutation = useMutation({
    mutationFn: (payload: { organizerId: string; status: OrganizerStatus }) =>
      setStatusFn({ data: payload }),
    onSuccess: (_r, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success(`Statut mis à jour : ${statusLabels[vars.status].toLowerCase()}.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const accounts = data ?? [];
  const selected = accounts.find((a) => a.id === selectedId) ?? null;

  const counts = useMemo(
    () => ({
      all: accounts.length,
      pending: accounts.filter((a) => a.status === "pending").length,
      approved: accounts.filter((a) => a.status === "approved").length,
      suspended: accounts.filter((a) => a.status === "suspended").length,
      rejected: accounts.filter((a) => a.status === "rejected").length,
    }),
    [accounts],
  );

  const filtered = accounts.filter((a) => {
    const matchStatus = filter === "all" || a.status === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q ||
      a.name.toLowerCase().includes(q) ||
      a.university.toLowerCase().includes(q) ||
      a.contact.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  return (
    <>
      <PageHeader
        title="Organisateurs"
        subtitle="C'est ici que vous accordez ou retirez le statut d'organisateur."
        actions={
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Rechercher un organisateur</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, université, responsable…"
              className="h-9 w-full min-w-56 rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        }
      />

      <div className="pb-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "pending", label: "En attente", count: counts.pending },
            { value: "approved", label: "Approuvés", count: counts.approved },
            { value: "suspended", label: "Suspendus", count: counts.suspended },
            { value: "rejected", label: "Refusés", count: counts.rejected },
            { value: "all", label: "Tous", count: counts.all },
          ]}
        />
      </div>

      <Panel bodyClassName="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement des organisateurs…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={BadgeCheck} message="Aucun organisateur dans cette catégorie." />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar initials={initialsOf(a.name)} />
                <div className="min-w-48 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-bold">{a.name}</p>
                    <TonePill tone={statusTone[a.status]}>{statusLabels[a.status]}</TonePill>
                    {a.isPro && (
                      <span className="rounded-md bg-mint/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-mint">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{a.university}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground/80">
                    {a.contact} · {a.phone} · demande du {dateFr(a.createdAt)}
                  </p>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold">{fcfa(a.revenue)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {a.caravans} caravanes · {a.rating ? `${a.rating}/5` : "pas d'avis"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AdminButton variant="ghost" onClick={() => setSelectedId(a.id)}>
                    <FileCheck2 className="size-3.5" /> Dossier
                  </AdminButton>
                  {a.status !== "approved" && (
                    <AdminButton
                      variant="success"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ organizerId: a.id, status: "approved" })}
                    >
                      <Check className="size-3.5" /> Accorder
                    </AdminButton>
                  )}
                  {a.status === "approved" && (
                    <AdminButton
                      variant="danger"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ organizerId: a.id, status: "suspended" })}
                    >
                      <Ban className="size-3.5" /> Suspendre
                    </AdminButton>
                  )}
                  {a.status === "pending" && (
                    <AdminButton
                      variant="danger"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ organizerId: a.id, status: "rejected" })}
                    >
                      <X className="size-3.5" /> Refuser
                    </AdminButton>
                  )}
                  {(a.status === "suspended" || a.status === "rejected") && (
                    <AdminButton
                      variant="ghost"
                      disabled={mutation.isPending}
                      onClick={() => mutation.mutate({ organizerId: a.id, status: "pending" })}
                    >
                      <RotateCcw className="size-3.5" /> Réexaminer
                    </AdminButton>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-brand/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-lifted">
            <div className="flex items-start gap-3">
              <Avatar initials={initialsOf(selected.name)} />
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold tracking-tight">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{selected.university}</p>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={() => setSelectedId(null)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Responsable</dt>
                <dd className="font-semibold">{selected.contact}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Téléphone</dt>
                <dd className="font-semibold">{selected.phone}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">E-mail</dt>
                <dd className="truncate font-semibold">{selected.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Commission</dt>
                <dd className="font-semibold">
                  {Math.round(selected.commissionRate * 100)} %
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Vérifié le</dt>
                <dd className="font-semibold">{dateFr(selected.verifiedAt)}</dd>
              </div>
            </dl>

            <p className="mt-5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Documents
            </p>
            {!selected.documents || Object.keys(selected.documents).length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">Aucun document déposé.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {selected.documents['student_card'] && (
                  <li className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                    <span>Carte Étudiant</span>
                    <a
                      href={selected.documents['student_card']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-bold text-xs"
                    >
                      Ouvrir
                    </a>
                  </li>
                )}
                {selected.documents['id_card'] && (
                  <li className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm">
                    <span>Carte d'Identité (CIN)</span>
                    <a
                      href={selected.documents['id_card']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-bold text-xs"
                    >
                      Ouvrir
                    </a>
                  </li>
                )}
              </ul>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <AdminButton variant="ghost" onClick={() => setSelectedId(null)}>
                Fermer
              </AdminButton>
              {selected.status !== "approved" ? (
                <AdminButton
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ organizerId: selected.id, status: "approved" })
                  }
                >
                  <BadgeCheck className="size-3.5" /> Accorder le statut d'organisateur
                </AdminButton>
              ) : (
                <AdminButton
                  variant="danger"
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ organizerId: selected.id, status: "suspended" })
                  }
                >
                  <Ban className="size-3.5" /> Retirer le statut
                </AdminButton>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
