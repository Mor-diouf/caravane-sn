/**
 * Données de démonstration du tableau de bord organisateur (CaravaneHub).
 * Aucune logique serveur : structures prêtes pour un backend.
 */

export type Plan = "basic" | "pro";

export const organization = {
  name: "Amicale UASZ",
  university: "Université Assane Seck de Ziguinchor",
  slug: "amicale-uasz",
  rating: 4.8,
  reviews: 124,
  plan: "pro" as Plan,
  owner: { name: "Amadou Diallo", role: "Propriétaire", initials: "AD", phone: "+221 77 145 88 20", email: "amadou@amicale-uasz.sn" },
};

export const activeCaravan = {
  route: "Ziguinchor → Dakar",
  destination: "Dakar",
  date: "15 octobre 2026",
  time: "07:30",
  capacity: 70,
  booked: 52,
  pending: 6,
  cancelled: 2,
  price: 8500,
  revenue: 442000,
  organizerRevenue: 26000,
  platformFee: 10400,
  occupancyTrend: "+18%",
};

export type Status =
  | "pending"
  | "paid"
  | "confirmed"
  | "cancelled"
  | "refunded"
  | "boarded"
  | "no_show";

export const statusLabels: Record<Status, string> = {
  pending: "En attente",
  paid: "Payé",
  confirmed: "Confirmé",
  cancelled: "Annulé",
  refunded: "Remboursé",
  boarded: "Embarqué",
  no_show: "Absent",
};

export const statusTone: Record<Status, "success" | "warning" | "danger" | "info" | "neutral"> = {
  pending: "warning",
  paid: "info",
  confirmed: "success",
  cancelled: "danger",
  refunded: "neutral",
  boarded: "success",
  no_show: "danger",
};

export type Booking = {
  id: string;
  student: string;
  initials: string;
  phone: string;
  destination: string;
  seats: number;
  amount: number;
  method: "Wave" | "Orange Money" | "Free Money" | "Carte";
  status: Status;
  ticket: "émis" | "scanné" | "en attente";
  date: string;
};

export const bookings: Booking[] = [
  { id: "CE-8F21A", student: "Fatou Ndiaye", initials: "FN", phone: "+221 77 512 44 18", destination: "Dakar", seats: 1, amount: 8500, method: "Wave", status: "confirmed", ticket: "émis", date: "12 oct. 09:12" },
  { id: "CE-7B93C", student: "Moussa Sarr", initials: "MS", phone: "+221 78 220 91 03", destination: "Dakar", seats: 1, amount: 8500, method: "Orange Money", status: "paid", ticket: "émis", date: "12 oct. 08:41" },
  { id: "CE-5D02E", student: "Aïssatou Baldé", initials: "AB", phone: "+221 76 884 12 77", destination: "Dakar", seats: 2, amount: 17000, method: "Wave", status: "confirmed", ticket: "scanné", date: "11 oct. 21:03" },
  { id: "CE-3A77F", student: "Cheikh Diouf", initials: "CD", phone: "+221 77 301 55 62", destination: "Thiès", seats: 1, amount: 6000, method: "Free Money", status: "pending", ticket: "en attente", date: "11 oct. 18:22" },
  { id: "CE-9C41B", student: "Mariama Cissé", initials: "MC", phone: "+221 70 118 76 30", destination: "Dakar", seats: 1, amount: 8500, method: "Carte", status: "boarded", ticket: "scanné", date: "11 oct. 15:47" },
  { id: "CE-2E64D", student: "Ibrahima Fall", initials: "IF", phone: "+221 78 909 23 14", destination: "Kolda", seats: 1, amount: 5500, method: "Wave", status: "cancelled", ticket: "en attente", date: "10 oct. 12:05" },
  { id: "CE-6H18K", student: "Ndeye Gueye", initials: "NG", phone: "+221 77 654 02 88", destination: "Dakar", seats: 1, amount: 8500, method: "Orange Money", status: "refunded", ticket: "en attente", date: "10 oct. 10:31" },
  { id: "CE-1K90M", student: "Ousmane Ba", initials: "OB", phone: "+221 76 445 71 20", destination: "Dakar", seats: 1, amount: 8500, method: "Wave", status: "confirmed", ticket: "émis", date: "09 oct. 19:58" },
];

export type Caravan = {
  id: string;
  route: string;
  destination: string;
  date: string;
  capacity: number;
  booked: number;
  revenue: number;
  rating: number;
  status: "active" | "upcoming" | "completed" | "cancelled" | "full";
};

