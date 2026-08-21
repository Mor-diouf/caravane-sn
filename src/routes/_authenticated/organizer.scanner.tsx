import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, QrCode, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Html5QrcodeScanner } from "html5-qrcode";
import { KpiCard, PageHeader, Panel, ProgressBar } from "@/components/organizer/ui";
import { orgOverviewQuery } from "@/lib/dash-queries";
import { organizerScanTicket } from "@/lib/organizer.functions";
import { activeCaravan as mockActiveCaravan } from "@/lib/organizer";
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
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [log, setLog] = useState<Result[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);

  const { data: dbOverview } = useQuery(orgOverviewQuery());
  const scanFn = useServerFn(organizerScanTicket);

  const activeCaravanInfo = dbOverview
    ? dbOverview.caravans?.[0]
      ? {
          route: dbOverview.caravans[0].route,
          date: new Date(dbOverview.caravans[0].departureAt).toLocaleDateString("fr-FR"),
          booked: dbOverview.caravans[0].booked,
          capacity: dbOverview.caravans[0].capacity,
        }
      : {
          route: "Aucune caravane active",
          date: "—",
          booked: 0,
          capacity: 0,
        }
    : mockActiveCaravan;

  const validate = async (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value || isScanningRef.current) return;

    setIsScanning(true);
    isScanningRef.current = true;
    try {
      const res = await scanFn({ data: { code: value } });
      const ok = res.result === "valid";
      const studentName = "student" in res ? res.student : "Billet";
      const routeInfo = "route" in res ? res.route : "Trajet";
      const seatsCount = "seats" in res ? res.seats : 1;

      const resultItem: Result = {
        code: value,
        ok,
        name: studentName,
        detail: ok
          ? `${routeInfo} · ${seatsCount} place(s) · ${res.message}`
          : res.message || "Billet invalide",
      };

      if (ok) {
        toast.success(`Embarquement validé : ${studentName}`);
        queryClient.invalidateQueries({ queryKey: ["organizer"] });
      } else {
        toast.error(`Accès refusé : ${res.message}`);
      }

      setLog((l) => [resultItem, ...l].slice(0, 12));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur de validation";
      setLog((l) => [
        {
          code: value,
          ok: false,
          name: "Erreur",
          detail: message,
        },
        ...l,
      ].slice(0, 12));
      toast.error(message);
    } finally {
      // Délai pour éviter de scanner le même code en boucle
      setTimeout(() => {
        setIsScanning(false);
        isScanningRef.current = false;
      }, 2000);
      setCode("");
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    scanner.render(
      (decodedText) => validate(decodedText),
      () => {
        // silence
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, []);

  const boarded = log.filter((l) => l.ok).length;

  return (
    <>
      <PageHeader
        title="Scanner les billets"
        subtitle={`Caravane en cours : ${activeCaravanInfo.route} · ${activeCaravanInfo.date}`}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Billets validés" value={String(boarded)} icon={CheckCircle2} accent="mint" />
        <KpiCard title="Refusés" value={String(log.length - boarded)} icon={XCircle} accent="warning" />
        <KpiCard title="Places vendues" value={`${activeCaravanInfo.booked}`} secondary={`sur ${activeCaravanInfo.capacity}`} icon={QrCode} accent="info" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Contrôle d'accès" description="Placez le QR code de l'étudiant dans le cadre">
          <div className="w-full overflow-hidden rounded-2xl border border-border bg-card">
            <div id="qr-reader" className="w-full border-0!" />
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
              placeholder="Saisie manuelle (ex: CE-5D02E)"
              className="h-11 flex-1 rounded-xl border border-border bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
            />
            <button
              type="submit"
              disabled={isScanning}
              className="rounded-xl bg-gradient-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
            >
              {isScanning ? "..." : "Valider"}
            </button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Progression de l'embarquement
          </p>
          <div className="mt-2">
            <ProgressBar value={Math.min(100, Math.round((boarded / (activeCaravanInfo.booked || 1)) * 100))} tone="mint" />
          </div>
        </Panel>

        <Panel title="Historique des scans" description="Les 12 derniers contrôles">
          {log.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Aucun scan pour l'instant. Présentez un QR code ou saisissez une référence manuellement.
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
