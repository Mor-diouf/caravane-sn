import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Heart,
  MapPin,
  Monitor,
  Plug,
  ShieldCheck,
  Snowflake,
  Star,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice, getCaravane, seatTone, student } from "@/lib/caravanes";
import { useBookings, useFavorites } from "@/hooks/use-local-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/caravane/$id")({
  loader: ({ params }) => {
    const caravane = getCaravane(params.id);
    if (!caravane) throw notFound();
    return { caravane };
  },
  head: ({ loaderData }) => {
    const c = loaderData?.caravane;
    const title = c ? `${c.from} → ${c.to} — Caravane Étudiants` : "Caravane Étudiants";
    const description = c
      ? `Caravane ${c.from} vers ${c.to} le ${c.date} à ${c.time} depuis ${c.pickup}. ${formatPrice(c.price)} FCFA, ${c.seatsLeft} places restantes.`
      : "Détail de la caravane universitaire.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CaravaneDetail,
});

const amenityMap = {
  ac: { icon: Snowflake, label: "Climatisation" },
  wifi: { icon: Wifi, label: "Wi-Fi" },
  usb: { icon: Plug, label: "Prises USB" },
  video: { icon: Monitor, label: "Vidéo" },
} as const;

const methods = [
  { id: "wave", label: "Wave", hint: "Instantané" },
  { id: "orange", label: "Orange Money", hint: "Code OTP" },
  { id: "free", label: "Free Money", hint: "USSD" },
] as const;

function CaravaneDetail() {
  const { caravane } = Route.useLoaderData();
  const navigate = useNavigate();
  const { favorites, toggle } = useFavorites();
  const { add } = useBookings();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<string>("wave");
  const [seats, setSeats] = useState(1);
  const [pending, setPending] = useState(false);

  const favorite = favorites.includes(caravane.id);
  const tone = seatTone(caravane.seatsLeft);
  const total = caravane.price * seats;

  const pay = () => {
    setPending(true);
    const reference = `CE-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    window.setTimeout(() => {
      add({
        id: reference,
        caravaneId: caravane.id,
        reference,
        seats,
        method: methods.find((m) => m.id === method)?.label ?? "Wave",
        createdAt: new Date().toISOString(),
      });
      setPending(false);
      setOpen(false);
      toast.success("Paiement confirmé", { description: `Billet ${reference} généré.` });
      navigate({ to: "/billets" });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative">
        <img
          src={caravane.image}
          alt={`Bus de la caravane ${caravane.from} vers ${caravane.to}`}
          width={1280}
          height={800}
          className="h-72 w-full object-cover sm:h-96"
        />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link
            to="/"
            aria-label="Retour"
            className="grid size-11 place-items-center rounded-full border border-border/40 bg-surface-blur text-foreground backdrop-blur-xl"
          >
            <ArrowLeft className="size-5" />
          </Link>
          <button
            type="button"
            aria-label="Favori"
            aria-pressed={favorite}
            onClick={() => toggle(caravane.id)}
            className="grid size-11 place-items-center rounded-full border border-border/40 bg-surface-blur text-muted-foreground backdrop-blur-xl aria-pressed:text-danger"
          >
            <Heart className={cn("size-5", favorite && "fill-current")} />
          </button>
        </div>
        <span
          className={cn(
            "absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-xs font-semibold text-primary-foreground backdrop-blur",
            tone === "critical" && "bg-danger/90",
            tone === "warning" && "bg-secondary-accent/90 text-text-strong",
            tone === "ok" && "bg-success/90",
          )}
        >
          {caravane.seatsLeft} places restantes
        </span>
      </div>

      <main className="mx-auto -mt-8 max-w-3xl space-y-6 px-5">
        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-ambient">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
            <h1 className="text-2xl font-extrabold tracking-tight">
              {caravane.from} <span className="text-muted-foreground">→</span> {caravane.to}
            </h1>
            <p className="shrink-0 text-right text-xl font-extrabold text-primary-accent">
              {formatPrice(caravane.price)}
              <span className="ml-1 text-[11px] font-semibold text-muted-foreground">FCFA</span>
            </p>
          </div>

          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <CalendarDays className="size-4 shrink-0 text-primary-accent" />
              {caravane.date}
            </li>
            <li className="flex items-center gap-3">
              <Clock className="size-4 shrink-0 text-primary-accent" />
              {caravane.time}
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 shrink-0 text-primary-accent" />
              <span className="min-w-0 truncate">{caravane.pickup}</span>
            </li>
            <li className="flex items-center gap-3">
              <MapPin className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">{caravane.dropoff}</span>
            </li>
          </ul>
        </section>

        <section className="flex items-center gap-3 rounded-3xl border border-border/70 bg-card p-4 shadow-ambient">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent text-xs font-black text-primary">
            {caravane.from.slice(0, 2)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Organisé par</p>
            <p className="truncate text-sm font-bold">{caravane.organizer}</p>
          </div>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gradient-primary px-2.5 py-1 text-xs font-bold text-primary-foreground">
            {caravane.rating}
            <Star className="size-3 fill-current" />
          </span>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-ambient">
          <h2 className="text-sm font-bold tracking-tight">À propos de cette caravane</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{caravane.about}</p>

          <h3 className="mt-5 text-sm font-bold tracking-tight">Équipements</h3>
          <ul className="mt-3 grid grid-cols-4 gap-2">
            {caravane.amenities.map((a) => {
              const { icon: Icon, label } = amenityMap[a];
              return (
                <li
                  key={a}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-muted/60 p-3 text-center"
                >
                  <Icon className="size-5 text-primary-accent" />
                  <span className="text-[11px] font-medium leading-tight">{label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface-blur px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-muted-foreground">Total estimé</p>
            <p className="truncate text-lg font-extrabold">
              {formatPrice(caravane.price)} <span className="text-xs">FCFA</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-2xl bg-gradient-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow-lifted transition-transform active:scale-[0.98]"
          >
            Réserver une place
          </button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold">Paiement PayTech</DialogTitle>
            <DialogDescription>
              {student.name} • {student.studentId}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-muted/60 p-3 text-sm">
              <span className="font-medium">Places</span>
              <span className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Retirer une place"
                  onClick={() => setSeats((s) => Math.max(1, s - 1))}
                  className="grid size-8 place-items-center rounded-full border border-border bg-card font-bold"
                >
                  −
                </button>
                <span className="w-4 text-center font-bold">{seats}</span>
                <button
                  type="button"
                  aria-label="Ajouter une place"
                  onClick={() => setSeats((s) => Math.min(caravane.seatsLeft, s + 1))}
                  className="grid size-8 place-items-center rounded-full border border-border bg-card font-bold"
                >
                  +
                </button>
              </span>
            </div>

            <ul className="space-y-2">
              {methods.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-colors",
                      method === m.id
                        ? "border-primary-accent bg-accent"
                        : "border-border/70 hover:border-primary-accent/50",
                    )}
                  >
                    <span className="text-sm font-bold">{m.label}</span>
                    <span className="text-[11px] font-medium text-muted-foreground">{m.hint}</span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-medium text-muted-foreground">À payer</span>
              <span className="text-lg font-extrabold text-primary-accent">
                {formatPrice(total)} FCFA
              </span>
            </div>

            <button
              type="button"
              disabled={pending}
              onClick={pay}
              className="w-full rounded-2xl bg-gradient-primary py-3.5 text-sm font-bold text-primary-foreground shadow-lifted transition-transform active:scale-[0.98] disabled:opacity-70"
            >
              {pending ? "Paiement en cours…" : "Confirmer le paiement"}
            </button>
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Transaction chiffrée via PayTech
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
