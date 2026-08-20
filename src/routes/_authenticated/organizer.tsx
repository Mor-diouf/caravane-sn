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

  const allowed = Boolean(data?.organizerId) || Boolean(data?.isAdmin);
  if (!allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lifted">
          <ShieldAlert className="mx-auto size-8 text-warning" />
          <h1 className="mt-4 text-lg font-extrabold tracking-tight">
            Aucun espace organisateur
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre compte n'est pas encore rattaché à une amicale. Demandez à l'administration
            d'activer votre statut d'organisateur.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
          >
            Retour à l'accueil
          </Link>
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
