import type { SubscriptionLifecycleStatus, SubscriptionState } from "@/lib/api/endpoints/subscriptions";

export type PurchaseRecord = {
  eventId: string;
  eventType: string;
  productId: string | null;
  transactionId: string | null;
  store: string | null;
  environment: string | null;
  purchasedAt: string | null;
};

export type BillingActivityRecord = {
  eventType: string;
  processedAt: string | null;
  status?: string;
};

const MONTHLY_HINTS = ["month", "monthly"];
const YEARLY_HINTS = ["year", "yearly", "annual"];

export function formatPlanLabel(state: Pick<SubscriptionState, "isPro" | "tier" | "productId">): string {
  if (!state.isPro && state.tier !== "pro") return "Free";
  const product = (state.productId || "").toLowerCase();
  if (YEARLY_HINTS.some((hint) => product.includes(hint))) return "Pro Annual";
  if (MONTHLY_HINTS.some((hint) => product.includes(hint))) return "Pro Monthly";
  return "Pro";
}

export function formatSubscriptionStatusLabel(
  status: SubscriptionLifecycleStatus | string | null | undefined,
  state: Pick<SubscriptionState, "inGracePeriod" | "billingIssueDetectedAt" | "cancellationAt" | "isActive">,
): string {
  if (state.inGracePeriod) return "Grace period";
  if (state.billingIssueDetectedAt || status === "billing_issue") return "Past due";
  if (status === "cancelled") return state.isActive ? "Cancelled" : "Expired";
  if (status === "expired") return "Expired";
  if (status === "active" && state.cancellationAt) return "Cancelled";
  if (status === "active") return "Active";
  if (status === "inactive" && !state.isActive) return "Inactive";
  if (typeof status === "string" && status.length > 0) return status.replaceAll("_", " ");
  return "Unknown";
}

/** Coerce partial API payloads so billing UI never crashes on missing fields. */
export function normalizeSubscriptionState(
  raw: Partial<SubscriptionState> | null | undefined,
): SubscriptionState {
  const entitlements = raw?.entitlements ?? {};
  const limits = raw?.limits ?? {};
  return {
    tier: raw?.tier === "pro" ? "pro" : "free",
    isPro: Boolean(raw?.isPro),
    productId: raw?.productId ?? null,
    entitlementId: raw?.entitlementId ?? null,
    isActive: Boolean(raw?.isActive),
    expiresAt: raw?.expiresAt ?? null,
    renewsAt: raw?.renewsAt ?? null,
    purchasedAt: raw?.purchasedAt ?? null,
    lastRenewalAt: raw?.lastRenewalAt ?? null,
    cancellationAt: raw?.cancellationAt ?? null,
    inGracePeriod: Boolean(raw?.inGracePeriod),
    billingIssueDetectedAt: raw?.billingIssueDetectedAt ?? null,
    trialEndsAt: raw?.trialEndsAt ?? null,
    platform: raw?.platform ?? null,
    autoRenewing: Boolean(raw?.autoRenewing),
    subscriptionProvider: "revenuecat",
    subscriptionStatus: (raw?.subscriptionStatus as SubscriptionLifecycleStatus) ?? "inactive",
    entitlements: {
      canUseCloudSync: Boolean(entitlements.canUseCloudSync),
      canUseCSVImportExport: Boolean(entitlements.canUseCSVImportExport),
      canUseUnlimitedPasswords: Boolean(entitlements.canUseUnlimitedPasswords),
      canUseUnlimitedNotes: Boolean(entitlements.canUseUnlimitedNotes),
      canUsePasswordHistory: Boolean(entitlements.canUsePasswordHistory),
      canUseAdvancedSecurity: Boolean(entitlements.canUseAdvancedSecurity),
      canUseMultiDevice: Boolean(entitlements.canUseMultiDevice),
    },
    limits: {
      maxPasswords: Number(limits.maxPasswords) || 15,
      maxSecureNotes: Number(limits.maxSecureNotes) || 5,
      maxDevices: Number(limits.maxDevices) || 1,
    },
    updatedAt: raw?.updatedAt ?? new Date().toISOString(),
  };
}

export function getRenewalDisplayDate(state: SubscriptionState): string | null {
  if (state.subscriptionStatus === "cancelled" || state.cancellationAt) {
    return formatBillingDate(state.expiresAt);
  }
  if (state.isPro && state.renewsAt) {
    return formatBillingDate(state.renewsAt);
  }
  if (!state.isPro && state.expiresAt) {
    return formatBillingDate(state.expiresAt);
  }
  return null;
}

export function getRenewalDisplayLabel(state: SubscriptionState): string | null {
  if (state.subscriptionStatus === "cancelled" || state.cancellationAt) {
    return state.isActive ? "Access until" : "Expired";
  }
  if (state.isPro && state.renewsAt) return "Renews";
  if (!state.isPro && state.expiresAt) return "Expired";
  return null;
}

