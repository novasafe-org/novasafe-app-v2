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
  status: SubscriptionLifecycleStatus,
  state: Pick<SubscriptionState, "inGracePeriod" | "billingIssueDetectedAt" | "cancellationAt" | "isActive">,
): string {
  if (state.inGracePeriod) return "Grace period";
  if (state.billingIssueDetectedAt || status === "billing_issue") return "Past due";
  if (status === "cancelled") return state.isActive ? "Cancelled" : "Expired";
  if (status === "expired") return "Expired";
  if (status === "active" && state.cancellationAt) return "Cancelled";
  if (status === "active") return "Active";
  if (status === "inactive" && !state.isActive) return "Inactive";
  return status.replaceAll("_", " ");
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

export function shouldShowUpgrade(state: SubscriptionState): boolean {
  return !state.isPro && state.tier !== "pro";
}

export function shouldShowManageSubscription(
  state: SubscriptionState,
  purchases: PurchaseRecord[],
): boolean {
  if (state.isPro || state.inGracePeriod) return true;
  if (
    state.subscriptionStatus === "cancelled" ||
    state.subscriptionStatus === "billing_issue" ||
    state.subscriptionStatus === "grace_period"
  ) {
    return true;
  }
  return purchases.length > 0;
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
