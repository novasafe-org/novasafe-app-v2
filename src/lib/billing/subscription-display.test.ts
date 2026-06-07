import { describe, expect, it } from "vitest";
import type { SubscriptionState } from "@/lib/api/endpoints/subscriptions";
import {
  getBillingPageActions,
  partitionBillingHistory,
  resolveBillingUxState,
  shouldShowBillingHistory,
} from "./subscription-display";

const base = (): SubscriptionState => ({
  tier: "free",
  isPro: false,
  productId: null,
  entitlementId: null,
  isActive: false,
  expiresAt: null,
  renewsAt: null,
  purchasedAt: null,
  lastRenewalAt: null,
  cancellationAt: null,
  inGracePeriod: false,
  billingIssueDetectedAt: null,
  trialEndsAt: null,
  platform: null,
  autoRenewing: false,
  subscriptionProvider: "revenuecat",
  subscriptionStatus: "inactive",
  entitlements: {
    canUseCloudSync: false,
    canUseCSVImportExport: false,
    canUseUnlimitedPasswords: false,
    canUseUnlimitedNotes: false,
    canUsePasswordHistory: false,
    canUseAdvancedSecurity: false,
    canUseMultiDevice: false,
  },
  limits: { maxPasswords: 15, maxSecureNotes: 5, maxDevices: 1 },
  updatedAt: new Date().toISOString(),
});

describe("billing UX states", () => {
  it("classifies free users", () => {
    expect(resolveBillingUxState(base())).toBe("free");
    const actions = getBillingPageActions(base(), []);
    expect(actions.showUpgrade).toBe(true);
    expect(actions.showManage).toBe(false);
    expect(actions.showBillingPortal).toBe(false);
  });

  it("classifies active pro users", () => {
    const pro = {
      ...base(),
      tier: "pro" as const,
      isPro: true,
      isActive: true,
      subscriptionStatus: "active" as const,
      productId: "novasafe_pro_annual",
      renewsAt: "2026-07-01T00:00:00.000Z",
    };
    expect(resolveBillingUxState(pro)).toBe("pro");
    const actions = getBillingPageActions(pro, []);
    expect(actions.showUpgrade).toBe(false);
    expect(actions.showManage).toBe(true);
    expect(actions.showBillingPortal).toBe(true);
  });

  it("classifies cancelled-but-active users", () => {
    const cancelled = {
      ...base(),
      tier: "pro" as const,
      isPro: true,
      isActive: true,
      subscriptionStatus: "cancelled" as const,
      cancellationAt: "2026-06-01T00:00:00.000Z",
      expiresAt: "2026-07-01T00:00:00.000Z",
    };
    expect(resolveBillingUxState(cancelled)).toBe("cancelled_active");
    const actions = getBillingPageActions(cancelled, [{ eventId: "1" } as never]);
    expect(actions.showResume).toBe(true);
    expect(actions.showUpgrade).toBe(false);
  });

  it("classifies expired users", () => {
    const expired = {
      ...base(),
      subscriptionStatus: "expired" as const,
      purchasedAt: "2025-01-01T00:00:00.000Z",
      expiresAt: "2026-01-01T00:00:00.000Z",
    };
    expect(resolveBillingUxState(expired)).toBe("expired");
    const actions = getBillingPageActions(expired, []);
    expect(actions.upgradeLabel).toBe("Upgrade again");
    expect(actions.showManage).toBe(false);
    expect(actions.showBillingPortal).toBe(false);
    const withHistory = getBillingPageActions(expired, [{ eventId: "1" } as never]);
    expect(withHistory.showManage).toBe(false);
    expect(withHistory.showBillingPortal).toBe(false);
  });

  it("hides history for free users", () => {
    expect(shouldShowBillingHistory("free", [{ id: "1" } as never])).toBe(false);
  });

  it("filters renewal noise for expired users", () => {
    const sections = partitionBillingHistory(
      [
        { id: "1", label: "Renewal", date: "2026-01-01", plan: "Pro", status: "Completed", source: "purchase" },
        { id: "2", label: "Cancellation", date: "2026-02-01", plan: "—", status: "Processed", source: "event" },
      ],
      "expired",
    );
    expect(sections).toHaveLength(1);
    expect(sections[0]?.rows).toHaveLength(1);
    expect(sections[0]?.rows[0]?.label).toBe("Cancellation");
  });
});
