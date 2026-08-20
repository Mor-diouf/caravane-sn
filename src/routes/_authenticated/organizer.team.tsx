import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mail, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, KpiCard, PageHeader, Panel, ProBadge } from "@/components/organizer/ui";
import { orgTeamQuery } from "@/lib/dash-queries";
import { organizerAddMember, organizerRemoveMember } from "@/lib/organizer.functions";
import { initialsOf } from "@/lib/dash-shared";
import { roleLabels } from "@/lib/organizer";

export const Route = createFileRoute("/_authenticated/organizer/team")({
  head: () => ({
    meta: [
      { title: "Équipe — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Invitez vos collaborateurs et attribuez des rôles : gestionnaire, finance, contrôleur ou support.",
      },
      { property: "og:title", content: "Équipe — CaravaneHub" },
      {
        property: "og:description",
        content: "Travaillez à plusieurs sur vos caravanes avec des permissions claires.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TeamPage,
});

const permissions = [
  { role: "manager", detail: "Créer et publier des caravanes, gérer les réservations." },
  { role: "finance", detail: "Consulter les paiements, demander des retraits, exporter." },
  { role: "scanner", detail: "Scanner les billets et valider les embarquements." },
  { role: "support", detail: "Répondre aux étudiants et traiter les demandes." },
];

function TeamPage() {
  const queryClient = useQueryClient();
  const { data: team, isLoading } = useQuery(orgTeamQuery());
  const addFn = useServerFn(organizerAddMember);
  const removeFn = useServerFn(organizerRemoveMember);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "finance" | "scanner" | "support">("manager");

  const addMutation = useMutation({
    mutationFn: (data: Parameters<typeof organizerAddMember>[0]["data"]) => addFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Invitation envoyée");
      setEmail("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: (data: Parameters<typeof organizerRemoveMember>[0]["data"]) => removeFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Membre retiré");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const members = team ?? [];

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Équipe <ProBadge />
          </span>
        }
        subtitle="Déléguez sans partager votre mot de passe."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Membres actifs" value={String(members.length)} icon={UsersRound} />
        <KpiCard title="Rôles disponibles" value={String(Object.keys(roleLabels).length)} icon={ShieldCheck} accent="info" />
        <KpiCard title="Invitations" value="—" icon={Mail} accent="warning" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" title="Membres" bodyClassName="p-0">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Chargement de l'équipe…</p>
          ) : (
            <ul className="divide-y divide-border">
              {members.map((m) => (
                <li key={m.id} className="flex items-center gap-4 px-5 py-4">
                  <Avatar initials={initialsOf(m.name)} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{m.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                  </div>
                  <span className="rounded-full bg-brand-soft px-3 py-1 text-[11px] font-bold text-primary">
                    {roleLabels[m.role] ?? m.role}
                  </span>
                  {m.id !== "owner" && (
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate({ memberId: m.id })}
                      className="text-xs font-bold text-danger hover:underline"
                    >
                      Retirer
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Inviter un collaborateur">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email.trim()) return;
              addMutation.mutate({ email, role });
            }}
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                Adresse e-mail
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@amicale-uasz.sn"
                maxLength={255}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Rôle</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as typeof role)}
                className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              >
                {Object.entries(roleLabels)
                  .filter(([key]) => key !== "owner")
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-60"
            >
              <UserPlus className="size-4" /> {addMutation.isPending ? "Envoi…" : "Envoyer l'invitation"}
            </button>
          </form>
          <ul className="mt-5 space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
            {permissions.map((p) => (
              <li key={p.role}>
                <span className="font-bold text-foreground">{roleLabels[p.role]} :</span> {p.detail}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
