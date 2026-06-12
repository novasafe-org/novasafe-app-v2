import { useMemo, useState } from "react";
import {
  AlertCircle,
  KeyRound,
  Monitor,
  StickyNote,
  Shield,
  History,
  FolderOpen,
  Sparkles,
  Smartphone,
} from "lucide-react";
import type { SubscriptionState } from "@/lib/api/endpoints/subscriptions";
import {
  formatBillingDate,
  formatPlanLabel,
  getBillingPageActions,
  PRO_PLAN_FEATURES,
  shouldShowBillingHistory,
  type BillingActivityRecord,
  type PurchaseRecord,
} from "@/lib/billing/subscription-display";
import { useVault } from "@/lib/vault-store";
import {
  buildBillingRecommendations,
  buildFeatureEntitlements,
  buildPlanComparison,
  buildSubscriptionTimeline,
  formatMemberSince,
  formatTimelineMonth,
  getBillingHistoryRows,
  membershipHeroStatus,
  paginate,
  renewalDisplay,
} from "./billing-center-helpers";
import {
  SectionCard,
  MembershipHero,
  ValueMetricCard,
  FeatureEntitlementCard,
  SubscriptionTimelineItem,
  BillingHistoryTable,
  PaymentMethodCard,
  PlanComparisonPanel,
  UsageInsightCard,
  BenefitCard,
  TrustIndicatorRow,
  ManagementActionCard,
} from "./billing-center-ui";

export type MembershipCenterProps = {
  state: SubscriptionState;
  purchases: PurchaseRecord[];
  recentActivity: BillingActivityRecord[];
  upgradeUrl: string;
  manageUrl: string;
  usage?: {
    totalItems: number;
    deviceCount: number;
    trustedDevices: number;
  };
  onRetry?: () => void;
  errorMessage?: string | null;
};

