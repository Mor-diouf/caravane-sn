import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Ban, BadgeCheck, Loader2, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Avatar, EmptyState, KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, Tabs, TonePill } from "@/components/admin/ui";
import { adminUsersQuery } from "@/lib/dash-queries";
import { adminSetUserBlocked, adminSetUserRole } from "@/lib/admin.functions";
import { dateFr, initialsOf } from "@/lib/dash-shared";
import { fcfa, fmt } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Utilisateurs — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Annuaire complet des étudiants et organisateurs : rôles, dépenses, blocage de comptes.",
      },
      { property: "og:title", content: "Utilisateurs — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "Gérez les rôles et l'accès de tous les comptes de la plateforme.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UsersPage,
});

type Role = "student" | "organizer" | "pending_organizer" | "admin";
type Filter = "all" | Role | "blocked";

const roleLabels: Record<Role, string> = {
  student: "Étudiant",
  organizer: "Organisateur",
  pending_organizer: "En attente org.",
  admin: "Administrateur",
};

function UsersPage() {
  const { data: users, isLoading } = useQuery(adminUsersQuery());
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const queryClient = useQueryClient();
  const setRoleFn = useServerFn(adminSetUserRole);
  const setBlockedFn = useServerFn(adminSetUserBlocked);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin"] });

  const roleMutation = useMutation({
    mutationFn: (payload: { userId: string; role: Role; grant: boolean }) =>
      setRoleFn({ data: payload }),
    onSuccess: () => {
      invalidate();
      toast.success("Rôle mis à jour.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const blockMutation = useMutation({
    mutationFn: (payload: { userId: string; blocked: boolean }) => setBlockedFn({ data: payload }),
    onSuccess: (_r, vars) => {
      invalidate();
      toast.success(vars.blocked ? "Compte bloqué." : "Compte réactivé.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rows = users ?? [];
  const filtered = rows.filter((u) => {
    const matchFilter =
      filter === "all" ? true : filter === "blocked" ? u.blocked : u.role === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchFilter && matchQuery;
  });

  const students = rows.filter((u) => u.role === "student").length;
  const organizers = rows.filter((u) => u.role === "organizer").length;
  const blocked = rows.filter((u) => u.blocked).length;
  const busy = roleMutation.isPending || blockMutation.isPending;

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Tous les comptes de la plateforme, avec leurs rôles et leur historique."
        actions={
          <label className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Rechercher un utilisateur</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom ou e-mail…"
              className="h-9 w-full min-w-56 rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Étudiants" value={fmt(students)} secondary="Comptes voyageurs" icon={Users} />
        <KpiCard
          title="Organisateurs"
          value={fmt(organizers)}
          secondary="Statut accordé par vous"
          icon={BadgeCheck}
          accent="mint"
        />
        <KpiCard
          title="Comptes bloqués"
          value={fmt(blocked)}
          secondary="Accès révoqué"
          icon={Ban}
          accent="warning"
        />
      </div>

      <div className="py-4">
        <Tabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "Tous" },
            { value: "student", label: "Étudiants" },
            { value: "pending_organizer", label: "Org. en attente" },
            { value: "organizer", label: "Organisateurs" },
            { value: "blocked", label: "Bloqués" },
          ]}
        />
      </div>

      <Panel bodyClassName="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement des comptes…
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Users} message="Aucun utilisateur ne correspond à cette recherche." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-bold">Utilisateur</th>
                  <th className="px-5 py-3 font-bold">Rôle</th>
                  <th className="px-5 py-3 font-bold">Université</th>
                  <th className="px-5 py-3 font-bold">Trajets</th>
                  <th className="px-5 py-3 font-bold">Dépensé</th>
                  <th className="px-5 py-3 font-bold">Inscrit le</th>
                  <th className="px-5 py-3 text-right font-bold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initialsOf(u.name)} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {u.name}
                            {u.orgName && <span className="ml-2 text-xs font-normal text-muted-foreground">— {u.orgName}</span>}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <TonePill
                        tone={
                          u.role === "organizer"
                            ? "success"
                            : u.role === "admin"
                              ? "info"
                              : u.role === "pending_organizer"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {roleLabels[u.role]}
                      </TonePill>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{u.university}</td>
                    <td className="px-5 py-3 font-semibold">{u.trips}</td>
                    <td className="px-5 py-3 font-semibold">{fcfa(u.spent)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{dateFr(u.joined)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {u.role === "student" || u.role === "pending_organizer" ? (
                          <AdminButton
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              roleMutation.mutate({ userId: u.id, role: "organizer", grant: true })
                            }
                          >
                            <ShieldCheck className="size-3.5" /> {u.role === "pending_organizer" ? "Valider organisateur" : "Rendre organisateur"}
                          </AdminButton>
                        ) : u.role === "organizer" ? (
                          <AdminButton
                            variant="ghost"
                            disabled={busy}
                            onClick={() =>
                              roleMutation.mutate({ userId: u.id, role: "organizer", grant: false })
                            }
                          >
                            <ShieldCheck className="size-3.5" /> Retirer le statut
                          </AdminButton>
                        ) : null}
                        <AdminButton
                          variant={u.blocked ? "success" : "danger"}
                          disabled={busy}
                          onClick={() =>
                            blockMutation.mutate({ userId: u.id, blocked: !u.blocked })
                          }
                        >
                          <Ban className="size-3.5" /> {u.blocked ? "Réactiver" : "Bloquer"}
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
