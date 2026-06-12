import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  StatusPill,
  type StatusTone,
} from "@/components/account/profile/profile-ui";

export function HeroScoreRing({
  score,
  size = 140,
  className,
}: {
  score: number;
  size?: number;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, score));
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Security score ${clamped} out of 100`}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/80"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-brand transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl md:text-4xl font-semibold tracking-tight text-ink">{clamped}</span>
        <span className="text-xs text-ink-muted font-medium">/ 100</span>
      </div>
    </div>
  );
}

export function ScoreBreakdownRow({
  label,
  points,
  max,
}: {
  label: string;
  points: number;
  max: number;
}) {
  const pct = max > 0 ? (points / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-ink-muted truncate">{label}</span>
          <span className="font-medium text-ink tabular-nums shrink-0">
            {points} pts
          </span>
        </div>
        <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-brand/80 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function ProtectionCard({
  icon,
  title,
  status,
  statusTone = "neutral",
  rows,
  action,
  onAction,
  actionLabel,
  disabled,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  statusTone?: StatusTone;
  rows?: Array<{ label: string; value: string }>;
  action?: ReactNode;
  onAction?: () => void;
  actionLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/60 p-4 flex flex-col gap-3 h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="size-10 rounded-lg brand-gradient-soft grid place-items-center text-brand shrink-0">
          {icon}
        </div>
        <StatusPill tone={statusTone}>{status}</StatusPill>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {rows && rows.length > 0 && (
          <dl className="mt-2 space-y-1">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-2 text-xs">
                <dt className="text-ink-muted">{row.label}</dt>
                <dd className="font-medium text-ink text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="mt-auto pt-1">
        {action ?? (
          <button
            type="button"
            onClick={onAction}
            disabled={disabled}
            className="w-full h-8 rounded-lg hairline text-xs font-medium hover:bg-muted transition disabled:opacity-50"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export type HealthSeverity = "healthy" | "warning" | "critical";

const healthStyles: Record<HealthSeverity, string> = {
  healthy: "text-success",
  warning: "text-warning",
  critical: "text-destructive",
};

export function HealthMetric({
  label,
  count,
  severity,
}: {
  label: string;
  count: number;
  severity: HealthSeverity;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/50 p-4 text-center">
      <div className={cn("text-2xl font-semibold tabular-nums", healthStyles[severity])}>
        {count}
      </div>
      <div className="text-xs text-ink-muted mt-1">{label}</div>
    </div>
  );
}

export function healthSeverity(count: number, type: "breached" | "default"): HealthSeverity {
  if (count === 0) return "healthy";
  if (type === "breached" || count >= 5) return "critical";
  return "warning";
}

export function RiskFinding({
  title,
  explanation,
  action,
  onAction,
  to,
  level,
}: {
  title: string;
  explanation: string;
  action: string;
  onAction?: () => void;
  to?: string;
  level: "low" | "medium" | "high";
}) {
  const levelTone: StatusTone =
    level === "high" ? "risk" : level === "medium" ? "attention" : "healthy";
  const levelLabel = level === "high" ? "High risk" : level === "medium" ? "Medium risk" : "Low risk";

  const actionClassName =
    "shrink-0 h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition inline-flex items-center justify-center";

  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/40 p-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-medium text-ink">{title}</h4>
          <StatusPill tone={levelTone}>{levelLabel}</StatusPill>
        </div>
        <p className="text-xs text-ink-muted leading-relaxed">{explanation}</p>
      </div>
      {to ? (
        <Link to={to} className={actionClassName}>
          {action}
        </Link>
      ) : onAction ? (
        <button type="button" onClick={onAction} className={actionClassName}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

export function TimelineEntry({
  title,
  timestamp,
  severity,
  type,
}: {
  title: string;
  timestamp: string;
  severity: "info" | "success" | "warning" | "critical";
  type: string;
}) {
  const dotClass =
    severity === "critical"
      ? "bg-destructive"
      : severity === "warning"
        ? "bg-warning"
        : severity === "success"
          ? "bg-success"
          : "bg-brand";

  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={cn("size-2.5 rounded-full ring-4 ring-surface shrink-0", dotClass)} />
        <div className="w-px flex-1 bg-hairline mt-1 last:hidden" />
      </div>
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{title}</span>
          <span className="text-[10px] uppercase tracking-wide text-ink-faint font-medium">
            {type}
          </span>
        </div>
        <time className="text-xs text-ink-muted">{timestamp}</time>
      </div>
    </div>
  );
}

export function TrustIndicator({
  label,
  enabled,
  hint,
}: {
  label: string;
  enabled: boolean;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-elev/40 px-4 py-3">
      <div
        className={cn(
          "size-8 rounded-lg grid place-items-center shrink-0",
          enabled ? "bg-success/12 text-success" : "bg-muted text-ink-muted",
        )}
        aria-hidden
      >
        <span className="text-sm">{enabled ? "✓" : "—"}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink">{label}</div>
        {hint && <div className="text-xs text-ink-muted">{hint}</div>}
      </div>
      <StatusPill tone={enabled ? "healthy" : "neutral"}>
        {enabled ? "Enabled" : "Disabled"}
      </StatusPill>
    </div>
  );
}

export function DangerAction({
  title,
  description,
  actionLabel,
  onClick,
  disabled,
  variant = "default",
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink">{title}</div>
        <p className="text-xs text-ink-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "shrink-0 h-9 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50",
          variant === "destructive"
            ? "bg-destructive text-destructive-foreground hover:opacity-95"
            : "border border-destructive/30 text-destructive hover:bg-destructive/10",
        )}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export { SectionCard, StatusPill, ProgressBar, PrimaryButton, GhostButton, ActionLink } from "@/components/account/profile/profile-ui";