export const caravans: Caravan[] = [
  { id: "cv-001", route: "Ziguinchor → Dakar", destination: "Dakar", date: "15 oct. 2026", capacity: 70, booked: 52, revenue: 442000, rating: 4.8, status: "active" },
  { id: "cv-002", route: "Ziguinchor → Thiès", destination: "Thiès", date: "22 oct. 2026", capacity: 70, booked: 18, revenue: 108000, rating: 0, status: "upcoming" },
  { id: "cv-003", route: "Ziguinchor → Kolda", destination: "Kolda", date: "29 oct. 2026", capacity: 50, booked: 4, revenue: 22000, rating: 0, status: "upcoming" },
  { id: "cv-004", route: "Ziguinchor → Dakar", destination: "Dakar", date: "12 sept. 2026", capacity: 70, booked: 70, revenue: 595000, rating: 4.9, status: "completed" },
  { id: "cv-005", route: "Ziguinchor → Thiès", destination: "Thiès", date: "28 août 2026", capacity: 70, booked: 63, revenue: 378000, rating: 4.7, status: "completed" },
  { id: "cv-006", route: "Ziguinchor → Kolda", destination: "Kolda", date: "14 août 2026", capacity: 50, booked: 42, revenue: 231000, rating: 4.6, status: "completed" },
  { id: "cv-007", route: "Ziguinchor → Mbour", destination: "Mbour", date: "02 août 2026", capacity: 55, booked: 12, revenue: 66000, rating: 0, status: "cancelled" },
];

export const caravanStatusLabels: Record<Caravan["status"], string> = {
  active: "En cours",
  upcoming: "À venir",
  completed: "Terminée",
  cancelled: "Annulée",
  full: "Complète",
};

export type Passenger = {
  id: string;
  name: string;
  initials: string;
  phone: string;
  email: string;
  university: string;
  trips: number;
  spent: number;
  lastTrip: string;
  rating: number;
};

export const passengers: Passenger[] = [
  { id: "p1", name: "Fatou Ndiaye", initials: "FN", phone: "+221 77 512 44 18", email: "fatou.ndiaye@uasz.sn", university: "UASZ", trips: 7, spent: 59500, lastTrip: "12 oct. 2026", rating: 5 },
  { id: "p2", name: "Moussa Sarr", initials: "MS", phone: "+221 78 220 91 03", email: "moussa.sarr@uasz.sn", university: "UASZ", trips: 4, spent: 34000, lastTrip: "12 sept. 2026", rating: 4 },
  { id: "p3", name: "Aïssatou Baldé", initials: "AB", phone: "+221 76 884 12 77", email: "a.balde@uasz.sn", university: "UASZ", trips: 9, spent: 76500, lastTrip: "11 oct. 2026", rating: 5 },
  { id: "p4", name: "Cheikh Diouf", initials: "CD", phone: "+221 77 301 55 62", email: "cheikh.diouf@uasz.sn", university: "UASZ", trips: 2, spent: 12000, lastTrip: "28 août 2026", rating: 4 },
  { id: "p5", name: "Mariama Cissé", initials: "MC", phone: "+221 70 118 76 30", email: "m.cisse@uasz.sn", university: "UASZ", trips: 6, spent: 51000, lastTrip: "11 oct. 2026", rating: 5 },
  { id: "p6", name: "Ibrahima Fall", initials: "IF", phone: "+221 78 909 23 14", email: "i.fall@uasz.sn", university: "UASZ", trips: 1, spent: 5500, lastTrip: "14 août 2026", rating: 4 },
];

export const performanceSeries = [
  { day: "09 oct.", reservations: 4, paiements: 34000, occupation: 61 },
  { day: "10 oct.", reservations: 6, paiements: 51000, occupation: 65 },
  { day: "11 oct.", reservations: 9, paiements: 76500, occupation: 70 },
  { day: "12 oct.", reservations: 7, paiements: 59500, occupation: 74 },
  { day: "13 oct.", reservations: 5, paiements: 42500, occupation: 77 },
  { day: "14 oct.", reservations: 8, paiements: 68000, occupation: 82 },
  { day: "15 oct.", reservations: 6, paiements: 51000, occupation: 86 },
];

export const monthlySeries = [
  { month: "Mai", revenus: 218000, reservations: 34, occupation: 68 },
  { month: "Juin", revenus: 305000, reservations: 46, occupation: 74 },
  { month: "Juil.", revenus: 268000, reservations: 39, occupation: 71 },
  { month: "Août", revenus: 609000, reservations: 105, occupation: 86 },
  { month: "Sept.", revenus: 595000, reservations: 70, occupation: 96 },
  { month: "Oct.", revenus: 442000, reservations: 52, occupation: 74 },
];

export const paymentMethodSplit = [
  { name: "Wave", value: 58, amount: 256000 },
  { name: "Orange Money", value: 27, amount: 119000 },
  { name: "Free Money", value: 9, amount: 40000 },
  { name: "Carte", value: 6, amount: 27000 },
];

