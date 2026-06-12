import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Circle,
  KeyRound,
  Mail,
  Smartphone,
  ShieldCheck,
  UserPlus,
  Cloud,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  StatusPill,
  ProgressBar,
  ActionLink,
  type StatusTone,
} from "@/components/account/profile/profile-ui";
import { HeroScoreRing, ScoreBreakdownRow } from "@/components/account/security/security-ui";

export { ScoreBreakdownRow };
import { formatRelativeTime } from "@/components/account/profile/profile-helpers";
import type { RecoveryTimelineEvent } from "./recovery-helpers";

export { SectionCard, StatusPill, ProgressBar, ActionLink, HeroScoreRing };

export function RecoveryProtectionCard({
  icon,
  title,
  status,
  statusTone = "neutral",
  rows,
  actionLabel,
  onAction,
  actionTo,
}: {
  icon: ReactNode;
  title: string;
  status: string;
  statusTone?: StatusTone;
  rows?: Array<{ label: string; value: string }>;
  actionLabel: string;
  onAction?: () => void;
  actionTo?: string;
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
              <div key={row.label} className="flex justify-between gap-2 text-xs">
                <dt className="text-ink-muted">{row.label}</dt>
                <dd className="font-medium text-ink text-right">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="mt-auto pt-1">
        {actionTo ? (
          <ActionLink to={actionTo}>{actionLabel}</ActionLink>
        ) : (
          <button
            type="button"
            onClick={onAction}
            className="w-full h-8 rounded-lg hairline text-xs font-medium hover:bg-muted transition"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function RecoveryChecklist({
  items,
  completionPct,
}: {
  items: Array<{ id: string; label: string; done: boolean; to?: string }>;
  completionPct: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-sm font-semibold text-ink">{completionPct}% complete</span>
        <span className="text-xs text-ink-muted">
          {items.filter((i) => i.done).length} of {items.length} items
        </span>
      </div>
      <ProgressBar value={completionPct} className="mb-4" />
      <ul className="space-y-2">
        {items.map((item) => {
          const content = (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition",
                item.done
                  ? "border-success/20 bg-success/5"
                  : "border-hairline bg-surface-elev/40",
              )}
            >
              {item.done ? (
                <CheckCircle2 className="size-5 text-success shrink-0" aria-hidden />
              ) : (
                <Circle className="size-5 text-ink-faint shrink-0" aria-hidden />
              )}
              <span
                className={cn(
                  "text-sm flex-1",
                  item.done ? "text-ink" : "text-ink-muted",
                )}
              >
                {item.label}
              </span>
              {item.to && !item.done && (
                <ChevronRight className="size-4 text-ink-faint shrink-0" />
              )}
            </div>
          );

          if (item.to && !item.done) {
            return (
              <li key={item.id}>
                <Link to={item.to} className="block hover:opacity-90">
                  {content}
                </Link>
              </li>
            );
          }
          return <li key={item.id}>{content}</li>;
        })}
      </ul>
    </div>
  );
}

export function RecoveryKitPanel({
  hasKit,
  generatedAt,
  lastDownload,
  version,
  localKit,
  busy,
  onGenerate,
  onDownload,
  onRegenerate,
  onViewInstructions,
}: {
  hasKit: boolean;
  generatedAt: string;
  lastDownload: string;
  version: string;
  localKit: string | null;
  busy: boolean;
  onGenerate: () => void;
  onDownload: () => void;
  onRegenerate: () => void;
  onViewInstructions: () => void;
}) {
  return (
    <div className="rounded-xl border border-brand/20 bg-brand/4 p-5 md:p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Status</p>
          <p className="font-semibold text-ink mt-0.5">
            {hasKit || localKit ? "Generated" : "Not generated"}
          </p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Generation date</p>
          <p className="font-semibold text-ink mt-0.5">{generatedAt}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Last download</p>
          <p className="font-semibold text-ink mt-0.5">{lastDownload}</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Version</p>
          <p className="font-semibold text-ink mt-0.5">{version}</p>
        </div>
      </div>

      {localKit && (
        <div className="rounded-lg border border-hairline bg-surface p-4">
          <p className="text-xs font-medium text-ink-muted mb-2">Recovery code (store offline)</p>
          <pre className="mono text-xs bg-muted/60 p-3 rounded-lg whitespace-pre-wrap break-all text-ink">
            {localKit}
          </pre>
        </div>
      )}

      <div className="rounded-lg border border-warning/20 bg-warning/5 p-4 text-xs text-ink-muted space-y-1">
        <p className="font-medium text-ink">Important</p>
        <p>Store this kit offline in a secure location.</p>
        <p>Do not share it with anyone.</p>
        <p>Keep at least one backup copy.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onGenerate}
          className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-medium hover:opacity-95 transition disabled:opacity-50"
        >
          Generate Recovery Kit
        </button>
        <button
          type="button"
          disabled={busy || (!hasKit && !localKit)}
          onClick={onDownload}
          className="h-9 px-4 rounded-lg hairline text-sm font-medium hover:bg-muted transition disabled:opacity-50"
        >
          Download Recovery Kit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onRegenerate}
          className="h-9 px-4 rounded-lg hairline text-sm font-medium hover:bg-muted transition disabled:opacity-50"
        >
          Regenerate Recovery Kit
        </button>
        <button
          type="button"
          onClick={onViewInstructions}
          className="h-9 px-4 rounded-lg hairline text-sm font-medium hover:bg-muted transition"
        >
          View Recovery Instructions
        </button>
      </div>
    </div>
  );
}

