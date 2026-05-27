import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { loadMembershipAction } from "@/lib/account/server-actions";

export const Route = createFileRoute("/_app/account/billing")({
  head: () => ({ meta: [{ title: "Billing — NovaSafe" }] }),
  loader: async () => loadMembershipAction(),
  component: function Billing() {
    const { membership, state } = Route.useLoaderData();
    const plan = state.isPro ? "Pro" : "Free";
    const invoices = (membership.recentActivity || []).map((entry, index) => ({
      id: `${entry.eventType}-${index}`,
      number: entry.eventType.replaceAll("_", " "),
      paidAt: entry.processedAt ? new Date(entry.processedAt).getTime() : Date.now(),
      amount: 0,
      status: entry.status === "processed" ? "paid" : "pending",
    }));
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
            <div className="mt-3 text-3xl font-semibold">{plan}</div>
            <div className="text-sm opacity-80 mt-1">
              {state.subscriptionStatus} {state.renewsAt ? `· Renews ${new Date(state.renewsAt).toLocaleDateString()}` : ""}
            </div>
            <div className="mt-5 flex gap-2 items-center">
              <button
                onClick={() => toast.info("Manage billing from the onboarding billing flow.")}
                className="h-9 px-3 rounded-lg text-sm bg-white text-brand-ink"
              >
                Manage plan
              </button>
              <span className="text-xs opacity-80">Provider: {state.subscriptionProvider}</span>
            </div>
          </div>
        </div>
        <div className="rounded-2xl hairline bg-surface overflow-hidden">
          <div className="px-4 py-3 text-sm font-medium border-b border-hairline">Invoices</div>
          <table className="w-full text-sm">
            <tbody>
              {invoices.length === 0 && (
                <tr>
                  <td className="p-3 text-ink-muted text-sm" colSpan={5}>
                    No billing activity yet.
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-hairline first:border-t-0">
                  <td className="p-3 font-medium">{inv.number}</td>
                  <td className="p-3 text-ink-muted">
                    {new Date(inv.paidAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 mono">{inv.amount ? `$${inv.amount.toFixed(2)}` : "-"}</td>
                  <td className="p-3">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-success/15 text-success capitalize">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => toast.success("Invoice downloaded")}
                      className="text-xs text-brand hover:underline"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
});
