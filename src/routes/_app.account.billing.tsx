import { useEffect, useRef } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { MembershipCenter } from "@/components/billing/MembershipCenter";
import { buildAppUrl, buildManageBillingUrl, buildUpgradeUrl } from "@/config";
import {
  loadBillingCenterAction,
  syncSubscriptionAfterUpgradeAction,
} from "@/lib/account/server-actions";
import { normalizeSubscriptionState } from "@/lib/billing/subscription-display";

const billingSearchSchema = z.object({
  upgraded: z.enum(["1"]).optional().catch(undefined),
  billingSynced: z.enum(["1"]).optional().catch(undefined),
  portalError: z.enum(["1"]).optional().catch(undefined),
});

export const Route = createFileRoute("/_app/account/billing")({
  head: () => ({ meta: [{ title: "Billing — NovaSafe" }] }),
  validateSearch: (search) => billingSearchSchema.parse(search),
  staleTime: 60_000,
  loader: async () => loadBillingCenterAction(),
  component: function BillingRoute() {
    const loaderData = Route.useLoaderData();
    const { upgraded, billingSynced, portalError } = Route.useSearch();
    const router = useRouter();
    const refreshedRef = useRef(false);
    const portalToastRef = useRef(false);
    const billingReturnUrl = buildAppUrl({ path: "/account/billing" });
    const upgradeUrl = buildUpgradeUrl({ next: billingReturnUrl, ref: "app_billing" });
    const manageUrl = buildManageBillingUrl({ next: billingReturnUrl, ref: "app_billing_manage" });

    useEffect(() => {
      if (portalError === "1" && !portalToastRef.current) {
        portalToastRef.current = true;
        toast.error("Subscription management is not available.", {
          description: "Please contact support at support@novasafe.app.",
        });
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("portalError");
          window.history.replaceState({}, "", url.toString());
        }
      }
    }, [portalError]);

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
        <MembershipCenter
          state={normalizeSubscriptionState(null)}
          purchases={[]}
          recentActivity={[]}
          upgradeUrl={upgradeUrl}
          manageUrl={manageUrl}
          errorMessage={loaderData.message}
          onRetry={() => void router.invalidate()}
        />
      );
    }

    const { membership, state, usage } = loaderData;

    return (
      <MembershipCenter
        state={state}
        purchases={membership.purchases ?? []}
        recentActivity={membership.recentActivity ?? []}
        upgradeUrl={upgradeUrl}
        manageUrl={manageUrl}
        usage={usage}
      />
    );
  },
});
