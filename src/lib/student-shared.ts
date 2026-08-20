import bus1 from "@/assets/bus-1.jpg";
import bus2 from "@/assets/bus-2.jpg";
import bus3 from "@/assets/bus-3.jpg";

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
  rating: number;
  isPro: boolean;
  amenities: Amenity[];
  about: string;
};

const fallbackImages = [bus1, bus2, bus3];

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
  let sum = 0;
  for (const char of id) sum += char.charCodeAt(0);
  return fallbackImages[sum % fallbackImages.length]!;
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
    rating: Number(row.organizers?.rating ?? 0),
    isPro: Boolean(row.organizers?.is_pro),
    amenities: (row.amenities ?? []).filter((a): a is Amenity =>
      ["wifi", "ac", "usb", "video"].includes(a),
    ),
    about: row.about ?? "",
  };
}

export const CARAVAN_SELECT =
  "id, university_id, from_label, to_label, departure_at, pickup, dropoff, price_fcfa, seats_left, total_seats, image_url, amenities, about, organizer_id, organizers(name, rating, is_pro, phone)";

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
  preferred_payment?: "wave" | "orange" | "free";
  notify_departures?: boolean;
  notify_promos?: boolean;
  notify_whatsapp?: boolean;
};
