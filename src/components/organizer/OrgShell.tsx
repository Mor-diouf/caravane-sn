import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  Bell,
  Bus,
  Crown,
  FileText,
  HelpCircle,
  History,
  LayoutDashboard,
  Megaphone,
  Menu,
  QrCode,
  Search,
  Settings,
  Star,
  Ticket,
  Users,
  UsersRound,
  Wallet,
  X,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { accessQuery } from "@/lib/dash-queries";
import { dateTimeFr, initialsOf } from "@/lib/dash-shared";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
  pro?: boolean;
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Direction & Lignes",
    items: [
      { label: "Tableau de bord", icon: LayoutDashboard, to: "/organizer/dashboard" },
      { label: "Lignes & Départs", icon: Bus, to: "/organizer/caravans" },
      { label: "Réservations", icon: Ticket, to: "/organizer/bookings" },
      { label: "Manifeste Passagers", icon: Users, to: "/organizer/passengers" },
    ],
  },
  {
    title: "Opérations & Gares",
    items: [
      { label: "Scanner Embarquement", icon: QrCode, to: "/organizer/scanner" },
      { label: "Recettes & Caisse", icon: Wallet, to: "/organizer/payments" },
      { label: "Avis Voyageurs", icon: Star, to: "/organizer/reputation" },
      { label: "Équipe & Contrôleurs", icon: UsersRound, to: "/organizer/team" },
    ],
  },
  {
    title: "Configuration",
    items: [
      { label: "Paramètres Agence", icon: Settings, to: "/organizer/settings" },
    ],
  },
];

const mobileNav: NavItem[] = [
  { label: "Bord", icon: LayoutDashboard, to: "/organizer/dashboard" },
  { label: "Lignes", icon: Bus, to: "/organizer/caravans" },
  { label: "Scanner", icon: QrCode, to: "/organizer/scanner" },
  { label: "Passagers", icon: Users, to: "/organizer/passengers" },
  { label: "Caisse", icon: Wallet, to: "/organizer/payments" },
];

function OrgLogo() {
  return (
    <img
      src="/images/king-bus/logo.jpg"
      alt="KING-BUS 2.0"
      className="size-9 shrink-0 rounded-xl object-cover bg-white border border-primary/40 shadow-sm"
    />
  );
}

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
      {navGroups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-foreground/40">
            {group.title}
          </p>
          <ul className="space-y-1">
            {group.items.map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-foreground/12 text-brand-foreground"
                        : "text-brand-foreground/65 hover:bg-brand-foreground/8 hover:text-brand-foreground",
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.pro && (
                      <span className="shrink-0 rounded-md bg-mint/20 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-mint">
                        Pro
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarInner({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const access = useQuery(accessQuery());
  return (
    <div className="flex h-full flex-col bg-brand text-brand-foreground">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-brand-foreground/10">
        <OrgLogo />
        <div className="min-w-0">
          <p className="truncate text-sm font-black tracking-tight flex items-center gap-1.5">
            KING-BUS <span className="text-primary text-[10px] font-bold px-1 rounded bg-primary/20">2.0</span>
          </p>
          <p className="truncate text-[11px] text-brand-foreground/60 font-semibold">
            {access.data?.organizerName ?? "Portail Exploitation"}
          </p>
        </div>
      </div>
      <NavList onNavigate={onNavigate} />
    </div>
  );
}

function NotificationBell() {
  const { data } = useQuery({
    queryKey: ["organizer", "notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, kind, read_at, created_at")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const items = data ?? [];
  const unread = items.filter((n) => !n.read_at).length;

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative grid size-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="size-4" />
        {unread > 0 && <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger" />}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-bold">Notifications</p>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Aucune notification pour le moment.
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {items.map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-3">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.kind === "payment" && "bg-success",
                    n.kind === "departure" && "bg-warning",
                    n.kind === "review" && "bg-info",
                    n.kind === "dispute" && "bg-danger",
                    !["payment", "departure", "review", "dispute"].includes(n.kind) && "bg-info",
                  )}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold leading-tight">{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                  <span className="block text-[11px] text-muted-foreground/70">
                    {dateTimeFr(n.created_at)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function OrgShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const access = useQuery(accessQuery());
  const ownerName = access.data?.fullName || "Organisateur";


  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarInner />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-brand/50 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 shadow-lifted">
            <button
              type="button"
              aria-label="Fermer"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 z-10 grid size-8 place-items-center rounded-lg text-brand-foreground/70"
            >
              <X className="size-4" />
            </button>
            <SidebarInner onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-surface-blur backdrop-blur-xl">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              aria-label="Ouvrir le menu"
              onClick={() => setOpen(true)}
              className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card lg:hidden"
            >
              <Menu className="size-4" />
            </button>

            <label className="relative hidden min-w-0 flex-1 items-center sm:flex">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <span className="sr-only">Recherche globale</span>
              <input
                type="search"
                placeholder="Rechercher une caravane, un étudiant, un billet…"
                className="h-9 w-full max-w-md rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
              />
            </label>

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                aria-label="Aide"
                className="hidden size-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground sm:grid"
              >
                <HelpCircle className="size-4" />
              </button>
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 transition-colors hover:bg-muted text-left">
                    <span className="grid size-7 place-items-center rounded-lg bg-brand text-[10px] font-black text-brand-foreground">
                      {initialsOf(ownerName)}
                    </span>
                    <span className="hidden min-w-0 leading-tight sm:block">
                      <span className="block truncate text-xs font-bold">{ownerName}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">
                        {access.data?.organizerName ?? "Mon amicale"}
                      </span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Mon Compte</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/" className="cursor-pointer flex items-center gap-2">
                      <ArrowLeft className="size-4" />
                      Retour à l'application
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="cursor-pointer text-danger focus:text-danger focus:bg-danger/10 flex items-center gap-2"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      window.location.href = "/";
                    }}
                  >
                    <LogOut className="size-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 pb-28 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-blur px-2 py-2 backdrop-blur-xl lg:hidden">
        <ul className="grid grid-cols-5">
          {mobileNav.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                activeProps={{ className: "text-primary-accent" }}
                className="flex flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-semibold text-muted-foreground"
              >
                <item.icon className="size-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
