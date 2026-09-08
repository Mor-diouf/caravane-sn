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
              <span className="text-[#1dc3ec] shrink-0 font-bold">➔</span>
              <span className="truncate">{caravane.to}</span>
            </h3>
          </div>
        </div>

        {/* Lower Content Section */}
        <div className="flex flex-col flex-1 p-5 gap-3.5 justify-between">
          <div className="space-y-2.5">
            {/* Date & Time */}
            <div className="flex items-center gap-2.5 text-xs sm:text-sm text-foreground font-semibold">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="size-3.5" />
              </div>
              <span className="truncate">
                Départ : <strong className="text-foreground">{caravane.date}</strong> à <strong>{caravane.time}</strong>
              </span>
            </div>
            
            {/* Pickup Location */}
            <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium">
              <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground mt-0.5">
                <MapPin className="size-3.5" />
              </div>
              <span className="line-clamp-2 leading-relaxed">
                <strong className="text-foreground/80 font-semibold">Départ :</strong> {caravane.pickup}
              </span>
            </div>

            {/* Dropoff Location if available */}
            {caravane.dropoff && (
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground mt-0.5">
                  <span className="text-[11px] font-bold">🏁</span>
                </div>
                <span className="line-clamp-1 leading-relaxed">
                  <strong className="text-foreground/80 font-semibold">Arrivée :</strong> {caravane.dropoff}
                </span>
              </div>
            )}
          </div>

          {/* Organizer & Trust Badge */}
          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="flex items-center gap-2 min-w-0">
              <OrganizerLogo
                url={caravane.organizerLogoUrl}
                name={caravane.organizer}
                className="size-6 rounded-full"
                iconClassName="size-3"
              />
              <span className="truncate text-xs font-bold text-foreground/90">
                {caravane.organizer}
              </span>
              <CheckCircle2 className="size-3.5 text-[#1dc3ec] shrink-0" />
            </div>

            <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
              {caravane.rating ? `${caravane.rating} ⭐` : "Certifié"}
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
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-md transition-all group-hover:scale-[1.03] group-hover:shadow-lifted">
                <span>{isFull ? "Détails" : "Réserver"}</span>
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
