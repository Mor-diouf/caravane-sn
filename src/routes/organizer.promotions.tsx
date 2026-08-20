import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BadgePercent, Megaphone, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { KpiCard, PageHeader, Panel, ProBadge, StatusPill } from "@/components/organizer/ui";
import { fcfa } from "@/lib/organizer";

export const Route = createFileRoute("/organizer/promotions")({
  head: () => ({
    meta: [
      { title: "Promotions — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Créez des codes promo, mettez vos caravanes en avant et envoyez des campagnes WhatsApp aux étudiants.",
      },
      { property: "og:title", content: "Promotions — CaravaneHub" },
      {
        property: "og:description",
        content: "Remplissez vos places restantes avec des campagnes ciblées.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PromotionsPage,
});

const promos = [
  { code: "RENTREE10", detail: "-10% sur Dakar", used: 24, limit: 50, status: "paid" as const },
  { code: "GROUPE4", detail: "4 places = 1 offerte", used: 8, limit: 20, status: "paid" as const },
  { code: "KOLDA5", detail: "-5% sur Kolda", used: 20, limit: 20, status: "cancelled" as const },
];

function PromotionsPage() {
  const [message, setMessage] = useState(
    "Salut ! Il reste des places pour la caravane Ziguinchor → Dakar du 20 octobre. Réserve vite sur CaravaneHub.",
  );

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            Promotions <ProBadge />
          </span>
        }
        subtitle="Boostez la visibilité de vos caravanes et remplissez les dernières places."
        actions={
          <button
            type="button"
            onClick={() => toast.success("Caravane mise en avant pendant 48 h")}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-ambient"
          >
            <Sparkles className="size-4" /> Mettre en avant
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Codes actifs" value="2" icon={BadgePercent} accent="info" />
        <KpiCard title="Réductions accordées" value={fcfa(42500)} icon={BadgePercent} accent="warning" />
        <KpiCard title="Places vendues via promo" value="52" icon={Megaphone} accent="mint" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Codes promotionnels" bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {promos.map((p) => (
              <li key={p.code} className="flex items-center gap-4 px-5 py-4">
                <span className="rounded-xl bg-muted px-3 py-1.5 font-mono text-xs font-bold">
                  {p.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{p.detail}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {p.used}/{p.limit} utilisations
                  </span>
                </span>
                <StatusPill status={p.status} />
              </li>
            ))}
          </ul>
          <div className="border-t border-border p-4">
            <button
              type="button"
              onClick={() => toast.success("Nouveau code promo créé")}
              className="w-full rounded-xl border border-dashed border-border py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted"
            >
              + Créer un code promo
            </button>
          </div>
        </Panel>

        <Panel title="Campagne WhatsApp" description="Envoyée aux étudiants ayant déjà voyagé avec vous">
          <textarea
            rows={5}
            value={message}
            maxLength={500}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          />
          <p className="mt-1 text-right text-[11px] text-muted-foreground">
            {message.length}/500 caractères
          </p>
          <button
            type="button"
            onClick={() =>
              message.trim()
                ? toast.success("Campagne programmée", { description: "128 étudiants ciblés." })
                : toast.error("Le message ne peut pas être vide")
            }
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-2.5 text-sm font-bold text-primary-foreground"
          >
            <Send className="size-4" /> Programmer l'envoi
          </button>
        </Panel>
      </div>
    </>
  );
}