export function MembershipCenter({
  state,
  purchases,
  recentActivity,
  upgradeUrl,
  manageUrl,
  usage,
  onRetry,
  errorMessage,
}: MembershipCenterProps) {
  const [historyPage, setHistoryPage] = useState(1);
  const items = useVault((s) => s.items);
  const vaults = useVault((s) => s.vaults);

  const actions = getBillingPageActions(state, purchases);
  const planLabel = formatPlanLabel(state);
  const heroPlan = actions.planHeadline.replace(/^NovaSafe\s*/i, "") || planLabel;
  const status = membershipHeroStatus(state);
  const renewal = renewalDisplay(state);
  const memberSince = formatMemberSince(state.purchasedAt);

  const passwordCount = useMemo(
    () => items.filter((i) => !i.archived && (i.type === "password" || !i.type)).length,
    [items],
  );
  const noteCount = useMemo(
    () => items.filter((i) => !i.archived && i.type === "note").length,
    [items],
  );
  const collectionCount = useMemo(() => {
    const tags = new Set<string>();
    for (const item of items) {
      if (item.archived) continue;
      for (const tag of item.tags) tags.add(tag);
    }
    return tags.size;
  }, [items]);

  const historyRows = useMemo(
    () => getBillingHistoryRows(purchases, recentActivity),
    [purchases, recentActivity],
  );
  const historyPageData = useMemo(
    () => paginate(historyRows, historyPage, 6),
    [historyRows, historyPage],
  );

  const timeline = useMemo(
    () => buildSubscriptionTimeline(purchases, recentActivity).slice(0, 8),
    [purchases, recentActivity],
  );

  const entitlements = useMemo(() => buildFeatureEntitlements(state), [state]);
  const comparison = useMemo(() => buildPlanComparison(state), [state]);
  const recommendations = useMemo(
    () =>
      buildBillingRecommendations(state, upgradeUrl, {
        deviceCount: usage?.deviceCount ?? 0,
      }),
    [state, upgradeUrl, usage],
  );

  const lastBilling = historyRows[0]?.date ? formatBillingDate(historyRows[0].date) : null;
  const showHistory = shouldShowBillingHistory(actions.uxState, historyRows);
  const isPro = actions.uxState === "pro" || actions.uxState === "cancelled_active";

  const devicesUsed = usage?.deviceCount ?? 0;
  const deviceLimit = state.entitlements.canUseMultiDevice ? undefined : state.limits.maxDevices;
  const passwordLimit = state.entitlements.canUseUnlimitedPasswords
    ? undefined
    : state.limits.maxPasswords;

  if (errorMessage) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="rounded-xl border border-hairline bg-surface p-6 flex items-start gap-3">
          <AlertCircle className="size-5 text-warning shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg font-semibold text-ink">Billing</h1>
            <p className="text-sm text-ink-muted mt-1">{errorMessage}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 text-sm font-medium text-brand hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      {/* SECTION 1: Membership Hero */}
      <MembershipHero
        planLabel={heroPlan}
        status={status}
        memberSince={memberSince}
        renewalLabel={renewal.label}
        renewalDate={renewal.date}
        isPro={isPro}
        upgradeUrl={upgradeUrl}
        manageUrl={manageUrl}
        showUpgrade={actions.showUpgrade}
        showManage={actions.showManage}
        showResume={actions.showResume}
        showBillingPortal={actions.showBillingPortal}
        upgradeLabel={actions.upgradeLabel}
      />

      {/* SECTION 2: Membership Value Dashboard */}
      <SectionCard title="Your membership value" description="What NovaSafe protects for you">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <ValueMetricCard
            icon={<Smartphone className="size-4" />}
            label="Devices protected"
            value={usage?.trustedDevices ?? devicesUsed}
            hint={`${devicesUsed} active session${devicesUsed === 1 ? "" : "s"}`}
          />
          <ValueMetricCard
            icon={<KeyRound className="size-4" />}
            label="Passwords secured"
            value={passwordCount || usage?.totalItems || 0}
          />
          <ValueMetricCard
            icon={<StickyNote className="size-4" />}
            label="Secure notes"
            value={noteCount}
          />
          <ValueMetricCard
            icon={<Shield className="size-4" />}
            label="Vault items"
            value={usage?.totalItems || items.filter((i) => !i.archived).length}
          />
          <ValueMetricCard
            icon={<FolderOpen className="size-4" />}
            label="Folders"
            value={vaults.length}
          />
          <ValueMetricCard
            icon={<History className="size-4" />}
            label="Collections"
            value={collectionCount}
          />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* SECTION 3: Feature Access Center */}
        <SectionCard
          title="Feature access"
          description={isPro ? "Included in your plan" : "Upgrade to unlock"}
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {entitlements.map((f) => (
              <FeatureEntitlementCard
                key={f.id}
                label={f.label}
                included={f.included}
                description={f.description}
              />
            ))}
          </div>
        </SectionCard>

        {/* SECTION 4: Subscription Timeline */}
        <SectionCard title="Membership timeline" description="Plan changes and renewals">
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-muted">
              {isPro ? "No timeline events yet." : "Subscribe to Pro to see your membership history."}
            </p>
          ) : (
            <div className="pl-1">
              {timeline.map((event) => (
                <SubscriptionTimelineItem
                  key={event.id}
                  title={event.title}
                  subtitle={event.subtitle}
                  month={formatTimelineMonth(event.at)}
                  type={event.type}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* SECTION 5: Billing History */}
      {showHistory && (
        <SectionCard
          title="Billing history"
          description={`${historyRows.length} transaction${historyRows.length === 1 ? "" : "s"}`}
        >
          <BillingHistoryTable
            rows={historyPageData.items}
            page={historyPageData.page}
            totalPages={historyPageData.totalPages}
            onPageChange={setHistoryPage}
            manageUrl={manageUrl}
          />
        </SectionCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 6: Payment Method */}
        <SectionCard title="Payment method" description="Billing via Paddle">
          <PaymentMethodCard manageUrl={manageUrl} lastBilling={lastBilling} />
        </SectionCard>

        {/* SECTION 8: Usage Insights */}
        <SectionCard title="Usage insights" description="How you're using your plan">
          <div className="grid grid-cols-2 gap-3">
            <UsageInsightCard
              label="Devices used"
              value={devicesUsed}
              max={deviceLimit}
              unit="devices"
            />
            <UsageInsightCard
              label="Vault items"
              value={usage?.totalItems || passwordCount}
            />
            <UsageInsightCard
              label="Passwords"
              value={passwordCount}
              max={passwordLimit}
            />
            <UsageInsightCard label="Collections" value={collectionCount} />
          </div>
        </SectionCard>
      </div>

      {/* SECTION 7: Plan Comparison */}
      <SectionCard title="Plan comparison" description={`${comparison.currentPlan} vs ${comparison.targetPlan}`}>
        <PlanComparisonPanel
          currentPlan={comparison.currentPlan}
          targetPlan={comparison.targetPlan}
          rows={comparison.rows}
          savings={comparison.savings}
          upgradeUrl={upgradeUrl}
          showCta={actions.showUpgrade || comparison.targetPlan !== comparison.currentPlan}
        />
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 9: Recommendations */}
        {recommendations.length > 0 && (
          <SectionCard title="Recommendations" description="Get more from your membership">
            <div className="space-y-2">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-hairline bg-surface-elev/40 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{rec.title}</p>
                    <p className="text-xs text-ink-muted mt-0.5">{rec.description}</p>
                  </div>
                  {rec.href ? (
                    <a
                      href={rec.href}
                      className="shrink-0 h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition inline-flex items-center justify-center"
                    >
                      Take action
                    </a>
                  ) : (
                    <a
                      href={manageUrl}
                      className="shrink-0 h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition inline-flex items-center justify-center"
                    >
                      Take action
                    </a>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* SECTION 10: Subscription Management */}
        <SectionCard title="Manage membership" description="RevenueCat & Paddle">
          <ManagementActionCard
            actions={actions}
            manageUrl={manageUrl}
            upgradeUrl={upgradeUrl}
          />
        </SectionCard>
      </div>

      {/* SECTION 11: Membership Benefits */}
      <SectionCard title="Why NovaSafe Pro?" description="Premium protection for your digital life">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              title: "Multi-device sync",
              description: "Access your vault on web, mobile, and browser extension.",
            },
            {
              title: "Advanced security",
              description: "Priority breach monitoring and security insights.",
            },
            {
              title: "Password history",
              description: "Track and rotate credentials with full history.",
            },
            {
              title: "Premium protection",
              description: "Unlimited storage with zero-knowledge encryption.",
            },
          ].map((b) => (
            <BenefitCard key={b.title} title={b.title} description={b.description} />
          ))}
        </div>
        {!isPro && (
          <ul className="mt-4 space-y-1.5 text-xs text-ink-muted">
            {PRO_PLAN_FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-2">
                <Sparkles className="size-3 text-brand shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {/* SECTION 12: Account Trust */}
      <SectionCard title="Billing trust & security" description="How we protect your payment data">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TrustIndicatorRow
            label="Subscription provider"
            value="RevenueCat"
            icon={<Shield className="size-4" />}
          />
          <TrustIndicatorRow
            label="Payment processor"
            value="Paddle"
            icon={<Monitor className="size-4" />}
          />
          <TrustIndicatorRow
            label="Security"
            value="Encrypted billing data"
            icon={<KeyRound className="size-4" />}
          />
        </div>
      </SectionCard>
    </div>
  );
}
