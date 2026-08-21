import { cn } from "@/lib/utils";

type Method = "wave" | "orange" | "free";

const marks: Record<Method, { label: string }> = {
  wave: { label: "Wave" },
  orange: { label: "Orange Money" },
  free: { label: "Free Money" },
};

/** Marque avec le logo officiel du fournisseur de paiement mobile. */
export function PaymentMark({ method, className }: { method: Method; className?: string }) {
  const mark = marks[method];
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-white shadow-ambient overflow-hidden border border-border/50",
        className || "w-16 h-11",
      )}
    >
      <img 
        src={`/payment/${method}.png`} 
        alt={mark.label} 
        className="size-full object-contain p-1" 
      />
    </span>
  );
}

export const paymentLabel = (method: Method) => marks[method].label;
