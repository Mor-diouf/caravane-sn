import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PassengerExportItem {
  id?: string;
  name: string;
  phone: string;
  university: string;
  pickupStop?: string;
  trips?: number;
  seats?: number;
  spent?: number;
  amount?: number;
  lastTrip?: string;
  reference?: string;
  status?: string;
  paymentStatus?: string;
  ticketStatus?: string;
}

export interface ExportPdfOptions {
  organizerName?: string | undefined;
  caravanTitle?: string | undefined;
  departureDate?: string | undefined;
  pickupLocation?: string | undefined;
  dropoffLocation?: string | undefined;
  passengers: PassengerExportItem[];
}

export function exportPassengerManifestPdf(options: ExportPdfOptions) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const today = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Header Banner (Deep Navy / Slate-900)
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, "F");

  // Orange brand accent bar (King-Bus)
  doc.setFillColor(249, 115, 22); // #f97316 orange-500
  doc.rect(0, 30, pageWidth, 2, "F");

  // App Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(15);
  doc.setFont("helvetica", "bold");
  doc.text("KING-BUS 2.0", 14, 13);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("Transport Universitaire Étudiant", 14, 19);

  // Document Title
  const isCaravanSpecific = Boolean(options.caravanTitle);
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(249, 115, 22); // orange-500
  doc.text(
    isCaravanSpecific ? "MANIFESTE DU BUS" : "LISTE DES PASSAGERS",
    pageWidth - 14,
    14,
    { align: "right" }
  );

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(226, 232, 240);
  doc.text(`Émis le : ${today}`, pageWidth - 14, 20, { align: "right" });

  // 2. Caravan & Organizer Details Box
  let currentY = 38;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, currentY, pageWidth - 28, isCaravanSpecific ? 22 : 14, 2, 2, "FD");

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(`Organisateur : ${options.organizerName || "Amicale / Transporteur Agréé"}`, 18, currentY + 6);

  if (isCaravanSpecific) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(234, 88, 12); // orange-600
    doc.text(`Caravane : ${options.caravanTitle}`, 18, currentY + 12);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    const dateText = options.departureDate ? `Départ : ${options.departureDate}` : "";
    const pickupText = options.pickupLocation ? `Ramassage : ${options.pickupLocation}` : "";
    const detailLine = [dateText, pickupText].filter(Boolean).join("  •  ");
    doc.text(detailLine, 18, currentY + 18);
    currentY += 28;
  } else {
    currentY += 20;
  }

  // 3. KPI Summary Bar
  const totalPassengers = options.passengers.length;
  const totalSeats = options.passengers.reduce(
    (acc, p) => acc + (p.seats || p.trips || 1),
    0
  );
  const totalAmount = options.passengers.reduce(
    (acc, p) => acc + (p.amount || p.spent || 0),
    0
  );

  const kpiBoxWidth = (pageWidth - 28 - 6) / 3;
  
  // KPI 1 : Passagers
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, currentY, kpiBoxWidth, 12, 1.5, 1.5, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Passagers inscrits", 18, currentY + 4.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalPassengers}`, 18, currentY + 9.5);

  // KPI 2 : Places
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14 + kpiBoxWidth + 3, currentY, kpiBoxWidth, 12, 1.5, 1.5, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Places réservées", 14 + kpiBoxWidth + 7, currentY + 4.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalSeats} place${totalSeats > 1 ? "s" : ""}`, 14 + kpiBoxWidth + 7, currentY + 9.5);

  // KPI 3 : Total Encaissé
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14 + (kpiBoxWidth + 3) * 2, currentY, kpiBoxWidth, 12, 1.5, 1.5, "F");
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Total collecté", 14 + (kpiBoxWidth + 3) * 2 + 4, currentY + 4.5);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalAmount.toLocaleString("fr-FR")} FCFA`, 14 + (kpiBoxWidth + 3) * 2 + 4, currentY + 9.5);

  currentY += 18;

  // 4. Passenger Table
  let headers: string[][];
  let tableData: string[][];

  if (isCaravanSpecific) {
    headers = [["#", "Nom du Passager", "Téléphone", "Lieu de montée", "Réf / Billet", "Places", "Montant", "Paiement"]];
    tableData = options.passengers.map((p, index) => [
      (index + 1).toString(),
      p.name,
      p.phone || "—",
      p.pickupStop || "Départ initial",
      p.reference || "—",
      `${p.seats || p.trips || 1}`,
      `${(p.amount || p.spent || 0).toLocaleString("fr-FR")} F`,
      p.paymentStatus === "paid" || p.status === "confirmed" ? "Payé (Wave)" : "En attente",
    ]);
  } else {
    headers = [["#", "Nom & Prénom", "Téléphone", "Université", "Voyages", "Total Payé", "Dernier Voyage"]];
    tableData = options.passengers.map((p, index) => [
      (index + 1).toString(),
      p.name,
      p.phone || "—",
      p.university || "—",
      `${p.trips || p.seats || 1}`,
      `${(p.spent || p.amount || 0).toLocaleString("fr-FR")} FCFA`,
      p.lastTrip || "—",
    ]);
  }

  autoTable(doc, {
    startY: currentY,
    head: headers,
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: [249, 115, 22], // orange-500
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
      cellPadding: 2.5,
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
      overflow: "linebreak",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { halign: "center" },
      1: { fontStyle: "bold" },
      4: { halign: "center" },
      5: { halign: "center" },
      6: { halign: "right", fontStyle: "bold" },
      7: { halign: "right" },
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(148, 163, 184);
      doc.text(
        "Document officiel Ride Route Sénégal — À conserver par l'organisateur pour le pointage à bord du car.",
        14,
        pageHeight - 6
      );
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth - 14,
        pageHeight - 6,
        { align: "right" }
      );
    },
  });

  // 5. File Download
  const cleanTitle = options.caravanTitle
    ? options.caravanTitle.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
    : "tous_passagers";
  const filename = `manifeste_${cleanTitle}_${Date.now()}.pdf`;
  doc.save(filename);
}
