/**
 * Données de démonstration du back-office administrateur (CaravaneHub Admin).
 * Vue « super-admin » : c'est ici que le propriétaire de la plateforme
 * approuve les organisateurs, surveille les paiements et modère les avis.
 */

export const platform = {
  name: "Caravane Étudiants",
  admin: { name: "Amadou Diallo", role: "Super administrateur", initials: "AD", email: "admin@caravane.sn" },
  version: "2.0.0",
  commission: 4,
};

export const platformKpis = {
  gmv: 4820000,
  gmvTrend: "+22%",
  commission: 192800,
  commissionTrend: "+19%",
  students: 3184,
  studentsTrend: "+8%",
  organizers: 42,
  organizersTrend: "+5%",
  caravans: 168,
  activeCaravans: 23,
  bookings: 1274,
  fillRate: 81,
  disputes: 3,
};

export type OrganizerStatus = "pending" | "approved" | "suspended" | "rejected";

export const organizerStatusLabels: Record<OrganizerStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  suspended: "Suspendu",
  rejected: "Refusé",
};

export const organizerStatusTone: Record<OrganizerStatus, "success" | "warning" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  suspended: "danger",
  rejected: "neutral",
};

export type OrganizerAccount = {
  id: string;
  name: string;
  initials: string;
  university: string;
  contact: string;
  phone: string;
  email: string;
  plan: "basic" | "pro";
  status: OrganizerStatus;
  caravans: number;
  revenue: number;
  rating: number;
  documents: { label: string; verified: boolean }[];
  requestedAt: string;
};

export const organizerAccounts: OrganizerAccount[] = [
  {
    id: "org-001",
    name: "Amicale UASZ",
    initials: "AU",
    university: "Université Assane Seck de Ziguinchor",
    contact: "Amadou Diallo",
    phone: "+221 77 145 88 20",
    email: "amadou@amicale-uasz.sn",
    plan: "pro",
    status: "approved",
    caravans: 24,
    revenue: 1842000,
    rating: 4.8,
    documents: [
      { label: "Statuts de l'amicale", verified: true },
      { label: "Pièce d'identité du responsable", verified: true },
      { label: "Attestation universitaire", verified: true },
    ],
    requestedAt: "12 mars 2026",
  },
  {
    id: "org-002",
    name: "Transport UCAD",
    initials: "TU",
    university: "Université Cheikh Anta Diop",
    contact: "Sokhna Mbaye",
    phone: "+221 78 402 11 90",
    email: "sokhna@transport-ucad.sn",
    plan: "pro",
    status: "approved",
    caravans: 31,
    revenue: 2210000,
    rating: 4.6,
    documents: [
      { label: "Statuts de l'amicale", verified: true },
      { label: "Pièce d'identité du responsable", verified: true },
      { label: "Attestation universitaire", verified: true },
    ],
    requestedAt: "02 avril 2026",
  },
  {
    id: "org-003",
    name: "Amicale UGB Saint-Louis",
    initials: "UG",
    university: "Université Gaston Berger",
    contact: "Pape Sène",
    phone: "+221 76 771 30 45",
    email: "pape@ugb-caravane.sn",
    plan: "basic",
    status: "pending",
    caravans: 0,
    revenue: 0,
    rating: 0,
    documents: [
      { label: "Statuts de l'amicale", verified: true },
      { label: "Pièce d'identité du responsable", verified: true },
      { label: "Attestation universitaire", verified: false },
    ],
    requestedAt: "18 août 2026",
  },
  {
    id: "org-004",
    name: "Collectif UIDT Thiès",
    initials: "CT",
    university: "Université Iba Der Thiam",
    contact: "Ndeye Gueye",
    phone: "+221 77 654 02 88",
    email: "ndeye@uidt-collectif.sn",
    plan: "basic",
    status: "pending",
    caravans: 0,
    revenue: 0,
    rating: 0,
    documents: [
      { label: "Statuts de l'amicale", verified: false },
      { label: "Pièce d'identité du responsable", verified: true },
      { label: "Attestation universitaire", verified: false },
    ],
    requestedAt: "19 août 2026",
  },
  {
    id: "org-005",
    name: "Amicale UADB Bambey",
    initials: "AB",
    university: "Université Alioune Diop de Bambey",
    contact: "Lamine Ndour",
    phone: "+221 70 220 65 11",
    email: "lamine@uadb-amicale.sn",
    plan: "basic",
    status: "suspended",
    caravans: 9,
    revenue: 386000,
    rating: 3.4,
    documents: [
      { label: "Statuts de l'amicale", verified: true },
      { label: "Pièce d'identité du responsable", verified: true },
      { label: "Attestation universitaire", verified: true },
    ],
    requestedAt: "21 mai 2026",
  },
  {
    id: "org-006",
    name: "Bus Étudiants Kolda",
    initials: "BK",
    university: "Antenne universitaire de Kolda",
    contact: "Ibrahima Fall",
    phone: "+221 78 909 23 14",
    email: "ibrahima@bus-kolda.sn",
    plan: "basic",
    status: "rejected",
    caravans: 0,
    revenue: 0,
    rating: 0,
    documents: [
      { label: "Statuts de l'amicale", verified: false },
      { label: "Pièce d'identité du responsable", verified: false },
      { label: "Attestation universitaire", verified: false },
    ],
    requestedAt: "04 juillet 2026",
  },
];

