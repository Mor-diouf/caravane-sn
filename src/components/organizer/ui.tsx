import type { ComponentType, ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusLabels, statusTone, type Status } from "@/lib/organizer";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
        className,
      )}
    >
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold tracking-tight">{title}</h2>}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function KpiCard({
  title,
  value,
  secondary,
  trend,
  icon: Icon,
  accent = "brand",
}: {
  title: string;
  value: string;
  secondary?: string;
  trend?: string;
  icon: ComponentType<{ className?: string }>;
  accent?: "brand" | "mint" | "info" | "warning";
}) {
  const up = !trend?.startsWith("-");
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-ambient">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </p>
        <span
          className={cn(
            "grid size-9 shrink-0 place-items-center rounded-xl",
            accent === "brand" && "bg-brand-soft text-primary",
            accent === "mint" && "bg-mint/12 text-mint",
            accent === "info" && "bg-info/10 text-info",
            accent === "warning" && "bg-warning/12 text-warning",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 truncate text-2xl font-extrabold tracking-tight">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {secondary && <p className="text-xs text-muted-foreground">{secondary}</p>}
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold",
              up ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
            )}
          >
            {up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatusPill({ status }: { status: Status }) {
  const tone = statusTone[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        tone === "success" && "bg-success/10 text-success",
        tone === "warning" && "bg-warning/12 text-warning",
        tone === "danger" && "bg-danger/10 text-danger",
        tone === "info" && "bg-info/10 text-info",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {statusLabels[status]}
    </span>
  );
}

export function Avatar({ initials }: { initials: string }) {
  return (
    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-[11px] font-black text-primary">
      {initials}
    </span>
  );
}

export function ProBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-mint/15 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-mint">
      Pro
    </span>
  );
}

export function InsightBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-info/20 bg-info/5 p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-info/10 text-info">
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold">Caravane Intelligence</p>
        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  message,
  cta,
}: {
  icon: ComponentType<{ className?: string }>;
  message: string;
  cta?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {cta}
    </div>
  );
}

export function ProgressBar({ value, tone = "brand" }: { value: number; tone?: "brand" | "mint" | "warning" }) {
  return (
    <span className="block h-2 w-full overflow-hidden rounded-full bg-muted">
      <span
        className={cn(
          "block h-full rounded-full transition-[width] duration-700",
          tone === "brand" && "bg-gradient-primary",
          tone === "mint" && "bg-mint",
          tone === "warning" && "bg-warning",
        )}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </span>
  );
}
