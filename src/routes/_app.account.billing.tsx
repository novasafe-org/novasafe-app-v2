import { createFileRoute } from "@tanstack/react-router";
import { useVault } from "@/lib/vault-store";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/account/billing")({
  head: () => ({ meta: [{ title: "Billing — NovaSafe" }] }),
  component: function Billing() {
    const plan = useVault((s) => s.plan);
    const setPlan = useVault((s) => s.setPlan);
    const invoices = useVault((s) => s.invoices);
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
              Unlimited items · Encrypted sharing · Priority sync
            </div>
            <div className="mt-5 flex gap-2">
              {(["Free", "Pro", "Family"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPlan(p);
                    toast.success(`Switched to ${p}`);
                  }}
                  className={`h-9 px-3 rounded-lg text-sm ${plan === p ? "bg-white text-brand-ink" : "bg-white/15 hover:bg-white/25"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-2xl hairline bg-surface overflow-hidden">
          <div className="px-4 py-3 text-sm font-medium border-b border-hairline">Invoices</div>
          <table className="w-full text-sm">
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-hairline first:border-t-0">
                  <td className="p-3 font-medium">{inv.number}</td>
                  <td className="p-3 text-ink-muted">
                    {new Date(inv.paidAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 mono">${inv.amount.toFixed(2)}</td>
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