export function EmergencyAccessPanel({
  onConfigure,
  onUpdateContact,
  onDisable,
}: {
  onConfigure: () => void;
  onUpdateContact: () => void;
  onDisable: () => void;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/40 p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Emergency access</p>
          <p className="font-semibold text-ink mt-0.5">Not configured</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Trusted recovery contact</p>
          <p className="font-semibold text-ink mt-0.5">—</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Recovery method</p>
          <p className="font-semibold text-ink mt-0.5">Time-delayed access</p>
        </div>
        <div>
          <p className="text-xs text-ink-faint uppercase tracking-wide">Waiting period</p>
          <p className="font-semibold text-ink mt-0.5">72 hours (default)</p>
        </div>
      </div>
      <p className="text-xs text-ink-muted">
        Emergency access lets a trusted contact request vault access after a waiting period. Coming
        soon to NovaSafe.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onConfigure}
          className="h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition"
        >
          Configure Emergency Access
        </button>
        <button
          type="button"
          onClick={onUpdateContact}
          className="h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition"
        >
          Update Trusted Contact
        </button>
        <button
          type="button"
          onClick={onDisable}
          className="h-8 px-3 rounded-lg hairline text-xs font-medium text-ink-muted hover:bg-muted transition"
        >
          Disable Emergency Access
        </button>
      </div>
    </div>
  );
}

export function RecoveryTimelineItem({ event }: { event: RecoveryTimelineEvent }) {
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <div className="size-2.5 rounded-full bg-brand ring-4 ring-surface shrink-0" />
        <div className="w-px flex-1 bg-hairline mt-1" />
      </div>
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{event.title}</span>
          <span className="text-[10px] uppercase tracking-wide text-ink-faint">{event.type}</span>
        </div>
        <div className="text-xs text-ink-muted mt-0.5 space-x-2">
          {event.device && <span>{event.device}</span>}
          {event.location && <span>· {event.location}</span>}
        </div>
        <time className="text-xs text-ink-faint">{formatRelativeTime(event.at)}</time>
      </div>
    </div>
  );
}

export function ResilienceInsightCard({
  headline,
  body,
  tone,
}: {
  headline: string;
  body: string;
  tone: "success" | "warning" | "risk";
}) {
  const styles = {
    success: "border-success/25 bg-success/5",
    warning: "border-warning/25 bg-warning/5",
    risk: "border-destructive/25 bg-destructive/5",
  };
  const iconClass = {
    success: "text-success",
    warning: "text-warning",
    risk: "text-destructive",
  };

  return (
    <div className={cn("rounded-xl border p-5", styles[tone])}>
      <div className="flex items-start gap-3">
        <ShieldCheck className={cn("size-5 shrink-0 mt-0.5", iconClass[tone])} />
        <div>
          <p className="text-sm font-semibold text-ink">{headline}</p>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">{body}</p>
        </div>
      </div>
    </div>
  );
}

export function EducationCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl border border-hairline bg-surface-elev/40 p-4 hover:border-brand/30 transition w-full"
    >
      <div className="flex items-start gap-3">
        <BookOpen className="size-4 text-brand shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-ink">{title}</p>
          <p className="text-xs text-ink-muted mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function EmergencyAction({
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

export const RECOVERY_ICONS = {
  kit: KeyRound,
  email: Mail,
  devices: Smartphone,
  twoFa: ShieldCheck,
  contact: UserPlus,
  backup: Cloud,
} as const;
