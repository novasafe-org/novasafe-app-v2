import {
  AlertCircle,
  Crown,
  ExternalLink,
  History,
  KeyRound,
  Monitor,
  Shield,
  Sparkles,
  StickyNote,
} from "lucide-react";
import type { SubscriptionState } from "@/lib/api/endpoints/subscriptions";
import {
  buildBillingFeatureCards,
  formatBillingDate,
  formatPlanLabel,
  formatSubscriptionStatusLabel,
  getRenewalDisplayDate,
  getRenewalDisplayLabel,
  mergeBillingHistoryRows,
  type PurchaseRecord,
  type BillingActivityRecord,
} from "@/lib/billing/subscription-display";

type BillingPageViewProps = {
  state: SubscriptionState;
  purchases: PurchaseRecord[];
  recentActivity: BillingActivityRecord[];
  upgradeUrl: string;
  manageUrl: string;
  showUpgrade: boolean;
  showManage: boolean;
  onRetry?: () => void;
  errorMessage?: string | null;
};

const featureIcons = {
  passwords: KeyRound,
  devices: Monitor,
  security: Shield,
  history: History,
  fields: StickyNote,
} as const;

export function BillingPageView({
  state,
  purchases,
  recentActivity,
  upgradeUrl,
  manageUrl,
  showUpgrade,
  showManage,
  onRetry,
  errorMessage,
}: BillingPageViewProps) {
  const planLabel = formatPlanLabel(state);
  const statusLabel = formatSubscriptionStatusLabel(state.subscriptionStatus, state);
  const renewalLabel = getRenewalDisplayLabel(state);
  const renewalDate = getRenewalDisplayDate(state);
  const historyRows = mergeBillingHistoryRows(purchases, recentActivity);
  const featureCards = buildBillingFeatureCards(state);
  const isPro = state.isPro || state.tier === "pro";

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-ink-muted">Manage your plan, renewal, and payment history.</p>
      </div>

      {errorMessage ? (
        <div className="rounded-xl hairline bg-surface p-4 flex items-start gap-3 text-sm">
          <AlertCircle className="size-4 text-warning mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Couldn't load billing details</div>
            <p className="text-ink-muted mt-1">{errorMessage}</p>
            {onRetry ? (
              <button type="button" onClick={onRetry} className="mt-3 text-brand text-sm hover:underline">
                Try again
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Current plan — compact premium card */}
      <section className="rounded-2xl hairline overflow-hidden bg-gradient-to-br from-surface via-surface to-brand-softer/30 dark:from-[oklch(0.17_0.02_250)] dark:via-[oklch(0.19_0.025_252)] dark:to-[oklch(0.22_0.04_250)]">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface/60 px-2 py-0.5 text-[11px] font-medium text-ink-muted backdrop-blur-sm">
                  {isPro ? <Crown className="size-3 text-brand" /> : <Sparkles className="size-3" />}
                  Current plan
                </span>
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    statusLabel === "Active"
                      ? "bg-success/15 text-success"
                      : statusLabel === "Cancelled"
                        ? "bg-warning/15 text-warning"
                        : statusLabel === "Expired" || statusLabel === "Inactive"
                          ? "bg-muted text-ink-muted"
                          : "bg-brand/10 text-brand"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.65rem]">
                  {planLabel === "Free" ? "NovaSafe Free" : `NovaSafe ${planLabel}`}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {isPro ? "Active subscription" : "Free plan"}
                  {state.purchasedAt ? ` · Member since ${formatBillingDate(state.purchasedAt)}` : ""}
                </p>
              </div>

              {renewalLabel && renewalDate ? (
                <p className="text-sm font-medium text-ink">
                  {renewalLabel} <span className="text-brand">{renewalDate}</span>
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-hairline/80 pt-4">
            {showUpgrade ? (
              <a
                href={upgradeUrl}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-brand-foreground transition hover:opacity-95"
              >
                <Sparkles className="size-3.5" />
                Upgrade to Pro
              </a>
            ) : null}
            {showManage ? (
              <a
                href={manageUrl}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline bg-surface/80 px-3.5 text-sm font-semibold text-ink transition hover:bg-surface-elev"
              >
                Manage subscription
              </a>
            ) : null}
            {showManage ? (
              <a
                href={manageUrl}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-hairline bg-transparent px-3.5 text-sm font-medium text-ink-muted transition hover:text-ink sm:ml-auto"
              >
                Billing portal <ExternalLink className="size-3.5" />
              </a>
            ) : null}
            {!isPro && purchases.length > 0 ? (
              <a
                href={upgradeUrl}
                className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-brand hover:underline"
              >
                Resubscribe
              </a>
            ) : null}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-ink">Plan features</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {featureCards.map((card) => {
            const Icon = featureIcons[card.id as keyof typeof featureIcons] ?? Sparkles;
            return (
              <div
                key={card.id}
                className="rounded-xl hairline bg-surface/80 p-3 backdrop-blur-sm transition hover:bg-surface-elev"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`grid size-7 place-items-center rounded-lg ${
                      card.included ? "bg-brand/10 text-brand" : "bg-muted text-ink-muted"
                    }`}
                  >
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-ink-muted">{card.label}</p>
                    <p className="truncate text-xs font-semibold text-ink">{card.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Billing history — timeline cards */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-ink">Billing history</h3>
          <span className="text-[11px] text-ink-faint">{historyRows.length} events</span>
        </div>

        <div className="rounded-2xl hairline bg-surface/60 divide-y divide-hairline overflow-hidden">
          {historyRows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-ink-muted">No billing activity yet.</p>
          ) : (
            historyRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{row.label}</p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {row.date ? formatBillingDate(row.date) : "—"}
                    {row.plan !== "—" ? ` · ${row.plan}` : ""}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                    row.status.toLowerCase().includes("complete") || row.status === "Processed"
                      ? "bg-success/15 text-success"
                      : "bg-muted text-ink-muted"
                  }`}
                >
                  {row.status}
                </span>
              </div>
            ))
          )}
        </div>
        <p className="text-[11px] text-ink-faint leading-relaxed">
          Receipts are emailed by Paddle after each charge. Invoice PDF downloads are not available in-app yet.
        </p>
      </section>
    </div>
  );
}
