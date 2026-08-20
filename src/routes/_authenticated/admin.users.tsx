import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Ban, BadgeCheck, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, EmptyState, KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, Tabs, TonePill } from "@/components/admin/ui";
import { platformUsers, userRoleLabels, type PlatformUser } from "@/lib/admin";
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

type Filter = "all" | PlatformUser["role"] | "blocked";

function UsersPage() {
  const [users, setUsers] = useState<PlatformUser[]>(platformUsers);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filtered = users.filter((u) => {
    const matchFilter =
      filter === "all" ? true : filter === "blocked" ? u.blocked : u.role === filter;
    const q = query.trim().toLowerCase();
    const matchQuery =
      !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchFilter && matchQuery;
  });

  const students = users.filter((u) => u.role === "student").length;
  const organizers = users.filter((u) => u.role === "organizer").length;
  const blocked = users.filter((u) => u.blocked).length;

  function toggleBlock(u: PlatformUser) {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, blocked: !x.blocked } : x)));
    toast.success(u.blocked ? `${u.name} réactivé.` : `${u.name} bloqué.`);
  }

  function promote(u: PlatformUser) {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: "organizer" } : x)));
    toast.success(`${u.name} a reçu le statut d'organisateur.`);
  }

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
            { value: "organizer", label: "Organisateurs" },
            { value: "blocked", label: "Bloqués" },
          ]}
        />
      </div>

      <Panel bodyClassName="p-0">
        {filtered.length === 0 ? (
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
                        <Avatar initials={u.initials} />
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{u.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <TonePill
                        tone={
                          u.role === "organizer" ? "success" : u.role === "admin" ? "info" : "neutral"
                        }
                      >
                        {userRoleLabels[u.role]}
                      </TonePill>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{u.university}</td>
                    <td className="px-5 py-3 font-semibold">{u.trips}</td>
                    <td className="px-5 py-3 font-semibold">{fcfa(u.spent)}</td>
                    <td className="px-5 py-3 text-muted-foreground">{u.joined}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        {u.role === "student" && (
                          <AdminButton variant="ghost" onClick={() => promote(u)}>
                            <ShieldCheck className="size-3.5" /> Rendre organisateur
                          </AdminButton>
                        )}
                        <AdminButton
                          variant={u.blocked ? "success" : "danger"}
                          onClick={() => toggleBlock(u)}
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
