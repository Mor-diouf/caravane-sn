import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Heart,
  Monitor,
  Plug,
  ShieldCheck,
  Snowflake,
  Star,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PaymentMark } from "@/components/PaymentMark";
import { UniversityMark } from "@/components/UniversityMark";
import { formatPrice, seatTone } from "@/lib/student-shared";
import { caravanQuery, caravanReviewsQuery, universitiesQuery } from "@/lib/student-queries";
import { createBooking, initiateWavePayment } from "@/lib/student.functions";
import { useStudentFavorites } from "@/hooks/use-student-favorites";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { OrganizerLogo } from "@/components/OrganizerLogo";

export const Route = createFileRoute("/caravane/$id")({
  loader: async ({ context, params }) => {
    const [caravane] = await Promise.all([
      context.queryClient.ensureQueryData(caravanQuery(params.id)),
      context.queryClient.ensureQueryData(universitiesQuery),
    ]);
    if (!caravane) throw notFound();
    return { caravane };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.caravane;
    const title = c ? `${c.from} ➔ ${c.to} — KING-BUS 2.0` : "KING-BUS 2.0";
    const description = c
      ? `Départ King-Bus ${c.from} vers ${c.to} le ${c.date} à ${c.time} depuis ${c.pickup}. ${formatPrice(c.price)} FCFA, ${c.seatsLeft} places restantes. Confort, climatisation et sécurité assurée.`
      : "Détail du départ officiel King-Bus 2.0.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  errorComponent: () => (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <p className="text-sm text-muted-foreground">Cette caravane n'a pas pu être chargée.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <p className="text-sm text-muted-foreground">Caravane introuvable ou déjà terminée.</p>
    </div>
  ),
  component: CaravaneDetail,
});

const amenityMap = {
  ac: { icon: Snowflake, label: "Climatisation" },
  wifi: { icon: Wifi, label: "Wi-Fi" },
  usb: { icon: Plug, label: "Prises USB" },
  video: { icon: Monitor, label: "Vidéo" },
} as const;

const methods = [
  { id: "wave", label: "Wave", hint: "Instantané" },
] as const;

type Method = (typeof methods)[number]["id"];

function CaravaneDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(caravanQuery(id));
  const { data: universities } = useSuspenseQuery(universitiesQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { favorites, toggle } = useStudentFavorites();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<Method>("wave");
  const [payerPhone, setPayerPhone] = useState("");
  const [forFriend, setForFriend] = useState(false);
  const [friendFirstName, setFriendFirstName] = useState("");
  const [friendLastName, setFriendLastName] = useState("");
  const seats = 1;

  const caravane = data!;
  const favorite = favorites.includes(caravane.id);
  const tone = seatTone(caravane.seatsLeft);
  const total = caravane.price * seats;
  const university = universities.find((u) => u.id === caravane.universityId);

  const { data: reviewsData } = useQuery(caravanReviewsQuery(caravane.id));
  const reviews: any[] = reviewsData?.reviews ?? [];
  const avgRating = reviewsData?.average ?? caravane.rating;
  const totalReviews = reviewsData?.total ?? 0;

  const booking = useMutation({
    mutationFn: () => {
      const passengerName = forFriend ? `${friendFirstName.trim()} ${friendLastName.trim()}`.trim() : undefined;
      return initiateWavePayment({ data: { caravanId: caravane.id, seats: 1, payerPhone, passengerName } });
    },
    onSuccess: (res) => {
      setOpen(false);
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        toast.success("Réservation confirmée avec succès !");
        navigate({ to: "/billets" });
      }
    },
    onError: (error) =>
      toast.error("Paiement impossible", {
        description: error instanceof Error ? error.message : "Réessayez plus tard.",
      }),
  });

  const openPayment = () => {
    if (!user) {
      toast.info("Connectez-vous pour réserver votre place");
      navigate({ to: "/auth" });
      return;
    }
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative">
        <img
          src={caravane.image}
          alt={`Bus de la caravane ${caravane.from} vers ${caravane.to}`}
          width={1280}
          height={800}
          className="h-52 w-full object-cover sm:h-72"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-background"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link
            to="/"
            aria-label="Retour"
            className="grid size-10 place-items-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-xl"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <button
            type="button"
            aria-label="Favori"
            aria-pressed={favorite}
            onClick={() => toggle(caravane.id)}
            className={cn(
              "grid size-10 place-items-center rounded-full border border-white/30 bg-black/25 backdrop-blur-xl",
              favorite ? "text-danger" : "text-white",
            )}
          >
            <Heart className={cn("size-5", favorite && "fill-current")} />
          </button>
        </div>
        <span
          className={cn(
            "absolute bottom-3 left-4 rounded-full border border-white/25 px-3 py-1.5 text-[11px] font-semibold text-primary-foreground backdrop-blur",
            tone === "critical" && "bg-danger/90",
            tone === "warning" && "bg-secondary-accent/90 text-text-strong",
            tone === "ok" && "bg-success/90",
          )}
        >
          {caravane.seatsLeft} places restantes
        </span>
      </div>

      <main className="mx-auto -mt-4 max-w-3xl space-y-4 px-5">
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-ambient">
          <div className="flex items-start gap-4">
            {caravane.organizerLogoUrl ? (
              <img
                src={caravane.organizerLogoUrl}
                alt={caravane.organizer}
                className="size-14 shrink-0 rounded-full border border-border/60 bg-white object-contain p-1 shadow-sm"
              />
            ) : (
              <UniversityMark abbr={caravane.from} active className="size-14 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              {university && (
                <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {university.name}
                </p>
              )}
              <h1 className="mt-1 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                {caravane.from} <span className="text-muted-foreground">→</span> {caravane.to}
              </h1>
            </div>
            <p className="shrink-0 text-right text-lg font-extrabold leading-tight text-primary-accent sm:text-xl">
              {formatPrice(caravane.price)}
              <span className="ml-1 block text-[10px] font-semibold text-muted-foreground">
                FCFA / place
              </span>
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <span className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2 text-xs font-semibold">
              <CalendarDays className="size-4 shrink-0 text-primary-accent" />
              <span className="min-w-0 truncate">{caravane.date}</span>
            </span>
            <span className="flex items-center gap-2 rounded-2xl bg-muted/60 px-3 py-2 text-xs font-semibold">
              <Clock className="size-4 shrink-0 text-primary-accent" />
              {caravane.time}
            </span>
          </div>

          <ol className="mt-4 space-y-4 border-l border-dashed border-border pl-5 text-sm">
            <li className="relative">
              <span
                aria-hidden
                className="absolute -left-[26px] top-1 grid size-4 place-items-center rounded-full bg-primary-accent ring-4 ring-card"
              />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Départ
              </p>
              <p className="font-semibold leading-snug">{caravane.pickup}</p>
            </li>
            <li className="relative">
              <span
                aria-hidden
                className="absolute -left-[26px] top-1 grid size-4 place-items-center rounded-full bg-muted-foreground/50 ring-4 ring-card"
              />
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Arrivée
              </p>
              <p className="font-semibold leading-snug">{caravane.dropoff}</p>
            </li>
          </ol>
        </section>

        <section className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card p-4 shadow-ambient">
          <OrganizerLogo
            url={caravane.organizerLogoUrl}
            name={caravane.organizer}
            className="size-12 rounded-2xl p-1"
            iconClassName="size-6"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Organisé par</p>
            <p className="truncate text-sm font-extrabold">{caravane.organizer}</p>
            {caravane.organizerSlogan && (
              <p className="truncate text-[11px] italic text-muted-foreground">
                "{caravane.organizerSlogan}"
              </p>
            )}
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gradient-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-sm">
            {avgRating.toFixed(1)}
            <Star className="size-3.5 fill-current" />
          </span>
        </section>

        {caravane.about && (
          <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-ambient">
            <h2 className="text-sm font-bold tracking-tight">À propos de cette caravane</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {caravane.about}
            </p>

            {caravane.amenities.length > 0 && (
              <>
                <h3 className="mt-5 text-sm font-bold tracking-tight">Équipements</h3>
                <ul className="mt-3 grid grid-cols-4 gap-2">
                  {caravane.amenities.map((a) => {
                    const { icon: Icon, label } = amenityMap[a];
                    return (
                      <li
                        key={a}
                        className="flex flex-col items-center gap-2 rounded-2xl bg-muted/60 p-3 text-center"
                      >
                        <Icon className="size-5 text-primary-accent" />
                        <span className="text-[11px] font-medium leading-tight">{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </section>
        )}
        {/* ── Section Avis & Réputation des Étudiants ── */}
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-ambient">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Avis & Expériences</h2>
              <p className="text-xs text-muted-foreground">
                {totalReviews > 0
                  ? `${totalReviews} avis vérifié${totalReviews > 1 ? "s" : ""} d'étudiants`
                  : "Nouveau transporteur certifié"}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-amber-500/10 px-3 py-1.5 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
              <Star className="size-4 fill-current" />
              <span>{avgRating.toFixed(1)} / 5</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-muted/40 p-4 text-center text-xs text-muted-foreground">
              <p>Aucun avis publié pour le moment.</p>
              <p className="mt-1 font-medium text-foreground">
                Soyez parmi les premiers à voyager avec cette caravane et partagez votre expérience !
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {reviews.map((r) => (
                <li key={r.id} className="rounded-2xl border border-border/60 bg-muted/20 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {r.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-bold">{r.author}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "size-3",
                            i < r.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-xs leading-relaxed text-muted-foreground italic">
                      "{r.comment}"
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70">
                    {r.route ? `${r.route} • ` : ""}
                    {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface-blur px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              Total estimé · {caravane.time}
            </p>
            <p className="truncate text-lg font-extrabold">
              {formatPrice(caravane.price)} <span className="text-xs">FCFA</span>
            </p>
          </div>
          <button
            type="button"
            onClick={openPayment}
            disabled={caravane.seatsLeft === 0}
            className="shrink-0 rounded-2xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 px-7 py-3.5 text-sm font-black text-black shadow-lg shadow-primary/20 hover:brightness-110 transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {caravane.seatsLeft === 0 ? "Complet" : "Réserver ma place"}
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Confirmation de réservation</DialogTitle>
            <DialogDescription>
              {caravane.from} → {caravane.to} • {caravane.date}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-3 text-sm">
              <span className="font-medium">Place(s)</span>
              <span className="font-bold">1 place</span>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm font-medium cursor-pointer transition-colors hover:bg-muted/40">
              <input 
                type="checkbox" 
                checked={forFriend} 
                onChange={(e) => setForFriend(e.target.checked)}
                className="size-4 rounded-sm border-border text-primary-accent focus:ring-primary-accent"
              />
              Réserver pour une autre personne
            </label>

            {forFriend && (
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/30 p-3 border border-border/50">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Prénom</label>
                  <input
                    type="text"
                    placeholder="Moussa"
                    value={friendFirstName}
                    onChange={(e) => setFriendFirstName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Nom</label>
                  <input
                    type="text"
                    placeholder="Sarr"
                    value={friendLastName}
                    onChange={(e) => setFriendLastName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>
            )}

            <ul className="space-y-2">
              {methods.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors",
                      method === m.id
                        ? "border-primary-accent bg-accent"
                        : "border-border/70 hover:border-primary-accent/50",
                    )}
                  >
                    <PaymentMark method={m.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold leading-tight">
                        {m.label}
                      </span>
                      <span className="block text-[11px] font-medium leading-tight text-muted-foreground">
                        {m.hint}
                      </span>
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border",
                        method === m.id
                          ? "border-primary-accent bg-primary-accent text-primary-foreground"
                          : "border-border",
                      )}
                    >
                      {method === m.id && <Check className="size-3" />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {method === "wave" && (
              <div className="space-y-3 pt-2">
                <div className="rounded-xl bg-danger/10 p-3 text-xs font-medium text-danger border border-danger/20 leading-relaxed">
                  <span className="font-bold">⚠️ ATTENTION :</span> Le numéro saisi ci-dessous DOIT être le numéro avec lequel vous allez effectuer le transfert sur Wave. Sinon, votre billet ne sera pas généré automatiquement.
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Numéro de téléphone Wave</label>
                  <input
                    type="tel"
                    placeholder="77 123 45 67"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-accent"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-medium text-muted-foreground">À payer</span>
              <span className="text-lg font-extrabold text-primary-accent">
                {formatPrice(total)} FCFA
              </span>
            </div>

            <button
              type="button"
              disabled={booking.isPending || (method === "wave" && payerPhone.length < 9) || (forFriend && (!friendFirstName || !friendLastName))}
              onClick={() => booking.mutate()}
              className="w-full rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lifted transition-transform active:scale-[0.98] disabled:opacity-50"
            >
              {booking.isPending ? "Paiement en cours…" : "Continuer vers le paiement"}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Transaction 100% sécurisée
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
