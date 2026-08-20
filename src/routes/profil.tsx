import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Heart,
  HelpCircle,
  LogOut,
  Mail,
  Megaphone,
  Pencil,
  Phone,
  Route as RouteIcon,
  Settings,
  Shield,
  Sparkles,
  TicketCheck,
  Wallet,
  X,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PaymentMark } from "@/components/PaymentMark";
import { UniversityMark } from "@/components/UniversityMark";
import { formatPrice, getCaravane, student, universities } from "@/lib/caravanes";
import { useBookings, useFavorites, useLocalStore } from "@/hooks/use-local-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil étudiant — Caravane Étudiants" },
      {
        name: "description",
        content:
          "Gérez votre profil étudiant, votre université, votre moyen de paiement mobile et vos préférences de notifications pour vos caravanes.",
      },
      { property: "og:title", content: "Profil étudiant — Caravane Étudiants" },
      {
        property: "og:description",
        content:
          "Carte étudiant numérique, historique de trajets, moyens de paiement Wave / Orange Money et préférences de voyage.",
      },
    ],
  }),
  component: Profil,
});

type Profile = {
  name: string;
  universityAbbr: string;
  studentId: string;
  phone: string;
  email: string;
};

type Prefs = {
  method: "wave" | "orange" | "free";
  departures: boolean;
  promos: boolean;
  whatsapp: boolean;
};

const defaultProfile: Profile = {
  name: student.name,
  universityAbbr: "UASZ",
  studentId: student.studentId,
  phone: student.phone,
  email: "mamadou.diop@univ-zig.sn",
};

const defaultPrefs: Prefs = {
  method: "wave",
  departures: true,
  promos: true,
  whatsapp: false,
};

const methods = [
  { id: "wave", label: "Wave" },
  { id: "orange", label: "Orange Money" },
  { id: "free", label: "Free Money" },
] as const;

const links = [
  { icon: TicketCheck, label: "Historique des trajets", to: "/billets" as const },
  { icon: Heart, label: "Mes favoris", to: "/favoris" as const },
];

