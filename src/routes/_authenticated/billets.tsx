import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Building2,
  CheckCircle2,
  Download,
  Loader2,
  MessageSquareQuote,
  Phone,
  Share2,
  Star,
  Wallet,
} from "lucide-react";
import { QrCode } from "@/components/QrCode";
import { formatPrice } from "@/lib/student-shared";
import { PaymentMark } from "@/components/PaymentMark";
import { ticketsQuery, profileQuery } from "@/lib/student-queries";
import { submitCaravanReview } from "@/lib/student.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/billets")({
  head: () => ({
    meta: [
      { title: "Mes billets électroniques — Caravane Étudiants" },
      {
        name: "description",
        content:
          "Retrouvez vos billets électroniques de caravanes étudiantes avec QR code de validation à l'embarquement.",
      },
      { property: "og:title", content: "Mes billets — Caravane Étudiants" },
      {
        property: "og:description",
        content: "Vos billets QR de caravanes universitaires, prêts pour l'embarquement.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Billets,
});

type ReviewModalState = {
  open: boolean;
  caravanId: string;
  organizerName: string;
  route: string;
  rating: number;
  comment: string;
};

function Billets() {
  const queryClient = useQueryClient();
  const { data: bookings, isLoading, isError } = useQuery(ticketsQuery);
  const { data: profile } = useQuery(profileQuery);
  const submitReviewFn = useServerFn(submitCaravanReview);

  const [reviewModal, setReviewModal] = useState<ReviewModalState>({
    open: false,
    caravanId: "",
    organizerName: "",
    route: "",
    rating: 5,
    comment: "",
  });
  const [hoverRating, setHoverRating] = useState<number>(0);

  const reviewMutation = useMutation({
    mutationFn: (data: { caravanId: string; rating: number; comment?: string }) =>
      submitReviewFn({ data }),
    onSuccess: (res) => {
      toast.success(res.message);
      setReviewModal((m) => ({ ...m, open: false }));
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#fbbf24", "#f59e0b", "#d97706"],
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success("Paiement validé avec succès !");
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#3b82f6", "#f59e0b"],
      });
      window.history.replaceState({}, "", "/billets");
    }
  }, []);

  const downloadTicket = async (id: string, ref: string) => {
    const el = document.getElementById(`ticket-card-${id}`);
    if (!el) return;
    const toastId = toast.loading("Génération de l'image du billet...");
    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 3,
      });
      toast.dismiss(toastId);
      const a = document.createElement("a");
      a.download = `Billet-${ref}.png`;
      a.href = dataUrl;
      a.click();
      toast.success("Billet téléchargé avec succès !");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Erreur lors du téléchargement de l'image");
    }
  };

  const shareTicket = async (id: string, ref: string, text: string) => {
    const el = document.getElementById(`ticket-card-${id}`);
    if (!el) return;
    const toastId = toast.loading("Préparation du partage...");
    try {
      const blob = await toBlob(el, {
        cacheBust: true,
        pixelRatio: 3,
      });
      toast.dismiss(toastId);
      if (!blob) return;
      const file = new File([blob], `Billet-${ref}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Mon Billet CaravaneHub",
          text: text,
        });
      } else {
        const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 3 });
        const a = document.createElement("a");
        a.download = `Billet-${ref}.png`;
        a.href = dataUrl;
        a.click();
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Erreur lors du partage");
    }
  };

  const openReviewDialog = (caravanId: string, orgName: string, routeName: string, existingRating?: number, existingComment?: string) => {
    setReviewModal({
      open: true,
      caravanId,
      organizerName: orgName,
      route: routeName,
      rating: existingRating || 5,
      comment: existingComment || "",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="bg-gradient-primary px-5 pb-12 pt-8 text-primary-foreground">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-2xl font-extrabold tracking-tight">Mes billets</h1>
          <p className="mt-1 text-sm text-primary-foreground/75">
            Présentez le QR code au responsable de l'amicale lors de l'embarquement.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl space-y-6 px-4">
        {isLoading ? (
          <div className="grid place-items-center rounded-3xl border border-border/70 bg-card p-12 shadow-ambient">
            <Loader2 className="size-5 animate-spin text-primary-accent" />
          </div>
        ) : isError ? (
          <p className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Vos billets n'ont pas pu être chargés.
          </p>
        ) : !bookings || bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-ambient">
            <p className="text-sm text-muted-foreground">Vous n'avez pas encore de billet.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-2xl bg-gradient-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lifted"
            >
              Découvrir les caravanes
            </Link>
          </div>
        ) : (
          bookings.map((b) => {
            const c = b.caravan;
            if (!c) return null;
            const used = b.ticket?.status === "used";
            const existingReview = (b as any).review;

            return (
              <div key={b.id} className="mx-auto max-w-[360px]">
                {/* ── PRINTABLE TICKET CARD ── */}
                <article
                  id={`ticket-card-${b.id}`}
                  className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-ambient"
                >
                  {/* ── Top Status Header ── */}
                  <div className="flex items-center justify-between border-b border-border/50 bg-accent px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-primary">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      {used ? "BILLET DÉJÀ SCANNE" : "BILLET VALIDE"}
                    </span>
                    <span className="font-mono text-[11px] font-extrabold text-muted-foreground">
                      {b.reference}
                    </span>
                  </div>

                  {/* ── Organizer Branding ── */}
                  <div className="flex flex-col items-center border-b border-border/50 bg-gradient-to-b from-muted/30 to-card px-5 py-5 text-center">
                    {c.organizerLogoUrl ? (
                      <img
                        src={c.organizerLogoUrl}
                        alt={c.organizer}
                        className="size-20 rounded-2xl border border-border/60 bg-white object-contain p-1.5 shadow-sm"
                      />
                    ) : (
                      <span className="grid size-20 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-sm">
                        <Building2 className="size-8" />
                      </span>
                    )}
                    <h3 className="mt-2.5 text-lg font-black text-foreground">{c.organizer}</h3>
                    {c.organizerSlogan && (
                      <p className="text-[11px] font-medium italic text-muted-foreground">
                        "{c.organizerSlogan}"
                      </p>
                    )}

                    {(c.organizerSupportPhone || c.organizerPhone) && (
                      <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                        <Phone className="size-3" />
                        <span>Assistance : {c.organizerSupportPhone ?? c.organizerPhone}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Giant Centered QR Code ── */}
                  <div className="flex flex-col items-center px-5 py-5 bg-card">
                    <div className="rounded-2xl border border-primary/20 bg-white p-3 shadow-sm">
                      <QrCode value={b.ticket?.qr_code ?? b.reference} size={185} />
                    </div>
                    <p className="mt-2.5 text-center text-[11px] font-semibold text-muted-foreground">
                      Présentez ce QR Code au contrôleur lors de l'embarquement
                    </p>
                  </div>

                  {/* ── Ticket Divider ── */}
                  <div className="px-5">
                    <div className="w-full border-t-2 border-dashed border-border/60" />
                  </div>

                  {/* ── Trip Details & Passenger Info ── */}
                  <div className="p-5 space-y-3.5">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Trajet & Horaires
                      </span>
                      <h2 className="mt-0.5 text-lg font-black tracking-tight text-foreground">
                        {c.from} <span className="text-primary-accent">→</span> {c.to}
                      </h2>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        📅 {c.date} • ⏰ {c.time}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">📍 Départ : {c.pickup}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-muted/40 p-3 text-xs">
                      <div>
                        <dt className="text-[10px] font-medium text-muted-foreground">Passager</dt>
                        <dd className="font-extrabold text-foreground truncate">{b.passenger_name || profile?.full_name || "Étudiant"}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-medium text-muted-foreground">Places</dt>
                        <dd className="font-extrabold text-foreground">{b.seats} place(s)</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-medium text-muted-foreground">Paiement</dt>
                        <dd className="font-bold flex items-center">
                          {b.payment ? <PaymentMark method={b.payment.method} /> : "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-medium text-muted-foreground">Montant total</dt>
                        <dd className="font-extrabold text-primary-accent">
                          {formatPrice(b.amount)} FCFA
                        </dd>
                      </div>
                    </div>
                  </div>
                </article>

                {/* ── Action Buttons & Reviews ── */}
                <div className="mt-3 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => downloadTicket(b.id, b.reference)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-primary py-3 text-xs font-bold text-primary-foreground shadow-ambient transition-transform active:scale-[0.98]"
                  >
                    <Download className="size-4" /> Télécharger l'image du billet
                  </button>

                  {/* ── Button: Donnez votre avis sur le voyage ── */}
                  <button
                    type="button"
                    onClick={() =>
                      openReviewDialog(
                        c.id,
                        c.organizer,
                        `${c.from} → ${c.to}`,
                        existingReview?.rating,
                        existingReview?.comment
                      )
                    }
                    className={cn(
                      "flex w-full items-center justify-center gap-2 rounded-2xl border py-2.5 text-xs font-extrabold transition-all",
                      existingReview
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                        : "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10"
                    )}
                  >
                    <Star className="size-3.5 fill-current" />
                    {existingReview
                      ? `Mon avis (${existingReview.rating}/5) — Modifier`
                      : "⭐ Laisser un avis sur ce voyage"}
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        shareTicket(
                          b.id,
                          b.reference,
                          `Mon billet Caravane Étudiants ${b.reference} : ${c.from} → ${c.to}, ${c.date} à ${c.time} (${c.pickup}).`
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold transition-colors hover:bg-accent"
                    >
                      <Share2 className="size-3.5 text-emerald-500" /> WhatsApp
                    </button>
                    <button
                      type="button"
                      className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-2.5 text-xs font-bold transition-colors hover:bg-accent"
                    >
                      <Wallet className="size-3.5" /> Wallet
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>

      {/* ── Modal: Donnez votre avis étudiant ── */}
      <Dialog
        open={reviewModal.open}
        onOpenChange={(open) => setReviewModal((m) => ({ ...m, open }))}
      >
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-black">
              <Star className="size-5 text-amber-500 fill-amber-500" />
              Votre avis sur le voyage
            </DialogTitle>
            <DialogDescription>
              Organisé par <strong>{reviewModal.organizerName}</strong> ({reviewModal.route})
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              reviewMutation.mutate({
                caravanId: reviewModal.caravanId,
                rating: reviewModal.rating,
                comment: reviewModal.comment,
              });
            }}
            className="space-y-4 pt-2"
          >
            {/* Interactive 5-star Picker */}
            <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/40 p-5 text-center">
              <span className="text-xs font-bold text-muted-foreground mb-3">
                Notez la qualité du service (ponctualité, confort, chauffeur) :
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || reviewModal.rating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setReviewModal((m) => ({ ...m, rating: star }))}
                      className="p-1 transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star
                        className={cn(
                          "size-8 transition-colors",
                          active
                            ? "fill-amber-400 text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="mt-2.5 text-xs font-black text-amber-500">
                {reviewModal.rating === 5 && "⭐ Excellent (5/5) — Voyage parfait !"}
                {reviewModal.rating === 4 && "⭐ Très bon (4/5) — Conforme à mes attentes"}
                {reviewModal.rating === 3 && "⭐ Moyen (3/5) — Correct dans l'ensemble"}
                {reviewModal.rating === 2 && "⭐ Décevant (2/5) — Des points à améliorer"}
                {reviewModal.rating === 1 && "⭐ Mauvais (1/5) — Très insatisfait"}
              </span>
            </div>

            {/* Comment Area */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground mb-1.5">
                <MessageSquareQuote className="inline size-3.5 mr-1" />
                Commentaire ou remarques (facultatif) :
              </label>
              <textarea
                value={reviewModal.comment}
                onChange={(e) => setReviewModal((m) => ({ ...m, comment: e.target.value }))}
                placeholder="Racontez votre expérience : ambiance du bus, respect des horaires, pauses sur la route..."
                rows={3}
                className="w-full rounded-2xl border border-border bg-card p-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            <button
              type="submit"
              disabled={reviewMutation.isPending}
              className="w-full rounded-2xl bg-gradient-primary py-3.5 text-xs font-black text-primary-foreground shadow-lifted transition-all active:scale-95 disabled:opacity-50"
            >
              {reviewMutation.isPending ? "Publication en cours..." : "Publier mon avis vérifié"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
