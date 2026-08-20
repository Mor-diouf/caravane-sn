import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, CreditCard, Save } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel } from "@/components/organizer/ui";
import { orgSettingsQuery } from "@/lib/dash-queries";
import { organizerUpdateSettings } from "@/lib/organizer.functions";

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
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery(orgSettingsQuery());
  const updateFn = useServerFn(organizerUpdateSettings);

  const [form, setForm] = useState({ name: "", description: "", phone: "", whatsapp: "" });

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name ?? "",
        description: settings.description ?? "",
        phone: settings.phone ?? "",
        whatsapp: settings.whatsapp ?? "",
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Extract<Parameters<typeof organizerUpdateSettings>[0], { data: unknown }>["data"]) => updateFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Paramètres enregistrés");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <>
      <PageHeader title="Paramètres" subtitle="Votre organisation, vos paiements et vos alertes." />

      {isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chargement des paramètres…</p>
      ) : (
        <form
          className="grid gap-4 lg:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateMutation.mutate(form);
          }}
        >
          <Panel title="Profil de l'organisation" description="Visible par les étudiants dans l'application">
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
                <Building2 className="size-5" />
              </span>
              <div>
                <p className="font-bold">{form.name || "Mon amicale"}</p>
                <p className="text-xs text-muted-foreground">{settings?.status ?? "—"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Nom de l'amicale</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  maxLength={120}
                  className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  maxLength={1000}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel title="Contact" description="Coordonnées visibles pour vos passagers">
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Téléphone</span>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    maxLength={40}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">WhatsApp</span>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                    maxLength={40}
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                  />
                </label>
                <p className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  <CreditCard className="size-4 shrink-0" /> Commission plateforme :{" "}
                  {Math.round((settings?.commission_rate ?? 0.08) * 100)}% par billet vendu, prélevée
                  automatiquement.
                </p>
              </div>
            </Panel>

            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-ambient disabled:opacity-60"
            >
              <Save className="size-4" /> {updateMutation.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
