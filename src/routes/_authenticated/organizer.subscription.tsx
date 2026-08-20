import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, Panel, ProBadge } from "@/components/organizer/ui";
import { orgOverviewQuery } from "@/lib/dash-queries";
import { fcfa } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/organizer/subscription")({
  head: () => ({
    meta: [
      { title: "Abonnement — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Comparez les formules Essentiel et Pro de CaravaneHub : analytics, équipe, promotions et rapports.",
      },
      { property: "og:title", content: "Abonnement — CaravaneHub" },
      {
        property: "og:description",
        content: "Passez en Pro pour débloquer analytics, équipe et campagnes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { data: overview, isLoading } = useQuery(orgOverviewQuery());
  const isPro = overview?.organizer.isPro ?? false;
  const commissionRate = overview?.organizer.commissionRate ?? 0.08;
  const commissionPct = Math.round(commissionRate * 100);

  const plans = [
    {
      id: "basic",
      name: "Essentiel",
      price: 0,
      tagline: "Pour démarrer et vendre vos premières places.",
      features: [
        "Caravanes illimitées",
        "Réservations et billets QR",
        "Paiements Wave / Orange / Free Money",
        "Avis étudiants vérifiés",
        `Commission ${commissionPct}% par billet`,
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 9500,
      tagline: "Pour les amicales qui organisent chaque semaine.",
      features: [
        "Tout l'Essentiel",
        "Analytics avancés et prévisions",
        "Historique complet et rapports PDF/CSV",
        "Gestion d'équipe et rôles",
        "Promotions et campagnes WhatsApp (bientôt disponible)",
        "Mise en avant dans l'app étudiante (bientôt disponible)",
        "Support prioritaire",
      ],
    },
  ] as const;

  return (
    <>
      <PageHeader
        title="Abonnement"
        subtitle={
          isLoading
            ? "Chargement de votre formule…"
            : `Formule actuelle : ${isPro ? "Pro" : "Essentiel"}.`
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => {
          const current = isPro ? p.id === "pro" : p.id === "basic";
          return (
            <Panel
              key={p.id}
              className={cn(p.id === "pro" && "border-primary-accent/40 shadow-ambient")}
              title={
                <span className="inline-flex items-center gap-2">
                  {p.name} {p.id === "pro" && <ProBadge />}
                </span>
              }
              description={p.tagline}
            >
              <p className="text-3xl font-extrabold tracking-tight">
                {p.price === 0 ? "Gratuit" : fcfa(p.price)}
                {p.price > 0 && (
                  <span className="text-sm font-semibold text-muted-foreground"> / mois</span>
                )}
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={current}
                onClick={() =>
                  toast.info("Bientôt disponible", {
                    description: "Le paiement en ligne de l'abonnement Pro arrive prochainement. Contactez le support pour l'activer.",
                  })
                }
                className={cn(
                  "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-transform active:scale-[0.99]",
                  current
                    ? "cursor-default border border-border text-muted-foreground"
                    : "bg-gradient-primary text-primary-foreground shadow-ambient",
                )}
              >
                {current ? (
                  "Formule active"
                ) : (
                  <>
                    <Crown className="size-4" /> Passer en Pro
                  </>
                )}
              </button>
            </Panel>
          );
        })}
      </div>

      <Panel className="mt-4" title="Pourquoi passer en Pro ?">
        <ul className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Meilleur remplissage", detail: "Outils de promotion pour remplir vos dernières places." },
            { title: "Gain de temps", detail: "Rapports automatiques et équipe autonome sur le scan des billets." },
            { title: "Décisions éclairées", detail: "Analytics avancés sur vos revenus et vos destinations." },
          ].map((b) => (
            <li key={b.title} className="rounded-2xl bg-muted/50 p-4">
              <Sparkles className="size-5 text-primary-accent" />
              <p className="mt-2 font-bold">{b.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{b.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