const actions = [
  { icon: Megaphone, label: "Devenir organisateur", hint: "Publiez vos caravanes" },
  { icon: Shield, label: "Sécurité et confidentialité", hint: "Mot de passe, appareils" },
  { icon: Settings, label: "Paramètres du compte", hint: "Langue, données" },
  { icon: HelpCircle, label: "Aide et support", hint: "FAQ, WhatsApp support" },
];

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function Profil() {
  const { bookings } = useBookings();
  const { favorites } = useFavorites();
  const [profile, setProfile] = useLocalStore<Profile>("caravane:profile", defaultProfile);
  const [prefs, setPrefs] = useLocalStore<Prefs>("caravane:prefs", defaultPrefs);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Profile>(profile);

  const university = universities.find((u) => u.abbr === profile.universityAbbr);

  const { seats, spent, destinations } = useMemo(() => {
    let seats = 0;
    let spent = 0;
    const dest = new Set<string>();
    for (const b of bookings) {
      const c = getCaravane(b.caravaneId);
      seats += b.seats;
      if (c) {
        spent += c.price * b.seats;
        dest.add(c.to);
      }
    }
    return { seats, spent, destinations: dest.size };
  }, [bookings]);

  const openEdit = () => {
    setDraft(profile);
    setEditing(true);
  };

  const save = () => {
    setProfile(draft);
    setEditing(false);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden bg-gradient-primary px-5 pb-20 pt-5 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div className="relative mx-auto max-w-3xl">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-primary-foreground/60">
              Mon profil
            </p>
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-primary-foreground/15 px-3 py-1.5 text-[12px] font-semibold backdrop-blur transition-colors hover:bg-primary-foreground/25"
            >
              <Pencil className="size-3.5" />
              Modifier
            </button>
          </div>

          <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-3xl bg-primary-foreground/15 text-xl font-black backdrop-blur">
              {initials(profile.name)}
            </span>
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-[19px] font-extrabold leading-tight tracking-tight">
                <span className="truncate">{profile.name}</span>
                <BadgeCheck className="size-4 shrink-0 text-secondary-accent" />
              </h1>
              <p className="truncate text-[13px] font-medium leading-relaxed text-primary-foreground/75">
                {university?.name ?? profile.universityAbbr}
              </p>
              <p className="truncate text-[11px] leading-relaxed text-primary-foreground/60">
                {profile.studentId}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-14 max-w-3xl space-y-5 px-5">
        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-lifted">
          <div className="flex items-center gap-3 border-b border-border/70 p-4">
            <UniversityMark abbr={profile.universityAbbr} showAbbr={false} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Carte étudiant numérique
              </p>
              <p className="truncate text-sm font-bold">{profile.studentId}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-primary-accent">
              <Check className="size-3" /> Vérifié
            </span>
          </div>
          <dl className="divide-y divide-border">
            {[
              { icon: Phone, label: "Téléphone", value: profile.phone },
              { icon: Mail, label: "Email", value: profile.email },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <Icon className="size-4 shrink-0 text-primary-accent" />
                <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
                <dd className="ml-auto min-w-0 truncate text-xs font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: TicketCheck, label: "Billets", value: bookings.length },
            { icon: Wallet, label: "Places réservées", value: seats },
            { icon: RouteIcon, label: "Destinations", value: destinations },
            { icon: Heart, label: "Favoris", value: favorites.length },
          ].map(({ icon: Icon, label, value }) => (
            <article
              key={label}
              className="rounded-3xl border border-border/70 bg-card p-4 shadow-ambient"
            >
              <Icon className="size-4 text-primary-accent" />
              <p className="mt-2 text-2xl font-extrabold leading-none text-primary-accent">
                {value}
              </p>
              <p className="mt-1 text-[11px] font-medium leading-tight text-muted-foreground">
                {label}
              </p>
            </article>
          ))}
        </section>

        <section className="rounded-3xl bg-gradient-primary p-5 text-primary-foreground shadow-lifted">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-secondary-accent" />
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold">Total dépensé en caravanes</h2>
              <p className="mt-1 text-[26px] font-black leading-none">
                {formatPrice(spent)} <span className="text-sm font-bold">FCFA</span>
              </p>
              <p className="mt-1.5 text-xs text-primary-foreground/75">
                Cumul de vos réservations payées via mobile money.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-ambient">
          <div className="flex items-center gap-2">
            <CreditCard className="size-4 text-primary-accent" />
            <h2 className="text-sm font-bold tracking-tight">Moyen de paiement préféré</h2>
          </div>
          <ul className="mt-3 space-y-2">
            {methods.map((m) => {
              const active = prefs.method === m.id;
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setPrefs({ ...prefs, method: m.id })}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
                      active
                        ? "border-primary-accent bg-accent shadow-ambient"
                        : "border-border/70 hover:border-primary-accent/50",
                    )}
                  >
                    <PaymentMark method={m.id} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                      {m.label}
                    </span>
                    <span
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-full border-2",
                        active ? "border-primary-accent" : "border-border",
                      )}
                    >
                      {active && <span className="size-2.5 rounded-full bg-primary-accent" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-ambient">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary-accent" />
            <h2 className="text-sm font-bold tracking-tight">Notifications</h2>
          </div>
          <ul className="mt-2 divide-y divide-border">
            {(
              [
                { key: "departures", label: "Rappels de départ", hint: "2h avant le trajet" },
                { key: "promos", label: "Bons plans et promos", hint: "Réductions étudiantes" },
                { key: "whatsapp", label: "Alertes WhatsApp", hint: "Billet et changements" },
              ] as const
            ).map(({ key, label, hint }) => (
              <li key={key} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{hint}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={prefs[key]}
                  aria-label={label}
                  onClick={() => setPrefs({ ...prefs, [key]: !prefs[key] })}
                  className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    prefs[key] ? "bg-primary-accent" : "bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-5 rounded-full bg-card shadow-ambient transition-all",
                      prefs[key] ? "left-[22px]" : "left-0.5",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-ambient">
          <ul className="divide-y divide-border">
            {links.map(({ icon: Icon, label, to }) => (
              <li key={label}>
                <Link
                  to={to}
                  className="flex w-full items-center gap-3 px-5 py-4 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 shrink-0 text-primary-accent" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              </li>
            ))}
            {actions.map(({ icon: Icon, label, hint }) => (
              <li key={label}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 shrink-0 text-primary-accent" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{label}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">
                      {hint}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-semibold text-danger transition-colors hover:bg-accent"
              >
                <LogOut className="size-4 shrink-0" />
                Déconnexion
              </button>
            </li>
          </ul>
        </section>

        <p className="pb-2 text-center text-[11px] text-muted-foreground">
          Caravane Étudiants — version 2.0.0
        </p>
      </main>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-md rounded-t-3xl border border-border/70 bg-card p-5 shadow-lifted sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold tracking-tight">Modifier mon profil</h2>
              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Fermer"
                className="grid size-9 place-items-center rounded-xl border border-border/70 transition-colors hover:bg-accent"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {(
                [
                  { key: "name", label: "Nom complet", type: "text" },
                  { key: "studentId", label: "Numéro étudiant", type: "text" },
                  { key: "phone", label: "Téléphone", type: "tel" },
                  { key: "email", label: "Email", type: "email" },
                ] as const
              ).map(({ key, label, type }) => (
                <label key={key} className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {label}
                  </span>
                  <input
                    type={type}
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className="mt-1 w-full rounded-2xl border border-border/70 bg-background px-3 py-2.5 text-sm font-medium focus:border-primary-accent focus:outline-none"
                  />
                </label>
              ))}

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Université
                </span>
                <ul className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                  {universities.map((u) => {
                    const active = draft.universityAbbr === u.abbr;
                    return (
                      <li key={u.id}>
                        <button
                          type="button"
                          title={u.name}
                          onClick={() => setDraft({ ...draft, universityAbbr: u.abbr })}
                          className={cn(
                            "flex w-[70px] flex-col items-center gap-1 rounded-2xl border p-2 transition-all",
                            active
                              ? "border-primary-accent bg-accent"
                              : "border-border/70 hover:border-primary-accent/50",
                          )}
                        >
                          <UniversityMark abbr={u.abbr} active={active} showAbbr={false} />
                          <span className="w-full truncate text-center text-[10px] font-semibold">
                            {u.abbr}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={save}
              className="mt-5 w-full rounded-2xl bg-gradient-primary py-3 text-sm font-bold text-primary-foreground shadow-lifted"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
