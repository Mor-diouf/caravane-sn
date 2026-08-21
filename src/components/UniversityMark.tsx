import { cn } from "@/lib/utils";

const logos: Record<string, string> = {
  UASZ: "/university/uasz.png",
  UCAD: "/university/ucad.png",
  UGB: "/university/ugb.jpg",
  UIDT: "/university/uidt.jpg",
  UADB: "/university/uadb.jpg",
};

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
  const logo = logos[key];

  if (!logo) {
    return (
      <span
        className={cn(
          "grid size-14 shrink-0 place-items-center rounded-2xl bg-muted font-bold text-muted-foreground shadow-ambient",
          className,
        )}
      >
        {key.slice(0, 4)}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-ambient transition-all border",
        active
          ? "border-primary ring-2 ring-primary ring-offset-2 ring-offset-background"
          : "border-border/70",
        className || "size-14",
      )}
    >
      <img
        src={logo}
        alt={`Logo ${abbr}`}
        className="size-full object-contain p-1.5"
      />
    </span>
  );
}
