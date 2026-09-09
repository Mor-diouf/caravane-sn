import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Download,
  Search,
  Ticket,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  AlertCircle,
  X,
  Phone,
  User,
  MapPin,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  EmptyState,
  KpiCard,
  PageHeader,
  Panel,
  StatusPill,
} from "@/components/organizer/ui";
import { orgBookingsQuery } from "@/lib/dash-queries";
import { organizerConfirmBookingManual, organizerCancelBookingManual } from "@/lib/organizer.functions";
import { fcfa, statusLabels, type Status } from "@/lib/organizer";
import { PaymentMark } from "@/components/PaymentMark";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/organizer/bookings")({
  head: () => ({
    meta: [
      { title: "Réservations — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Suivez chaque réservation étudiante : paiement, billet, statut d'embarquement et validation manuelle.",
      },
      { property: "og:title", content: "Réservations — CaravaneHub" },
      {
        property: "og:description",
        content: "Toutes vos réservations, filtrables par statut et exportables.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BookingsPage,
});

const tabs: { id: "all" | Status; label: string }[] = [
  { id: "all", label: "Toutes" },
  { id: "pending", label: "En attente" },
  { id: "paid", label: "Payées" },
  { id: "boarded", label: "Embarquées" },
  { id: "cancelled", label: "Annulées" },
  { id: "refunded", label: "Remboursées" },
];

function BookingsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const { data: dbBookings, isLoading } = useQuery(orgBookingsQuery());

  const confirmBookingFn = useServerFn(organizerConfirmBookingManual);
  const cancelBookingFn = useServerFn(organizerCancelBookingManual);

  const [validatingBooking, setValidatingBooking] = useState<any>(null);
  const [confirmMethod, setConfirmMethod] = useState<"wave" | "orange" | "free">("wave");
  const [confirmNote, setConfirmNote] = useState("");
  const [cancellingBooking, setCancellingBooking] = useState<any>(null);

  const confirmMutation = useMutation({
    mutationFn: (data: { bookingId: string; method: "wave" | "orange" | "free"; note?: string }) =>
      confirmBookingFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Réservation validée avec succès ! Le billet électronique a été généré.", {
        description: "Le passager peut désormais voir son QR code dans son espace Mes billets.",
      });
      setValidatingBooking(null);
      setConfirmNote("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: (data: { bookingId: string; reason?: string }) =>
      cancelBookingFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer"] });
      toast.success("Réservation annulée. Les places ont été libérées.");
      setCancellingBooking(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const bookingList = useMemo(() => {
    if (!dbBookings) {
      return [];
    }
    return dbBookings.map((b) => {
      let derivedStatus: Status = "pending";
      if (b.ticketStatus === "used") derivedStatus = "boarded";
      else if (b.status === "confirmed") derivedStatus = "paid";
      else if (b.status === "cancelled") derivedStatus = "cancelled";
      else if (b.status === "refunded") derivedStatus = "refunded";

      return {
        id: b.reference || b.id.substring(0, 8),
        bookingId: b.id,
        rawStatus: b.status,
        student: b.student,
        pickupStop: (b as any).pickupStop || null,
        phone: b.phone || "—",
        email: b.email,
        initials: (b.student || "E").substring(0, 2).toUpperCase(),
        destination: b.route,
        seats: b.seats,
        amount: b.amount,
        method: (b.method ? b.method.toUpperCase() : "WAVE") as "WAVE" | "ORANGE" | "FREE",
        status: derivedStatus,
        ticket: (b.qrCode || b.reference || "").substring(0, 8).toUpperCase(),
        date: new Date(b.createdAt).toLocaleDateString("fr-FR"),
      };
    });
  }, [dbBookings]);

  const rows = useMemo(
    () =>
      bookingList.filter(
        (b) =>
          (tab === "all" || b.status === tab) &&
          (b.student.toLowerCase().includes(query.toLowerCase()) ||
            b.id.toLowerCase().includes(query.toLowerCase()) ||
            b.phone.toLowerCase().includes(query.toLowerCase()) ||
            b.ticket.toLowerCase().includes(query.toLowerCase())),
      ),
    [bookingList, tab, query],
  );

  const pendingCount = bookingList.filter((b) => b.status === "pending").length;
  const total = rows.reduce((acc, b) => acc + b.amount, 0);

  return (
    <>
      <PageHeader
        title="Réservations"
        subtitle="Chaque billet vendu, son paiement et son statut d'embarquement."
        actions={
          <button
            type="button"
            onClick={() => toast.success("Export CSV généré", { description: `${rows.length} réservations exportées.` })}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            <Download className="size-4" /> Exporter en CSV
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Réservations affichées" value={String(rows.length)} icon={Ticket} />
        <KpiCard
          title="En attente de validation"
          value={String(pendingCount)}
          {...(pendingCount > 0 ? { accent: "warning" as const } : {})}
          icon={Clock}
        />
        <KpiCard title="Montant cumulé" value={fcfa(total)} accent="mint" icon={Ticket} />
      </div>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/60 p-0.5">
            {tabs.map((t) => {
              const count = t.id === "all" ? bookingList.length : bookingList.filter((b) => b.status === t.id).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors flex items-center gap-1.5",
                    tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                  )}
                >
                  <span>{t.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                        t.id === "pending"
                          ? "bg-amber-500/20 text-amber-500"
                          : tab === t.id
                            ? "bg-muted text-foreground"
                            : "bg-muted/60 text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <label className="relative ml-auto flex min-w-[220px] items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Rechercher une réservation</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, téléphone, référence…"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Chargement des réservations…
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Ticket} message="Aucune réservation ne correspond à cette recherche." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-3 font-semibold">Étudiant</th>
                  <th className="px-5 py-3 font-semibold">Destination</th>
                  <th className="px-5 py-3 font-semibold">Places</th>
                  <th className="px-5 py-3 font-semibold">Montant</th>
                  <th className="px-5 py-3 font-semibold">Méthode</th>
                  <th className="px-5 py-3 font-semibold">Statut</th>
                  <th className="px-5 py-3 font-semibold">Billet</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((b) => (
                  <tr
                    key={b.bookingId}
                    className={cn(
                      "transition-colors hover:bg-muted/40",
                      b.status === "pending" ? "bg-amber-500/[0.03]" : undefined,
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-3">
                        <Avatar initials={b.initials} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold">{b.student}</span>
                          <span className="block text-[11px] text-muted-foreground font-mono">
                            {b.phone !== "—" ? b.phone : b.id}
                          </span>
                          {b.pickupStop && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full mt-0.5 w-fit">
                              <MapPin className="size-2.5" />
                              Montée : {b.pickupStop}
                            </span>
                          )}
                        </span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-medium">{b.destination}</td>
                    <td className="px-5 py-3.5 font-semibold">{b.seats}</td>
                    <td className="px-5 py-3.5 font-semibold">{fcfa(b.amount)}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <div className="flex items-center">
                        <PaymentMark
                          method={b.method.toLowerCase() as any}
                          className="h-8 w-auto min-w-[3rem] shadow-none border-none bg-transparent"
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-5 py-3.5">
                      {b.ticket ? (
                        <span className="font-mono text-xs font-bold text-primary">{b.ticket}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">En attente</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.date}</td>
                    <td className="px-5 py-3.5 text-right">
                      {b.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setValidatingBooking(b);
                              setConfirmMethod("wave");
                              setConfirmNote("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 px-3 py-1.5 text-xs font-black text-black shadow-sm hover:brightness-110 active:scale-[0.98] transition-all"
                          >
                            <CheckCircle2 className="size-3.5" /> Valider
                          </button>
                          <button
                            type="button"
                            onClick={() => setCancellingBooking(b)}
                            className="rounded-lg p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Annuler cette réservation non payée"
                          >
                            <XCircle className="size-4" />
                          </button>
                        </div>
                      ) : b.status === "paid" ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="size-3.5" /> Billet actif
                        </span>
                      ) : b.status === "boarded" ? (
                        <span className="inline-flex items-center gap-1 rounded-md border border-info/20 bg-info/10 px-2.5 py-1 text-xs font-bold text-info">
                          Embarqué
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          {rows.length} réservation(s) · filtre :{" "}
          {tab === "all" ? "toutes" : statusLabels[tab].toLowerCase()}
        </p>
      </Panel>

      {/* Modal: Validation Manuelle de la Réservation */}
      {validatingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-amber-400 to-orange-500 text-black shadow-sm">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Valider la réservation</h2>
                  <p className="text-xs text-muted-foreground">
                    Génération immédiate du billet électronique
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidatingBooking(null)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Recap info */}
            <div className="mb-4 rounded-xl border border-border bg-muted/40 p-3.5 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <User className="size-3" /> Passager :
                </span>
                <span className="font-bold text-foreground">{validatingBooking.student}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Phone className="size-3" /> Téléphone :
                </span>
                <span className="font-mono font-semibold text-foreground">{validatingBooking.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="size-3" /> Trajet :
                </span>
                <span className="font-semibold text-foreground">{validatingBooking.destination}</span>
              </div>
              {validatingBooking.pickupStop && (
                <div className="flex justify-between items-center">
                  <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <MapPin className="size-3" /> Lieu de montée :
                  </span>
                  <span className="font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                    {validatingBooking.pickupStop}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-border pt-1.5">
                <span className="text-muted-foreground">Places & Total :</span>
                <span className="font-extrabold text-primary text-sm">
                  {validatingBooking.seats} place(s) · {fcfa(validatingBooking.amount)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-foreground">
                  Mode d'encaissement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "wave", label: "Wave", badge: "Mobile" },
                    { id: "orange", label: "Orange", badge: "OM" },
                    { id: "free", label: "Espèces", badge: "Guichet" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setConfirmMethod(m.id as any)}
                      className={cn(
                        "flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all",
                        confirmMethod === m.id
                          ? "border-primary bg-primary/10 text-foreground shadow-xs ring-1 ring-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted/50",
                      )}
                    >
                      <span>{m.label}</span>
                      <span className="text-[10px] font-normal opacity-70">{m.badge}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  Note interne (optionnelle)
                </label>
                <input
                  type="text"
                  value={confirmNote}
                  onChange={(e) => setConfirmNote(e.target.value)}
                  placeholder="Ex: Reçu SMS Wave sur tél. agence"
                  className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                />
              </div>

              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <Sparkles className="size-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Génération de billet :</span> Cette action confirme le paiement et génère automatiquement le billet avec son QR Code officiel, visible instantanément dans l'espace voyageur.
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setValidatingBooking(null)}
                className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={confirmMutation.isPending}
                onClick={() => {
                  const payload: {
                    bookingId: string;
                    method: "wave" | "orange" | "free";
                    note?: string;
                  } = {
                    bookingId: validatingBooking.bookingId,
                    method: confirmMethod,
                  };
                  if (confirmNote.trim()) {
                    payload.note = confirmNote.trim();
                  }
                  confirmMutation.mutate(payload);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 via-primary to-orange-500 px-4 py-2 text-xs font-black text-black shadow-md hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              >
                {confirmMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Validation…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5" /> Valider & Générer le billet
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Annulation de Réservation */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3 text-destructive">
              <div className="grid size-10 place-items-center rounded-xl bg-destructive/10">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Annuler la réservation ?</h3>
                <p className="text-xs text-muted-foreground">Réservation non payée</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Voulez-vous annuler la réservation de{" "}
              <span className="font-bold text-foreground">{cancellingBooking.student}</span> pour le trajet{" "}
              <span className="font-bold text-foreground">{cancellingBooking.destination}</span> ? Les{" "}
              <span className="font-bold text-foreground">{cancellingBooking.seats} place(s)</span> seront remises
              immédiatement à disposition des autres voyageurs.
            </p>
            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="rounded-xl border border-border px-3.5 py-1.5 text-xs font-semibold hover:bg-muted"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={cancelMutation.isPending}
                onClick={() =>
                  cancelMutation.mutate({
                    bookingId: cancellingBooking.bookingId,
                    reason: "Annulée par l'organisateur (défaut de paiement)",
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-destructive px-3.5 py-1.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
              >
                {cancelMutation.isPending ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Annulation…
                  </>
                ) : (
                  "Confirmer l'annulation"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
