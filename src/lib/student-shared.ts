export type Amenity = "wifi" | "ac" | "usb" | "video";

export type UniversityRow = {
  id: string;
  abbr: string;
  name: string;
  city: string;
};

export type IntermediateStop = {
  id: string;
  city: string;
  pickup: string;
  price_fcfa: number;
  time_offset?: string | undefined;
  payment_link?: string | undefined;
};

const STOPS_MARKER_START = "<!-- STOPS_DATA:";
const STOPS_MARKER_END = ":STOPS_DATA -->";

export function parseStops(stopsField: unknown, aboutField?: string | null): IntermediateStop[] {
  if (Array.isArray(stopsField) && stopsField.length > 0) {
    return stopsField.map((s: any, idx) => ({
      id: String(s.id || `stop-${idx}`),
      city: String(s.city || ""),
      pickup: String(s.pickup || ""),
      price_fcfa: Number(s.price_fcfa || 0),
      ...(s.time_offset ? { time_offset: String(s.time_offset) } : {}),
      ...(s.payment_link ? { payment_link: String(s.payment_link) } : {}),
    }));
  }
  if (aboutField && aboutField.includes(STOPS_MARKER_START)) {
    try {
      const start = aboutField.indexOf(STOPS_MARKER_START) + STOPS_MARKER_START.length;
      const end = aboutField.indexOf(STOPS_MARKER_END, start);
      if (start > -1 && end > -1) {
        const jsonStr = aboutField.slice(start, end).trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          return parsed.map((s: any, idx) => ({
            id: String(s.id || `stop-${idx}`),
            city: String(s.city || ""),
            pickup: String(s.pickup || ""),
            price_fcfa: Number(s.price_fcfa || 0),
            ...(s.time_offset ? { time_offset: String(s.time_offset) } : {}),
            ...(s.payment_link ? { payment_link: String(s.payment_link) } : {}),
          }));
        }
      }
    } catch {
      // ignore parse errors
    }
  }
  return [];
}

export function stripStopsFromAbout(about?: string | null): string {
  if (!about) return "";
  if (!about.includes(STOPS_MARKER_START)) return about.trim();
  const start = about.indexOf(STOPS_MARKER_START);
  const end = about.indexOf(STOPS_MARKER_END, start);
  if (start > -1 && end > -1) {
    const before = about.slice(0, start);
    const after = about.slice(end + STOPS_MARKER_END.length);
    return `${before} ${after}`.trim();
  }
  return about.trim();
}

export function embedStopsInAbout(about: string, stops: IntermediateStop[]): string {
  const clean = stripStopsFromAbout(about);
  if (!stops || stops.length === 0) return clean;
  return `${clean}\n\n${STOPS_MARKER_START} ${JSON.stringify(stops)} ${STOPS_MARKER_END}`;
}

export function parsePassengerBoarding(rawName: string | null | undefined): { name: string; pickupStop?: string | undefined } {
  if (!rawName) return { name: "Passager" };
  const match = rawName.match(/^(.*?)\s*\[Montée:\s*([^\]]+)\]$/i);
  if (match && match[2]?.trim()) {
    return { name: match[1]?.trim() || "Passager", pickupStop: match[2].trim() };
  }
  return { name: rawName.trim() };
}

export function formatPassengerWithBoarding(name: string, pickupStop?: string): string {
  const trimmed = name.trim();
  if (!pickupStop || !pickupStop.trim()) return trimmed;
  return `${trimmed} [Montée: ${pickupStop.trim()}]`;
}

/**
 * Retrouve l'escale correspondante pour un passager en fonction du libellé de montée enregistré.
 */
export function findStopForBoarding(
  stops: IntermediateStop[] | undefined | null,
  pickupStopName: string | null | undefined
): IntermediateStop | null {
  if (!stops || stops.length === 0 || !pickupStopName) return null;
  const cleanTarget = pickupStopName.trim().toLowerCase();

  // 1. Recherche par correspondance exacte ou inclusion de la ville
  const match = stops.find((s) => {
    const city = s.city.trim().toLowerCase();
    return cleanTarget === city || cleanTarget.includes(city) || city.includes(cleanTarget);
  });
  if (match) return match;

  // 2. Recherche par le lieu de prise en charge (pickup)
  return (
    stops.find((s) => {
      const pickup = s.pickup.trim().toLowerCase();
      return pickup && (cleanTarget.includes(pickup) || pickup.includes(cleanTarget));
    }) ?? null
  );
}

/**
 * Détermine l'heure d'embarquement à afficher pour un passager (escale prioritaire ou départ général).
 */
