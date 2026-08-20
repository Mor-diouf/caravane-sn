import { Link } from "@tanstack/react-router";
import { Clock, Heart, MapPin } from "lucide-react";
import { formatPrice, seatTone, type Caravane } from "@/lib/caravanes";
import { cn } from "@/lib/utils";

type Props = {
  caravane: Caravane;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
};

export function CaravanCard({ caravane, favorite, onToggleFavorite }: Props) {
  const tone = seatTone(caravane.seatsLeft);

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card shadow-ambient transition-all duration-300 hover:-translate-y-1 hover:shadow-lifted">
      <Link to="/caravane/$id" params={{ id: caravane.id }} className="block">
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={caravane.image}
            alt={`Bus ${caravane.from} vers ${caravane.to}`}
            loading="lazy"
            width={1280}
            height={800}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/45 via-transparent to-transparent" />
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full border border-white/25 px-2.5 py-1 text-[11px] font-semibold leading-none tracking-tight text-primary-foreground shadow-ambient backdrop-blur-md",
              tone === "critical" && "bg-danger/75",
              tone === "warning" && "bg-secondary-accent/80 text-text-strong",
              tone === "ok" && "bg-success/75",
            )}
          >
            {caravane.seatsLeft} places
          </span>
        </div>

        <div className="space-y-2 p-4 pr-12">
          <h3 className="truncate text-[15px] font-bold leading-snug tracking-tight">
            {caravane.from} <span className="text-muted-foreground">→</span> {caravane.to}
          </h3>
          <p className="flex items-center gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <span className="truncate">
              {caravane.date} • {caravane.time}
            </span>
          </p>
          <p className="flex items-start gap-1.5 text-[12px] leading-relaxed text-muted-foreground">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <span className="line-clamp-2">{caravane.pickup}</span>
          </p>
          <p className="pt-1 text-[17px] font-extrabold leading-none text-primary-accent">
            {formatPrice(caravane.price)}
            <span className="ml-1 text-[11px] font-semibold text-muted-foreground">FCFA</span>
          </p>
        </div>

      </Link>

      <button
        type="button"
        aria-label="Ajouter aux favoris"
        aria-pressed={favorite}
        onClick={() => onToggleFavorite?.(caravane.id)}
        className="absolute bottom-4 right-4 grid size-9 place-items-center rounded-full border border-border/70 bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:text-danger aria-pressed:border-danger/40 aria-pressed:text-danger"
      >
        <Heart className={cn("size-4", favorite && "fill-current")} />
      </button>
    </article>
  );
}
