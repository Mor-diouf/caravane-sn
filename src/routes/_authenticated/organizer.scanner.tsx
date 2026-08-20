import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, QrCode, ScanLine, XCircle } from "lucide-react";
import { KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { activeCaravan, bookings } from "@/lib/organizer";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/organizer/scanner")({
  head: () => ({
    meta: [
      { title: "Scanner les billets — CaravaneHub Organisateur" },
      {
        name: "description",
        content:
          "Validez l'embarquement des étudiants en scannant leur QR code : contrôle instantané, hors ligne compatible.",
      },
      { property: "og:title", content: "Scanner les billets — CaravaneHub" },
      {
        property: "og:description",
        content: "Contrôle d'accès rapide au départ de chaque caravane.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScannerPage,
});

type Result = { code: string; ok: boolean; name: string; detail: string };

function ScannerPage() {
  const [code, setCode] = useState("");
  const [log, setLog] = useState<Result[]>([]);

  const validate = (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) return;
    const match = bookings.find((b) => b.ticket.toUpperCase() === value);
    const result: Result =
      match && (match.status === "paid" || match.status === "boarded")
        ? {
            code: value,
            ok: true,
            name: match.student,
            detail: `${match.destination} · ${match.seats} place(s) · embarquement validé`,
          }
        : {
            code: value,
            ok: false,
            name: match?.student ?? "Billet inconnu",
            detail: match ? `Billet ${match.status} — accès refusé` : "Aucun billet correspondant",
          };
    setLog((l) => [result, ...l].slice(0, 12));
    setCode("");
  };

  const boarded = log.filter((l) => l.ok).length;

  return (
    <>
      <PageHeader
        title="Scanner les billets"
        subtitle={`Caravane en cours : ${activeCaravan.route} · ${activeCaravan.date}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Billets validés" value={String(boarded)} icon={CheckCircle2} accent="mint" />
        <KpiCard title="Refusés" value={String(log.length - boarded)} icon={XCircle} accent="warning" />
        <KpiCard title="Places vendues" value={`${activeCaravan.booked}`} secondary={`sur ${activeCaravan.capacity}`} icon={QrCode} accent="info" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Contrôle d'accès" description="Placez le QR code de l'étudiant dans le cadre">
          <div className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl border border-border bg-muted/40">
            <div className="absolute inset-8 rounded-2xl border-2 border-dashed border-primary-accent/50" />
            <ScanLine className="size-16 text-primary-accent/70" />
            <span className="absolute bottom-5 text-xs font-semibold text-muted-foreground">
              Caméra prête — ou saisissez le code manuellement
            </span>
          </div>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              validate(code);
            }}
          >
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Ex : CE-5D02E"
              className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="submit"
              className="rounded-xl bg-gradient-primary px-5 text-sm font-bold text-primary-foreground"
            >
              Valider
            </button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Progression de l'embarquement
          </p>
          <div className="mt-2">
            <ProgressBar value={Math.min(100, Math.round((boarded / activeCaravan.booked) * 100))} tone="mint" />
          </div>
        </Panel>

        <Panel title="Historique des scans" description="Les 12 derniers contrôles">
          {log.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun scan pour l'instant. Essayez avec un billet de la liste des réservations.
            </p>
          ) : (
            <ul className="space-y-2">
              {log.map((l, i) => (
                <li
                  key={`${l.code}-${i}`}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3",
                    l.ok ? "border-success/25 bg-success/8" : "border-danger/25 bg-danger/8",
                  )}
                >
                  {l.ok ? (
                    <CheckCircle2 className="size-5 shrink-0 text-success" />
                  ) : (
                    <XCircle className="size-5 shrink-0 text-danger" />
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{l.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {l.code} — {l.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
