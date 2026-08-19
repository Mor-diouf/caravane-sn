import { Link } from "@tanstack/react-router";
import { Home, TicketCheck, Heart, User } from "lucide-react";

const items = [
  { to: "/", label: "Accueil", icon: Home },
  { to: "/billets", label: "Mes billets", icon: TicketCheck },
  { to: "/favoris", label: "Favoris", icon: Heart },
  { to: "/profil", label: "Profil", icon: User },
] as const;

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface-blur backdrop-blur-xl">
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2 lg:max-w-2xl">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary-accent"
            >
              <Icon className="size-5 transition-transform group-hover:-translate-y-0.5" />
              <span className="truncate">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
