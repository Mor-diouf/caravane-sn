import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Sparkles,
  ShieldAlert,
  Ticket,
  UserCheck,
  MapPin,
  Clock,
  Check,
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

type Result = { code: string; ok: boolean; name: string; detail: string; time: string };
type CameraDevice = { id: string; label: string };
type ScanMode = "camera" | "file" | "manual";

type LastValidScan = {
  name: string;
  route: string;
  seats: number;
  time: string;
  code: string;
} | null;

/** Web Audio API synthesized "Pop Pop!" high-tech chime sound */
function playChimeSound(isSuccess: boolean) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (isSuccess) {
      // First Pop chime (D5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Second Pop chime (D6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.1);
      osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);
      gain2.gain.setValueAtTime(0.4, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.32);
    } else {
      // Low double buzz for error
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (_) {}
}

function ScannerPage() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [log, setLog] = useState<Result[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const isScanningRef = useRef(false);
  
  const [selectedCaravanId, setSelectedCaravanId] = useState<string>("");

  // Camera & Mode State
  const [activeTab, setActiveTab] = useState<ScanMode>("camera");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isFromFile, setIsFromFile] = useState(false);

  // Instant Pop-up Featured Ticket Modal State
  const [lastValidScan, setLastValidScan] = useState<LastValidScan>(null);
  const [scanFlash, setScanFlash] = useState<"success" | "error" | null>(null);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { data: dbOverview } = useQuery(orgOverviewQuery());
  const scanFn = useServerFn(organizerScanTicket);

  const activeCaravans = useMemo(() => {
    return dbOverview?.caravans?.filter(c => c.status !== "cancelled" && c.status !== "completed") || [];
  }, [dbOverview]);

  useEffect(() => {
    if (activeCaravans.length > 0 && !selectedCaravanId) {
      setSelectedCaravanId(activeCaravans[0].id);
    }
  }, [activeCaravans, selectedCaravanId]);

  const activeCaravanInfo = useMemo(() => {
    const c = activeCaravans.find(x => x.id === selectedCaravanId) || activeCaravans[0];
    if (c) {
      return {
        id: c.id,
        route: c.route,
        date: new Date(c.departureAt).toLocaleDateString("fr-FR"),
        booked: c.booked,
        capacity: c.capacity,
      };
    }
    return mockActiveCaravan;
  }, [activeCaravans, selectedCaravanId]);

  const playVoiceFeedback = useCallback((text: string, type: "valid" | "used" | "error") => {
    const isSuccess = type === "valid";

    // 1. Instant Pop-Pop chime sound effect
    playChimeSound(isSuccess);

    // 2. Physical Haptic Vibration on smartphones
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(isSuccess ? [100, 40, 100] : [200, 100, 200]);
    }

    // 3. Audio / Speech Feedback
    if (type === "used") {
      // Play custom audio provided for already used tickets
      try {
        const audioUrl = encodeURI("/sounds/Maintenant_vous_pouvez_génére_trimmed.mp3");
        const audio = new Audio(audioUrl);
        audio.play().catch(() => {
          // Fallback to SpeechSynthesis if audio play fails
          if (typeof window !== "undefined" && window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance("Attention, ce billet a déjà été utilisé");
            utterance.lang = "fr-FR";
            utterance.pitch = 0.9;
            window.speechSynthesis.speak(utterance);
          }
        });
      } catch (_) {}
    } else {
      // Speech Synthesis for valid or invalid tickets
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "fr-FR";
        utterance.pitch = isSuccess ? 1.15 : 0.85;
        utterance.rate = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const frVoice = voices.find((v) => v.lang.startsWith("fr"));
        if (frVoice) utterance.voice = frVoice;

        // Small delay so Pop-Pop plays right before speech
        setTimeout(() => {
          window.speechSynthesis.speak(utterance);
        }, 150);
      }
    }
  }, []);

  const validate = useCallback(
    async (raw: string) => {
      const value = raw.trim().toUpperCase();
      if (!value || isScanningRef.current) return;

      setIsScanning(true);
      isScanningRef.current = true;
      const nowStr = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

      try {
        const res = await scanFn({ data: { code: value, targetCaravanId: selectedCaravanId } });
        const ok = res.result === "valid";
        const isUsed = res.result === "used";
        const studentName = "student" in res ? res.student : "Billet";
        const routeInfo = "route" in res ? res.route : "Trajet";
        const seatsCount = "seats" in res ? res.seats : 1;

        const resultItem: Result = {
          code: value,
          ok,
          name: studentName,
          detail: ok
            ? `${routeInfo} · ${seatsCount} place(s) · ${res.message}`
            : res.message || (isUsed ? "Billet déjà utilisé" : "Billet invalide"),
          time: nowStr,
        };

        if (ok) {
          setScanFlash("success");
          setLastValidScan({
            name: studentName,
            route: routeInfo,
            seats: seatsCount,
            time: nowStr,
            code: value,
          });

          // Play Pop-Pop chime + Speech Synthesis
          playVoiceFeedback(`Embarquement validé. Je vous souhaite un bon voyage, ${studentName}`, "valid");
          toast.success(`Embarquement validé : ${studentName}`);
          queryClient.invalidateQueries({ queryKey: ["organizer"] });
        } else {
          setScanFlash("error");
          if (isUsed) {
            playVoiceFeedback("Billet déjà utilisé", "used");
            toast.error("Accès refusé : Ce billet a déjà été utilisé !");
          } else {
            playVoiceFeedback("Billet invalide", "error");
            toast.error(`Accès refusé : ${res.message || "Billet invalide"}`);
          }
        }

        setLog((l) => [resultItem, ...l].slice(0, 12));
      } catch (err: unknown) {
        setScanFlash("error");
        const message = err instanceof Error ? err.message : "Erreur de validation";
        setLog((l) => [
          {
            code: value,
            ok: false,
            name: "Erreur",
            detail: message,
            time: nowStr,
          },
          ...l,
        ].slice(0, 12));
        playVoiceFeedback("Erreur de validation", "error");
        toast.error(message);
      } finally {
        setTimeout(() => {
          setIsScanning(false);
          isScanningRef.current = false;
          setScanFlash(null);
        }, 1800);
        setCode("");
      }
    },
    [scanFn, queryClient, playVoiceFeedback, selectedCaravanId]
  );

  // Stop active camera session safely
  const stopCameraStream = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          try {
            await html5QrCodeRef.current.stop();
          } catch (_) {}
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

      try {
        const instance = new Html5Qrcode("qr-reader-target");
        html5QrCodeRef.current = instance;

        // Fetch available camera devices if not done yet
        if (cameras.length === 0) {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const cameraList = devices.map((d) => ({
              id: d.id,
              label: d.label || `Caméra ${d.id.slice(0, 4)}`,
            }));
            setCameras(cameraList);

            // Prefer environment (rear) camera by default
            const backCam = devices.find((d) => /back|rear|environment|arrière/i.test(d.label));
            if (!cameraId && backCam) {
              cameraId = backCam.id;
              setSelectedCameraId(backCam.id);
            }
          }
        }

        const config = {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        };

        const targetCam = cameraId || selectedCameraId || { facingMode: "environment" };

        await instance.start(
          targetCam,
          config,
          (decodedText) => {
            validate(decodedText);
          },
          () => {} // Ignore frame scan noise errors
        );

        setIsCameraActive(true);
      } catch (err: unknown) {
        console.error("Camera Start Error:", err);
        const errMsg =
          err instanceof Error
            ? err.message
            : "Impossible d'accéder à la caméra. Vérifiez les autorisations de votre navigateur.";
        setCameraError(errMsg);
        setIsCameraActive(false);
      } finally {
        setIsCameraLoading(false);
      }
    },
    [cameras.length, selectedCameraId, stopCameraStream, validate]
  );

  // Auto-start camera when switching to Camera tab
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
    if (!file) return;
    setIsFromFile(true);

    try {
      await stopCameraStream();
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

      {activeCaravans.length > 1 && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-2">
          <label className="mb-1.5 block text-sm font-bold text-muted-foreground">
            Sélectionnez la caravane à contrôler :
          </label>
          <div className="relative">
            <select
              value={selectedCaravanId}
              onChange={(e) => setSelectedCaravanId(e.target.value)}
              className="w-full h-12 appearance-none rounded-2xl border-2 border-primary/20 bg-primary/5 px-4 pr-10 text-sm font-extrabold text-primary outline-none transition-all hover:border-primary/40 focus:border-primary focus:bg-primary/10 focus:ring-4 focus:ring-primary/20"
            >
              {activeCaravans.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.route} ({new Date(c.departureAt).toLocaleDateString("fr-FR")})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Header */}
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard title="Billets validés" value={String(boarded)} icon={CheckCircle2} accent="mint" />
        <KpiCard title="Refusés" value={String(log.length - boarded)} icon={XCircle} accent="warning" />
        <KpiCard title="Places vendues" value={`${activeCaravanInfo.booked}`} secondary={`sur ${activeCaravanInfo.capacity}`} icon={QrCode} accent="info" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel
          title="Contrôle d'accès & Viseur"
          description="Scanner le QR code du billet étudiant par caméra, fichier ou code"
        >
          {/* Mode Selector Tabs */}
          <div className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-muted/60 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("camera")}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all",
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
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all",
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
                "flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all",
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
                  <span className="font-semibold">
                    {isCameraActive
                      ? "Direct • Viseur actif (60 FPS)"
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
                    className="h-8 max-w-[170px] rounded-xl border border-border bg-card px-2 text-xs font-semibold text-foreground outline-none"
                  >
                    <option value="">Changer caméra</option>
                    {cameras.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* High-Tech Viewfinder Box */}
              <div
                className={cn(
                  "relative w-full overflow-hidden rounded-3xl border border-border bg-black aspect-square max-h-[350px] flex items-center justify-center transition-all duration-300",
                  scanFlash === "success" && "ring-4 ring-emerald-500 ring-offset-2 shadow-[0_0_40px_rgba(16,185,129,0.5)]",
                  scanFlash === "error" && "ring-4 ring-rose-500 ring-offset-2 shadow-[0_0_40px_rgba(244,63,94,0.5)]"
                )}
              >
                {/* HTML5Qrcode Video Element Mount Target */}
                <div id="qr-reader-target" className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

                {/* Reticle Overlay (when active) */}
                {isCameraActive && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="relative size-60 rounded-3xl border-2 border-dashed border-emerald-400/80 shadow-[0_0_40px_rgba(52,211,153,0.3)]">
                      {/* Animated Laser Scan Line */}
                      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[bounce_1.8s_infinite]" />
                      {/* Corner Accents */}
                      <div className="absolute -top-1 -left-1 size-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
                      <div className="absolute -top-1 -right-1 size-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
                      <div className="absolute -bottom-1 -left-1 size-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
                      <div className="absolute -bottom-1 -right-1 size-5 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />
                    </div>
                  </div>
                )}

                {/* Scan Cooldown / Flash Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white">
                    <Sparkles className="size-12 text-emerald-400 animate-spin" />
                    <p className="mt-3 text-sm font-extrabold tracking-wide text-emerald-400">
                      TRAITEMENT EN COURS...
                    </p>
                  </div>
                )}

                {/* Camera Error Display */}
                {cameraError && !isCameraLoading && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/95 p-6 text-center">
                    <ShieldAlert className="size-10 text-danger" />
                    <p className="mt-3 text-sm font-bold text-foreground">{cameraError}</p>
                    <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                      Sélectionnez une image de QR code ou utilisez la saisie manuelle.
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
                    <CameraOff className="size-12 text-muted-foreground opacity-50" />
                    <p className="mt-3 text-sm font-bold">Caméra en pause</p>
                    <button
                      type="button"
                      onClick={() => startCameraStream()}
                      className="mt-4 flex items-center gap-2 rounded-2xl bg-gradient-primary px-6 py-3 text-xs font-extrabold text-primary-foreground shadow-ambient hover:opacity-90"
                    >
                      <Camera className="size-4" />
                      Activer la caméra
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Pause Button */}
              {isCameraActive && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={stopCameraStream}
                    className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
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
                className="group relative flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/30 p-10 text-center transition-all hover:border-primary hover:bg-muted/50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform shadow-sm">
                  {isFromFile ? (
                    <RefreshCw className="size-8 animate-spin" />
                  ) : (
                    <Upload className="size-8" />
                  )}
                </div>
                <h4 className="mt-4 text-sm font-bold">Cliquez pour importer une image QR Code</h4>
                <p className="mt-1 text-xs text-muted-foreground">
                  Format accepté : PNG, JPG, JPEG, WEBP
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-gradient-primary px-5 py-2.5 text-xs font-extrabold text-primary-foreground shadow-sm">
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
                value={code || ""}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && validate(code)}
                placeholder="Saisie manuelle (ex: BK-12345)"
                className="h-12 flex-1 rounded-2xl border border-border bg-card px-4 text-sm font-medium outline-none focus:ring-2 focus:ring-ring/40"
              />
              <button
                type="submit"
                disabled={isScanning}
                className="rounded-2xl bg-gradient-primary px-6 text-sm font-extrabold text-primary-foreground shadow-sm active:scale-95 disabled:opacity-50"
              >
                {isScanning ? "..." : "Valider"}
              </button>
            </form>
          )}

          <div className="mt-4">
            <div className="flex justify-between text-xs font-bold mb-1.5">
              <span className="text-muted-foreground">Progression de l'embarquement</span>
              <span className="text-primary">{Math.min(100, Math.round((boarded / (activeCaravanInfo.booked || 1)) * 100))}%</span>
            </div>
            <ProgressBar value={Math.min(100, Math.round((boarded / (activeCaravanInfo.booked || 1)) * 100))} tone="mint" />
          </div>
        </Panel>

        {/* Right Side: Featured Last Scan + Scan History */}
        <div className="space-y-4">
          {/* POP-POP FEATURED LAST SCAN CARD */}
          {lastValidScan && (
            <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 shadow-ambient animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  <Check className="size-3.5 stroke-[3]" />
                  DERNIER EMBARQUEMENT VALIDÉ
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  {lastValidScan.time}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-emerald-500 text-white shadow-md">
                  <UserCheck className="size-7" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-extrabold">{lastValidScan.name}</h3>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mt-0.5">
                    <MapPin className="size-3.5 text-emerald-500" />
                    {lastValidScan.route}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-card border border-border px-2.5 py-1 text-xs font-bold">
                      <Ticket className="size-3.5 text-primary" />
                      {lastValidScan.seats} place(s)
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      Ref: {lastValidScan.code.slice(0, 12)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCAN HISTORY PANEL */}
          <Panel title="Historique des contrôles" description="Les derniers accès scannés">
            {log.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Aucun scan pour l'instant. Scannez un QR code ou saisissez une référence.
              </p>
            ) : (
              <ul className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {log.map((l, i) => (
                  <li
                    key={`${l.code}-${i}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-3.5 transition-all",
                      l.ok
                        ? "border-success/30 bg-success/10 text-foreground"
                        : "border-danger/30 bg-danger/10 text-foreground"
                    )}
                  >
                    {l.ok ? (
                      <CheckCircle2 className="size-5 shrink-0 text-success" />
                    ) : (
                      <XCircle className="size-5 shrink-0 text-danger" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between">
                        <span className="truncate text-sm font-extrabold">{l.name}</span>
                        <span className="text-[11px] font-medium text-muted-foreground">{l.time}</span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground mt-0.5">
                        {l.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
