import { cn } from "@/lib/utils";

type Method = "wave" | "orange" | "free";

const marks: Record<Method, { label: string; short: string; className: string }> = {
  wave: {
    label: "Wave",
    short: "W",
    className: "bg-[oklch(0.62_0.19_255)] text-white",
  },
  orange: {
    label: "Orange Money",
    short: "OM",
    className: "bg-[oklch(0.7_0.19_45)] text-white",
  },
  free: {
    label: "Free Money",
    short: "FM",
    className: "bg-[oklch(0.55_0.2_15)] text-white",
  },
};

/** Marque colorée du fournisseur de paiement mobile (rendu SVG, sans logo tiers). */
export function PaymentMark({ method, className }: { method: Method; className?: string }) {
  const mark = marks[method];
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-black tracking-tight shadow-ambient",
        mark.className,
        className,
      )}
    >
      {method === "wave" ? (
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round">
          <path d="M2 14c2.5-4 5-4 7.5 0s5 4 7.5 0 2.5-4 5-4" />
        </svg>
      ) : (
        mark.short
      )}
    </span>
  );
}

export const paymentLabel = (method: Method) => marks[method].label;
