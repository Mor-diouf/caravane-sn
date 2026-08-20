import { cn } from "@/lib/utils";

/**
 * Écusson d'université dessiné en SVG : chaque université a sa palette et son
 * motif (livre, vagues, soleil, baobab, arche) pour être reconnaissable d'un
 * coup d'œil, même en petit format.
 */

type Crest = {
  from: string;
  to: string;
  motif: "book" | "waves" | "sun" | "tree" | "arch";
};

const crests: Record<string, Crest> = {
  UASZ: { from: "#0f766e", to: "#22c55e", motif: "tree" },
  UCAD: { from: "#1d4ed8", to: "#38bdf8", motif: "book" },
  UGB: { from: "#7c3aed", to: "#38bdf8", motif: "waves" },
  UIDT: { from: "#b45309", to: "#f59e0b", motif: "sun" },
  UADB: { from: "#be123c", to: "#fb7185", motif: "arch" },
};

const fallback: Crest = { from: "#1e3a8a", to: "#3b82f6", motif: "book" };

function Motif({ motif }: { motif: Crest["motif"] }) {
  const stroke = "rgba(255,255,255,0.95)";
  switch (motif) {
    case "tree":
      return (
        <g fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <path d="M24 32V20" />
          <path d="M24 20c-4-1-7-4-7-7 3 0 6 1 7 3 1-2 4-3 7-3 0 3-3 6-7 7Z" fill={stroke} stroke="none" />
          <path d="M18 32h12" />
        </g>
      );
    case "waves":
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round">
          <path d="M15 20c3-2.5 6-2.5 9 0s6 2.5 9 0" />
          <path d="M15 26c3-2.5 6-2.5 9 0s6 2.5 9 0" />
          <path d="M15 32c3-2.5 6-2.5 9 0s6 2.5 9 0" />
        </g>
      );
    case "sun":
      return (
        <g stroke={stroke} strokeWidth="2" strokeLinecap="round">
          <circle cx="24" cy="25" r="5" fill={stroke} stroke="none" />
          <path d="M24 14v3M24 33v3M13 25h3M32 25h3M16.5 17.5l2 2M29.5 30.5l2 2M31.5 17.5l-2 2M18.5 30.5l-2 2" />
        </g>
      );
    case "arch":
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round">
          <path d="M16 33V25a8 8 0 0 1 16 0v8" />
          <path d="M13 33h22" />
        </g>
      );
    default:
      return (
        <g fill="none" stroke={stroke} strokeWidth="2.2" strokeLinecap="round">
          <path d="M14 19h8a3 3 0 0 1 3 3v11a3 3 0 0 0-3-2.5h-8Z" />
          <path d="M34 19h-8a3 3 0 0 0-3 3v11a3 3 0 0 1 3-2.5h8Z" />
        </g>
      );
  }
}

export function UniversityMark({
  abbr,
  active,
  showAbbr = true,
  className,
}: {
  abbr: string;
  active?: boolean;
  showAbbr?: boolean;
  className?: string;
}) {
  const key = abbr.toUpperCase();
  const crest = crests[key] ?? fallback;
  const gradientId = `um-${key}`;

  return (
    <span className={cn("relative grid size-12 place-items-center", className)}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={crest.from} />
            <stop offset="100%" stopColor={crest.to} />
          </linearGradient>
        </defs>
        <path
          d="M24 2.5 43 8.5v18c0 10.2-7.6 16.6-19 21-11.4-4.4-19-10.8-19-21v-18Z"
          fill={`url(#${gradientId})`}
          opacity={active ? 1 : 0.92}
        />
        <path
          d="M24 2.5 43 8.5v18c0 10.2-7.6 16.6-19 21-11.4-4.4-19-10.8-19-21v-18Z"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1"
        />
        <Motif motif={crest.motif} />
      </svg>
      {showAbbr && (
        <span className="relative mt-4 text-[8px] font-black uppercase leading-none tracking-tight text-white">
          {key.slice(0, 4)}
        </span>
      )}
    </span>
  );
}
