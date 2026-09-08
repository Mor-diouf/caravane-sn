import { Link } from "@tanstack/react-router";
import { Home, TicketCheck, MessageCircle, User } from "lucide-react";

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-surface-blur backdrop-blur-xl">
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 py-2 lg:max-w-2xl">
        <li>
          <Link
            to="/"
            activeOptions={{ exact: true }}
            className="group flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
          >
            <Home className="size-5 transition-transform group-hover:-translate-y-0.5" />
            <span className="truncate">Accueil</span>
          </Link>
        </li>
        <li>
          <Link
            to="/billets"
            className="group flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
          >
            <TicketCheck className="size-5 transition-transform group-hover:-translate-y-0.5" />
            <span className="truncate">Mes billets</span>
          </Link>
        </li>
        <li>
          <a
            href="https://wa.me/221781880102?text=Bonjour%20King-Bus,%20je%20souhaite%20r%C3%A9server%20un%20trajet"
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
          >
            <MessageCircle className="size-5 transition-transform group-hover:-translate-y-0.5" />
            <span className="truncate">WhatsApp</span>
          </a>
        </li>
        <li>
          <Link
            to="/profil"
            className="group flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors data-[status=active]:text-primary"
          >
            <User className="size-5 transition-transform group-hover:-translate-y-0.5" />
            <span className="truncate">Compte</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
