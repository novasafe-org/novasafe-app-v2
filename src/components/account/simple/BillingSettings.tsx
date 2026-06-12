import { useMemo } from "react";
import type { SubscriptionState } from "@/lib/api/endpoints/subscriptions";
import {
  formatBillingDate,
  formatPlanLabel,
  formatSubscriptionStatusLabel,
  getBillingPageActions,
  getRenewalDisplayDate,
  getRenewalDisplayLabel,
  mergeBillingHistoryRows,
  type BillingActivityRecord,
  type PurchaseRecord,
} from "@/lib/billing/subscription-display";
import { formatMemberSince } from "@/components/account/profile/profile-helpers";
import {
  SettingsPage,
  SettingsCard,
  SettingsRow,
  SettingsButton,
  StatusBadge,
  SimpleList,
  SimpleListItem,
} from "./settings-ui";

export function BillingSettings({
  state,
  purchases,
  recentActivity,
  upgradeUrl,
  manageUrl,
  errorMessage,
  onRetry,
}: {
  state: SubscriptionState;
  purchases: PurchaseRecord[];
  recentActivity: BillingActivityRecord[];
  upgradeUrl: string;
  manageUrl: string;
  errorMessage?: string | null;
  onRetry?: () => void;
}) {
  const actions = getBillingPageActions(state, purchases);
  const planLabel = formatPlanLabel(state);
  const statusLabel = formatSubscriptionStatusLabel(state.subscriptionStatus, state);
  const renewalLabel = getRenewalDisplayLabel(state);
  const renewalDate = getRenewalDisplayDate(state);
  const memberSince = formatMemberSince(state.purchasedAt);

  const history = useMemo(
    () => mergeBillingHistoryRows(purchases, recentActivity).slice(0, 10),
    [purchases, recentActivity],
  );

  const statusVariant =
    statusLabel === "Active" ? "success" : statusLabel === "Cancelled" ? "warning" : "neutral";

  if (errorMessage) {
    return (
      <SettingsPage title="Billing" description="Your plan and payment history.">
        <SettingsCard>
          <p className="text-sm text-ink-muted">{errorMessage}</p>
          {onRetry && (
            <div className="mt-3">
              <SettingsButton onClick={onRetry}>Try again</SettingsButton>
            </div>
          )}
        </SettingsCard>
      </SettingsPage>
    );
  }

  return (
    <SettingsPage title="Billing" description="Your plan and payment history.">
      <SettingsCard>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold text-ink">{planLabel}</p>
            <p className="text-sm text-ink-muted mt-1">{actions.planSubline}</p>
            {renewalLabel && renewalDate && (
              <p className="text-sm text-ink mt-3">
                {renewalLabel} <span className="font-medium">{renewalDate}</span>
              </p>
            )}
            {memberSince !== "—" && (
              <p className="text-xs text-ink-muted mt-1">Member since {memberSince}</p>
            )}
          </div>
          <StatusBadge variant={statusVariant}>{statusLabel}</StatusBadge>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-hairline">
          {actions.showUpgrade && (
            <SettingsButton href={upgradeUrl} variant="primary">
              {actions.upgradeLabel}
            </SettingsButton>
          )}
          {actions.showResume && (
            <SettingsButton href={manageUrl} variant="primary">
              Resume subscription
            </SettingsButton>
          )}
          {actions.showManage && (
            <SettingsButton href={manageUrl}>Manage subscription</SettingsButton>
          )}
          {actions.showBillingPortal && (
            <SettingsButton href={manageUrl}>Billing portal</SettingsButton>
          )}
        </div>
      </SettingsCard>

      {history.length > 0 && (
        <SettingsCard title="Billing history" description="Receipts are emailed after each payment.">
          <SimpleList>
            {history.map((row) => (
              <SimpleListItem
                key={row.id}
                primary={row.label}
                secondary={row.plan !== "—" ? row.plan : undefined}
                meta={row.date ? formatBillingDate(row.date) ?? undefined : undefined}
                action={
                  actions.showBillingPortal ? (
                    <SettingsButton href={manageUrl}>Receipt</SettingsButton>
                  ) : undefined
                }
              />
            ))}
          </SimpleList>
        </SettingsCard>
      )}

      {history.length === 0 && actions.uxState === "free" && (
        <SettingsCard>
          <SettingsRow
            label="No billing history yet"
            description="Upgrade to Pro to start your subscription."
            action={
              <SettingsButton href={upgradeUrl} variant="primary">
                Upgrade plan
              </SettingsButton>
            }
          />
        </SettingsCard>
      )}
    </SettingsPage>
  );
}
