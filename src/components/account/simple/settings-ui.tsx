import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SettingsPage({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
        {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SettingsCard({
  title,
  description,
  children,
  className,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-hairline bg-surface overflow-hidden",
        className,
      )}
    >
      {(title || description) && (
        <div className="px-5 pt-5 pb-3 border-b border-hairline">
          {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
          {description && <p className="text-xs text-ink-muted mt-0.5">{description}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function SettingsRow({
  label,
  description,
  value,
  action,
  children,
}: {
  label: string;
  description?: string;
  value?: ReactNode;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 first:pt-0 last:pb-0 border-b border-hairline last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        {description && <p className="text-xs text-ink-muted mt-0.5">{description}</p>}
        {value && <div className="text-sm text-ink-muted mt-1">{value}</div>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function SettingsButton({
  children,
  onClick,
  disabled,
  variant = "secondary",
  href,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  href?: string;
}) {
  const className = cn(
    "inline-flex h-9 items-center justify-center px-4 rounded-lg text-sm font-medium transition disabled:opacity-50",
    variant === "primary" && "bg-brand text-brand-foreground hover:opacity-95",
    variant === "secondary" && "hairline hover:bg-muted",
    variant === "danger" && "text-destructive hover:bg-destructive/10",
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  );
}

export function StatusBadge({
  children,
  variant = "neutral",
}: {
  children: ReactNode;
  variant?: "success" | "warning" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variant === "success" && "bg-success/15 text-success",
        variant === "warning" && "bg-warning/15 text-warning",
        variant === "neutral" && "bg-muted text-ink-muted",
      )}
    >
      {children}
    </span>
  );
}

export function SimpleList({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-hairline">{children}</div>;
}

export function SettingsPageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 pb-10 animate-pulse">
      <div>
        <div className="h-7 w-32 rounded-lg bg-muted/70" />
        <div className="h-4 w-64 rounded-lg bg-muted/60 mt-2" />
      </div>
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-hairline bg-surface p-5 space-y-4">
          <div className="h-4 w-28 rounded bg-muted/70" />
          <div className="h-10 rounded-xl bg-muted/60" />
          <div className="h-10 rounded-xl bg-muted/60" />
        </div>
      ))}
    </div>
  );
}

export function SettingsQueryError({
  message = "Couldn't load this page. Please try again.",
  onRetry,
}: {
  message?: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-6 max-w-2xl mx-auto pb-10">
      <SettingsCard>
        <p className="text-sm text-ink-muted">{message}</p>
        <div className="mt-3">
          <SettingsButton onClick={onRetry}>Try again</SettingsButton>
        </div>
      </SettingsCard>
    </div>
  );
}

export function SettingsQueryLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="p-6 max-w-2xl mx-auto flex items-center gap-2 text-sm text-ink-muted">
      <Loader2 className="size-4 animate-spin" />
      {label}
    </div>
  );
}

export function SimpleListItem({
  primary,
  secondary,
  meta,
  action,
}: {
  primary: string;
  secondary?: string;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink">{primary}</p>
        {secondary && <p className="text-xs text-ink-muted mt-0.5">{secondary}</p>}
        {meta && <p className="text-xs text-ink-faint mt-1">{meta}</p>}
      </div>
      {action}
    </div>
  );
}