export type BillingFeatureCard = {
  id: string;
  label: string;
  value: string;
  included: boolean;
};

export function buildBillingFeatureCards(state: SubscriptionState): BillingFeatureCard[] {
  const { entitlements: e, limits: l } = state;
  return [
    {
      id: "passwords",
      label: "Passwords",
      value: e.canUseUnlimitedPasswords ? "Unlimited" : `Up to ${l.maxPasswords}`,
      included: e.canUseUnlimitedPasswords,
    },
    {
      id: "devices",
      label: "Devices",
      value: e.canUseMultiDevice ? "All your devices" : `${l.maxDevices} trusted device`,
      included: e.canUseMultiDevice,
    },
    {
      id: "security",
      label: "Security alerts",
      value: e.canUseAdvancedSecurity ? "Priority monitoring" : "Breach monitoring",
      included: e.canUseAdvancedSecurity,
    },
    {
      id: "history",
      label: "Password history",
      value: e.canUsePasswordHistory ? "Full history" : "Pro feature",
      included: e.canUsePasswordHistory,
    },
    {
      id: "fields",
      label: "Custom fields",
      value: "Unlimited",
      included: true,
    },
  ];
}

export function formatBillingDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) return null;
  return new Date(time).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function buildPlanSubtitle(state: SubscriptionState): string {
  const status = formatSubscriptionStatusLabel(state.subscriptionStatus, state);
  const parts: string[] = [status];

  if (state.subscriptionStatus === "cancelled" || state.cancellationAt) {
    const ends = formatBillingDate(state.expiresAt);
    if (ends) parts.push(`Access until ${ends}`);
  } else if (state.isPro && state.renewsAt) {
    const renews = formatBillingDate(state.renewsAt);
    if (renews) parts.push(`Renews ${renews}`);
  } else if (!state.isPro && state.expiresAt) {
    const expired = formatBillingDate(state.expiresAt);
    if (expired) parts.push(`Expired ${expired}`);
  } else if (state.billingIssueDetectedAt) {
    parts.push("Update payment method in the billing portal");
  }

  return parts.join(" · ");
}

/** Billing page lifecycle — drives CTA visibility on app.novasafe.io/account/billing */
export type BillingUxState = "free" | "pro" | "cancelled_active" | "expired";

export type BillingPageActions = {
  uxState: BillingUxState;
  showUpgrade: boolean;
  upgradeLabel: string;
  showManage: boolean;
  showBillingPortal: boolean;
  showResume: boolean;
  planHeadline: string;
  planSubline: string;
};

export function resolveBillingUxState(state: SubscriptionState): BillingUxState {
  const hasCancellation =
    state.subscriptionStatus === "cancelled" ||
    Boolean(state.cancellationAt) ||
    (state.subscriptionStatus === "active" && Boolean(state.cancellationAt));

  if (state.isPro && state.isActive && hasCancellation) {
    return "cancelled_active";
  }

  if (state.isPro && state.isActive) {
    return "pro";
  }

  if (state.inGracePeriod || state.subscriptionStatus === "billing_issue") {
    return "pro";
  }

  const hadSubscription =
    state.subscriptionStatus === "expired" ||
    state.subscriptionStatus === "cancelled" ||
    Boolean(state.cancellationAt) ||
    Boolean(state.purchasedAt) ||
    Boolean(state.expiresAt);

  if (!state.isPro && hadSubscription) {
    return "expired";
  }

  return "free";
}

export function getBillingPageActions(
  state: SubscriptionState,
  purchases: PurchaseRecord[],
): BillingPageActions {
  const uxState = resolveBillingUxState(state);
  const planLabel = formatPlanLabel(state);

  switch (uxState) {
    case "free":
      return {
        uxState,
        showUpgrade: true,
        upgradeLabel: "Upgrade to Pro",
        showManage: false,
        showBillingPortal: false,
        showResume: false,
        planHeadline: "NovaSafe Free",
        planSubline: "Usage limits apply on the free plan",
      };
    case "pro":
      return {
        uxState,
        showUpgrade: false,
        upgradeLabel: "Upgrade to Pro",
        showManage: true,
        showBillingPortal: true,
        showResume: false,
        planHeadline: planLabel === "Free" ? "NovaSafe Pro" : `NovaSafe ${planLabel}`,
        planSubline: "Active subscription",
      };
    case "cancelled_active":
      return {
        uxState,
        showUpgrade: false,
        upgradeLabel: "Upgrade to Pro",
        showManage: true,
        showBillingPortal: true,
        showResume: true,
        planHeadline: planLabel === "Free" ? "NovaSafe Pro" : `NovaSafe ${planLabel}`,
        planSubline: "Cancelled — access continues until your billing period ends",
      };
    case "expired":
      return {
        uxState,
        showUpgrade: true,
        upgradeLabel: "Upgrade again",
        showManage: purchases.length > 0,
        showBillingPortal: purchases.length > 0,
        showResume: false,
        planHeadline: "Subscription expired",
        planSubline: "You're on the free plan. Upgrade to restore Pro features.",
      };
  }
}

