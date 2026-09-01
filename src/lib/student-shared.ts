import bus1 from "@/assets/bus-1.jpg";
import bus2 from "@/assets/bus-2.jpg";
import bus3 from "@/assets/bus-3.jpg";
import bus4 from "@/assets/bus-4.jpg";

export type Amenity = "wifi" | "ac" | "usb" | "video";

export type UniversityRow = {
  id: string;
  abbr: string;
  name: string;
  city: string;
};

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
};

export const BUS_PRESET_IMAGES = [bus1, bus2, bus3, bus4];
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
};

export function mapCaravan(row: RawCaravan): CaravanView {
  const departure = new Date(row.departure_at);
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
    organizer: row.organizers?.name ?? "Amicale étudiante",
    organizerId: row.organizer_id,
    organizerPhone: row.organizers?.phone ?? null,
    organizerLogoUrl: row.organizers?.logo_url ?? null,
    organizerSlogan: row.organizers?.slogan ?? null,
    organizerSupportPhone: row.organizers?.support_phone ?? null,
    rating: Number(row.organizers?.rating ?? 0),
    isPro: Boolean(row.organizers?.is_pro),
    amenities: (row.amenities ?? []).filter((a): a is Amenity =>
      ["wifi", "ac", "usb", "video"].includes(a),
    ),
    about: row.about ?? "",
  };
}

export const CARAVAN_SELECT =
  "id, university_id, from_label, to_label, departure_at, pickup, dropoff, price_fcfa, seats_left, total_seats, image_url, amenities, about, organizer_id, organizers(name, rating, is_pro, phone, logo_url, slogan, support_phone)";

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
