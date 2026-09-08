import { useState } from "react";
import { Bus } from "lucide-react";
import { cn } from "@/lib/utils";

type OrganizerLogoProps = {
  url?: string | null;
  name: string;
  className?: string;
  iconClassName?: string;
};

export function OrganizerLogo({
  url,
  name,
  className = "size-6 rounded-full",
  iconClassName = "size-3",
}: OrganizerLogoProps) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return (
      <div
        className={cn(
          "grid shrink-0 place-items-center rounded-full bg-primary/10 text-primary border border-border/80 shadow-xs",
          className,
        )}
        title={name}
      >
        <Bus className={iconClassName} />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={name}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
      className={cn(
        "shrink-0 bg-white object-contain border border-border/80 shadow-xs",
        className,
      )}
    />
  );
}