export function getPassengerBoardingTime(
  generalDepartureTime: string,
  stop: IntermediateStop | null | undefined
): { time: string; isEscale: boolean; label: string } {
  if (stop?.time_offset && stop.time_offset.trim()) {
    return {
      time: stop.time_offset.trim(),
      isEscale: true,
      label: "Heure estimée de passage",
    };
  }
  return {
    time: generalDepartureTime,
    isEscale: false,
    label: "Heure de départ",
  };
}


/** Caravan shape returned by the public server functions. */
export type CaravanView = {
  id: string;
  universityId: string | null;
  from: string;
  to: string;
  departureAt: string;
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  price: number;
  seatsLeft: number;
  totalSeats: number;
  image: string;
  organizer: string;
  organizerId: string;
  organizerPhone: string | null;
  /** Branding fields shown on tickets */
  organizerLogoUrl: string | null;
  organizerSlogan: string | null;
  organizerSupportPhone: string | null;
  rating: number;
  isPro: boolean;
  amenities: Amenity[];
  about: string;
  stops: IntermediateStop[];
  layout?: any;
  reservedSeats?: string[];
  payment_link?: string | null;
};

export const BUS_PRESET_IMAGES = [
  "/images/bus-1.jpg",
  "/images/bus-2.jpg",
  "/images/bus-3.jpg",
  "/images/bus-4.jpg",
  "/images/bus-5.jpg",
  "/images/bus-6.jpg",
];
const fallbackImages = BUS_PRESET_IMAGES;

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-FR").format(value);

export const seatTone = (seatsLeft: number) =>
  seatsLeft <= 5 ? "critical" : seatsLeft <= 12 ? "warning" : "ok";

const dateFmt = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const timeFmt = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

export function fallbackImage(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return fallbackImages[Math.abs(hash) % fallbackImages.length]!;
}

type RawCaravan = {
  id: string;
  university_id: string | null;
  from_label: string;
  to_label: string;
  departure_at: string;
  pickup: string;
  dropoff: string;
  price_fcfa: number;
  seats_left: number;
  total_seats: number;
  image_url: string | null;
  amenities: string[] | null;
  about: string | null;
  stops?: unknown;
  organizer_id: string;
  organizers?: {
    name: string | null;
    rating: number | null;
    is_pro: boolean | null;
    phone: string | null;
    logo_url: string | null;
    slogan: string | null;
    support_phone: string | null;
  } | null;
  layout?: any;
  reservedSeats?: string[];
  payment_link?: string | null;
};

export function mapCaravan(row: RawCaravan): CaravanView {
  const departure = new Date(row.departure_at);
  const stops = parseStops(row.stops, row.about);
  const cleanAbout = stripStopsFromAbout(row.about);

  return {
    id: row.id,
    universityId: row.university_id,
    from: row.from_label,
    to: row.to_label,
    departureAt: row.departure_at,
    date: dateFmt.format(departure),
    time: timeFmt.format(departure),
    pickup: row.pickup,
    dropoff: row.dropoff,
    price: row.price_fcfa,
    seatsLeft: row.seats_left,
    totalSeats: row.total_seats,
    image: row.image_url || fallbackImage(row.id),
    organizer: row.organizers?.name ?? "KING-BUS 2.0",
    organizerId: row.organizer_id,
    organizerPhone: row.organizers?.phone ?? "+221 78 188 01 02",
    organizerLogoUrl: row.organizers?.logo_url ?? "/images/king-bus/logo.jpg",
    organizerSlogan: row.organizers?.slogan ?? "Voyagez avec confort, voyagez avec classe",
    organizerSupportPhone: row.organizers?.support_phone ?? "+221 78 188 01 02",
    rating: row.organizers?.rating ?? 4.8,
    isPro: row.organizers?.is_pro ?? true,
    amenities: (row.amenities as Amenity[]) || ["ac", "wifi"],
    about: cleanAbout,
    stops,
    layout: row.layout,
    reservedSeats: row.reservedSeats || [],
    payment_link: row.payment_link,
  };
}

export const CARAVAN_SELECT =
  "id, university_id, from_label, to_label, departure_at, pickup, dropoff, price_fcfa, seats_left, total_seats, image_url, amenities, about, layout, payment_link, organizer_id, organizers(name, rating, is_pro, phone, logo_url, slogan, support_phone)";

export const paymentLabels: Record<string, string> = {
  wave: "Wave",
  orange: "Orange Money",
  free: "Free Money",
};

/** Champs modifiables du profil étudiant. */
export type ProfileUpdate = {
  full_name?: string;
  phone?: string | null;
  email?: string | null;
  student_id?: string | null;
  university_id?: string | null;
  avatar_url?: string | null;
  preferred_payment?: "wave" | "orange" | "free";
  notify_departures?: boolean;
  notify_promos?: boolean;
  notify_whatsapp?: boolean;
};