export type PlatformUser = {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  university: string;
  role: "student" | "organizer" | "admin";
  trips: number;
  spent: number;
  joined: string;
  blocked: boolean;
};

export const platformUsers: PlatformUser[] = [
  { id: "u1", name: "Fatou Ndiaye", initials: "FN", email: "fatou.ndiaye@uasz.sn", phone: "+221 77 512 44 18", university: "UASZ", role: "student", trips: 7, spent: 59500, joined: "12 janv. 2026", blocked: false },
  { id: "u2", name: "Amadou Diallo", initials: "AD", email: "amadou@amicale-uasz.sn", phone: "+221 77 145 88 20", university: "UASZ", role: "organizer", trips: 0, spent: 0, joined: "12 mars 2026", blocked: false },
  { id: "u3", name: "Aïssatou Baldé", initials: "AB", email: "a.balde@uasz.sn", phone: "+221 76 884 12 77", university: "UASZ", role: "student", trips: 9, spent: 76500, joined: "03 févr. 2026", blocked: false },
  { id: "u4", name: "Sokhna Mbaye", initials: "SM", email: "sokhna@transport-ucad.sn", phone: "+221 78 402 11 90", university: "UCAD", role: "organizer", trips: 0, spent: 0, joined: "02 avril 2026", blocked: false },
  { id: "u5", name: "Cheikh Diouf", initials: "CD", email: "cheikh.diouf@uasz.sn", phone: "+221 77 301 55 62", university: "UASZ", role: "student", trips: 2, spent: 12000, joined: "22 mai 2026", blocked: false },
  { id: "u6", name: "Ibrahima Fall", initials: "IF", email: "ibrahima@bus-kolda.sn", phone: "+221 78 909 23 14", university: "Kolda", role: "student", trips: 1, spent: 5500, joined: "04 juil. 2026", blocked: true },
  { id: "u7", name: "Mariama Cissé", initials: "MC", email: "m.cisse@uasz.sn", phone: "+221 70 118 76 30", university: "UASZ", role: "student", trips: 6, spent: 51000, joined: "18 mars 2026", blocked: false },
  { id: "u8", name: "Moussa Sarr", initials: "MS", email: "moussa.sarr@uasz.sn", phone: "+221 78 220 91 03", university: "UASZ", role: "student", trips: 4, spent: 34000, joined: "09 avril 2026", blocked: false },
];

export const userRoleLabels: Record<PlatformUser["role"], string> = {
  student: "Étudiant",
  organizer: "Organisateur",
  admin: "Administrateur",
};

export const platformGrowth = [
  { month: "Mars", gmv: 380000, commission: 15200, etudiants: 640, organisateurs: 12 },
  { month: "Avril", gmv: 520000, commission: 20800, etudiants: 980, organisateurs: 18 },
  { month: "Mai", gmv: 610000, commission: 24400, etudiants: 1420, organisateurs: 24 },
  { month: "Juin", gmv: 780000, commission: 31200, etudiants: 1980, organisateurs: 29 },
  { month: "Juil.", gmv: 1120000, commission: 44800, etudiants: 2560, organisateurs: 35 },
  { month: "Août", gmv: 1410000, commission: 56400, etudiants: 3184, organisateurs: 42 },
];

export const universitySplit = [
  { name: "UCAD", value: 34, revenue: 1640000 },
  { name: "UASZ", value: 27, revenue: 1300000 },
  { name: "UGB", value: 19, revenue: 916000 },
  { name: "UIDT", value: 12, revenue: 578000 },
  { name: "UADB", value: 8, revenue: 386000 },
];

export type PlatformPayment = {
  id: string;
  organizer: string;
  student: string;
  amount: number;
  commission: number;
  method: "Wave" | "Orange Money" | "Free Money" | "Carte";
  status: "settled" | "pending" | "refunded" | "failed";
  date: string;
};

