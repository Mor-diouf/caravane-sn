import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, MessageSquareWarning, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Avatar, EmptyState, KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, TonePill } from "@/components/admin/ui";
import { moderationQueue, type ModerationItem } from "@/lib/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  head: () => ({
    meta: [
      { title: "Modération — CaravaneHub Admin" },
      {
        name: "description",
        content:
          "Traitez les avis signalés, les faux avis et les contenus inappropriés publiés sur la plateforme.",
      },
      { property: "og:title", content: "Modération — CaravaneHub Admin" },
      {
        property: "og:description",
        content: "File de modération des avis étudiants signalés.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ModerationPage,
});

function Stars({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i <= score ? "fill-warning text-warning" : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

function ModerationPage() {
  const [queue, setQueue] = useState<ModerationItem[]>(moderationQueue);
  const [treated, setTreated] = useState(0);

  function resolve(item: ModerationItem, action: "keep" | "remove") {
    setQueue((prev) => prev.filter((x) => x.id !== item.id));
    setTreated((n) => n + 1);
    toast.success(action === "keep" ? "Avis publié et conservé." : "Avis supprimé de la plateforme.");
  }

  return (
    <>
      <PageHeader
        title="Modération"
        subtitle="Arbitrez les avis signalés pour préserver la confiance des étudiants."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="À modérer"
          value={String(queue.length)}
          secondary="Signalements en attente"
          icon={MessageSquareWarning}
          accent="warning"
        />
        <KpiCard title="Traités aujourd'hui" value={String(treated)} secondary="Décisions prises" icon={Check} accent="mint" />
        <KpiCard title="Note moyenne plateforme" value="4,6/5" secondary="1 842 avis vérifiés" icon={Star} accent="info" />
      </div>

      <div className="mt-4">
        <Panel title="File de modération" bodyClassName="p-0">
          {queue.length === 0 ? (
            <EmptyState icon={Check} message="Plus rien à modérer. Excellente hygiène de plateforme." />
          ) : (
            <ul className="divide-y divide-border">
              {queue.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <Avatar initials={item.initials} />
                  <div className="min-w-56 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{item.author}</p>
                      <Stars score={item.score} />
                      <TonePill tone="warning">{item.reason}</TonePill>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">« {item.text} »</p>
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {item.organizer} · {item.date}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AdminButton variant="success" onClick={() => resolve(item, "keep")}>
                      <Check className="size-3.5" /> Conserver
                    </AdminButton>
                    <AdminButton variant="danger" onClick={() => resolve(item, "remove")}>
                      <Trash2 className="size-3.5" /> Supprimer
                    </AdminButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
