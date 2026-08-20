import { cn } from "@/lib/utils";

/**
 * Écusson d'université dessiné en SVG (bouclier + monogramme), pour remplacer
 * les simples initiales en texte par une marque cohérente et lisible.
 */
export function UniversityMark({
  abbr,
  active,
  className,
}: {
  abbr: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("relative grid size-12 place-items-center", className)}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id={`um-${abbr}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--primary-accent)" />
          </linearGradient>
        </defs>
        <path
          d="M24 2.5 43 8.5v18c0 10.2-7.6 16.6-19 21-11.4-4.4-19-10.8-19-21v-18Z"
          fill={active ? `url(#um-${abbr})` : "var(--muted)"}
          stroke={active ? "transparent" : "var(--border)"}
          strokeWidth="1.2"
        />
      </svg>
      <span
        className={cn(
          "relative text-[10px] font-black leading-none tracking-tight",
          active ? "text-primary-foreground" : "text-primary",
        )}
      >
        {abbr.slice(0, 4)}
      </span>
    </span>
  );
}