export const platformPayments: PlatformPayment[] = [
  { id: "PX-90211", organizer: "Amicale UASZ", student: "Fatou Ndiaye", amount: 8500, commission: 340, method: "Wave", status: "settled", date: "20 août 09:12" },
  { id: "PX-90210", organizer: "Transport UCAD", student: "Moussa Sarr", amount: 6000, commission: 240, method: "Orange Money", status: "settled", date: "20 août 08:41" },
  { id: "PX-90209", organizer: "Amicale UASZ", student: "Aïssatou Baldé", amount: 17000, commission: 680, method: "Wave", status: "pending", date: "19 août 21:03" },
  { id: "PX-90208", organizer: "Amicale UGB Saint-Louis", student: "Cheikh Diouf", amount: 9500, commission: 380, method: "Free Money", status: "failed", date: "19 août 18:22" },
  { id: "PX-90207", organizer: "Transport UCAD", student: "Mariama Cissé", amount: 8500, commission: 340, method: "Carte", status: "settled", date: "19 août 15:47" },
  { id: "PX-90206", organizer: "Amicale UADB Bambey", student: "Ibrahima Fall", amount: 5500, commission: 220, method: "Wave", status: "refunded", date: "18 août 12:05" },
];

export const paymentStatusLabels: Record<PlatformPayment["status"], string> = {
  settled: "Versé",
  pending: "En attente",
  refunded: "Remboursé",
  failed: "Échoué",
};

export type Payout = {
  id: string;
  organizer: string;
  amount: number;
  method: "Wave" | "Orange Money";
  status: "requested" | "processing" | "paid";
  requested: string;
};

export const payouts: Payout[] = [
  { id: "PO-4412", organizer: "Transport UCAD", amount: 412000, method: "Wave", status: "requested", requested: "20 août 07:10" },
  { id: "PO-4411", organizer: "Amicale UASZ", amount: 268000, method: "Orange Money", status: "processing", requested: "19 août 16:30" },
  { id: "PO-4410", organizer: "Amicale UGB Saint-Louis", amount: 96000, method: "Wave", status: "paid", requested: "17 août 11:02" },
];

export const payoutStatusLabels: Record<Payout["status"], string> = {
  requested: "Demandé",
  processing: "En cours",
  paid: "Payé",
};

export type ModerationItem = {
  id: string;
  author: string;
  initials: string;
  organizer: string;
  score: number;
  text: string;
  reason: string;
  date: string;
};

export const moderationQueue: ModerationItem[] = [
  { id: "m1", author: "Ibrahima Fall", initials: "IF", organizer: "Amicale UADB Bambey", score: 1, text: "Bus en retard de 4 heures et aucune information donnée aux étudiants.", reason: "Signalé par l'organisateur", date: "19 août 2026" },
  { id: "m2", author: "Anonyme", initials: "AN", organizer: "Transport UCAD", score: 2, text: "Contenu contenant des propos inappropriés envers le chauffeur.", reason: "Langage inapproprié", date: "18 août 2026" },
  { id: "m3", author: "Cheikh Diouf", initials: "CD", organizer: "Amicale UGB Saint-Louis", score: 5, text: "Avis potentiellement dupliqué depuis un autre compte.", reason: "Suspicion de faux avis", date: "17 août 2026" },
];

export type Dispute = {
  id: string;
  student: string;
  organizer: string;
  amount: number;
  subject: string;
  status: "open" | "review" | "resolved";
  opened: string;
};

export const disputes: Dispute[] = [
  { id: "D-2201", student: "Ibrahima Fall", organizer: "Amicale UADB Bambey", amount: 5500, subject: "Caravane annulée sans remboursement", status: "open", opened: "18 août 2026" },
  { id: "D-2200", student: "Ndeye Gueye", organizer: "Transport UCAD", amount: 8500, subject: "Double débit Orange Money", status: "review", opened: "16 août 2026" },
  { id: "D-2199", student: "Mariama Cissé", organizer: "Amicale UASZ", amount: 8500, subject: "Billet non scanné à l'embarquement", status: "resolved", opened: "12 août 2026" },
];

export const disputeStatusLabels: Record<Dispute["status"], string> = {
  open: "Ouvert",
  review: "En analyse",
  resolved: "Résolu",
};

export const adminActivity = [
  { id: "aa1", title: "Nouvelle demande d'organisateur", detail: "Collectif UIDT Thiès — documents à vérifier", time: "il y a 18 min", tone: "warning" as const },
  { id: "aa2", title: "Retrait demandé", detail: "Transport UCAD — 412 000 FCFA via Wave", time: "il y a 1 h", tone: "info" as const },
  { id: "aa3", title: "Avis signalé", detail: "Amicale UADB Bambey — note 1/5", time: "il y a 3 h", tone: "danger" as const },
  { id: "aa4", title: "Organisateur approuvé", detail: "Transport UCAD est passé en plan Pro", time: "hier", tone: "success" as const },
  { id: "aa5", title: "Litige résolu", detail: "D-2199 — billet non scanné", time: "il y a 2 j", tone: "success" as const },
];

export const systemHealth = [
  { label: "API réservations", status: "ok" as const, detail: "99,98 % de disponibilité" },
  { label: "Paiements PayTech", status: "ok" as const, detail: "Latence moyenne 420 ms" },
  { label: "Scanner QR", status: "warn" as const, detail: "2 échecs de scan signalés" },
  { label: "Notifications WhatsApp", status: "ok" as const, detail: "1 842 messages envoyés" },
];
