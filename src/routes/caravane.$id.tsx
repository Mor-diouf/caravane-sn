import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
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
  MapPin,
  X,
  Share2,
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
import { caravanQuery, caravanReviewsQuery, universitiesQuery, profileQuery } from "@/lib/student-queries";
import { createBooking, initiateWavePayment } from "@/lib/student.functions";
import { useStudentFavorites } from "@/hooks/use-student-favorites";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { OrganizerLogo } from "@/components/OrganizerLogo";
import { BusCanvas } from "@/features/bus-configurator";

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
    const baseUrl = "https://caravane-sn-indol.vercel.app";
    const rawImageUrl = c?.image ? (c.image.startsWith("http") ? c.image : `${baseUrl}${c.image}`) : `${baseUrl}/images/king-bus/logo.jpg`;
    
    // WhatsApp est très strict sur la taille des images (< 300KB). 
    // On utilise un proxy gratuit et rapide (Images.weserv.nl) pour redimensionner et compresser l'image à la volée.
    const optimizedImageUrl = `https://wsrv.nl/?url=${encodeURIComponent(rawImageUrl)}&w=800&h=418&fit=cover&output=jpg&q=80`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:site_name", content: "KING-BUS 2.0" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:image", content: optimizedImageUrl },
        { property: "og:image:secure_url", content: optimizedImageUrl },
        { property: "og:image:type", content: "image/jpeg" },
        { property: "og:image:width", content: "800" },
        { property: "og:image:height", content: "418" },
        { property: "og:image:alt", content: title },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: optimizedImageUrl },
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

