import { useEffect, useRef } from "react";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { AlertCircle, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { buildAppUrl, buildManageBillingUrl, buildUpgradeUrl } from "@/config";
import {
  loadMembershipAction,
  syncSubscriptionAfterUpgradeAction,
} from "@/lib/account/server-actions";
import {
  buildPlanSubtitle,
  formatBillingDate,
  formatPlanLabel,
  FREE_PLAN_FEATURES,
  mergeBillingHistoryRows,
  PRO_PLAN_FEATURES,
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
          router.navigate({ to: "/account/billing", search: {}, replace: true });
        }
      })();
    }, [upgraded, billingSynced, loaderData.ok, router]);

    if (!loaderData.ok) {
      return (
        <div className="p-6 max-w-3xl space-y-4">
          <h1 className="text-xl font-semibold">Billing</h1>
          <div className="rounded-2xl hairline bg-surface p-4 flex items-start gap-3 text-sm">
            <AlertCircle className="size-4 text-warning mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Couldn't load billing details</div>
              <p className="text-ink-muted mt-1">{loaderData.message}</p>
              <button
                type="button"
                onClick={() => router.invalidate()}
                className="mt-3 text-brand text-sm hover:underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    const { membership, state } = loaderData;
    const purchases = membership.purchases ?? [];
    const planLabel = formatPlanLabel(state);
    const planSubtitle = buildPlanSubtitle(state);
    const showUpgrade = shouldShowUpgrade(state);
    const showManage = shouldShowManageSubscription(state, purchases);
    const historyRows = mergeBillingHistoryRows(purchases, membership.recentActivity || []);
    const features = showUpgrade ? FREE_PLAN_FEATURES : PRO_PLAN_FEATURES;

    return (
      <div className="p-6 max-w-3xl space-y-4">
        <h1 className="text-xl font-semibold">Billing</h1>

        <div className="relative overflow-hidden rounded-3xl p-6 text-white brand-gradient shadow-float">
          <div className="absolute -top-10 -right-10 size-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-white/15 backdrop-blur">
              <Sparkles className="size-3" />
              Current plan
            </div>
            <div className="mt-3 text-3xl font-semibold">{planLabel}</div>
            <div className="text-sm opacity-80 mt-1">{planSubtitle}</div>
            {state.purchasedAt && (
              <div className="text-xs opacity-70 mt-1">
                Member since {formatBillingDate(state.purchasedAt)}
              </div>
            )}
            <div className="mt-5 flex flex-wrap gap-2 items-center">
              {showUpgrade && (
                <button
                  type="button"
                  onClick={() => window.location.assign(upgradeUrl)}
                  className="h-9 px-3 rounded-lg text-sm bg-white text-brand-ink"
                >
                  Upgrade to Pro
                </button>
              )}
              {showManage && (
                <button
                  type="button"
                  onClick={() => window.location.assign(manageUrl)}
                  className="h-9 px-3 rounded-lg text-sm bg-white text-brand-ink"
                >
                  Manage subscription
                </button>
              )}
              {!state.isPro && purchases.length > 0 && (
                <button
                  type="button"
                  onClick={() => window.location.assign(upgradeUrl)}
                  className="h-9 px-3 rounded-lg text-sm bg-white/15 text-white"
                >
                  Resubscribe
                </button>
              )}
              <span className="text-xs opacity-80">Provider: {state.subscriptionProvider}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl hairline bg-surface p-4">
          <div className="text-sm font-medium mb-2">{showUpgrade ? "Pro includes" : "Your plan includes"}</div>
          <ul className="space-y-1.5 text-sm text-ink-muted">
            {features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <span className="text-brand">•</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl hairline bg-surface overflow-hidden">
          <div className="px-4 py-3 text-sm font-medium border-b border-hairline">Billing history</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left text-ink-muted">
                <th className="p-3 font-medium">Event</th>
                <th className="p-3 font-medium">Date</th>
                <th className="p-3 font-medium">Plan</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length === 0 && (
                <tr>
                  <td className="p-3 text-ink-muted text-sm" colSpan={4}>
                    No billing activity yet.
                  </td>
                </tr>
              )}
              {historyRows.map((row) => (
                <tr key={row.id} className="border-t border-hairline first:border-t-0">
                  <td className="p-3 font-medium">{row.label}</td>
                  <td className="p-3 text-ink-muted">
                    {row.date ? formatBillingDate(row.date) : "—"}
                  </td>
                  <td className="p-3 text-ink-muted">{row.plan}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-success/15 text-success capitalize">
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 text-xs text-ink-muted border-t border-hairline">
            Receipts are emailed by Paddle after each charge. Invoice PDF downloads are not available in-app yet.
          </div>
        </div>
      </div>
    );
  },
});