export const destinationPerformance = [
  { destination: "Dakar", revenus: 1037000, remplissage: 87 },
  { destination: "Thiès", revenus: 486000, remplissage: 79 },
  { destination: "Kolda", revenus: 253000, remplissage: 84 },
  { destination: "Mbour", revenus: 66000, remplissage: 22 },
];

export type ActivityEvent = {
  id: string;
  kind: "booking" | "payment" | "review" | "scan" | "refund";
  title: string;
  detail: string;
  time: string;
};

export const activity: ActivityEvent[] = [
  { id: "a1", kind: "booking", title: "Nouvelle réservation", detail: "Fatou Ndiaye — Dakar, 1 place", time: "il y a 4 min" },
  { id: "a2", kind: "payment", title: "Paiement reçu", detail: "8 500 FCFA via Wave", time: "il y a 12 min" },
  { id: "a3", kind: "scan", title: "Billet scanné", detail: "CE-5D02E — embarquement validé", time: "il y a 38 min" },
  { id: "a4", kind: "review", title: "Nouvel avis vérifié", detail: "5/5 — « Départ à l'heure, bus très propre »", time: "il y a 2 h" },
  { id: "a5", kind: "refund", title: "Remboursement traité", detail: "Ndeye Gueye — 8 500 FCFA", time: "il y a 5 h" },
  { id: "a6", kind: "booking", title: "Nouvelle réservation", detail: "Ousmane Ba — Dakar, 1 place", time: "hier" },
];

export const insights = [
  "Votre caravane Dakar est remplie à 74 % — 18 places encore disponibles.",
  "Vous avez vendu 18 % de places supplémentaires cette semaine.",
  "À ce rythme, la caravane pourrait être complète dans environ 3 jours.",
  "Les étudiants notent particulièrement bien le confort de vos véhicules.",
  "Votre dernière caravane vers Dakar a atteint 96 % de remplissage.",
];

export const reviewCriteria = [
  { label: "Confort", score: 4.8 },
  { label: "Ponctualité", score: 4.9 },
  { label: "Organisation", score: 4.7 },
  { label: "État du véhicule", score: 4.6 },
  { label: "Expérience globale", score: 4.8 },
];

export const badges = [
  "Organisateur recommandé",
  "Très apprécié des étudiants",
  "Excellent taux de ponctualité",
  "Organisateur fiable",
];

export const reviews = [
  { id: "r1", author: "Aïssatou Baldé", initials: "AB", score: 5, trip: "Ziguinchor → Dakar · 12 sept.", text: "Départ à l'heure et bus impeccable. L'organisation était très pro.", date: "13 sept. 2026" },
  { id: "r2", author: "Mariama Cissé", initials: "MC", score: 5, trip: "Ziguinchor → Thiès · 28 août", text: "Communication claire sur WhatsApp et embarquement rapide avec le QR code.", date: "29 août 2026" },
  { id: "r3", author: "Cheikh Diouf", initials: "CD", score: 4, trip: "Ziguinchor → Kolda · 14 août", text: "Bon trajet, la pause aurait pu être un peu plus longue.", date: "15 août 2026" },
];

export const notifications = [
  { id: "n1", title: "Caravane presque complète", detail: "Dakar · 52/70 places vendues", time: "il y a 9 min", tone: "warning" as const },
  { id: "n2", title: "Paiement reçu", detail: "8 500 FCFA — Wave", time: "il y a 12 min", tone: "success" as const },
  { id: "n3", title: "Nouvel avis vérifié", detail: "5/5 par Aïssatou Baldé", time: "il y a 2 h", tone: "info" as const },
  { id: "n4", title: "Demande de remboursement", detail: "Ibrahima Fall — Kolda", time: "hier", tone: "danger" as const },
];

export const team = [
  { id: "t1", name: "Amadou Diallo", initials: "AD", role: "owner", email: "amadou@amicale-uasz.sn" },
  { id: "t2", name: "Sokhna Mbaye", initials: "SM", role: "manager", email: "sokhna@amicale-uasz.sn" },
  { id: "t3", name: "Pape Sène", initials: "PS", role: "finance", email: "pape@amicale-uasz.sn" },
  { id: "t4", name: "Lamine Ndour", initials: "LN", role: "scanner", email: "lamine@amicale-uasz.sn" },
];

export const roleLabels: Record<string, string> = {
  owner: "Propriétaire",
  manager: "Gestionnaire",
  finance: "Finance",
  scanner: "Contrôleur",
  support: "Support",
};

export const fmt = (value: number) => new Intl.NumberFormat("fr-FR").format(value);
export const fcfa = (value: number) => `${fmt(value)} FCFA`;
export const pct = (part: number, total: number) => Math.round((part / total) * 100);
