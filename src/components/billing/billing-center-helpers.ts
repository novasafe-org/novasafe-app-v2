import type { SubscriptionState } from "@/lib/api/endpoints/subscriptions";
import {
  formatActivityEventLabel,
  formatBillingDate,
  formatPlanLabel,
  formatProductLabel,
  formatPurchaseEventLabel,
  formatSubscriptionStatusLabel,
  getBillingPageActions,
  mergeBillingHistoryRows,
  type BillingActivityRecord,
  type PurchaseRecord,
} from "@/lib/billing/subscription-display";

export type MembershipStatusTone = "healthy" | "attention" | "risk" | "neutral";

export function membershipHeroStatus(state: SubscriptionState): {
  label: string;
  tone: MembershipStatusTone;
} {
  if (state.trialEndsAt) {
    const trialEnd = Date.parse(state.trialEndsAt);
    if (Number.isFinite(trialEnd) && trialEnd > Date.now()) {
      return { label: "Trial", tone: "attention" };
    }
  }
  if (state.inGracePeriod || state.subscriptionStatus === "billing_issue") {
    return { label: "Past due", tone: "risk" };
  }
  if (state.subscriptionStatus === "expired" || (!state.isActive && !state.isPro)) {
    return { label: "Expired", tone: "neutral" };
  }
  if (state.cancellationAt || state.subscriptionStatus === "cancelled") {
    if (state.isActive) return { label: "Expiring soon", tone: "attention" };
    return { label: "Cancelled", tone: "attention" };
  }
  if (state.isActive && state.isPro) return { label: "Active", tone: "healthy" };
  const base = formatSubscriptionStatusLabel(state.subscriptionStatus, state);
  if (base === "Active") return { label: "Active", tone: "healthy" };
  return { label: base, tone: "neutral" };
}

export function formatMemberSince(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export type SubscriptionTimelineEvent = {
  id: string;
  title: string;
  subtitle?: string;
  at: number;
  type: "start" | "renewal" | "upgrade" | "downgrade" | "cancel" | "resume";
};

export function buildSubscriptionTimeline(
  purchases: PurchaseRecord[],
  activity: BillingActivityRecord[],
): SubscriptionTimelineEvent[] {
  const events: SubscriptionTimelineEvent[] = [];

  for (const p of purchases) {
    const at = p.purchasedAt ? Date.parse(p.purchasedAt) : Date.now();
    const type =
      p.eventType === "INITIAL_PURCHASE"
        ? "start"
        : /renewal/i.test(p.eventType)
          ? "renewal"
          : /product/i.test(p.eventType)
            ? "upgrade"
            : "start";
    events.push({
      id: `purchase-${p.transactionId || p.eventId}`,
      title: formatPurchaseEventLabel(p.eventType),
      subtitle: formatProductLabel(p.productId),
      at,
      type,
    });
  }

  for (const [i, row] of activity.entries()) {
    const at = row.processedAt ? Date.parse(row.processedAt) : Date.now();
    const label = formatActivityEventLabel(row.eventType);
    const type =
      row.eventType === "INITIAL_PURCHASE"
        ? "start"
        : row.eventType === "RENEWAL"
          ? "renewal"
          : row.eventType === "CANCELLATION"
            ? "cancel"
            : row.eventType === "UNCANCELLATION"
              ? "resume"
              : row.eventType === "PRODUCT_CHANGE"
                ? "upgrade"
                : "renewal";
    events.push({
      id: `activity-${row.eventType}-${i}`,
      title: label,
      at,
      type,
    });
  }

  if (events.length === 0) return [];

  events.sort((a, b) => b.at - a.at);

  const seen = new Set<string>();
  return events.filter((e) => {
    const key = `${e.title}-${e.at}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export type BillingRecommendation = {
  id: string;
  title: string;
  description: string;
  href?: string;
  done: boolean;
};

export function buildBillingRecommendations(
  state: SubscriptionState,
  upgradeUrl: string,
  usage: { deviceCount: number },
): BillingRecommendation[] {
  const actions = getBillingPageActions(state, []);
  const plan = formatPlanLabel(state);
  const all: BillingRecommendation[] = [];

  if (actions.showUpgrade) {
    all.push({
      id: "upgrade",
      title: "Upgrade to Pro",
      description: "Unlock unlimited passwords, multi-device sync, and password history.",
      href: upgradeUrl,
      done: false,
    });
  }

  if (state.isPro && plan === "Pro Monthly" && state.isActive && !state.cancellationAt) {
    all.push({
      id: "annual",
      title: "Switch to annual billing",
      description: "Save with Pro Annual — one payment, full year of protection.",
      href: upgradeUrl,
      done: false,
    });
  }

  if (!state.entitlements.canUsePasswordHistory && !state.isPro) {
    all.push({
      id: "history",
      title: "Enable password history",
      description: "Track previous passwords and rotate credentials with confidence.",
      href: upgradeUrl,
      done: false,
    });
  }

  if (!state.entitlements.canUseMultiDevice && usage.deviceCount > state.limits.maxDevices) {
    all.push({
      id: "devices",
      title: "Secure more devices",
      description: `You're using ${usage.deviceCount} devices on a ${state.limits.maxDevices}-device plan.`,
      href: upgradeUrl,
      done: false,
    });
  }

  if (actions.showResume) {
    all.push({
      id: "resume",
      title: "Resume your subscription",
      description: "Keep Pro features without interruption.",
      done: false,
    });
  }

  return all.filter((r) => !r.done);
}

