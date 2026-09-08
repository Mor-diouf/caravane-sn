import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Heart,
  Info,
  Loader2,
  Lock,
  Minus,
  Monitor,
  Plug,
  Plus,
  ShieldCheck,
  Snowflake,
  Star,
  User,
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
        { property: "og:site_name", content: "KING-BUS 2.0" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
        { property: "og:image:secure_url", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: "800" },
        { property: "og:image:height", content: "800" },
        { property: "og:image:alt", content: "Logo Officiel KING-BUS 2.0" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: "https://caravane-sn-indol.vercel.app/images/king-bus/logo.jpg" },
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
  const [seats, setSeats] = useState(1);

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
      return initiateWavePayment({ data: { caravanId: caravane.id, seats, payerPhone: payerPhone.replace(/\D/g, ""), passengerName } });
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
    if (!payerPhone && user?.user_metadata?.phone) {
      const raw = String(user.user_metadata.phone).replace(/\+221/, '').trim();
      setPayerPhone(raw);
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
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3 py-1.5 text-xs font-black text-amber-700 dark:text-amber-400 shadow-sm">
            {avgRating.toFixed(1)}
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
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
        <DialogContent className="rounded-3xl sm:max-w-lg max-h-[92vh] overflow-y-auto p-0 border border-border/80 bg-card shadow-2xl">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 p-6 text-white border-b border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-amber-400/20 border border-amber-400/30 px-2.5 py-0.5 text-[10px] font-black text-amber-300 uppercase tracking-wider">
                Réservation Directe King-Bus
              </span>
              <span className="text-[10px] text-slate-400">• Billet instantané</span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              {caravane.from} <span className="text-amber-400">➔</span> {caravane.to}
            </h2>
            <p className="mt-1 text-xs text-slate-300 flex items-center gap-2 flex-wrap">
              <span>📅 {caravane.date}</span>
              <span>•</span>
              <span>⏰ {caravane.time}</span>
              <span>•</span>
              <span className="truncate">📍 {caravane.pickup}</span>
            </p>
          </div>

          <div className="p-6 space-y-4">
            {/* Seat Selector */}
            <div className="flex items-center justify-between rounded-2xl bg-muted/50 p-4 border border-border/60">
              <div>
                <span className="text-xs font-black text-foreground block">Nombre de places</span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {caravane.seatsLeft} place{caravane.seatsLeft > 1 ? "s" : ""} disponible{caravane.seatsLeft > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={seats <= 1}
                  onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  className="size-9 rounded-xl border border-border bg-card font-black text-lg flex items-center justify-center hover:bg-accent disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                  aria-label="Diminuer les places"
                >
                  <Minus className="size-4" />
                </button>
                <span className="font-black text-base min-w-[24px] text-center">{seats}</span>
                <button
                  type="button"
                  disabled={seats >= Math.min(caravane.seatsLeft, 6)}
                  onClick={() => setSeats((s) => Math.min(Math.min(caravane.seatsLeft, 6), s + 1))}
                  className="size-9 rounded-xl border border-border bg-card font-black text-lg flex items-center justify-center hover:bg-accent disabled:opacity-30 transition-all active:scale-95 shadow-sm"
                  aria-label="Augmenter les places"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* Passenger Identity Toggle */}
            <div className="rounded-2xl border border-border/70 p-4 bg-card space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <User className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Titulaire du billet</p>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[210px]">
                      {forFriend
                        ? "Billet réservé pour un proche"
                        : `Billet à mon nom (${user?.user_metadata?.full_name || "Moi"})`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForFriend(!forFriend)}
                  className={cn(
                    "text-xs font-extrabold px-3 py-1.5 rounded-xl border transition-all",
                    forFriend
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {forFriend ? "Pour un proche" : "Pour moi"}
                </button>
              </div>

              {forFriend && (
                <div className="grid grid-cols-2 gap-3 pt-2.5 border-t border-border/50">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Prénom du voyageur
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Moussa"
                      value={friendFirstName}
                      onChange={(e) => setFriendFirstName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Nom du voyageur
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Sarr"
                      value={friendLastName}
                      onChange={(e) => setFriendLastName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Payment method */}
            <div className="rounded-2xl border-2 border-primary/50 bg-primary/5 p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PaymentMark method="wave" className="h-8" />
                  <div>
                    <p className="text-xs font-black text-foreground flex items-center gap-1.5">
                      Paiement Sécurisé Wave
                      <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5">
                        Instantané
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">Génération immédiate du billet QR Code</p>
                  </div>
                </div>
                <div className="size-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black flex items-center justify-center shadow-sm">
                  <Check className="size-3.5 stroke-[3]" />
                </div>
              </div>

              {/* Informative Security Banner */}
              <div className="rounded-xl bg-card/80 p-3 border border-border/70 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5 shadow-xs">
                <Info className="size-4 shrink-0 text-primary-accent mt-0.5" />
                <span>
                  Indiquez le numéro de votre compte Wave pour valider votre réservation en 1 clic et recevoir immédiatement votre e-billet.
                </span>
              </div>

              {/* Phone Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Numéro de téléphone Wave
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-bold text-muted-foreground select-none">
                    🇸🇳 +221
                  </span>
                  <input
                    type="tel"
                    placeholder="77 123 45 67"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card pl-20 pr-3 py-2.5 text-sm font-black tracking-wide outline-none focus:ring-2 focus:ring-primary shadow-xs"
                  />
                </div>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="rounded-2xl bg-muted/40 p-4 space-y-2 border border-border/60 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>
                  Billet King-Bus ({seats} place{seats > 1 ? "s" : ""})
                </span>
                <span className="font-bold text-foreground">{formatPrice(total)} FCFA</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Bagages en soute (jusqu'à 25 kg)</span>
                <span className="font-bold text-emerald-600">Inclus (Gratuit)</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Climatisation & Prises USB</span>
                <span className="font-bold text-emerald-600">Inclus</span>
              </div>
              <div className="border-t border-border/60 pt-2.5 flex items-center justify-between text-sm">
                <span className="font-extrabold text-foreground">Total à régler</span>
                <span className="text-xl font-black text-primary-accent">
                  {formatPrice(total)} FCFA
                </span>
              </div>
            </div>

            {/* Action CTA Button */}
            <button
              type="button"
              disabled={
                booking.isPending ||
                payerPhone.replace(/\D/g, "").length < 9 ||
                (forFriend && (!friendFirstName.trim() || !friendLastName.trim()))
              }
              onClick={() => booking.mutate()}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 py-4 text-sm font-black text-black shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {booking.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Traitement du paiement en cours…</span>
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  <span>Confirmer et payer {formatPrice(total)} FCFA</span>
                </>
              )}
            </button>

            <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              Paiement sécurisé par Wave SN • Billet numérique garanti
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
