/** Types et utilitaires partagés par les espaces admin et organisateur. */

export type AppRole = "student" | "organizer" | "admin";

export type AccessInfo = {
  userId: string;
  roles: AppRole[];
  isAdmin: boolean;
  isOrganizer: boolean;
  organizerId: string | null;
  organizerName: string | null;
  organizerStatus: string | null;
  organizerIsPro: boolean;
  fullName: string;
  email: string | null;
};

export const initialsOf = (name: string | null | undefined) =>
  (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "??";

export const dateFr = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

export const dateTimeFr = (iso: string | null | undefined) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export const methodLabels: Record<string, string> = {
  wave: "Wave",
  orange: "Orange Money",
  free: "Free Money",
};