function ZoomableBusCanvas({ layout, children }: { layout: any, children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseScale, setBaseScale] = useState(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const busW = layout?.width || 430;
  const busH = layout?.height || 980;
  // Marges latérales pour roues et effets 3D
  const extraPaddingX = 32;
  const extraPaddingY = 32;
  const totalBusW = busW + extraPaddingX;
  const totalBusH = busH + extraPaddingY;

  useEffect(() => {
    if (!containerRef.current || !layout) return;

    const computeScale = () => {
      const el = containerRef.current;
      if (!el) return;
      const clientW = el.clientWidth;
      if (clientW <= 0) return;

      // Sur mobile (< 480px) : adapter à la largeur de l'écran pour des sièges bien grands et lisibles
      // Sur écran large : échelle 1.0 (ou 1.05) pour un grand confort visuel
      if (clientW < totalBusW + 16) {
        const fitScale = (clientW - 16) / totalBusW;
        setBaseScale(Math.max(0.65, fitScale));
      } else {
        setBaseScale(1.0);
      }
    };

    computeScale();
    const timer = setTimeout(computeScale, 50);
    const observer = new ResizeObserver(computeScale);
    observer.observe(containerRef.current);
    window.addEventListener("resize", computeScale);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
      window.removeEventListener("resize", computeScale);
    };
  }, [layout, totalBusW]);

  const effectiveScale = baseScale * zoomLevel;

  return (
    <div
      ref={containerRef}
      className="flex-1 w-full min-h-0 relative overflow-y-auto overflow-x-hidden bg-[#07090D] flex flex-col items-center select-none"
      style={{
        WebkitOverflowScrolling: "touch",
        overscrollBehavior: "contain",
      }}
    >
      {/* Barre d'aide flottante : indication scroll vertical & boutons de zoom */}
      <div className="sticky top-2.5 z-30 mb-2 flex items-center justify-between w-full max-w-lg px-4 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B0F17]/90 border border-white/10 shadow-lg backdrop-blur-md text-[11px] text-slate-300 font-medium">
          <span className="text-amber-400 font-bold text-xs">↕</span>
          <span>Faites défiler pour voir tous les sièges</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1 px-2 py-1 rounded-full bg-[#0B0F17]/90 border border-white/10 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(0.7, Number((z - 0.15).toFixed(2))))}
            className="size-6 rounded-full hover:bg-white/10 text-white font-black flex items-center justify-center text-xs transition-colors"
            title="Dézoomer"
            aria-label="Dézoomer"
          >
            -
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(1)}
            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-amber-400 hover:bg-white/10 transition-colors min-w-[36px] text-center"
            title="Réinitialiser zoom"
          >
            {Math.round(effectiveScale * 100)}%
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(1.5, Number((z + 0.15).toFixed(2))))}
            className="size-6 rounded-full hover:bg-white/10 text-white font-black flex items-center justify-center text-xs transition-colors"
            title="Zoomer"
            aria-label="Zoomer"
          >
            +
          </button>
        </div>
      </div>

      {/* Légende rapide et discrète */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 mb-3 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] bg-[#121620] border border-slate-600 inline-block" />
          <span>Libre</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] bg-[#FF5722] border border-[#FFA000] inline-block shadow-xs shadow-orange-500/50" />
          <span className="text-amber-300 font-bold">Sélectionné</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="size-3 rounded-[4px] bg-[#10B981] border border-[#34D399] opacity-80 inline-block" />
          <span>Occupé</span>
        </div>
      </div>

      {/* Wrapper du bus calculé au pixel près pour un scroll fluide sans débordement horizontal */}
      <div
        style={{
          width: Math.round(totalBusW * effectiveScale),
          height: Math.round(totalBusH * effectiveScale),
        }}
        className="relative shrink-0 mx-auto mb-12 transition-[width,height] duration-150 ease-out"
      >
        <div
          style={{
            width: totalBusW,
            height: totalBusH,
            transform: `scale(${effectiveScale})`,
            transformOrigin: "top left",
            paddingLeft: extraPaddingX / 2,
            paddingTop: extraPaddingY / 2,
          }}
          className="relative"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function CaravaneDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(caravanQuery(id));
  const { data: universities } = useSuspenseQuery(universitiesQuery);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { favorites, toggle } = useStudentFavorites();
  const { user } = useAuth();
  
  const handleShare = async () => {
    if (!data) return;
    // Utiliser le domaine de production pour que le partage fonctionne même depuis localhost
    const baseUrl = "https://caravane-sn-indol.vercel.app";
    const path = window.location.pathname;
    const urlObj = new URL(`${baseUrl}${path}`);
    urlObj.searchParams.set("v", Date.now().toString());
    const finalUrl = urlObj.toString();
    
    const shareData = {
      title: `Voyage King-Bus : ${data.from} ➔ ${data.to}`,
      url: finalUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // user cancelled or error
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(finalUrl);
      toast.success("Lien de partage copié dans le presse-papier !");
    }
  };
  
  const { data: profile } = useQuery({
    ...profileQuery,
    enabled: !!user,
  });
  
  const myName = profile?.full_name || user?.user_metadata?.['full_name'] || user?.user_metadata?.['name'] || "";
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"seats" | "payment">("seats");
  const [method, setMethod] = useState<Method>("wave");
  const [payerPhone, setPayerPhone] = useState("");
  const [forFriend, setForFriend] = useState(false);
  const [friendFirstName, setFriendFirstName] = useState("");
  const [friendLastName, setFriendLastName] = useState("");
  const [seats, setSeats] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);

  const caravane = data!;
  const isLayoutAvailable = !!caravane.layout && Array.isArray((caravane.layout as any).seats) && (caravane.layout as any).seats.length > 0;
  const seatsCount = isLayoutAvailable ? selectedSeats.length : seats;
  const favorite = favorites.includes(caravane.id);
  const tone = seatTone(caravane.seatsLeft);
  const selectedStop = (caravane.stops || []).find((s) => s.id === selectedStopId) ?? null;
  const unitPrice = selectedStop ? selectedStop.price_fcfa : caravane.price;
  const total = unitPrice * seatsCount;
  const university = universities.find((u) => u.id === caravane.universityId);

  const { data: reviewsData } = useQuery(caravanReviewsQuery(caravane.id));
  const reviews: any[] = reviewsData?.reviews ?? [];
  const avgRating = reviewsData?.average ?? caravane.rating;
  const totalReviews = reviewsData?.total ?? 0;

  const booking = useMutation({
    mutationFn: () => {
      const needsNameInput = !forFriend && !myName;
      const passengerName = forFriend || needsNameInput
        ? `${friendFirstName.trim()} ${friendLastName.trim()}`.trim()
        : myName.trim() || undefined;

      if ((forFriend || needsNameInput) && !passengerName) {
        throw new Error("Veuillez saisir le prénom et le nom du voyageur");
      }

      return initiateWavePayment({
        data: {
          caravanId: caravane.id,
          seats: seatsCount,
          selectedSeats: isLayoutAvailable ? selectedSeats : [],
          method,
          payerPhone: payerPhone.replace(/\D/g, ""),
          ...(passengerName ? { passengerName } : {}),
          ...(selectedStopId ? { stopId: selectedStopId } : {}),
          ...(selectedStop ? { pickupStop: selectedStop.city } : {}),
        },
      });
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["caravan"] });
      setSelectedSeats([]);
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

  const getSeatLabel = (id: string) => {
    const s = (caravane.layout as any)?.seats?.find((item: any) => item.id === id);
    return s?.number ? String(s.number) : id;
  };

  const openPayment = () => {
    if (!user) {
      toast.info("Connectez-vous pour réserver votre place");
      navigate({ to: "/auth" });
      return;
    }
    if (!payerPhone && user?.user_metadata?.['phone']) {
      const raw = String(user.user_metadata['phone']).replace(/\+221/, '').trim();
      setPayerPhone(raw);
    }
    setStep(isLayoutAvailable ? "seats" : "payment");
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      <div className="relative">
        <img
          src={caravane.image}
          alt={`Bus de la caravane ${caravane.from} vers ${caravane.to}`}
          width={1280}
          height={800}
          className="h-72 w-full object-cover sm:h-96 md:h-[450px]"
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
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Partager"
              onClick={handleShare}
              className="grid size-10 place-items-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur-xl transition-all hover:bg-black/40"
            >
              <Share2 className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Favori"
              aria-pressed={favorite}
              onClick={() => toggle(caravane.id)}
              className={cn(
                "grid size-10 place-items-center rounded-full border border-white/30 bg-black/25 backdrop-blur-xl transition-all hover:bg-black/40",
                favorite ? "text-danger" : "text-white",
              )}
            >
              <Heart className={cn("size-5", favorite && "fill-current")} />
            </button>
          </div>
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
        <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
          {/* Ligne de dégradé supérieure */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-primary to-orange-500" />
          
          <div className="flex items-start gap-4">
            {caravane.organizerLogoUrl ? (
              <img
                src={caravane.organizerLogoUrl}
                alt={caravane.organizer}
                className="size-16 shrink-0 rounded-2xl border border-border/60 bg-white object-contain p-1.5 shadow-sm"
              />
            ) : (
              <UniversityMark abbr={caravane.from} active className="size-16 shrink-0 rounded-2xl shadow-sm" />
            )}
            <div className="min-w-0 flex-1 pt-0.5">
              {university && (
                <p className="flex items-center gap-1.5 truncate text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {university.name}
                </p>
              )}
              <h1 className="text-2xl font-black leading-tight tracking-tight sm:text-3xl text-foreground">
                {caravane.from} <span className="text-primary mx-1.5">➔</span> {caravane.to}
              </h1>
            </div>
            <div className="shrink-0 text-right pt-0.5">
              <p className="text-2xl font-black leading-none text-primary drop-shadow-sm">
                {formatPrice(caravane.price)}
              </p>
              <p className="mt-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                FCFA / place
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2.5 border-b border-border/40 pb-6">
            <span className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2 text-xs font-bold text-primary shadow-sm">
              <CalendarDays className="size-4 shrink-0" />
              <span className="min-w-0 truncate">{caravane.date}</span>
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/20 px-3.5 py-2 text-xs font-bold text-primary shadow-sm">
              <Clock className="size-4 shrink-0" />
              {caravane.time}
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-muted/40 border border-border/60 px-3.5 py-2 text-xs font-bold text-muted-foreground shadow-sm">
              <MapPin className="size-4 shrink-0 opacity-70" />
              Trajet direct {caravane.stops && caravane.stops.length > 0 ? `+ ${caravane.stops.length} Escale${caravane.stops.length > 1 ? 's' : ''}` : ""}
            </span>
          </div>

          <div className="mt-6 relative px-2">
            {/* Ligne verticale de la timeline */}
            <div className="absolute left-[17px] top-3 bottom-4 w-0.5 bg-border/80" />
            
            <ol className="space-y-7 relative">
              {/* Départ */}
              <li className="relative pl-10">
                <span
                  aria-hidden
                  className="absolute left-[3px] top-1.5 grid size-3.5 place-items-center rounded-full bg-primary ring-4 ring-card shadow-sm"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className="text-primary">Départ</span> • {caravane.from}
                  </p>
                  <span className="text-xs font-black text-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-md">
                    {formatPrice(caravane.price)} FCFA
                  </span>
                </div>
                <p className="font-bold text-[15px] leading-snug mt-1 text-foreground">{caravane.pickup}</p>
              </li>

              {/* Escales */}
              {(caravane.stops || []).map((stop) => (
                <li key={stop.id} className="relative pl-10">
                  <span
                    aria-hidden
                    className="absolute left-[4px] top-1.5 grid size-3 place-items-center rounded-full bg-amber-400 ring-4 ring-card shadow-sm"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <span className="text-amber-500">Escale</span> • {stop.city}
                      </p>
                      {stop.time_offset && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-600 dark:text-amber-400">
                          <Clock className="size-3" /> ~{stop.time_offset}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-foreground bg-muted/40 border border-border/50 px-2 py-0.5 rounded-md">
                      {formatPrice(stop.price_fcfa)} FCFA
                    </span>
                  </div>
                  <p className="font-semibold text-[13px] leading-snug mt-1 text-muted-foreground">{stop.pickup}</p>
                </li>
              ))}

              {/* Arrivée */}
              <li className="relative pl-10">
                <span
                  aria-hidden
                  className="absolute left-[3px] top-1.5 grid size-3.5 place-items-center rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-card shadow-sm"
                />
                <p className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Arrivée</span> • {caravane.to}
                </p>
                <p className="font-bold text-[15px] leading-snug mt-1 text-foreground">{caravane.dropoff}</p>
              </li>
            </ol>
          </div>
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

      <div className="fixed inset-x-0 bottom-[64px] z-40 border-t border-border/70 bg-surface-blur px-5 py-4 backdrop-blur-xl pb-safe">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">
              Total estimé · {caravane.time}
            </p>
            <p className="truncate text-lg font-extrabold">
              {formatPrice(unitPrice)} <span className="text-xs">FCFA</span>
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

      <Dialog open={open} onOpenChange={(val) => { if (!val) setOpen(false); }}>
        <DialogContent 
          style={step === "seats" && isLayoutAvailable ? {
            position: 'fixed',
            inset: 0,
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
            transform: 'none',
            width: '100vw',
            height: '100dvh',
            maxWidth: 'none',
            margin: 0,
            padding: 0,
            zIndex: 50,
          } : undefined}
          className={cn(
            "p-0 border transition-all duration-300 gap-0",
            step === "seats" && isLayoutAvailable
              ? "!fixed !inset-0 !left-0 !top-0 !translate-x-0 !translate-y-0 !transform-none !w-screen !h-screen !h-[100dvh] !max-w-none !rounded-none !border-0 !m-0 !p-0 !bg-[#07090D] !flex !flex-col overflow-hidden z-50 [&>button]:text-white [&>button]:hover:text-amber-400 [&>button]:z-50 [&>button]:top-3.5 [&>button]:right-4"
              : "sm:max-w-lg w-full max-h-[92vh] bg-card border-border/80 flex flex-col overflow-hidden rounded-3xl"
          )}
        >
          {step === "seats" && isLayoutAvailable ? (
            /* ÉTAPE 1 : SÉLECTION DU SIÈGE (PLEIN ÉCRAN) */
            <div className="flex-1 flex flex-col min-h-0 h-full w-full overflow-hidden bg-[#07090D]">
              {/* Header compact : "zig → dakar" en haut + compteur discret "X/6 sélectionné" */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/10 bg-[#0B0F17]/90 backdrop-blur-md shrink-0 z-20">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="size-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    title="Fermer"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                    {caravane.from} <span className="text-amber-400">➔</span> {caravane.to}
                  </h2>
                </div>

                {/* Compteur discret : "1/6 sélectionné" */}
                <div className="flex items-center gap-3 pr-8">
                  <div className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    {selectedSeats.length}/6 sélectionné{selectedSeats.length > 1 ? "s" : ""}
                  </div>
                </div>
              </div>

              {/* Le plan du bus en grand avec scroll vertical fluide et zoom */}
              <ZoomableBusCanvas layout={caravane.layout}>
                <BusCanvas 
                  layout={caravane.layout} 
                  mode="preview"
                  selectedSeatIds={selectedSeats}
                  occupiedSeatIds={caravane.reservedSeats || []}
                  onSeatClick={(seat) => {
                    if (caravane.reservedSeats?.includes(seat.id)) return;
                    setSelectedSeats(prev => 
                      prev.includes(seat.id) 
                        ? prev.filter(id => id !== seat.id)
                        : prev.length < 6 ? [...prev, seat.id] : prev
                    );
                  }}
                />
              </ZoomableBusCanvas>

              {/* CTA sticky en bas, désactivé tant qu'aucun siège n'est choisi */}
              <div className="px-4 sm:px-6 py-3 sm:py-3.5 border-t border-white/10 bg-[#0B0F17]/95 backdrop-blur-md shrink-0 flex items-center justify-between gap-4 z-20">
                <div className="text-xs sm:text-sm font-semibold text-slate-300">
                  {selectedSeats.length > 0 ? (
                    <span>
                      <strong className="text-white font-black">{selectedSeats.length} place{selectedSeats.length > 1 ? "s" : ""}</strong>
                      <span className="mx-2 text-slate-500">·</span>
                      <strong className="text-amber-400 font-black">{formatPrice(unitPrice * selectedSeats.length)} FCFA</strong>
                    </span>
                  ) : (
                    <span className="text-slate-400 text-xs">Veuillez choisir au moins 1 siège</span>
                  )}
                </div>

                <button
                  type="button"
                  disabled={selectedSeats.length === 0}
                  onClick={() => setStep("payment")}
                  className="rounded-2xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 px-6 sm:px-9 py-3 text-xs sm:text-sm font-black text-black shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                >
                  <span>Continuer vers le paiement</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          ) : (
            /* ÉTAPE 2 : RÉCAPITULATIF + PAIEMENT */
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
              {/* Header : bouton retour (←) vers l'étape 1 pour changer de siège si besoin */}
              <div className="relative overflow-hidden bg-card p-6 border-b border-border/60 shrink-0">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-primary to-orange-500" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-black text-primary uppercase tracking-wider">
                      Réservation King-Bus
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">• Étape 2 sur 2</span>
                  </div>
                  {isLayoutAvailable && (
                    <button
                      type="button"
                      onClick={() => setStep("seats")}
                      className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors bg-muted/50 hover:bg-primary/10 px-3 py-1.5 rounded-full"
                    >
                      <ArrowLeft className="size-3.5" /> Changer de siège
                    </button>
                  )}
                </div>
                <h2 className="text-xl font-black tracking-tight text-foreground">
                  {caravane.from} <span className="text-primary mx-1">➔</span> {caravane.to}
                </h2>
                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-3 flex-wrap font-medium">
                  <span className="flex items-center gap-1"><CalendarDays className="size-3.5 opacity-70" /> {caravane.date}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3.5 opacity-70" /> {caravane.time}</span>
                  <span className="flex items-center gap-1 truncate"><MapPin className="size-3.5 opacity-70" /> {caravane.pickup}</span>
                </div>
                {isLayoutAvailable && selectedSeats.length > 0 && (
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-foreground">
                    <span className="text-muted-foreground font-semibold">Siège(s) choisi(s) :</span>
                    <span className="font-black text-primary">
                      {selectedSeats.map(getSeatLabel).join(", ")}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-5 space-y-4">
                {/* Si pas de plan de bus 2D/3D disponible, sélecteur de nombre de places classique */}
                {!isLayoutAvailable && (
                  <div className="flex items-center justify-between rounded-2xl border border-border/70 p-4 bg-card shadow-sm">
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
                )}

                {/* Point d'embarquement (Montée) */}
                {caravane.stops && caravane.stops.length > 0 && (
                  <div className="rounded-2xl border border-border/70 p-4 bg-card space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                          <MapPin className="size-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Point d'embarquement (Montée)</p>
                          <p className="text-[11px] text-muted-foreground">Où prenez-vous le bus ?</p>
                        </div>
                      </div>
                      {selectedStop && (
                        <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 border border-emerald-500/30">
                          Tarif réduit
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5 pt-2">
                      <label
                        onClick={() => setSelectedStopId(null)}
                        className={cn(
                          "group flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all",
                          selectedStopId === null
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                            : "border-border/60 bg-card hover:border-border hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={cn(
                              "size-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors",
                              selectedStopId === null ? "border-primary bg-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                            )}
                          >
                            {selectedStopId === null && <div className="size-2 rounded-full bg-white" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[13px] font-bold text-foreground truncate">
                              {caravane.from} (Départ principal)
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{caravane.pickup}</p>
                          </div>
                        </div>
                        <span className="text-[13px] font-black text-foreground shrink-0 ml-3">
                          {formatPrice(caravane.price)} FCFA
                        </span>
                      </label>

                      {caravane.stops.map((stop) => {
                        const isSelected = selectedStopId === stop.id;
                        const diff = caravane.price - stop.price_fcfa;
                        return (
                          <label
                            key={stop.id}
                            onClick={() => setSelectedStopId(stop.id)}
                            className={cn(
                              "group flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all",
                              isSelected
                                ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                                : "border-border/60 bg-card hover:border-border hover:shadow-sm"
                            )}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={cn(
                                  "size-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 transition-colors",
                                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                                )}
                              >
                                {isSelected && <div className="size-2 rounded-full bg-white" />}
                              </div>
                              <div className="min-w-0 space-y-1">
                                <p className="text-[13px] font-bold text-foreground truncate flex items-center gap-2 flex-wrap">
                                  <span>{stop.city}</span>
                                  {diff > 0 && (
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                      -{formatPrice(diff)} F
                                    </span>
                                  )}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                  <span>{stop.pickup}</span>
                                  {stop.time_offset && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-border" />
                                      <span className="inline-flex items-center gap-1 text-primary-accent font-semibold">
                                        <Clock className="size-3" /> ~{stop.time_offset}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <span className="text-[13px] font-black text-primary shrink-0 ml-3">
                              {formatPrice(stop.price_fcfa)} FCFA
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Titulaire du billet (Pour moi / Pour un proche) */}
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
                            : myName
                              ? `Billet à mon nom (${myName})`
                              : "Veuillez saisir votre nom"}
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

                  {(forFriend || (!forFriend && !myName)) && (
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

                {/* Moyen de paiement Wave */}
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

                  <div className="rounded-xl bg-card/80 p-3 border border-border/70 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5 shadow-xs">
                    <Info className="size-4 shrink-0 text-primary-accent mt-0.5" />
                    <span>
                      Indiquez le numéro de votre compte Wave pour valider votre réservation en 1 clic et recevoir immédiatement votre e-billet.
                    </span>
                  </div>

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

                {/* Récapitulatif du prix */}
                <div className="rounded-2xl bg-primary/5 p-5 space-y-3 border border-primary/20 text-[13px]">
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>
                      Billet King-Bus ({seatsCount} place{seatsCount > 1 ? "s" : ""})
                      {selectedStop ? ` · ${selectedStop.city}` : ` · ${caravane.from}`}
                    </span>
                    <span className="font-bold text-foreground">{formatPrice(total)} FCFA</span>
                  </div>
                  {isLayoutAvailable && selectedSeats.length > 0 && (
                    <div className="flex justify-between text-muted-foreground font-medium">
                      <span>Siège(s) choisi(s)</span>
                      <span className="font-bold text-primary">
                        {selectedSeats.map(getSeatLabel).join(", ")}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-primary/20 pt-3 flex items-center justify-between text-sm">
                    <span className="font-extrabold text-foreground uppercase tracking-wide">Total à régler</span>
                    <span className="text-2xl font-black text-primary drop-shadow-sm">
                      {formatPrice(total)} FCFA
                    </span>
                  </div>
                </div>

                {/* Bouton de confirmation finale */}
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
                <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-muted-foreground pb-2">
                  <ShieldCheck className="size-3.5 text-emerald-500" />
                  Paiement sécurisé par Wave SN • Billet numérique garanti
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
