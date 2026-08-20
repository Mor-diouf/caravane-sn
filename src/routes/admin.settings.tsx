import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Percent, Save, ShieldCheck, Sliders } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, TonePill } from "@/components/admin/ui";
import { platform, systemHealth } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({
    meta: [
      { title: "Paramètres — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Réglez la commission de la plateforme, les opérateurs de paiement et les règles de validation des organisateurs.",
      },
      { property: "og:title", content: "Paramètres — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "Configuration globale de la plateforme Caravane Étudiants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const operators = ["Wave", "Orange Money", "Free Money", "Carte bancaire"] as const;

function Toggle({
  label,
  description,
  defaultOn = false,
}: {
  label: string;
  description: string;
  defaultOn?: boolean;
}) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn(!on)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-card shadow transition-all",
            on ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
    </div>
  );
}

function SettingsPage() {
  const [commission, setCommission] = useState(platform.commission);

  return (
    <>
      <PageHeader
        title="Paramètres plateforme"
        subtitle="Les règles qui s'appliquent à tous les organisateurs et étudiants."
        actions={
          <AdminButton onClick={() => toast.success("Paramètres enregistrés.")}>
            <Save className="size-3.5" /> Enregistrer
          </AdminButton>
        }
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Commission de la plateforme" description="Prélevée sur chaque réservation payée">
          <label className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Taux appliqué
          </label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={15}
              step={0.5}
              value={commission}
              onChange={(e) => setCommission(Number(e.target.value))}
              className="h-2 flex-1 accent-primary"
            />
            <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-extrabold">
              {commission} <Percent className="size-3.5" />
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sur une réservation de 8 500 FCFA, la plateforme encaisse{" "}
            <span className="font-bold text-foreground">
              {Math.round(8500 * (commission / 100))} FCFA
            </span>
            .
          </p>
        </Panel>

        <Panel title="Opérateurs de paiement acceptés">
          <ul className="space-y-2">
            {operators.map((op) => (
              <li
                key={op}
                className="flex items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
              >
                <span className="font-semibold">{op}</span>
                <TonePill tone={op === "Carte bancaire" ? "warning" : "success"}>
                  {op === "Carte bancaire" ? "Bêta" : "Actif"}
                </TonePill>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Règles de validation des organisateurs" description="Ce qui est exigé avant d'accorder le statut">
          <div className="divide-y divide-border">
            <Toggle
              label="Statuts de l'amicale obligatoires"
              description="Document officiel signé par l'université."
              defaultOn
            />
            <Toggle
              label="Pièce d'identité du responsable"
              description="Vérification d'identité du gestionnaire du compte."
              defaultOn
            />
            <Toggle
              label="Validation manuelle par le super-admin"
              description="Aucun compte ne devient organisateur automatiquement."
              defaultOn
            />
            <Toggle
              label="Période d'essai Pro de 14 jours"
              description="Offerte aux nouveaux organisateurs approuvés."
            />
          </div>
        </Panel>

        <Panel title="Sécurité & système">
          <div className="flex items-center gap-3 rounded-xl bg-brand-soft p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">{platform.admin.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {platform.admin.role} · {platform.admin.email}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {systemHealth.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0">
                  <span className="block font-semibold">{s.label}</span>
                  <span className="block text-xs text-muted-foreground">{s.detail}</span>
                </span>
                <TonePill tone={s.status === "ok" ? "success" : "warning"}>
                  {s.status === "ok" ? "OK" : "À surveiller"}
                </TonePill>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sliders className="size-3.5" /> Version {platform.version} de la plateforme
          </p>
        </Panel>
      </div>
    </>
  );
}
