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

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
  pro?: boolean;
};

const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Pilotage",
    items: [
      { label: "Vue d'ensemble", icon: LayoutDashboard, to: "/organizer/dashboard" },
      { label: "Mes caravanes", icon: Bus, to: "/organizer/caravans" },
      { label: "Réservations", icon: Ticket, to: "/organizer/bookings" },
      { label: "Passagers", icon: Users, to: "/organizer/passengers" },
    ],
  },
  {
    title: "Opérations",
    items: [
      { label: "Paiements", icon: Wallet, to: "/organizer/payments" },
      { label: "Scanner les billets", icon: QrCode, to: "/organizer/scanner" },
      { label: "Avis & réputation", icon: Star, to: "/organizer/reputation" },
    ],
  },
  {
    title: "Croissance",
    items: [
      { label: "Analytics", icon: BarChart3, to: "/organizer/analytics", pro: true },
      { label: "Historique", icon: History, to: "/organizer/history", pro: true },
      { label: "Équipe", icon: UsersRound, to: "/organizer/team", pro: true },
      { label: "Promotions", icon: Megaphone, to: "/organizer/promotions", pro: true },
      { label: "Rapports", icon: FileText, to: "/organizer/reports", pro: true },
    ],
  },
  {
    title: "Compte",
    items: [
      { label: "Abonnement", icon: Crown, to: "/organizer/subscription" },
      { label: "Paramètres", icon: Settings, to: "/organizer/settings" },
    ],
  },
];

const mobileNav: NavItem[] = [
  { label: "Vue", icon: LayoutDashboard, to: "/organizer/dashboard" },
  { label: "Caravanes", icon: Bus, to: "/organizer/caravans" },
  { label: "Scanner", icon: QrCode, to: "/organizer/scanner" },
  { label: "Paiements", icon: Wallet, to: "/organizer/payments" },
  { label: "Avis", icon: Star, to: "/organizer/reputation" },
];

function OrgLogo() {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-foreground/10 text-[11px] font-black tracking-tight text-brand-foreground ring-1 ring-brand-foreground/15">
      CH
    </span>
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
      <div className="flex items-center gap-3 px-5 py-5">
        <OrgLogo />
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold tracking-tight">CaravaneHub</p>
          <p className="truncate text-[11px] text-brand-foreground/55">
            {access.data?.organizerName ?? "Mon amicale"}
          </p>
        </div>
      </div>
      <NavList onNavigate={onNavigate} />
      <div className="m-3 rounded-2xl bg-brand-foreground/8 p-4 ring-1 ring-brand-foreground/10">
        <p className="flex items-center gap-1.5 text-xs font-bold">
          <Crown className="size-3.5 text-mint" />{" "}
          {access.data?.organizerIsPro ? "Plan Pro actif" : "Plan Standard"}
        </p>
        <p className="mt-1 text-[11px] leading-snug text-brand-foreground/60">
          {access.data?.organizerIsPro
            ? "Analytics, exports et assistant intelligent inclus."
            : "Passez au Pro pour les analytics avancées et les exports."}
        </p>
        <Link
          to="/organizer/subscription"
          onClick={onNavigate}
          className="mt-3 block rounded-lg bg-brand-foreground px-3 py-2 text-center text-[11px] font-bold text-brand"
        >
          Gérer l'abonnement
        </Link>
      </div>
    </div>
  );
}

function NotificationBell() {
  return (
    <Popover>
      <PopoverTrigger
        aria-label="Notifications"
        className="relative grid size-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="size-4" />
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-bold">Notifications</p>
        <ul className="max-h-80 divide-y divide-border overflow-y-auto">
          {notifications.map((n) => (
            <li key={n.id} className="flex gap-3 px-4 py-3">
              <span
                className={cn(
                  "mt-1.5 size-2 shrink-0 rounded-full",
                  n.tone === "success" && "bg-success",
                  n.tone === "warning" && "bg-warning",
                  n.tone === "info" && "bg-info",
                  n.tone === "danger" && "bg-danger",
                )}
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight">{n.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{n.detail}</span>
                <span className="block text-[11px] text-muted-foreground/70">{n.time}</span>
              </span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function OrgShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

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
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5">
                <span className="grid size-7 place-items-center rounded-lg bg-brand text-[10px] font-black text-brand-foreground">
                  {organization.owner.initials}
                </span>
                <span className="hidden min-w-0 leading-tight sm:block">
                  <span className="block truncate text-xs font-bold">{organization.owner.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {organization.name}
                  </span>
                </span>
                <span className="ml-1 rounded-md bg-mint/15 px-1.5 py-0.5 text-[9px] font-black uppercase text-mint">
                  Pro
                </span>
              </div>
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
