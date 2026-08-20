import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Loader2, MessageSquareWarning, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Avatar, EmptyState, KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { AdminButton, TonePill } from "@/components/admin/ui";
import { adminReviewsQuery } from "@/lib/dash-queries";
import { adminSetReviewStatus } from "@/lib/admin.functions";
import { dateFr, initialsOf } from "@/lib/dash-shared";
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
  const { data: reviews, isLoading } = useQuery(adminReviewsQuery());
  const [treated, setTreated] = useState(0);

  const queryClient = useQueryClient();
  const setReviewStatusFn = useServerFn(adminSetReviewStatus);
  const mutation = useMutation({
    mutationFn: setReviewStatusFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  const all = reviews ?? [];
  const queue = all.filter((r) => r.status === "reported");
  const avgRating = all.length ? all.reduce((a, r) => a + r.rating, 0) / all.length : 0;

  function resolve(item: (typeof queue)[number], action: "keep" | "remove") {
    mutation.mutate(
      { data: { reviewId: item.id, status: action === "keep" ? "published" : "hidden" } },
      {
        onSuccess: () => {
          setTreated((n) => n + 1);
          toast.success(
            action === "keep" ? "Avis publié et conservé." : "Avis supprimé de la plateforme.",
          );
        },
      },
    );
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
          value={isLoading ? "…" : String(queue.length)}
          secondary="Signalements en attente"
          icon={MessageSquareWarning}
          accent="warning"
        />
        <KpiCard title="Traités aujourd'hui" value={String(treated)} secondary="Décisions prises" icon={Check} accent="mint" />
        <KpiCard
          title="Note moyenne plateforme"
          value={isLoading ? "…" : `${avgRating.toFixed(1)}/5`}
          secondary={`${all.length} avis vérifiés`}
          icon={Star}
          accent="info"
        />
      </div>

      <div className="mt-4">
        <Panel title="File de modération" bodyClassName="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 px-5 py-14 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Chargement…
            </div>
          ) : queue.length === 0 ? (
            <EmptyState icon={Check} message="Plus rien à modérer. Excellente hygiène de plateforme." />
          ) : (
            <ul className="divide-y divide-border">
              {queue.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <Avatar initials={initialsOf(item.author)} />
                  <div className="min-w-56 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold">{item.author}</p>
                      <Stars score={item.rating} />
                      <TonePill tone="warning">{item.reason}</TonePill>
                    </div>
                    {item.comment && (
                      <p className="mt-1 text-sm text-muted-foreground">« {item.comment} »</p>
                    )}
                    <p className="mt-1 text-[11px] text-muted-foreground/80">
                      {item.organizer} · {dateFr(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <AdminButton
                      variant="success"
                      disabled={mutation.isPending}
                      onClick={() => resolve(item, "keep")}
                    >
                      <Check className="size-3.5" /> Conserver
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      disabled={mutation.isPending}
                      onClick={() => resolve(item, "remove")}
                    >
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
