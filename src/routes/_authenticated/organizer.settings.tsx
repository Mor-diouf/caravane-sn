import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Building2, CreditCard, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/organizer/ui";
import { organization } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/organizer/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Profil de votre amicale, coordonnées de paiement mobile money et préférences de notifications.",
      },
      { property: "og:title", content: "Paramètres — CaravaneHub" },
      {
        property: "og:description",
        content: "Configurez votre organisation, vos paiements et vos alertes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [notifs, setNotifs] = useState({
    booking: true,
    payment: true,
    review: true,
    weekly: false,
  });

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Votre organisation, vos paiements et vos alertes." />

      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success("Paramètres enregistrés");
        }}
      >
        <Panel title="Profil de l'organisation" description="Visible par les étudiants dans l'application">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
              <Building2 className="size-5" />
            </span>
            <div>
              <p className="font-bold">{organization.name}</p>
              <p className="text-xs text-muted-foreground">{organization.university}</p>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Nom de l'amicale", value: organization.name },
              { label: "Université", value: organization.university },
              { label: "Responsable", value: organization.owner.name },
              { label: "Téléphone", value: organization.owner.phone },
              { label: "E-mail", value: organization.owner.email },
            ].map((f) => (
              <label key={f.label} className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  {f.label}
                </span>
                <input
                  defaultValue={f.value}
                  maxLength={120}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Compte de paiement" description="Où sont versés vos revenus">
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Opérateur
                </span>
                <select className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40">
                  <option>Wave</option>
                  <option>Orange Money</option>
                  <option>Free Money</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Numéro à créditer
                </span>
                <input
                  defaultValue={organization.owner.phone}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <p className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                <CreditCard className="size-4 shrink-0" /> Commission plateforme : 3% par billet
                vendu, prélevée automatiquement.
              </p>
            </div>
          </Panel>

          <Panel title="Notifications" description="Ce dont vous voulez être averti">
            <ul className="space-y-1">
              {[
                { key: "booking" as const, label: "Nouvelle réservation" },
                { key: "payment" as const, label: "Paiement reçu" },
                { key: "review" as const, label: "Nouvel avis étudiant" },
                { key: "weekly" as const, label: "Résumé hebdomadaire par e-mail" },
              ].map((n) => (
                <li key={n.key} className="flex items-center justify-between py-2">
                  <span className="flex items-center gap-2 text-sm">
                    <Bell className="size-4 text-muted-foreground" /> {n.label}
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={notifs[n.key]}
                    aria-label={n.label}
                    onClick={() => setNotifs((s) => ({ ...s, [n.key]: !s[n.key] }))}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      notifs[n.key] ? "bg-primary-accent" : "bg-muted",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 size-5 rounded-full bg-card shadow transition-all",
                        notifs[n.key] ? "left-[22px]" : "left-0.5",
                      )}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </Panel>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-ambient"
          >
            <Save className="size-4" /> Enregistrer les modifications
          </button>
        </div>
      </form>
    </>
  );
}
