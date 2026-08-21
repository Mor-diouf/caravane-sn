import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  QrCode,
  XCircle,
  Camera,
  CameraOff,
  Upload,
  Keyboard,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";
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
type CameraDevice = { id: string; label: string };
type ScanMode = "camera" | "file" | "manual";

function ScannerPage() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [log, setLog] = useState<Result[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);

  // Camera & Mode State
  const [activeTab, setActiveTab] = useState<ScanMode>("camera");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFromFile, setIsFromFile] = useState(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const validate = useCallback(
    async (raw: string) => {
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
        setTimeout(() => {
          setIsScanning(false);
          isScanningRef.current = false;
        }, 2000);
        setCode("");
      }
    },
    [scanFn, queryClient]
  );

  // Stop active camera session safely
  const stopCameraStream = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn("Erreur lors de l'arrêt de la caméra:", e);
      } finally {
        setIsCameraActive(false);
      }
    }
  }, []);

  // Start camera stream using selected camera or environment camera
  const startCameraStream = useCallback(
    async (cameraId?: string) => {
      setCameraError(null);
      setIsCameraLoading(true);

      // Stop any existing stream first
      await stopCameraStream();

      // Check protocol security on mobile browsers
      const isSecure =
        window.location.protocol === "https:" ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (!isSecure && !navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "L'accès à la caméra nécessite une connexion sécurisée (HTTPS) sur smartphone ou ordinateur."
        );
        setIsCameraLoading(false);
        return;
      }

      try {
        // Fetch camera devices list if not done yet
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const formatted = devices.map((d, index) => ({
              id: d.id,
              label: d.label || `Caméra ${index + 1}`,
            }));
            setCameras(formatted);
          }
        } catch {
          // Camera permission might be requested during start()
        }

        const qrCodeInstance = new Html5Qrcode("qr-reader-target");
        html5QrCodeRef.current = qrCodeInstance;

        // Choose camera constraint: explicit deviceId or rear camera environment mode
        const targetCamera = cameraId || selectedCameraId || { facingMode: "environment" };

        await qrCodeInstance.start(
          targetCamera,
          {
            fps: 12,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const minDim = Math.min(viewfinderWidth, viewfinderHeight);
              return { width: Math.floor(minDim * 0.7), height: Math.floor(minDim * 0.7) };
            },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            validate(decodedText);
          },
          () => {
            // Frame search failure - normal when no QR code in view
          }
        );

        setIsCameraActive(true);
      } catch (err: unknown) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error("Camera start error:", errMessage);

        if (
          errMessage.includes("NotAllowedError") ||
          errMessage.includes("Permission denied") ||
          errMessage.includes("permission")
        ) {
          setCameraError(
            "Autorisation refusée : Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour scanner directement."
          );
        } else if (errMessage.includes("NotFoundError") || errMessage.includes("no camera")) {
          setCameraError("Aucune caméra disponible sur cet appareil.");
        } else {
          setCameraError(
            "Impossible d'activer la caméra. Assurez-vous qu'aucune autre application n'utilise l'objectif."
          );
        }
        setIsCameraActive(false);
      } finally {
        setIsCameraLoading(false);
      }
    },
    [selectedCameraId, stopCameraStream, validate]
  );

  // Manage camera lifecycle based on activeTab
  useEffect(() => {
    if (activeTab === "camera") {
      startCameraStream();
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [activeTab, startCameraStream, stopCameraStream]);

  // Handle switching camera device from select dropdown
  const handleCameraChange = async (newDeviceId: string) => {
    setSelectedCameraId(newDeviceId);
    await startCameraStream(newDeviceId);
  };

  // Handle file import scan
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsFromFile(true);

    try {
      // Ensure existing camera instance doesn't conflict
      await stopCameraStream();

      // Create temporary scanner instance for file decode
      const tempScanner = new Html5Qrcode("qr-reader-file-temp");
      const decodedText = await tempScanner.scanFile(file, true);
      await tempScanner.clear();

      if (decodedText) {
        toast.success("QR code détecté dans l'image !");
        validate(decodedText);
      }
    } catch (err: unknown) {
      console.warn("File scan error:", err);
      toast.error("Impossible de lire un QR code valide dans cette image.");
    } finally {
      setIsFromFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
        <Panel
          title="Contrôle d'accès"
          description="Scanner le QR code du billet étudiant par caméra ou fichier"
        >
          {/* Mode Selector Tabs */}
          <div className="mb-4 flex flex-wrap gap-2 rounded-xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                activeTab === "camera"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Camera className="size-4" />
              <span>Caméra en direct</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("file")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                activeTab === "file"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Upload className="size-4" />
              <span>Importer image</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manual")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                activeTab === "manual"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Keyboard className="size-4" />
              <span>Code manuel</span>
            </button>
          </div>

          {/* TAB 1: LIVE CAMERA VIEW */}
          {activeTab === "camera" && (
            <div className="space-y-3">
              {/* Camera Header Status & Controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "size-2.5 rounded-full",
                      isCameraActive
                        ? "bg-emerald-500 animate-pulse"
                        : cameraError
                          ? "bg-red-500"
                          : "bg-amber-500"
                    )}
                  />
                  <span className="font-medium">
                    {isCameraActive
                      ? "Caméra active — Viseur prêt"
                      : isCameraLoading
                        ? "Initialisation de l'objectif..."
                        : cameraError
                          ? "Erreur caméra"
                          : "Caméra désactivée"}
                  </span>
                </div>

                {cameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => handleCameraChange(e.target.value)}
                    className="h-8 max-w-[170px] rounded-lg border border-border bg-card px-2 text-xs text-foreground outline-none"
                  >
                    <option value="">Caméra automatique</option>
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Camera Target Container */}
              <div className="relative w-full overflow-hidden rounded-2xl border border-border bg-black aspect-square max-h-[340px] flex items-center justify-center">
                {/* Real HTML5Qrcode Video Element Mount Target */}
                <div id="qr-reader-target" className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

                {/* Viewfinder Reticle Overlay (when scanning) */}
                {isCameraActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative size-56 rounded-2xl border-2 border-dashed border-emerald-400/80 shadow-[0_0_30px_rgba(52,211,153,0.3)]">
                      {/* Animated Laser Scan Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 size-4 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                      <div className="absolute -top-1 -right-1 size-4 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                      <div className="absolute -bottom-1 -left-1 size-4 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                      <div className="absolute -bottom-1 -right-1 size-4 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                    </div>
                  </div>
                )}

                {/* Camera Cooldown / Success Flash Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/75 backdrop-blur-xs text-white">
                    <Sparkles className="size-10 text-emerald-400 animate-spin" />
                    <p className="mt-2 text-sm font-semibold">Billet scanné — Traitement...</p>
                  </div>
                )}

                {/* Camera Error Message */}
                {cameraError && !isCameraLoading && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/95 p-6 text-center">
                    <ShieldAlert className="size-10 text-danger" />
                    <p className="mt-3 text-sm font-semibold text-foreground">{cameraError}</p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                      Vous pouvez aussi sélectionner une image de QR code ou utiliser la saisie manuelle.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startCameraStream()}
                        className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
                      >
                        <RefreshCw className="size-3.5" />
                        Réessayer
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab("file")}
                        className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        <Upload className="size-3.5" />
                        Importer image
                      </button>
                    </div>
                  </div>
                )}

                {/* Camera Inactive Placeholder */}
                {!isCameraActive && !isCameraLoading && !cameraError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card p-6 text-center">
                    <CameraOff className="size-10 text-muted-foreground opacity-60" />
                    <p className="mt-3 text-sm font-semibold">Caméra en pause</p>
                    <button
                      type="button"
                      onClick={() => startCameraStream()}
                      className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:opacity-90"
                    >
                      <Camera className="size-4" />
                      Activer la caméra
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Action Bar under Camera */}
              {isCameraActive && (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    <CameraOff className="size-3.5" />
                    Mettre en pause
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FILE SCANNER */}
          {activeTab === "file" && (
            <div className="space-y-3">
              <div id="qr-reader-file-temp" className="hidden" />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-all hover:border-primary hover:bg-muted/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  {isFromFile ? (
                    <RefreshCw className="size-7 animate-spin" />
                  ) : (
                    <Upload className="size-7" />
                  )}
                </div>
                <h4 className="mt-4 text-sm font-semibold">Cliquez pour importer un QR Code</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Format image accepté (PNG, JPG, JPEG, WEBP)
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2 text-xs font-bold text-primary-foreground">
                  Sélectionner un fichier
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: MANUAL INPUT FORM */}
          {(activeTab === "manual" || activeTab === "camera") && (
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
          )}

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
              Aucun scan pour l'instant. Présentez un QR code devant la caméra, importez un fichier ou saisissez une référence manuellement.
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