export type FeatureEntitlement = {
  id: string;
  label: string;
  included: boolean;
  description?: string;
};

export function buildFeatureEntitlements(state: SubscriptionState): FeatureEntitlement[] {
  const e = state.entitlements;
  const l = state.limits;
  return [
    {
      id: "vault",
      label: "Unlimited vault items",
      included: e.canUseUnlimitedPasswords,
      description: e.canUseUnlimitedPasswords ? "No limits on stored credentials" : `Up to ${l.maxPasswords} passwords`,
    },
    {
      id: "devices",
      label: "Multi-device access",
      included: e.canUseMultiDevice,
      description: e.canUseMultiDevice ? "Web, mobile, and extension" : `${l.maxDevices} trusted device`,
    },
    {
      id: "history",
      label: "Password history",
      included: e.canUsePasswordHistory,
      description: e.canUsePasswordHistory ? "Full credential history" : "Pro feature",
    },
    {
      id: "security",
      label: "Advanced security features",
      included: e.canUseAdvancedSecurity,
      description: e.canUseAdvancedSecurity ? "Priority monitoring" : "Basic breach alerts",
    },
    {
      id: "notes",
      label: "Secure notes",
      included: e.canUseUnlimitedNotes,
      description: e.canUseUnlimitedNotes ? "Unlimited secure notes" : `Up to ${l.maxSecureNotes} notes`,
    },
    {
      id: "extension",
      label: "Browser extension",
      included: true,
      description: "Autofill on supported browsers",
    },
    {
      id: "sync",
      label: "Cloud sync",
      included: e.canUseCloudSync,
      description: e.canUseCloudSync ? "Encrypted sync everywhere" : "Pro feature",
    },
    {
      id: "export",
      label: "CSV import & export",
      included: e.canUseCSVImportExport,
      description: e.canUseCSVImportExport ? "Full data portability" : "Pro feature",
    },
  ];
}

export type PlanComparisonRow = {
  feature: string;
  current: string;
  upgrade: string;
  highlight?: boolean;
};

export function buildPlanComparison(state: SubscriptionState): {
  currentPlan: string;
  targetPlan: string;
  rows: PlanComparisonRow[];
  savings?: string;
} {
  const current = formatPlanLabel(state);
  const isPro = state.isPro;

  if (!isPro) {
    return {
      currentPlan: "Free",
      targetPlan: "Pro",
      savings: "Best value with Pro Annual",
      rows: [
        { feature: "Passwords", current: `Up to ${state.limits.maxPasswords}`, upgrade: "Unlimited", highlight: true },
        { feature: "Devices", current: `${state.limits.maxDevices} device`, upgrade: "All devices", highlight: true },
        { feature: "Password history", current: "—", upgrade: "Included", highlight: true },
        { feature: "Cloud sync", current: "—", upgrade: "Included" },
        { feature: "CSV export", current: "—", upgrade: "Included" },
      ],
    };
  }

  if (current === "Pro Monthly") {
    return {
      currentPlan: "Pro Monthly",
      targetPlan: "Pro Annual",
      savings: "Save ~2 months per year",
      rows: [
        { feature: "Billing", current: "Monthly", upgrade: "Annual", highlight: true },
        { feature: "All Pro features", current: "Included", upgrade: "Included" },
        { feature: "Priority support", current: "Included", upgrade: "Included" },
      ],
    };
  }

  return {
    currentPlan: current,
    targetPlan: "Pro",
    rows: [
      { feature: "Status", current: "You're on the best plan", upgrade: "—" },
      { feature: "All features", current: "Unlocked", upgrade: "—" },
    ],
  };
}

export function paginate<T>(items: T[], page: number, pageSize: number): {
  items: T[];
  totalPages: number;
  page: number;
} {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
  };
}

export function getBillingHistoryRows(
  purchases: PurchaseRecord[],
  activity: BillingActivityRecord[],
) {
  return mergeBillingHistoryRows(purchases, activity);
}

export function formatTimelineMonth(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function renewalDisplay(state: SubscriptionState): {
  label: string;
  date: string | null;
} {
  if (state.cancellationAt && state.isActive) {
    return { label: "Access until", date: formatBillingDate(state.expiresAt) };
  }
  if (state.isPro && state.renewsAt) {
    return { label: "Renews on", date: formatBillingDate(state.renewsAt) };
  }
  if (state.trialEndsAt) {
    return { label: "Trial ends", date: formatBillingDate(state.trialEndsAt) };
  }
  return { label: "Next billing", date: formatBillingDate(state.renewsAt || state.expiresAt) };
}
