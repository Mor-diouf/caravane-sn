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
          <span
            className={cn(
              "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-tight text-primary-foreground backdrop-blur",
              tone === "critical" && "bg-danger/90",
              tone === "warning" && "bg-secondary-accent/90 text-text-strong",
              tone === "ok" && "bg-success/90",
            )}
          >
            {caravane.seatsLeft} places
          </span>
        </div>

        <div className="space-y-2.5 p-4">
          <h3 className="truncate text-base font-bold tracking-tight">
            {caravane.from} <span className="text-muted-foreground">→</span> {caravane.to}
          </h3>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5 shrink-0" />
            <span className="truncate">
              {caravane.date} • {caravane.time}
            </span>
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{caravane.pickup}</span>
          </p>
          <p className="pt-1 text-lg font-extrabold text-primary-accent">
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
