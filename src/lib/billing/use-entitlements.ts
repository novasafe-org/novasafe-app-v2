import { useBillingQuery } from "@/lib/account/account-queries";
import { normalizeSubscriptionState } from "@/lib/billing/subscription-display";

export function useEntitlements() {
  const billing = useBillingQuery();
  const state = normalizeSubscriptionState(billing.data?.ok ? billing.data.state : null);
  return {
    isLoading: billing.isLoading,
    isPro: state.isPro,
    canUsePasswordHistory: state.entitlements.canUsePasswordHistory,
    entitlements: state.entitlements,
    state,
  };
}
