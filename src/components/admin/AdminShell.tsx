import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  Bus,
  LayoutDashboard,
  Menu,
  MessageSquareWarning,
  Search,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { accessQuery, adminOverviewQuery } from "@/lib/dash-queries";
import { dateFr, initialsOf } from "@/lib/dash-shared";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type NavItem = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  to: string;
  badge?: number;
};


const navGroups: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Pilotage",
    items: [
      { label: "Vue plateforme", icon: LayoutDashboard, to: "/admin/dashboard" },
      { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
    ],
  },
  {
    title: "Gouvernance",
    items: [
      { label: "Organisateurs", icon: BadgeCheck, to: "/admin/organizers" },
      { label: "Utilisateurs", icon: Users, to: "/admin/users" },
      { label: "Caravanes", icon: Bus, to: "/admin/caravans" },
    ],
  },
  {
    title: "Confiance",
    items: [
      { label: "Finances", icon: Wallet, to: "/admin/finance" },
      { label: "Modération", icon: MessageSquareWarning, to: "/admin/moderation" },
      { label: "Litiges", icon: AlertTriangle, to: "/admin/disputes" },
    ],
  },
  {
    title: "Système",
    items: [{ label: "Paramètres", icon: Settings, to: "/admin/settings" }],
  },
];

const mobileNav: NavItem[] = [
  { label: "Vue", icon: LayoutDashboard, to: "/admin/dashboard" },
  { label: "Organisateurs", icon: BadgeCheck, to: "/admin/organizers" },
  { label: "Users", icon: Users, to: "/admin/users" },
  { label: "Finances", icon: Wallet, to: "/admin/finance" },
  { label: "Litiges", icon: AlertTriangle, to: "/admin/disputes" },
];

function NavList({ onNavigate }: { onNavigate?: (() => void) | undefined }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overview = useQuery(adminOverviewQuery());
  const pendingCount = overview.data?.kpis.pendingOrganizers ?? 0;


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
                    {(item.to === "/admin/organizers" ? pendingCount : (item.badge ?? 0)) > 0 && (
                      <span className="shrink-0 rounded-md bg-warning/25 px-1.5 py-0.5 text-[10px] font-black text-warning">
                        {item.to === "/admin/organizers" ? pendingCount : item.badge}
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
  return (
    <div className="flex h-full flex-col bg-brand text-brand-foreground">
      <div className="flex items-center gap-3 px-5 py-5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-foreground/10 text-brand-foreground ring-1 ring-brand-foreground/15">
          <ShieldCheck className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold tracking-tight">CaravaneHub Admin</p>
          <p className="truncate text-[11px] text-brand-foreground/55">Caravane Étudiants</p>
        </div>
      </div>
      <NavList onNavigate={onNavigate} />
      <div className="m-3 rounded-2xl bg-brand-foreground/8 p-4 ring-1 ring-brand-foreground/10">
        <p className="text-xs font-bold">Accès super-admin</p>
        <p className="mt-1 text-[11px] leading-snug text-brand-foreground/60">
          Vous seul pouvez accorder ou retirer le statut d'organisateur.
        </p>
        <Link
          to="/organizer/dashboard"
          onClick={onNavigate}
          className="mt-3 block rounded-lg bg-brand-foreground px-3 py-2 text-center text-[11px] font-bold text-brand"
        >
          Voir côté organisateur
        </Link>
      </div>
    </div>
  );
}

function AdminBell() {
  const overview = useQuery(adminOverviewQuery());
  const alerts = [
    ...(overview.data?.pending ?? []).map((o) => ({
      id: `org-${o.id}`,
      tone: "warning" as const,
      title: "Dossier organisateur à valider",
      detail: o.name,
      time: dateFr(o.createdAt),
    })),
    ...(overview.data?.recentDisputes ?? []).map((d) => ({
      id: `dis-${d.id}`,
      tone: d.status === "resolved" ? ("success" as const) : ("danger" as const),
      title: "Litige",
      detail: d.subject,
      time: dateFr(d.createdAt),
    })),
    ...(overview.data?.recentPayouts ?? [])
      .filter((p) => p.status === "requested")
      .map((p) => ({
        id: `pay-${p.id}`,
        tone: "info" as const,
        title: "Demande de retrait",
        detail: `${p.organizer} - ${p.amount} FCFA`,
        time: dateFr(p.requestedAt),
      })),
  ];

  return (
    <Popover>
      <PopoverTrigger
        aria-label="Alertes plateforme"
        className="relative grid size-9 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
      >
        <Bell className="size-4" />
        {alerts.length > 0 && (
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b border-border px-4 py-3 text-sm font-bold">Alertes plateforme</p>
        {alerts.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            Aucune alerte en cours.
          </p>
        ) : (
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {alerts.map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-3">
                <span
                  className={cn(
                    "mt-1.5 size-2 shrink-0 rounded-full",
                    n.tone === "success" && "bg-success",
                    n.tone === "warning" && "bg-warning",
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
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const access = useQuery(accessQuery());
  const adminName = access.data?.fullName || "Administrateur";

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
                placeholder="Rechercher un organisateur, un étudiant, un paiement…"
                className="h-9 w-full max-w-md rounded-xl border border-border bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40"
              />
            </label>

            <div className="ml-auto flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground sm:inline-flex">
                <ShieldCheck className="size-3.5 text-mint" /> Super-admin
              </span>
              <AdminBell />
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5">
                <span className="grid size-7 place-items-center rounded-lg bg-brand text-[10px] font-black text-brand-foreground">
                  {initialsOf(adminName)}
                </span>
                <span className="hidden min-w-0 leading-tight sm:block">
                  <span className="block truncate text-xs font-bold">{adminName}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    Super-admin
                  </span>
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 sm:px-6 lg:pb-12">{children}</main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-blur backdrop-blur-xl lg:hidden">
          <ul className="grid grid-cols-5">
            {mobileNav.map((item) => {
              const active = pathname === item.to;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <item.icon className="size-4" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
