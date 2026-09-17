import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, MessageCircle, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, EmptyState, KpiCard, PageHeader, Panel } from "@/components/organizer/ui";
import { orgBookingsQuery, orgCaravansQuery } from "@/lib/dash-queries";
import { fcfa } from "@/lib/organizer";
import { exportPassengerManifestPdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/_authenticated/organizer/passengers")({
  head: () => ({
    meta: [
      { title: "Passagers & Manifestes — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Annuaire des étudiants et manifestes d'embarquement par caravane avec export PDF officiel.",
      },
    ],
  }),
  component: PassengersPage,
});

function PassengersPage() {
  const [query, setQuery] = useState("");
  const [selectedCaravanId, setSelectedCaravanId] = useState<string>("all");
  const { data: dbBookings } = useQuery(orgBookingsQuery());
  const { data: dbCaravans } = useQuery(orgCaravansQuery());

  const caravans = dbCaravans ?? [];
  const selectedCaravan = caravans.find((c) => c.id === selectedCaravanId);

  // Filtrage selon la caravane sélectionnée
  const filteredBookings = useMemo(() => {
    if (!dbBookings) return [];
    const paidBookings = dbBookings.filter((b) => b.status === "confirmed");
    if (selectedCaravanId === "all") return paidBookings;
    return paidBookings.filter((b) => b.caravanId === selectedCaravanId);
  }, [dbBookings, selectedCaravanId]);

  const passengerList = useMemo(() => {
    if (!filteredBookings) return [];

    if (selectedCaravanId !== "all") {
      // Affichage passager par passager / billet pour cette caravane
      return filteredBookings.map((b) => ({
        id: b.id,
        name: b.student || "Étudiant",
        initials: (b.student || "E").substring(0, 2).toUpperCase(),
        university: b.university || "Non renseigné",
        phone: b.phone || "—",
        reference: b.reference,
        trips: b.seats,
        seats: b.seats,
        spent: b.amount,
        amount: b.amount,
        paymentStatus: b.paymentStatus,
        status: b.status,
        pickupStop: b.pickupStop,
        lastTrip: b.departureAt ? new Date(b.departureAt).toLocaleDateString("fr-FR") : new Date(b.createdAt).toLocaleDateString("fr-FR"),
      }));
    }

    // Vue agrégée par étudiant quand "Toutes les caravanes" est sélectionné
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        initials: string;
        university: string;
        phone: string;
        trips: number;
        spent: number;
        lastTripDate: string;
      }
    >();

    for (const b of filteredBookings) {
      const key = b.email || b.phone || b.student;
      const cur = map.get(key) ?? {
        id: b.id,
        name: b.student || "Étudiant",
        initials: (b.student || "E").substring(0, 2).toUpperCase(),
        university: b.university || "Non renseigné",
        phone: b.phone || "—",
        trips: 0,
        spent: 0,
        lastTripDate: b.createdAt,
      };

      cur.trips += b.seats;
      cur.spent += b.amount;
      if (b.university && b.university !== "—" && cur.university === "Non renseigné") {
        cur.university = b.university;
      }
      if (new Date(b.createdAt) > new Date(cur.lastTripDate)) {
        cur.lastTripDate = b.createdAt;
      }
      map.set(key, cur);
    }

    return [...map.values()].map((p) => ({
      ...p,
      seats: p.trips,
      amount: p.spent,
      lastTrip: new Date(p.lastTripDate).toLocaleDateString("fr-FR"),
    }));
  }, [filteredBookings, selectedCaravanId]);

  const rows = useMemo(
    () =>
      passengerList.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.university.toLowerCase().includes(query.toLowerCase()) ||
          p.phone.includes(query),
      ),
    [passengerList, query],
  );

  const totalSpent = rows.reduce((a, p) => a + (p.spent || p.amount || 0), 0);
  const totalSeats = rows.reduce((a, p) => a + (p.seats || p.trips || 1), 0);

  const handleExportPdf = () => {
    if (selectedCaravanId === "all") {
      toast.error("Action requise", {
        description: "Veuillez sélectionner une caravane spécifique avant de télécharger la liste.",
      });
      return;
    }

    if (rows.length === 0) {
      toast.error("Aucun passager à exporter.");
      return;
    }

    exportPassengerManifestPdf({
      organizerName: "Espace Organisateur",
      caravanTitle: selectedCaravan ? `${selectedCaravan.from_label} ➔ ${selectedCaravan.to_label}` : undefined,
      departureDate: selectedCaravan?.departure_at ? new Date(selectedCaravan.departure_at).toLocaleString("fr-FR") : undefined,
      pickupLocation: selectedCaravan?.pickup,
      passengers: rows,
    });

    toast.success("Manifeste PDF téléchargé !", {
      description: `${rows.length} passagers exportés pour ${selectedCaravan ? selectedCaravan.to_label : "toutes les caravanes"}.`,
    });
  };

  return (
    <>
      <PageHeader
        title={selectedCaravan ? `Manifeste : ${selectedCaravan.from_label} ➔ ${selectedCaravan.to_label}` : "Passagers & Manifestes"}
        subtitle="Consultez et exportez la liste officielle des passagers par caravane ou pour tout votre réseau."
        actions={
          <button
            type="button"
            onClick={handleExportPdf}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:opacity-90 active:scale-95"
          >
            <Download className="size-4" /> Exporter en PDF
          </button>
        }
      />

      {/* Selecteur de caravane */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <label htmlFor="caravan-select" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Filtrer par caravane :
          </label>
          <select
            id="caravan-select"
            value={selectedCaravanId}
            onChange={(e) => setSelectedCaravanId(e.target.value)}
            className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">🌍 Toutes les caravanes (Annuaire complet)</option>
            {caravans.map((c) => (
              <option key={c.id} value={c.id}>
                🚌 {c.from_label} ➔ {c.to_label} ({new Date(c.departure_at).toLocaleDateString("fr-FR")})
              </option>
            ))}
          </select>
        </div>

        {selectedCaravan && (
          <span className="text-xs font-bold text-primary">
            📍 Ramassage : {selectedCaravan.pickup || "Non spécifié"}
          </span>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Passagers inscrits" value={String(rows.length)} icon={Users} />
        <KpiCard title="Places réservées" value={`${totalSeats}`} secondary={selectedCaravan ? "Pour ce car" : "Tous trajets"} accent="info" icon={Users} />
        <KpiCard title="Montant collecté" value={fcfa(totalSpent)} accent="mint" icon={Users} />
      </div>

      <Panel className="mt-4" bodyClassName="p-0">
        <div className="flex items-center gap-3 border-b border-border p-4">
          <label className="relative flex w-full max-w-sm items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <span className="sr-only">Rechercher un passager</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, université ou téléphone…"
              className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Users} message="Aucun passager trouvé pour cette recherche." />
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Avatar initials={p.initials} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.university} · {p.phone}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold">{p.trips}</p>
                  <p className="text-[11px] text-muted-foreground">voyages</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{fcfa(p.spent)}</p>
                  <p className="text-[11px] text-muted-foreground">dernier : {p.lastTrip}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`tel:${p.phone.replace(/\s/g, "")}`}
                    className="grid size-9 place-items-center rounded-xl border border-border text-muted-foreground hover:bg-muted"
                    aria-label={`Appeler ${p.name}`}
                  >
                    <Phone className="size-4" />
                  </a>
                  <a
                    href={`https://wa.me/${p.phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="grid size-9 place-items-center rounded-xl border border-border text-success hover:bg-muted"
                    aria-label={`Écrire à ${p.name} sur WhatsApp`}
                  >
                    <MessageCircle className="size-4" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
