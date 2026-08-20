import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bell,
  HelpCircle,
  LogOut,
  Megaphone,
  Settings,
  TicketCheck,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { student } from "@/lib/caravanes";
import { useBookings, useFavorites } from "@/hooks/use-local-store";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Mon profil étudiant — Caravane Étudiants" },
      {
        name: "description",
        content:
          "Gérez votre profil étudiant, vos notifications et vos préférences de paiement pour vos caravanes.",
      },
      { property: "og:title", content: "Profil — Caravane Étudiants" },
      {
        property: "og:description",
        content: "Profil étudiant, historique de billets et préférences de voyage.",
      },
    ],
  }),
  component: Profil,
});

const links = [
  { icon: TicketCheck, label: "Historique des trajets" },
  { icon: Megaphone, label: "Devenir organisateur" },
  { icon: Bell, label: "Notifications" },
  { icon: Settings, label: "Paramètres" },
  { icon: HelpCircle, label: "Aide et support" },
];

function Profil() {
  const { bookings } = useBookings();
  const { favorites } = useFavorites();

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden bg-gradient-primary px-5 pb-16 pt-5 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-primary-foreground/10 blur-2xl"
        />
        <div className="relative mx-auto grid max-w-3xl grid-cols-[auto_minmax(0,1fr)] items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-3xl bg-primary-foreground/15 text-lg font-black backdrop-blur">
            MD
          </span>
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-[18px] font-extrabold leading-tight tracking-tight">
              <span className="truncate">{student.name}</span>
              <BadgeCheck className="size-4 shrink-0 text-secondary-accent" />
            </h1>
            <p className="truncate text-[13px] font-medium leading-relaxed text-primary-foreground/75">
              {student.university}
            </p>
            <p className="truncate text-[11px] leading-relaxed text-primary-foreground/60">
              {student.studentId}
            </p>
          </div>
        </div>
      </header>


      <main className="mx-auto -mt-10 max-w-3xl space-y-5 px-5">
        <section className="grid grid-cols-2 gap-4">
          {[
            { label: "Billets", value: bookings.length },
            { label: "Favoris", value: favorites.length },
          ].map((s) => (
            <article
              key={s.label}
              className="rounded-3xl border border-border/70 bg-card p-5 shadow-ambient"
            >
              <p className="text-2xl font-extrabold text-primary-accent">{s.value}</p>
              <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-ambient">
          <ul className="divide-y divide-border">
            {links.map(({ icon: Icon, label }) => (
              <li key={label}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Icon className="size-4 shrink-0 text-primary-accent" />
                  <span className="min-w-0 truncate">{label}</span>
                </button>
              </li>
            ))}
            <li>
              <button
                type="button"
                className="flex w-full items-center gap-3 px-5 py-4 text-left text-sm font-medium text-danger transition-colors hover:bg-accent"
              >
                <LogOut className="size-4 shrink-0" />
                Déconnexion
              </button>
            </li>
          </ul>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
