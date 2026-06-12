import type { ReactNode } from "react";
import {
  Crown,
  Check,
  X,
  ExternalLink,
  Sparkles,
  RefreshCw,
  CreditCard,
  Shield,
  Lock,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionCard, StatusPill, type StatusTone } from "@/components/account/profile/profile-ui";
import type { MembershipStatusTone } from "./billing-center-helpers";
import { formatBillingDate } from "@/lib/billing/subscription-display";

export { SectionCard, StatusPill };

const membershipToneMap: Record<MembershipStatusTone, StatusTone> = {
  healthy: "healthy",
  attention: "attention",
  risk: "risk",
  neutral: "neutral",
};

export function MembershipHero({
  planLabel,
  status,
  memberSince,
  renewalLabel,
  renewalDate,
  isPro,
  upgradeUrl,
  manageUrl,
  showUpgrade,
  showManage,
  showResume,
  showBillingPortal,
  upgradeLabel,
}: {
  planLabel: string;
  status: { label: string; tone: MembershipStatusTone };
  memberSince: string;
  renewalLabel: string;
  renewalDate: string | null;
  isPro: boolean;
  upgradeUrl: string;
  manageUrl: string;
  showUpgrade: boolean;
  showManage: boolean;
  showResume: boolean;
  showBillingPortal: boolean;
  upgradeLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface shadow-float">
      <div className="absolute inset-0 brand-gradient-soft opacity-50 pointer-events-none" />
      <div className="relative p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-4 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface/80 px-2.5 py-0.5 text-[11px] font-medium text-ink-muted">
                {isPro ? <Crown className="size-3 text-brand" /> : <Sparkles className="size-3" />}
                Current plan
              </span>
              <StatusPill tone={membershipToneMap[status.tone]}>{status.label}</StatusPill>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink">
                {planLabel}
              </h1>
              <p className="text-sm text-ink-muted mt-1">Membership & billing</p>
            </div>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm max-w-md">
              {renewalDate && (
                <div>
                  <dt className="text-xs text-ink-faint uppercase tracking-wide">{renewalLabel}</dt>
                  <dd className="font-semibold text-brand mt-0.5">{renewalDate}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-ink-faint uppercase tracking-wide">Member since</dt>
                <dd className="font-semibold text-ink mt-0.5">{memberSince}</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            {showUpgrade && (
              <a
                href={upgradeUrl}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:opacity-95 transition"
              >
                <Sparkles className="size-4" />
                {upgradeLabel}
              </a>
            )}
            {showResume && (
              <a
                href={manageUrl}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:opacity-95 transition"
              >
                <RefreshCw className="size-4" />
                Resume subscription
              </a>
            )}
            {showManage && (
              <a
                href={manageUrl}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg hairline bg-surface px-4 text-sm font-semibold text-ink hover:bg-muted transition"
              >
                Manage subscription
              </a>
            )}
            {(showUpgrade || showManage) && (
              <a
                href={upgradeUrl}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg hairline bg-surface px-4 text-sm font-medium text-ink hover:bg-muted transition"
              >
                Change plan
              </a>
            )}
            {showBillingPortal && (
              <a
                href={manageUrl}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg hairline px-4 text-sm font-medium text-ink-muted hover:text-ink transition"
              >
                Billing portal <ExternalLink className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ValueMetricCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/80 p-4 flex flex-col gap-2 min-h-[100px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {label}
        </span>
        <span className="text-ink-muted">{icon}</span>
      </div>
      <span className="text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</span>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}

export function FeatureEntitlementCard({
  label,
  included,
  description,
}: {
  label: string;
  included: boolean;
  description?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 flex items-start gap-3",
        included
          ? "border-success/20 bg-success/5"
          : "border-hairline bg-surface-elev/40 opacity-80",
      )}
    >
      <div
        className={cn(
          "size-7 rounded-lg grid place-items-center shrink-0",
          included ? "bg-success/15 text-success" : "bg-muted text-ink-faint",
        )}
      >
        {included ? <Check className="size-3.5" /> : <X className="size-3.5" />}
      </div>
      <div className="min-w-0">
        <p className={cn("text-sm font-medium", included ? "text-ink" : "text-ink-muted")}>
          {label}
        </p>
        {description && <p className="text-xs text-ink-muted mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

export function SubscriptionTimelineItem({
  title,
  subtitle,
  month,
  type,
}: {
  title: string;
  subtitle?: string;
  month: string;
  type: string;
}) {
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <div className="size-2.5 rounded-full bg-brand ring-4 ring-surface shrink-0" />
        <div className="w-px flex-1 bg-hairline mt-1" />
      </div>
      <div className="flex-1 min-w-0 -mt-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{month}</p>
        <p className="text-sm font-medium text-ink mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
        <span className="text-[10px] uppercase text-ink-faint">{type}</span>
      </div>
    </div>
  );
}

export type BillingHistoryRow = {
  id: string;
  date: string | null;
  label: string;
  plan: string;
  status: string;
};

export function BillingHistoryTable({
  rows,
  page,
  totalPages,
  onPageChange,
  manageUrl,
}: {
  rows: BillingHistoryRow[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  manageUrl: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-ink-muted py-6 text-center">
        No billing history yet. Upgrade to Pro to start your subscription.
      </p>
    );
  }

  return (
    <div>
      <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto] gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-ink-faint border-b border-hairline">
        <span>Date</span>
        <span>Plan</span>
        <span>Status</span>
        <span className="text-right">Actions</span>
      </div>
      <div className="divide-y divide-hairline">
        {rows.map((row) => (
          <div
            key={row.id}
            className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 sm:gap-3 items-center px-4 py-3 hover:bg-surface-elev/40 transition"
          >
            <div>
              <p className="text-sm font-medium text-ink sm:hidden text-ink-faint text-xs">Date</p>
              <p className="text-sm text-ink">
                {row.date ? formatBillingDate(row.date) : "—"}
              </p>
              <p className="text-xs text-ink-muted mt-0.5 sm:hidden">{row.label}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm text-ink">{row.label}</p>
              {row.plan !== "—" && (
                <p className="text-xs text-ink-muted">{row.plan}</p>
              )}
            </div>
            <div>
              <StatusPill
                tone={
                  row.status.toLowerCase().includes("complete") || row.status === "Processed"
                    ? "healthy"
                    : "neutral"
                }
              >
                {row.status}
              </StatusPill>
            </div>
            <div className="flex justify-end gap-1">
              <a
                href={manageUrl}
                className="h-8 px-2.5 rounded-lg hairline text-[11px] font-medium hover:bg-muted transition inline-flex items-center gap-1"
                title="Receipts are emailed by Paddle"
              >
                <Receipt className="size-3" />
                Receipt
              </a>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-hairline">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-8 px-2 rounded-lg hairline disabled:opacity-40 hover:bg-muted transition"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-ink-muted tabular-nums">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-8 px-2 rounded-lg hairline disabled:opacity-40 hover:bg-muted transition"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}

      <p className="text-[11px] text-ink-faint px-4 py-3 leading-relaxed">
        Receipts are emailed by Paddle after each charge. Use the billing portal for invoice details.
      </p>
    </div>
  );
}

export function PaymentMethodCard({ manageUrl, lastBilling }: { manageUrl: string; lastBilling: string | null }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/60 p-5 space-y-4">
      <div className="flex items-start gap-4">
        <div className="size-12 rounded-xl brand-gradient-soft grid place-items-center text-brand">
          <CreditCard className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">Payment method</p>
          <p className="text-sm text-ink-muted mt-1">Managed via Paddle</p>
          <p className="text-xs text-ink-faint mt-2">
            Update card and billing details in the secure Paddle customer portal.
          </p>
          {lastBilling && (
            <p className="text-xs text-ink-muted mt-2">
              Last billing: <span className="font-medium text-ink">{lastBilling}</span>
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={manageUrl}
          className="h-9 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-medium hover:opacity-95 transition inline-flex items-center"
        >
          Manage payment method
        </a>
        <a
          href={manageUrl}
          className="h-9 px-4 rounded-lg hairline text-sm font-medium hover:bg-muted transition inline-flex items-center"
        >
          Update billing details
        </a>
      </div>
    </div>
  );
}

export function PlanComparisonPanel({
  currentPlan,
  targetPlan,
  rows,
  savings,
  upgradeUrl,
  showCta,
}: {
  currentPlan: string;
  targetPlan: string;
  rows: Array<{ feature: string; current: string; upgrade: string; highlight?: boolean }>;
  savings?: string;
  upgradeUrl: string;
  showCta: boolean;
}) {
  return (
    <div className="rounded-xl border border-hairline overflow-hidden">
      <div className="grid grid-cols-2 border-b border-hairline bg-surface-elev/60">
        <div className="p-4 border-r border-hairline">
          <p className="text-xs text-ink-faint uppercase tracking-wide">Current</p>
          <p className="text-lg font-semibold text-ink mt-0.5">{currentPlan}</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-ink-faint uppercase tracking-wide">Compare</p>
          <p className="text-lg font-semibold text-brand mt-0.5">{targetPlan}</p>
        </div>
      </div>
      <div className="divide-y divide-hairline">
        {rows.map((row) => (
          <div
            key={row.feature}
            className={cn(
              "grid grid-cols-2 text-sm",
              row.highlight && "bg-brand/5",
            )}
          >
            <div className="p-3 border-r border-hairline">
              <p className="text-xs text-ink-faint mb-0.5">{row.feature}</p>
              <p className="font-medium text-ink">{row.current}</p>
            </div>
            <div className="p-3">
              <p className="text-xs text-ink-faint mb-0.5 invisible sm:visible">—</p>
              <p className="font-medium text-brand">{row.upgrade}</p>
            </div>
          </div>
        ))}
      </div>
      {savings && (
        <div className="px-4 py-3 bg-success/5 border-t border-hairline text-xs text-success font-medium">
          {savings}
        </div>
      )}
      {showCta && targetPlan !== "—" && (
        <div className="p-4 border-t border-hairline">
          <a
            href={upgradeUrl}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-4 text-sm font-semibold text-brand-foreground hover:opacity-95 transition"
          >
            <Sparkles className="size-3.5" />
            Upgrade to {targetPlan}
          </a>
        </div>
      )}
    </div>
  );
}

export function UsageInsightCard({
  label,
  value,
  max,
  unit,
}: {
  label: string;
  value: number;
  max?: number;
  unit?: string;
}) {
  const pct = max && max > 0 ? Math.min(100, Math.round((value / max) * 100)) : undefined;

  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/50 p-4">
      <p className="text-xs text-ink-faint uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-ink mt-1 tabular-nums">
        {value}
        {unit && <span className="text-sm font-normal text-ink-muted ml-1">{unit}</span>}
      </p>
      {pct !== undefined && max && (
        <>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-ink-faint mt-1">
            {value} of {max} {unit || ""}
          </p>
        </>
      )}
    </div>
  );
}

export function BenefitCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/40 p-4">
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-muted mt-1 leading-relaxed">{description}</p>
    </div>
  );
}

export function TrustIndicatorRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-elev/40 px-4 py-3">
      <div className="size-8 rounded-lg bg-success/12 text-success grid place-items-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="text-sm font-medium text-ink">{value}</p>
      </div>
      <Lock className="size-3.5 text-success shrink-0" aria-hidden />
    </div>
  );
}

export function ManagementActionCard({
  actions,
  manageUrl,
  upgradeUrl,
}: {
  actions: {
    showUpgrade: boolean;
    showManage: boolean;
    showResume: boolean;
    showBillingPortal: boolean;
    upgradeLabel: string;
  };
  manageUrl: string;
  upgradeUrl: string;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/40 p-5 space-y-3">
      <p className="text-sm font-semibold text-ink">Subscription management</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {actions.showManage && (
          <a
            href={manageUrl}
            className="h-10 px-4 rounded-xl hairline text-sm font-medium hover:bg-muted transition flex items-center justify-center"
          >
            Manage subscription
          </a>
        )}
        <a
          href={upgradeUrl}
          className="h-10 px-4 rounded-xl hairline text-sm font-medium hover:bg-muted transition flex items-center justify-center"
        >
          Change plan
        </a>
        {actions.showManage && (
          <a
            href={manageUrl}
            className="h-10 px-4 rounded-xl hairline text-sm font-medium text-destructive hover:bg-destructive/10 transition flex items-center justify-center"
          >
            Cancel subscription
          </a>
        )}
        {actions.showResume && (
          <a
            href={manageUrl}
            className="h-10 px-4 rounded-xl bg-brand text-brand-foreground text-sm font-medium hover:opacity-95 transition flex items-center justify-center"
          >
            Resume subscription
          </a>
        )}
        {actions.showBillingPortal && (
          <a
            href={manageUrl}
            className="h-10 px-4 rounded-xl hairline text-sm font-medium hover:bg-muted transition flex items-center justify-center gap-1.5 sm:col-span-2"
          >
            View billing portal <ExternalLink className="size-3.5" />
          </a>
        )}
        {actions.showUpgrade && (
          <a
            href={upgradeUrl}
            className="h-10 px-4 rounded-xl bg-brand text-brand-foreground text-sm font-semibold hover:opacity-95 transition flex items-center justify-center gap-1.5 sm:col-span-2"
          >
            <Sparkles className="size-4" />
            {actions.upgradeLabel}
          </a>
        )}
      </div>
    </div>
  );
}
