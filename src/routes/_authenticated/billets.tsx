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
  Calendar,
  Clock,
  MapPin,
  User,
  Bus,
  ShieldCheck,
} from "lucide-react";
import { QrCode } from "@/components/QrCode";
import { formatPrice } from "@/lib/student-shared";
import { PaymentMark } from "@/components/PaymentMark";
import { ticketsQuery, profileQuery } from "@/lib/student-queries";
import { submitCaravanReview } from "@/lib/student.functions";
import { OrganizerLogo } from "@/components/OrganizerLogo";
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
      { title: "Mes billets officiels — KING-BUS 2.0" },
      {
        name: "description",
        content:
          "Retrouvez vos billets électroniques King-Bus 2.0 avec QR Code de validation pour l'embarquement Dakar ⇄ Ziguinchor.",
      },
      { property: "og:site_name", content: "KING-BUS 2.0" },
      { property: "og:title", content: "Mes billets — KING-BUS 2.0" },
      {
        property: "og:description",
        content: "Vos billets King-Bus avec QR Code sécurisé prêts pour l'embarquement.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
      { property: "og:image:secure_url", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
      { property: "og:image:type", content: "image/jpeg" },
      { property: "og:image:width", content: "800" },
      { property: "og:image:height", content: "800" },
      { property: "og:image:alt", content: "Logo Officiel KING-BUS 2.0" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Mes billets — KING-BUS 2.0" },
      { name: "twitter:image", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
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
    const toastId = toast.loading("Génération de l'image haute définition...");
    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 3,
      });
      toast.dismiss(toastId);
      const a = document.createElement("a");
      a.download = `Billet-KingBus-${ref}.png`;
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
      const file = new File([blob], `Billet-KingBus-${ref}.png`, { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Mon Billet King-Bus 2.0",
          text: text,
        });
      } else {
        const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 3 });
        const a = document.createElement("a");
        a.download = `Billet-KingBus-${ref}.png`;
        a.href = dataUrl;
        a.click();
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Erreur lors du partage");
    }
  };

  const openReviewDialog = (
    caravanId: string,
    orgName: string,
    routeName: string,
    existingRating?: number,
    existingComment?: string
  ) => {
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
      {/* ── Page Header ── */}
      <header className="bg-gradient-to-r from-[#090d16] via-[#0f172a] to-[#0a0f1d] px-5 pb-12 pt-8 text-white border-b border-white/10">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-black text-amber-300 uppercase tracking-wider">
              King-Bus 2.0
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white mt-1">Mes billets d'embarquement</h1>
          <p className="mt-1 text-xs text-white/70">
            Présentez le QR code au contrôleur King-Bus à l'embarquement à la gare de départ.
          </p>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl space-y-6 px-4">
        {isLoading ? (
          <div className="grid place-items-center rounded-3xl border border-border/70 bg-card p-12 shadow-ambient">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <p className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Vos billets n'ont pas pu être chargés.
          </p>
        ) : !bookings || bookings.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center shadow-ambient">
            <p className="text-sm font-bold text-foreground">Vous n'avez pas encore de billet King-Bus.</p>
            <p className="text-xs text-muted-foreground mt-1">Réservez votre trajet Dakar ⇄ Ziguinchor dès maintenant.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-2xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 px-6 py-3 text-xs font-black text-black shadow-md hover:brightness-110"
            >
              Découvrir les départs King-Bus
            </Link>
          </div>
        ) : (
          bookings.map((b) => {
            const c = b.caravan;
            if (!c) return null;
            const used = b.ticket?.status === "used";
            const existingReview = (b as any).review;

            return (
              <div key={b.id} className="mx-auto max-w-[380px]">
                {/* ── PRINTABLE TICKET CARD ── */}
                <article
                  id={`ticket-card-${b.id}`}
                  className="relative overflow-hidden rounded-3xl border border-border/90 bg-card shadow-xl transition-all"
                >
                  {/* ── Top Boarding Header ── */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 px-5 py-4 text-white border-b border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-amber-400/20 border border-amber-400/30 px-2 py-0.5 text-[10px] font-black tracking-widest text-amber-300 uppercase">
                        PASS EMBARQUEMENT
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                          used
                            ? "bg-slate-800 text-slate-400 border border-slate-700"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            used ? "bg-slate-500" : "bg-emerald-400 animate-pulse"
                          )}
                        />
                        {used ? "BILLET SCANNÉ" : "BILLET VALIDE"}
                      </span>
                    </div>

                    {/* Organizer Brand line */}
                    <div className="mt-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <OrganizerLogo
                          url={c.organizerLogoUrl}
                          name={c.organizer}
                          className="size-11 rounded-xl p-1 bg-white/10 border border-white/15 shrink-0"
                          iconClassName="size-6 text-white"
                        />
                        <div>
                          <h3 className="text-sm font-black text-white leading-tight">{c.organizer}</h3>
                          <p className="text-[10px] text-slate-400 font-medium truncate max-w-[170px]">
                            {c.organizerSlogan || "Transport officiel certifié"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          RÉFÉRENCE
                        </span>
                        <span className="font-mono text-xs font-black text-amber-400 tracking-wider">
                          {b.reference}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ── Route & Schedule Display ── */}
                  <div className="bg-gradient-to-b from-muted/20 via-card to-card p-5 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3.5">
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                          DÉPART
                        </span>
                        <h4 className="text-lg font-black text-foreground tracking-tight truncate">
                          {c.from}
                        </h4>
                        <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">{c.pickup}</span>
                        </p>
                      </div>

                      <div className="flex flex-col items-center px-2 shrink-0">
                        <div className="size-8 rounded-full bg-amber-400/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                          <Bus className="size-4" />
                        </div>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground mt-0.5">
                          Direct
                        </span>
                      </div>

                      <div className="min-w-0 text-right">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                          ARRIVÉE
                        </span>
                        <h4 className="text-lg font-black text-foreground tracking-tight truncate">
                          {c.to}
                        </h4>
                        <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                          Gare terminus
                        </p>
                      </div>
                    </div>

                    {/* Date & Time pill */}
                    <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3.5 py-2.5 border border-border/60 text-xs">
                      <div className="flex items-center gap-1.5 font-black text-foreground">
                        <Calendar className="size-3.5 text-primary-accent" />
                        <span>{c.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-black text-foreground">
                        <Clock className="size-3.5 text-primary-accent" />
                        <span>{c.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Scalloped Cutout & Ticket Tear Perforation ── */}
                  <div className="relative flex items-center justify-between my-0.5">
                    <div className="size-5 -ml-2.5 rounded-full bg-background border border-border/80" />
                    <div className="flex-1 border-t-2 border-dashed border-border/70 mx-2" />
                    <div className="size-5 -mr-2.5 rounded-full bg-background border border-border/80" />
                  </div>

                  {/* ── Passenger & Payment Breakdown ── */}
                  <div className="p-5 pt-3 space-y-3.5">
                    <div className="grid grid-cols-2 gap-2.5 rounded-2xl bg-muted/40 p-3.5 border border-border/60 text-xs">
                      <div>
                        <dt className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                          <User className="size-3 text-muted-foreground" /> Passager
                        </dt>
                        <dd className="font-black text-foreground truncate mt-0.5">
                          {b.passenger_name || profile?.full_name || "Voyageur"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                          Place(s)
                        </dt>
                        <dd className="font-black text-foreground mt-0.5">
                          {b.seats} place{b.seats > 1 ? "s" : ""} réservée{b.seats > 1 ? "s" : ""}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                          Paiement
                        </dt>
                        <dd className="font-bold flex items-center gap-1.5 mt-0.5">
                          {b.payment ? <PaymentMark method={b.payment.method} /> : "—"}
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                            Validé
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                          Montant total
                        </dt>
                        <dd className="font-black text-amber-600 dark:text-amber-400 text-sm mt-0.5">
                          {formatPrice(b.amount)} FCFA
                        </dd>
                      </div>
                    </div>

                    {/* ── Official QR Code Container ── */}
                    <div className="flex flex-col items-center rounded-2xl bg-white p-4 border border-border/80 shadow-inner">
                      <div className="p-1.5 bg-white rounded-xl">
                        <QrCode value={b.ticket?.qr_code ?? b.reference} size={185} />
                      </div>
                      <div className="mt-2.5 flex items-center gap-2">
                        <span className="rounded-full bg-slate-900 px-3 py-1 font-mono text-[11px] font-black text-amber-400">
                          {b.reference}
                        </span>
                      </div>
                      <p className="mt-2 text-center text-[10px] font-bold text-slate-600">
                        Scannez ce QR Code lors de la montée dans le bus
                      </p>
                    </div>

                    {/* ── Assistance Phone & Anti-Fraud Stamp ── */}
                    <div className="pt-1 flex flex-col items-center gap-1 text-center">
                      {(c.organizerSupportPhone || c.organizerPhone) && (
                        <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-primary">
                          <Phone className="size-3" />
                          <span>Assistance départ : {c.organizerSupportPhone ?? c.organizerPhone}</span>
                        </div>
                      )}
                      <p className="text-[9px] text-muted-foreground font-medium">
                        Billet nominatif officiel KING-BUS 2.0 • Présentez une pièce d'identité avec ce QR code
                      </p>
                    </div>
                  </div>
                </article>

                {/* ── Action Buttons & Reviews ── */}
                <div className="mt-3.5 flex flex-col gap-2.5">
                  {/* Télécharger Button: High-contrast, radiant gold/amber with crisp black text */}
                  <button
                    type="button"
                    onClick={() => downloadTicket(b.id, b.reference)}
                    className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 py-3.5 px-4 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Download className="size-4 stroke-[2.5]" />
                    <span>Télécharger le billet (Image HD)</span>
                  </button>

                  {/* Laisser un avis Button */}
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
                      "flex w-full items-center justify-center gap-2 rounded-2xl border-2 py-3 text-xs font-extrabold transition-all cursor-pointer shadow-sm",
                      existingReview
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20"
                        : "border-amber-400/40 bg-amber-400/10 text-foreground hover:bg-amber-400/20"
                    )}
                  >
                    <Star className="size-4 fill-amber-400 text-amber-400" />
                    <span>
                      {existingReview
                        ? `Mon avis (${existingReview.rating}/5) — Modifier`
                        : "Laisser un avis sur ce voyage"}
                    </span>
                  </button>

                  {/* Secondary buttons: WhatsApp & Wallet */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        shareTicket(
                          b.id,
                          b.reference,
                          `Mon billet King-Bus 2.0 ${b.reference} : ${c.from} → ${c.to}, ${c.date} à ${c.time} (${c.pickup}).`
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-3 text-xs font-bold text-emerald-700 dark:text-emerald-400 transition-colors hover:bg-emerald-500/20 active:scale-[0.98] cursor-pointer"
                    >
                      <Share2 className="size-4 text-emerald-500" /> Partager WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        toast.info(
                          "Votre billet est sauvegardé dans votre espace. Le format Apple/Google Wallet sera activé très bientôt."
                        )
                      }
                      className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-xs font-bold text-foreground transition-colors hover:bg-accent active:scale-[0.98] cursor-pointer shadow-xs"
                    >
                      <Wallet className="size-4 text-primary" /> Sauvegarder
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
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 py-3.5 text-xs font-black text-slate-950 shadow-lg shadow-amber-500/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {reviewMutation.isPending ? "Publication en cours..." : "Publier mon avis vérifié"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
