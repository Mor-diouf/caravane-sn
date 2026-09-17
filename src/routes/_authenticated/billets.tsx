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
import { formatPrice, findStopForBoarding } from "@/lib/student-shared";
import { PaymentMark } from "@/components/PaymentMark";
import { ticketsQuery, profileQuery } from "@/lib/student-queries";
import { submitCaravanReview, cancelBooking } from "@/lib/student.functions";
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
    mutationFn: (data: any) => submitReviewFn({ data }),
    onSuccess: () => {
      toast.success("Votre avis a été publié !");
      setReviewModal((prev) => ({ ...prev, open: false }));
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      // Trigger a mini-confetti for positive review
      if (reviewModal.rating >= 4) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#fbbf24", "#f59e0b", "#10b981"],
          disableForReducedMotion: true,
          zIndex: 100,
        });
      }
    },
    onError: (error) => toast.error("Erreur", { description: error.message }),
  });

  const cancelBookingFn = useServerFn(cancelBooking);
  const cancelMutation = useMutation({
    mutationFn: (id: string) => cancelBookingFn({ data: { bookingId: id } }),
    onSuccess: () => {
      toast.success("Réservation annulée. Les places ont été libérées.");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (err) => toast.error("Erreur", { description: err.message }),
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
    const toastId = toast.loading("Génération de l'image ultra haute définition...");
    try {
      const dataUrl = await toPng(el, {
        cacheBust: true,
        pixelRatio: 5, // HD export
      });
      toast.dismiss(toastId);
      const a = document.createElement("a");
      a.download = `Billet-KingBus-${ref}.png`;
      a.href = dataUrl;
      a.click();
      toast.success("Billet HD téléchargé avec succès !");
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Erreur lors du téléchargement de l'image");
    }
  };

  const shareTicket = async (id: string, ref: string, text: string) => {
    const el = document.getElementById(`ticket-card-${id}`);
    if (!el) return;
    const toastId = toast.loading("Préparation du partage HD...");
    try {
      const blob = await toBlob(el, {
        cacheBust: true,
        pixelRatio: 5, // HD export
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
        const dataUrl = await toPng(el, { cacheBust: true, pixelRatio: 5 });
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
            const pickupStop = (b as any).pickup_stop;
            const matchedStop = findStopForBoarding(c.stops, pickupStop);

            return (
              <div key={b.id} className="mx-auto max-w-[380px]">
                {/* ── PRINTABLE TICKET CARD (COMPACT & PRO) ── */}
                <article
                  id={`ticket-card-${b.id}`}
                  className="relative overflow-hidden rounded-[2rem] border-2 border-border/60 bg-card shadow-2xl mx-auto max-w-sm"
                >
                  {/* ── Header: Organizer & Ref ── */}
                  <div className="bg-slate-900 text-white p-5 pb-7 flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <OrganizerLogo
                        url={c.organizerLogoUrl}
                        name={c.organizer}
                        className="size-10 rounded-xl p-1 bg-white/10 border border-white/15 shrink-0"
                        iconClassName="size-5 text-white"
                      />
                      <div>
                        <h3 className="font-black text-xs uppercase tracking-wider leading-none">{c.organizer}</h3>
                        <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1 mt-1.5">
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              used ? "bg-slate-500" : b.status === "pending" ? "bg-orange-500 animate-pulse" : "bg-emerald-400 animate-pulse"
                            )}
                          />
                          {used ? "SCANNÉ" : b.status === "pending" ? "EN ATTENTE" : "BILLET VALIDE"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="block text-[8px] font-extrabold uppercase tracking-widest text-slate-400 mb-0.5">
                        RÉFÉRENCE
                      </span>
                      <span className={cn(
                        "font-mono text-sm font-black tracking-wider px-2 py-0.5 rounded-lg border",
                        b.status === "pending"
                          ? "text-orange-400 bg-orange-400/10 border-orange-400/20"
                          : "text-amber-400 bg-amber-400/10 border-amber-400/20"
                      )}>
                        {b.reference}
                      </span>
                    </div>
                  </div>

                  {/* ── Main Body (overlapping header) ── */}
                  <div className="bg-card mx-2.5 -mt-4 rounded-2xl p-4 shadow-sm border border-border/80">
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex-1">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-extrabold truncate">
                          {matchedStop ? "Point d'embarquement" : "Départ"}
                        </p>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground truncate mt-0.5">
                          {matchedStop ? matchedStop.city : c.from}
                        </h2>
                      </div>
                      <div className="mx-2 flex shrink-0">
                        <span className="grid size-6 place-items-center rounded-full bg-primary/10 text-primary">
                          <Bus className="size-3.5" />
                        </span>
                      </div>
                      <div className="flex-1 text-right">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-extrabold truncate">
                          Terminus
                        </p>
                        <h2 className="text-xl sm:text-2xl font-black text-foreground truncate mt-0.5">
                          {c.to}
                        </h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-muted/40 rounded-xl p-3 border border-border/50">
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-extrabold">Date & Heure</p>
                        <p className="text-[11px] font-black text-foreground">
                          {c.date} • {matchedStop?.time_offset || c.time}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-extrabold">Passager</p>
                        <p className="text-[11px] font-black text-foreground truncate">
                          {b.passenger_name || profile?.full_name || "Voyageur"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-extrabold">Siège(s)</p>
                        <p className="text-[11px] font-black text-primary">
                          {b.status === "pending" && (b as any).selected_seats && (b as any).selected_seats.length > 0
                            ? (b as any).selected_seats.map((seatId: string) => {
                                if (c?.layout?.seats && Array.isArray(c.layout.seats)) {
                                  const seat = c.layout.seats.find((s: any) => s.id === seatId);
                                  if (seat && seat.number) return seat.number;
                                }
                                return seatId;
                              }).join(", ")
                            : (b as any).tickets && (b as any).tickets.some((t: any) => t.seat_number) 
                            ? `${(b as any).tickets.map((t: any) => {
                                const seatId = t.seat_number;
                                if (!seatId) return null;
                                if (c?.layout?.seats && Array.isArray(c.layout.seats)) {
                                  const seat = c.layout.seats.find((s: any) => s.id === seatId);
                                  if (seat && seat.number) return seat.number;
                                }
                                return seatId;
                              }).filter(Boolean).join(", ")}`
                            : `${b.seats} place${b.seats > 1 ? "s" : ""}`
                          }
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-extrabold">Paiement</p>
                        <p className="text-[11px] font-black flex items-center gap-1.5 text-foreground">
                          {b.status === "pending" ? (
                            <span className="text-orange-500">Non payé</span>
                          ) : (
                            <>
                              <PaymentMark method={b.payment?.method} className="h-2.5" />
                              <span className="text-emerald-600 dark:text-emerald-400">Validé</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {matchedStop && (
                      <p className="mt-2 text-[10px] text-amber-700 dark:text-amber-400 font-semibold bg-amber-500/10 px-2.5 py-1.5 rounded-lg border border-amber-500/20 leading-tight">
                        <Clock className="inline-block size-3 mr-1 -mt-0.5" />
                        Rendez-vous à <strong>{matchedStop.pickup}</strong> au moins 15 min avant {matchedStop.time_offset}.
                      </p>
                    )}
                  </div>

                  {/* ── Scalloped Cutout & Ticket Tear Perforation ── */}
                  <div className="relative flex items-center justify-between mt-3 mb-1">
                    <div className="size-6 -ml-3 rounded-full bg-background border-r-2 border-border/60 shadow-inner" />
                    <div className="flex-1 border-t-[3px] border-dashed border-border/50 mx-2" />
                    <div className="size-6 -mr-3 rounded-full bg-background border-l-2 border-border/60 shadow-inner" />
                  </div>

                  {/* ── GIANT QR Code Section ── */}
                  {b.status === "pending" ? (
                    <div className="pb-6 pt-2 px-5 flex flex-col items-center bg-card">
                      <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-center w-full mt-2">
                        <p className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                          Paiement en attente
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vos places sont réservées pour 30 minutes.
                        </p>
                        <p className="text-[10px] text-orange-600/80 dark:text-orange-400/80 mt-2 font-medium leading-tight px-2">
                          Si vous avez déjà payé, l'organisateur validera votre paiement dans quelques minutes.<br/>
                          Sinon, veuillez procéder au paiement.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="pb-6 pt-2 px-5 flex flex-col items-center bg-card">
                      <div className="p-2.5 bg-white rounded-3xl shadow-sm border-2 border-slate-100">
                        <QrCode value={b.ticket?.qr_code ?? b.reference} size={220} />
                      </div>
                      <p className="mt-3.5 text-center text-[10px] font-extrabold text-muted-foreground leading-snug">
                        Ce QR Code sera scanné par le contrôleur lors de la montée.
                        {(c.organizerSupportPhone || c.organizerPhone) && (
                          <span className="block mt-1 font-bold text-primary">
                            <Phone className="inline-block size-3 -mt-0.5 mr-1" />
                            Assistance : {c.organizerSupportPhone ?? c.organizerPhone}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </article>

                {/* ── Action Buttons & Reviews ── */}
                <div className="mt-3.5 flex flex-col gap-2.5">
                  {b.status === "pending" ? (
                    <>
                      <a
                        href={matchedStop?.payment_link || c.payment_link || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-400 to-orange-500 py-3.5 px-4 text-xs font-black text-white shadow-lg hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Payer maintenant ({formatPrice(b.amount)} FCFA)
                      </a>
                      <button
                        type="button"
                        onClick={() => cancelMutation.mutate(b.id)}
                        disabled={cancelMutation.isPending}
                        className="flex w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-border/60 bg-transparent py-3 px-4 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.98] transition-all cursor-pointer"
                      >
                        {cancelMutation.isPending ? "Annulation..." : "Annuler la réservation"}
                      </button>
                    </>
                  ) : (
                    <>
                      {/* Télécharger Button */}
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
                          onClick={() => {
                            const shareMsg = matchedStop
                              ? `Mon billet King-Bus 2.0 ${b.reference} : Embarquement à ${matchedStop.city} (${matchedStop.pickup}) le ${c.date} vers ${matchedStop.time_offset || c.time}. Trajet ${c.from} → ${c.to} (Départ initial de ${c.from} à ${c.time}).`
                              : `Mon billet King-Bus 2.0 ${b.reference} : ${c.from} → ${c.to}, ${c.date} à ${c.time} (${c.pickup}).`;
                            shareTicket(b.id, b.reference, shareMsg);
                          }}
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
                    </>
                  )}
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
