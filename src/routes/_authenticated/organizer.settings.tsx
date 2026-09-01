import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Building2, CreditCard, Image, Phone, Save, Sparkles } from "lucide-react";
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

type FormState = {
  name: string;
  description: string;
  phone: string;
  whatsapp: string;
  /** Branding fields — displayed on tickets and caravan pages */
  logo_url: string;
  slogan: string;
  support_phone: string;
};

function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery(orgSettingsQuery());
  const updateFn = useServerFn(organizerUpdateSettings);

  const [form, setForm] = useState<FormState>({
    name: "",
    description: "",
    phone: "",
    whatsapp: "",
    logo_url: "",
    slogan: "",
    support_phone: "",
  });

  const [logoPreviewError, setLogoPreviewError] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name ?? "",
        description: settings.description ?? "",
        phone: settings.phone ?? "",
        whatsapp: settings.whatsapp ?? "",
        logo_url: (settings as any).logo_url ?? "",
        slogan: (settings as any).slogan ?? "",
        support_phone: (settings as any).support_phone ?? "",
      });
      setLogoPreviewError(false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: (data: Partial<FormState>) =>
      updateFn({
        data: {
          ...data,
          logo_url: data.logo_url || null,
          slogan: data.slogan || null,
          support_phone: data.support_phone || null,
        } as never,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Paramètres enregistrés");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const field =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const inputClass =
    "h-10 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40";

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
          {/* ── Profil de l'organisation ── */}
          <Panel title="Profil de l'organisation" description="Visible par les étudiants dans l'application">
            <div className="mb-4 flex items-center gap-3">
              {form.logo_url && !logoPreviewError ? (
                <img
                  src={form.logo_url}
                  alt={form.name}
                  onError={() => setLogoPreviewError(true)}
                  className="size-12 rounded-2xl object-cover border border-border/60 shadow-sm"
                />
              ) : (
                <span className="grid size-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground">
                  <Building2 className="size-5" />
                </span>
              )}
              <div>
                <p className="font-bold">{form.name || "Mon amicale"}</p>
                {form.slogan ? (
                  <p className="text-xs text-muted-foreground italic">{form.slogan}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">{settings?.status ?? "—"}</p>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                  Nom de l'amicale / marque
                </span>
                <input value={form.name} onChange={field("name")} maxLength={120} className={inputClass} />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={field("description")}
                  maxLength={1000}
                  className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
                />
              </label>
            </div>
          </Panel>

          {/* ── Identité & Marque ── */}
          <Panel
            title="Identité & Marque"
            description="Logo et slogan affichés sur les billets QR des passagers"
          >
            <div className="space-y-3">
              {/* Logo Upload */}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Image className="size-3.5" /> Logo de la marque (Téléversement)
                </span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      toast.error("L'image est trop lourde (max 2 Mo)");
                      return;
                    }
                    setLogoPreviewError(false);
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                      if (typeof evt.target?.result === "string") {
                        setForm((f) => ({ ...f, logo_url: evt.target!.result as string }));
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="w-full cursor-pointer text-sm text-muted-foreground file:mr-4 file:cursor-pointer file:rounded-xl file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-primary transition-colors hover:file:bg-primary/20"
                />
              </label>

              {/* Logo live preview */}
              {form.logo_url && (
                <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-3 border border-border/50">
                  {!logoPreviewError ? (
                    <img
                      src={form.logo_url}
                      alt="Aperçu logo"
                      onError={() => setLogoPreviewError(true)}
                      className="size-14 rounded-xl object-contain border border-border/60 bg-white p-1"
                    />
                  ) : (
                    <div className="grid size-14 place-items-center rounded-xl border border-dashed border-destructive/50 bg-destructive/10 text-destructive">
                      <Image className="size-5" />
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {logoPreviewError
                      ? "⚠️ URL invalide — vérifiez le lien de l'image"
                      : "✅ Aperçu du logo — apparaîtra sur les billets passagers"}
                  </p>
                </div>
              )}

              {/* Slogan */}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Sparkles className="size-3.5" /> Slogan / Devise
                </span>
                <input
                  value={form.slogan}
                  onChange={field("slogan")}
                  maxLength={200}
                  placeholder="Ex : Votre confort, notre priorité !"
                  className={inputClass}
                />
              </label>

              {/* Support phone */}
              <label className="block">
                <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Phone className="size-3.5" /> Téléphone d'assistance passagers
                </span>
                <input
                  value={form.support_phone}
                  onChange={field("support_phone")}
                  maxLength={40}
                  placeholder="Ex : +221 77 000 00 00"
                  className={inputClass}
                />
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Affiché sur le billet en cas de problème lors du voyage.
                </p>
              </label>
            </div>
          </Panel>

          {/* ── Contact ── */}
          <div className="space-y-4">
            <Panel title="Contact" description="Coordonnées visibles pour vos passagers">
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">Téléphone</span>
                  <input value={form.phone} onChange={field("phone")} maxLength={40} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">WhatsApp</span>
                  <input value={form.whatsapp} onChange={field("whatsapp")} maxLength={40} className={inputClass} />
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
              <Save className="size-4" />{" "}
              {updateMutation.isPending ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        </form>
      )}
    </>
  );
}
