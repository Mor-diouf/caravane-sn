import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert } from "lucide-react";
import { OrgShell } from "@/components/organizer/OrgShell";
import { accessQuery } from "@/lib/dash-queries";

export const Route = createFileRoute("/_authenticated/organizer")({
  component: OrganizerLayout,
});

function OrganizerLayout() {
  const { data, isLoading } = useQuery(accessQuery());

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Chargement de votre espace organisateur…
      </div>
    );
  }

  if (data?.organizerId && data.organizerStatus === "pending" && !data?.isAdmin && !data?.roles?.includes("organizer")) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lifted">
          <ShieldAlert className="mx-auto size-8 text-primary-accent" />
          <h1 className="mt-4 text-lg font-extrabold tracking-tight">
            Demande en cours
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre demande pour devenir organisateur est en cours de traitement par l'administration. Veuillez patienter jusqu'à sa validation.
          </p>
          <Link
            to="/profil"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Retour au profil
          </Link>
        </div>
      </div>
    );
  }

  const allowed = Boolean(
    data?.isAdmin || data?.isOrganizer || data?.roles?.includes("organizer")
  );
  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-lifted">
          <img
            src="/images/king-bus/logo.jpg"
            alt="KING-BUS"
            className="size-14 mx-auto rounded-2xl object-cover mb-2 border border-primary/40 shadow-sm"
          />
          <h1 className="mt-3 text-lg font-black tracking-tight text-foreground">
            Portail Réservé aux Équipes King-Bus
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Cet espace d'exploitation est strictement réservé à la direction, aux chefs d'agence de Dakar & Ziguinchor, et aux contrôleurs d'embarquement de King-Bus 2.0.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-xs font-black text-black shadow-md hover:brightness-110"
            >
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <OrgShell>
      <Outlet />
    </OrgShell>
  );
}
