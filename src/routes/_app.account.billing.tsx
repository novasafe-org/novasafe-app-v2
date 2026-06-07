import { useEffect, useRef } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { BillingPageView } from "@/components/billing/BillingPageView";
import { buildAppUrl, buildManageBillingUrl, buildUpgradeUrl } from "@/config";
import {
  loadMembershipAction,
  syncSubscriptionAfterUpgradeAction,
} from "@/lib/account/server-actions";
import {
  normalizeSubscriptionState,
  shouldShowManageSubscription,
  shouldShowUpgrade,
} from "@/lib/billing/subscription-display";

const billingSearchSchema = z.object({
  upgraded: z.enum(["1"]).optional().catch(undefined),
  billingSynced: z.enum(["1"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_app/account/billing")({
  head: () => ({ meta: [{ title: "Billing — NovaSafe" }] }),
  validateSearch: (search) => billingSearchSchema.parse(search),
  staleTime: 60_000,
  loader: async () => loadMembershipAction(),
  component: function Billing() {
    const loaderData = Route.useLoaderData();
    const { upgraded, billingSynced } = Route.useSearch();
    const router = useRouter();
    const refreshedRef = useRef(false);
    const billingReturnUrl = buildAppUrl({ path: "/account/billing" });
    const upgradeUrl = buildUpgradeUrl({ next: billingReturnUrl, ref: "app_billing" });
    const manageUrl = buildManageBillingUrl({ next: billingReturnUrl, ref: "app_billing_manage" });

    useEffect(() => {
      const shouldSync = upgraded === "1" || billingSynced === "1";
      if (!shouldSync || refreshedRef.current || !loaderData.ok) return;
      refreshedRef.current = true;
      (async () => {
        try {
          await syncSubscriptionAfterUpgradeAction();
          await router.invalidate();
          toast.success(
            upgraded === "1"
              ? "Welcome to NovaSafe Pro — your features are unlocked."
              : "Billing updated — your subscription status is current.",
          );
        } catch {
          toast.message("Syncing your subscription…", {
            description: "If your plan doesn't look right, try again in a moment.",
          });
        } finally {
          if (typeof window !== "undefined") {
            const url = new URL(window.location.href);
            url.searchParams.delete("upgraded");
            url.searchParams.delete("billingSynced");
            window.history.replaceState({}, "", url.toString());
          }
        }
      })();
    }, [upgraded, billingSynced, loaderData.ok, router]);

    if (!loaderData.ok) {
      return (
        <BillingPageView
          state={normalizeSubscriptionState(null)}
          purchases={[]}
          recentActivity={[]}
          upgradeUrl={upgradeUrl}
          manageUrl={manageUrl}
          showUpgrade
          showManage={false}
          errorMessage={loaderData.message}
          onRetry={() => void router.invalidate()}
        />
      );
    }

    const { membership, state } = loaderData;
    const purchases = membership.purchases ?? [];

    return (
      <BillingPageView
        state={state}
        purchases={purchases}
        recentActivity={membership.recentActivity ?? []}
        upgradeUrl={upgradeUrl}
        manageUrl={manageUrl}
        showUpgrade={shouldShowUpgrade(state)}
        showManage={shouldShowManageSubscription(state, purchases)}
      />
    );
  },
});
