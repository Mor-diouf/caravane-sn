import bus1 from "@/assets/bus-1.jpg";
import bus2 from "@/assets/bus-2.jpg";
import bus3 from "@/assets/bus-3.jpg";

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
};

export const universities: University[] = [
  { id: "uasz", abbr: "UASZ", name: "Université Assane Seck", city: "Ziguinchor" },
  { id: "ucad", abbr: "UCAD", name: "Université Cheikh Anta Diop", city: "Dakar" },
  { id: "ugb", abbr: "UGB", name: "Université Gaston Berger", city: "Saint-Louis" },
  { id: "uidt", abbr: "UIDT", name: "Université Iba Der Thiam", city: "Thiès" },
  { id: "uadb", abbr: "UADB", name: "Université Alioune Diop", city: "Bambey" },
];

export const caravanes: Caravane[] = [
  {
    id: "uasz-dakar-15",
    universityId: "uasz",
    from: "UASZ",
    to: "Dakar",
    date: "15 Août 2026",
    time: "08:00",
    pickup: "Campus social de l'UASZ",
    dropoff: "Gare routière de Dakar",
    price: 4500,
    seatsLeft: 12,
    totalSeats: 55,
    image: bus1,
    organizer: "Amicale des étudiants de Dakar",
    rating: 4.8,
    amenities: ["ac", "wifi", "usb", "video"],
    about:
      "Départ à 08h précises. Présentez-vous 20 minutes avant l'embarquement avec votre billet électronique.",
  },
  {
    id: "uasz-thies-16",
    universityId: "uasz",
    from: "UASZ",
    to: "Thiès",
    date: "16 Août 2026",
    time: "09:00",
    pickup: "Gare routière de Ziguinchor",
    dropoff: "Rond-point Thiès Ville",
    price: 5000,
    seatsLeft: 5,
    totalSeats: 55,
    image: bus2,
    organizer: "Amicale des étudiants de Thiès",
    rating: 4.6,
    amenities: ["ac", "usb"],
    about: "Trajet direct avec une pause de 20 minutes à Kaolack.",
  },
  {
    id: "uasz-kolda-17",
    universityId: "uasz",
    from: "UASZ",
    to: "Kolda",
    date: "17 Août 2026",
    time: "07:30",
    pickup: "Campus social de l'UASZ",
    dropoff: "Gare routière de Kolda",
    price: 4000,
    seatsLeft: 20,
    totalSeats: 55,
    image: bus3,
    organizer: "Amicale des étudiants du Fouladou",
    rating: 4.7,
    amenities: ["ac", "wifi"],
    about: "Bus climatisé, bagage de 20 kg inclus par étudiant.",
  },
  {
    id: "ugb-stlouis-18",
    universityId: "ugb",
    from: "UGB",
    to: "Saint-Louis",
    date: "18 Août 2026",
    time: "08:30",
    pickup: "Campus 2 UGB",
    dropoff: "Place Faidherbe",
    price: 1500,
    seatsLeft: 3,
    totalSeats: 40,
    image: bus2,
    organizer: "Amicale des étudiants de Sanar",
    rating: 4.9,
    amenities: ["ac", "wifi", "usb"],
    about: "Navette express du week-end, départ toutes les heures pleines.",
  },
  {
    id: "ucad-mbour-19",
    universityId: "ucad",
    from: "UCAD",
    to: "Mbour",
    date: "19 Août 2026",
    time: "10:00",
    pickup: "Place du Souvenir UCAD",
    dropoff: "Gare de Mbour",
    price: 3000,
    seatsLeft: 18,
    totalSeats: 55,
    image: bus1,
    organizer: "Amicale des étudiants de la Petite Côte",
    rating: 4.5,
    amenities: ["ac", "video"],
    about: "Départ depuis le campus principal, arrivée prévue à 12h15.",
  },
  {
    id: "uidt-dakar-20",
    universityId: "uidt",
    from: "UIDT",
    to: "Dakar",
    date: "20 Août 2026",
    time: "06:45",
    pickup: "Campus UIDT",
    dropoff: "Dakar Plateau",
    price: 2500,
    seatsLeft: 9,
    totalSeats: 50,
    image: bus3,
    organizer: "Amicale des étudiants de Thiès",
    rating: 4.4,
    amenities: ["ac", "wifi", "usb"],
    about: "Trajet matinal pensé pour les cours de 9h à Dakar.",
  },
  {
    id: "uadb-diourbel-21",
    universityId: "uadb",
    from: "UADB",
    to: "Diourbel",
    date: "21 Août 2026",
    time: "16:00",
    pickup: "Campus UADB Bambey",
    dropoff: "Gare de Diourbel",
    price: 1000,
    seatsLeft: 24,
    totalSeats: 45,
    image: bus2,
    organizer: "Amicale des étudiants du Baol",
    rating: 4.3,
    amenities: ["ac"],
    about: "Navette de fin de journée, retour possible le lendemain matin.",
  },
  {
    id: "ucad-ziguinchor-22",
    universityId: "ucad",
    from: "UCAD",
    to: "Ziguinchor",
    date: "22 Août 2026",
    time: "20:00",
    pickup: "Campus social UCAD",
    dropoff: "Campus UASZ",
    price: 8000,
    seatsLeft: 2,
    totalSeats: 55,
    image: bus1,
    organizer: "Amicale des étudiants casamançais",
    rating: 4.8,
    amenities: ["ac", "wifi", "usb", "video"],
    about: "Trajet de nuit avec deux chauffeurs et arrêt à Kaolack.",
  },
];

export const student = {
  name: "Mamadou Diop",
  university: "Étudiant à l'UASZ",
  studentId: "UASZ-2026-4517",
  phone: "+221 77 000 00 00",
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-FR").format(value);

export const getCaravane = (id: string) => caravanes.find((c) => c.id === id);

export const seatTone = (seatsLeft: number) =>
  seatsLeft <= 5 ? "critical" : seatsLeft <= 12 ? "warning" : "ok";
