import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, QrCode, ScanLine, XCircle } from "lucide-react";
import { toast } from "sonner";
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

  const { data: dbOverview } = useQuery(orgOverviewQuery());
  const scanFn = useServerFn(organizerScanTicket);

  const activeCaravanInfo = dbOverview?.caravans?.[0]
    ? {
        route: dbOverview.caravans[0].route,
        date: new Date(dbOverview.caravans[0].departureAt).toLocaleDateString("fr-FR"),
        booked: dbOverview.caravans[0].booked,
        capacity: dbOverview.caravans[0].capacity,
      }
    : mockActiveCaravan;

  const validate = async (raw: string) => {
    const value = raw.trim().toUpperCase();
    if (!value) return;

    setIsScanning(true);
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
      setIsScanning(false);
      setCode("");
    }
  };

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
              placeholder="Ex : CE-5D02E ou QR Code"
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
              Aucun scan pour l'instant. Essayez en saisissant un code de billet.
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
