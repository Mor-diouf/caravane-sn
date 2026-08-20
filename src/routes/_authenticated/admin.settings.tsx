import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Percent, Save, ShieldCheck, Sliders } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, TonePill } from "@/components/admin/ui";
import { accessQuery, adminSettingsQuery } from "@/lib/dash-queries";
import { adminUpdateSettings } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/settings")({
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

function Toggle({
  label,
  description,
  on,
  onChange,
}: {
  label: string;
  description: string;
  on: boolean;
  onChange: (next: boolean) => void;
}) {
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
        onClick={() => onChange(!on)}
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

type FormState = {
  commission: number;
  wave: boolean;
  orange: boolean;
  free: boolean;
  autoApprove: boolean;
  minPayout: number;
  supportPhone: string;
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const settings = useQuery(adminSettingsQuery());
  const access = useQuery(accessQuery());
  const save = useServerFn(adminUpdateSettings);

  const [form, setForm] = useState<FormState | null>(null);

  useEffect(() => {
    const s = settings.data;
    if (!s || form) return;
    setForm({
      commission: Math.round(Number(s.commission_rate) * 1000) / 10,
      wave: s.wave_enabled,
      orange: s.orange_enabled,
      free: s.free_enabled,
      autoApprove: s.auto_approve_organizers,
      minPayout: s.min_payout_fcfa,
      supportPhone: s.support_phone,
    });
  }, [settings.data, form]);

  const mutation = useMutation({
    mutationFn: (state: FormState) =>
      save({
        data: {
          commission_rate: Math.round(state.commission * 10) / 1000,
          wave_enabled: state.wave,
          orange_enabled: state.orange,
          free_enabled: state.free,
          auto_approve_organizers: state.autoApprove,
          min_payout_fcfa: state.minPayout,
          support_phone: state.supportPhone,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Paramètres enregistrés.");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!form) {
    return (
      <>
        <PageHeader title="Paramètres plateforme" subtitle="Chargement de la configuration…" />
        <Panel>
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </Panel>
      </>
    );
  }

  const patch = (next: Partial<FormState>) => setForm({ ...form, ...next });

  return (
    <>
      <PageHeader
        title="Paramètres plateforme"
        subtitle="Les règles qui s'appliquent à tous les organisateurs et étudiants."
        actions={
          <AdminButton disabled={mutation.isPending} onClick={() => mutation.mutate(form)}>
            <Save className="size-3.5" /> {mutation.isPending ? "Enregistrement…" : "Enregistrer"}
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
              value={form.commission}
              onChange={(e) => patch({ commission: Number(e.target.value) })}
              className="h-2 flex-1 accent-primary"
            />
            <span className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-1.5 text-sm font-extrabold">
              {form.commission} <Percent className="size-3.5" />
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sur une réservation de 8 500 FCFA, la plateforme encaisse{" "}
            <span className="font-bold text-foreground">
              {Math.round(8500 * (form.commission / 100))} FCFA
            </span>
            .
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Retrait minimum (FCFA)
              </span>
              <input
                type="number"
                min={0}
                step={500}
                value={form.minPayout}
                onChange={(e) => patch({ minPayout: Number(e.target.value) })}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Téléphone support
              </span>
              <input
                value={form.supportPhone}
                onChange={(e) => patch({ supportPhone: e.target.value })}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
              />
            </label>
          </div>
        </Panel>

        <Panel title="Opérateurs de paiement acceptés">
          <div className="divide-y divide-border">
            <Toggle
              label="Wave"
              description="Paiement instantané par Wave."
              on={form.wave}
              onChange={(v) => patch({ wave: v })}
            />
            <Toggle
              label="Orange Money"
              description="Paiement via Orange Money Sénégal."
              on={form.orange}
              onChange={(v) => patch({ orange: v })}
            />
            <Toggle
              label="Free Money"
              description="Paiement via Free Money."
              on={form.free}
              onChange={(v) => patch({ free: v })}
            />
          </div>
        </Panel>

        <Panel
          title="Règles de validation des organisateurs"
          description="Ce qui s'applique avant d'accorder le statut"
        >
          <div className="divide-y divide-border">
            <Toggle
              label="Validation automatique des organisateurs"
              description="Si désactivé, chaque dossier est validé manuellement par vous."
              on={form.autoApprove}
              onChange={(v) => patch({ autoApprove: v })}
            />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Le statut d'organisateur est accordé depuis la page Organisateurs : il crée aussi le
            rôle correspondant sur le compte.
          </p>
        </Panel>

        <Panel title="Sécurité & système">
          <div className="flex items-center gap-3 rounded-xl bg-brand-soft p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-card text-primary">
              <ShieldCheck className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold">{access.data?.fullName || "Administrateur"}</p>
              <p className="truncate text-xs text-muted-foreground">
                Super-admin · {access.data?.email ?? "—"}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block font-semibold">Base de données</span>
                <span className="block text-xs text-muted-foreground">
                  Politiques de sécurité actives sur toutes les tables
                </span>
              </span>
              <TonePill tone="success">OK</TonePill>
            </li>
            <li className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="block font-semibold">Paiements mobile money</span>
                <span className="block text-xs text-muted-foreground">
                  {[form.wave && "Wave", form.orange && "Orange Money", form.free && "Free Money"]
                    .filter(Boolean)
                    .join(" · ") || "Aucun opérateur actif"}
                </span>
              </span>
              <TonePill tone={form.wave || form.orange || form.free ? "success" : "warning"}>
                {form.wave || form.orange || form.free ? "OK" : "À surveiller"}
              </TonePill>
            </li>
          </ul>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sliders className="size-3.5" /> Configuration synchronisée avec la base de données
          </p>
        </Panel>
      </div>
    </>
  );
}
