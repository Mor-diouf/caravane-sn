import { Link } from "@tanstack/react-router";
import { Clock, Heart, MapPin, ChevronRight, Bus, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatPrice, seatTone, type CaravanView } from "@/lib/student-shared";
import { OrganizerLogo } from "@/components/OrganizerLogo";
import { cn } from "@/lib/utils";

type Props = {
  caravane: CaravanView;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
};

export function CaravanCard({ caravane, favorite, onToggleFavorite }: Props) {
  const tone = seatTone(caravane.seatsLeft);
  const isFull = caravane.seatsLeft === 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-ambient transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lifted hover:border-primary/40">
      <Link to="/caravane/$id" params={{ id: caravane.id }} className="flex flex-col flex-1 relative z-10">
        
        {/* Top Bus Photograph Section */}
        <div className="relative aspect-[16/10] w-full overflow-hidden rounded-t-[2rem] bg-muted/40">
          <img
            src={caravane.image}
            alt={`Bus ${caravane.from} vers ${caravane.to}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Subtle Contrast Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
          
          {/* Top Badges */}
          <div className="absolute top-3.5 left-3.5 flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black text-white shadow-md backdrop-blur-md border border-white/15",
                isFull && "bg-neutral-800/90",
                !isFull && tone === "critical" && "bg-danger/90",
                !isFull && tone === "warning" && "bg-amber-500/90",
                !isFull && tone === "ok" && "bg-emerald-600/90",
              )}
            >
              {!isFull && <div className="size-1.5 rounded-full bg-white animate-pulse" />}
              {isFull ? "Complet" : `${caravane.seatsLeft} places restantes`}
            </span>

            {caravane.amenities && caravane.amenities.includes("ac") && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10">
                ❄️ Climatisé
              </span>
            )}
          </div>

          {/* Route Overlay Title directly on photo */}
          <div className="absolute bottom-3.5 left-4 right-4 text-white">
            <h3 className="text-xl sm:text-2xl font-black leading-tight tracking-tight flex items-center gap-2 drop-shadow-md">
              <span className="truncate">{caravane.from}</span>
              <span className="text-primary shrink-0 font-black">➔</span>
              <span className="truncate">{caravane.to}</span>
            </h3>
          </div>
        </div>

        {/* Lower Content Section */}
        <div className="flex flex-col flex-1 p-5 gap-3.5 justify-between">
          <div className="space-y-2.5">
            {/* Date & Time */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground font-semibold">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Clock className="size-3.5" />
              </div>
              <span className="truncate">
                Départ : <strong className="text-foreground">{caravane.date}</strong> à <strong>{caravane.time}</strong>
              </span>
            </div>
            
            {/* Pickup Location */}
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground mt-0.5">
                <MapPin className="size-3.5 text-primary" />
              </div>
              <span className="line-clamp-2 leading-relaxed">
                <strong className="text-foreground/80 font-semibold">Gare départ :</strong> {caravane.pickup}
              </span>
            </div>

            {/* Dropoff Location if available */}
            {caravane.dropoff && (
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground mt-0.5">
                  <span className="text-[11px] font-bold">🏁</span>
                </div>
                <span className="line-clamp-1 leading-relaxed">
                  <strong className="text-foreground/80 font-semibold">Gare arrivée :</strong> {caravane.dropoff}
                </span>
              </div>
            )}
          </div>

          {/* King-Bus Official Trust Badge */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={caravane.organizerLogoUrl || "/images/king-bus/logo.jpg"}
                alt="KING-BUS"
                className="size-6 rounded-full object-cover border border-primary/40 bg-white"
              />
              <span className="truncate text-xs font-black text-foreground/90">
                {caravane.organizer || "KING-BUS 2.0"}
              </span>
              <CheckCircle2 className="size-3.5 text-primary shrink-0" />
            </div>

            <span className="shrink-0 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              ⭐ 4.9 • Confort Assuré
            </span>
          </div>

          {/* Pricing & CTA Action Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tarif par place</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tracking-tight text-foreground">
                  {formatPrice(caravane.price)}
                </span>
                <span className="text-xs font-extrabold text-muted-foreground">FCFA</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 px-4 py-2.5 text-xs font-black text-black shadow-md transition-all group-hover:scale-[1.03] group-hover:shadow-lifted hover:brightness-110">
                <span>{isFull ? "Complet" : "Réserver"}</span>
                <ChevronRight className="size-3.5" />
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* Favorite Button (top right) */}
      <button
        type="button"
        aria-label="Ajouter aux favoris"
        aria-pressed={favorite}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.(caravane.id);
        }}
        className="absolute right-3.5 top-3.5 z-20 grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition-all hover:bg-black/60 hover:scale-110 active:scale-95 aria-pressed:text-danger aria-pressed:bg-white/95 shadow-md"
      >
        <Heart className={cn("size-5 transition-colors", favorite && "fill-current")} />
      </button>
    </article>
  );
}
