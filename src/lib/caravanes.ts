const bus1 = "/images/bus-1.jpg";
const bus2 = "/images/bus-2.jpg";
const bus3 = "/images/bus-3.jpg";

import type { IntermediateStop } from "@/lib/student-shared";

export type University = {
  id: string;
  abbr: string;
  name: string;
  city: string;
};

export type Caravane = {
  id: string;
  universityId: string;
  from: string;
  to: string;
  date: string;
  time: string;
  pickup: string;
  dropoff: string;
  price: number;
  seatsLeft: number;
  totalSeats: number;
  image: string;
  organizer: string;
  rating: number;
  amenities: Array<"wifi" | "ac" | "usb" | "video">;
  about: string;
  stops?: IntermediateStop[];
};

export const universities: University[] = [
  { id: "dakar", abbr: "DKR", name: "Gare King-Bus Dakar", city: "Dakar" },
  { id: "ziguinchor", abbr: "ZIG", name: "Gare King-Bus Ziguinchor", city: "Ziguinchor" },
  { id: "cap-skirring", abbr: "CAP", name: "Agence King-Bus Cap Skirring", city: "Cap Skirring" },
  { id: "saint-louis", abbr: "SL", name: "Gare King-Bus Saint-Louis", city: "Saint-Louis" },
  { id: "mbour", abbr: "MBR", name: "Agence King-Bus Mbour", city: "Mbour" },
];

export const caravanes: Caravane[] = [
  {
    id: "kb-dkr-zig-01",
    universityId: "dakar",
    from: "Dakar",
    to: "Ziguinchor",
    date: "Aujourd'hui",
    time: "07:00",
    pickup: "Gare King-Bus Dakar (Patte d'Oie / Beaux Maraîchers)",
    dropoff: "Gare King-Bus Ziguinchor (Escale)",
    price: 12000,
    seatsLeft: 14,
    totalSeats: 50,
    image: "/images/king-bus/flyer.jpg",
    organizer: "KING-BUS 2.0",
    rating: 4.9,
    amenities: ["ac", "wifi", "usb", "video"],
    about:
      "Ligne régulière quotidienne Dakar ⇄ Ziguinchor. Bus grand confort climatisé, suspension pneumatique, prises de recharge USB et bagages autorisés inclus. Arrivez 30 minutes avant l'embarquement avec votre billet électronique ou QR Code.",
    stops: [
      {
        id: "stop-mbour",
        city: "Mbour",
        pickup: "Croisement Saly / Station Shell Mbour",
        price_fcfa: 10500,
        time_offset: "08:15",
      },
      {
        id: "stop-fatick",
        city: "Fatick",
        pickup: "Rond-point Fatick / Station Total",
        price_fcfa: 9000,
        time_offset: "09:30",
      },
      {
        id: "stop-kaolack",
        city: "Kaolack",
        pickup: "Garage Nioro / Rond-point Kaolack",
        price_fcfa: 8000,
        time_offset: "10:30",
      },
    ],
  },
  {
    id: "kb-zig-dkr-02",
    universityId: "ziguinchor",
    from: "Ziguinchor",
    to: "Dakar",
    date: "Aujourd'hui",
    time: "07:00",
    pickup: "Gare King-Bus Ziguinchor (Escale)",
    dropoff: "Gare King-Bus Dakar (Patte d'Oie)",
    price: 12000,
    seatsLeft: 9,
    totalSeats: 50,
    image: "/images/king-bus/flyer.jpg",
    organizer: "KING-BUS 2.0",
    rating: 4.9,
    amenities: ["ac", "wifi", "usb", "video"],
    about:
      "Ligne express retour Ziguinchor ➔ Dakar. Voyagez avec confort et sérénité. Bagage soute jusqu'à 25 kg inclus. Assistance voyage WhatsApp : 78 188 01 02.",
  },
  {
    id: "kb-dkr-zig-nuit",
    universityId: "dakar",
    from: "Dakar",
    to: "Ziguinchor",
    date: "Ce soir",
    time: "20:30",
    pickup: "Gare King-Bus Dakar (Patte d'Oie)",
    dropoff: "Gare King-Bus Ziguinchor",
    price: 14000,
    seatsLeft: 6,
    totalSeats: 48,
    image: bus1,
    organizer: "KING-BUS 2.0",
    rating: 5.0,
    amenities: ["ac", "wifi", "usb", "video"],
    about:
      "Service VIP Nuit Dakar ➔ Ziguinchor. Sièges inclinables grand confort pour dormir sereinement pendant le trajet. Sécurité renforcée et climatisation régulée.",
  },
  {
    id: "kb-zig-dkr-nuit",
    universityId: "ziguinchor",
    from: "Ziguinchor",
    to: "Dakar",
    date: "Ce soir",
    time: "20:30",
    pickup: "Gare King-Bus Ziguinchor",
    dropoff: "Gare King-Bus Dakar",
    price: 14000,
    seatsLeft: 11,
    totalSeats: 48,
    image: bus2,
    organizer: "KING-BUS 2.0",
    rating: 4.8,
    amenities: ["ac", "wifi", "usb", "video"],
    about:
      "Service VIP Nuit Ziguinchor ➔ Dakar. Arrivée à Dakar tôt le matin pour entamer votre journée sans stress.",
  },
  {
    id: "kb-dkr-cap",
    universityId: "dakar",
    from: "Dakar",
    to: "Cap Skirring",
    date: "Demain",
    time: "06:30",
    pickup: "Gare King-Bus Dakar",
    dropoff: "Centre Cap Skirring",
    price: 16000,
    seatsLeft: 18,
    totalSeats: 50,
    image: bus3,
    organizer: "KING-BUS 2.0",
    rating: 4.9,
    amenities: ["ac", "wifi", "usb", "video"],
    about:
      "Ligne balnéaire directe vers Cap Skirring. Idéal pour vos séjours et vacances en Casamance avec le confort King-Bus.",
  },
  {
    id: "kb-dkr-saintlouis",
    universityId: "dakar",
    from: "Dakar",
    to: "Saint-Louis",
    date: "Demain",
    time: "08:00",
    pickup: "Gare King-Bus Dakar",
    dropoff: "Place Faidherbe Saint-Louis",
    price: 7000,
    seatsLeft: 22,
    totalSeats: 50,
    image: bus1,
    organizer: "KING-BUS 2.0",
    rating: 4.8,
    amenities: ["ac", "wifi", "usb"],
    about:
      "Départ quotidien Dakar ➔ Saint-Louis par autoroute. Ponctualité, climatisation et sécurité King-Bus.",
  },
];

export const student = {
  name: "Client King-Bus",
  university: "Voyageur",
  studentId: "KB-2026-PASS",
  phone: "+221 78 188 01 02",
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-FR").format(value);

export const getCaravane = (id: string) => caravanes.find((c) => c.id === id);

export const seatTone = (seatsLeft: number) =>
  seatsLeft <= 5 ? "critical" : seatsLeft <= 12 ? "warning" : "ok";