export function shouldShowUpgrade(state: SubscriptionState): boolean {
  return getBillingPageActions(state, []).showUpgrade;
}

export function shouldShowManageSubscription(
  state: SubscriptionState,
  purchases: PurchaseRecord[],
): boolean {
  return getBillingPageActions(state, purchases).showManage;
}

export type BillingHistoryRow = ReturnType<typeof mergeBillingHistoryRows>[number];

export function shouldShowBillingHistory(
  uxState: BillingUxState,
  rows: BillingHistoryRow[],
): boolean {
  if (uxState === "free") return false;
  return rows.length > 0;
}

export function partitionBillingHistory(
  rows: BillingHistoryRow[],
  uxState: BillingUxState,
): { title: string; rows: BillingHistoryRow[] }[] {
  if (uxState === "free" || rows.length === 0) return [];

  if (uxState === "expired") {
    const past = rows
      .filter((row) => !/renewal/i.test(row.label))
      .slice(0, 8);
    if (past.length === 0) return [];
    return [{ title: "Past subscription", rows: past }];
  }

  const renewals = rows.filter((row) => /renewal/i.test(row.label));
  const other = rows.filter((row) => !/renewal/i.test(row.label));

  if (uxState === "pro" || uxState === "cancelled_active") {
    const sections: { title: string; rows: BillingHistoryRow[] }[] = [];
    if (renewals.length > 0) {
      sections.push({ title: "Active subscription", rows: renewals.slice(0, 10) });
    }
    const remainder = [...other, ...renewals.slice(10)];
    if (remainder.length > 0) {
      sections.push({
        title: renewals.length > 0 ? "Earlier activity" : "Billing history",
        rows: remainder.slice(0, 8),
      });
    }
    if (sections.length === 0) {
      return [{ title: "Billing history", rows: rows.slice(0, 12) }];
    }
    return sections;
  }

  return [{ title: "Billing history", rows: rows.slice(0, 12) }];
}

export function formatProductLabel(productId: string | null): string {
  if (!productId) return "NovaSafe Pro";
  const lower = productId.toLowerCase();
  if (YEARLY_HINTS.some((hint) => lower.includes(hint))) return "Pro Annual";
  if (MONTHLY_HINTS.some((hint) => lower.includes(hint))) return "Pro Monthly";
  return productId.replaceAll("_", " ");
}

export function formatPurchaseEventLabel(eventType: string): string {
  return eventType.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatActivityEventLabel(eventType: string): string {
  const map: Record<string, string> = {
    INITIAL_PURCHASE: "Subscription started",
    RENEWAL: "Renewal",
    CANCELLATION: "Cancellation",
    EXPIRATION: "Expired",
    BILLING_ISSUE: "Payment issue",
    UNCANCELLATION: "Subscription resumed",
    PRODUCT_CHANGE: "Plan changed",
  };
  return map[eventType] || formatPurchaseEventLabel(eventType);
}

export function mergeBillingHistoryRows(
  purchases: PurchaseRecord[],
  activity: BillingActivityRecord[],
): Array<{
  id: string;
  date: string | null;
  label: string;
  plan: string;
  status: string;
  source: "purchase" | "event";
}> {
  const purchaseRows = purchases.map((row) => ({
    id: `purchase-${row.transactionId || row.eventId}`,
    date: row.purchasedAt,
    label: formatPurchaseEventLabel(row.eventType),
    plan: formatProductLabel(row.productId),
    status: "Completed",
    source: "purchase" as const,
  }));

  const eventTypesInPurchases = new Set(purchases.map((p) => p.eventType));
  const activityRows = activity
    .filter((row) => !["TEST", "INVOICE_ISSUANCE"].includes(row.eventType))
    .filter((row) => {
      if (row.eventType === "INITIAL_PURCHASE" || row.eventType === "RENEWAL") {
        return !eventTypesInPurchases.has(row.eventType);
      }
      return true;
    })
    .map((row, index) => ({
      id: `event-${row.eventType}-${index}`,
      date: row.processedAt,
      label: formatActivityEventLabel(row.eventType),
      plan: "—",
      status: row.status === "completed" ? "Processed" : row.status || "Recorded",
      source: "event" as const,
    }));

  return [...purchaseRows, ...activityRows]
    .sort((a, b) => Date.parse(b.date || "") - Date.parse(a.date || ""))
    .slice(0, 25);
}

export const FREE_PLAN_FEATURES = [
  "Up to 15 passwords and 5 secure notes",
  "Encrypted vault on one device",
  "Breach monitoring alerts",
] as const;

export const PRO_PLAN_FEATURES = [
  "Unlimited passwords, notes, and cards",
  "Sync across web, mobile, and extension",
  "Password history and CSV import/export",
  "Priority breach monitoring",
] as const;
