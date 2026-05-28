import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { deleteAccountAction, loadRecoveryAction } from "@/lib/account/server-actions";
import { logoutAction } from "@/lib/auth/server-actions";

export const Route = createFileRoute("/_app/account/recovery")({
  head: () => ({ meta: [{ title: "Recovery — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadRecoveryAction(),
  component: function Recovery() {
    const { summary, history } = Route.useLoaderData();
    const [kit, setKit] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Recovery</h1>
        <p className="text-sm text-ink-muted">
          Generate a recovery kit and choose a trusted contact.
        </p>
        <div className="rounded-2xl hairline bg-surface p-5">
          <div className="text-sm font-medium mb-2">Recovery kit</div>
          {kit ? (
            <pre className="mono text-xs bg-muted/60 p-3 rounded-lg whitespace-pre-wrap break-all">
              {kit}
            </pre>
          ) : (
            <p className="text-xs text-ink-muted">
              Generate a one-time kit to regain access if you lose your master password.
            </p>
          )}
          <button
            onClick={() => {
              const k = Array.from(crypto.getRandomValues(new Uint8Array(20)))
                .map((b) => b.toString(16).padStart(2, "0"))
                .join("")
                .match(/.{1,4}/g)!
                .join("-");
              setKit(k);
              toast.success("Recovery kit generated");
            }}
            className="mt-3 h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm"
          >
            Generate new kit
          </button>
        </div>
        <div className="rounded-2xl hairline bg-surface p-5">
          <div className="text-sm font-medium">Trusted contact</div>
          <div className="text-xs text-ink-muted mt-1">
            Account: {summary.email || "Unknown"} · Items: {summary.itemCount} · Sessions:{" "}
            {summary.sessionCount}
          </div>
          <div className="mt-3 text-xs text-ink-muted">
            Exports created: {summary.exportCount} ({history.length} recent entries)
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              const confirmed = window.confirm(
                "Delete account permanently? This cannot be undone and will revoke all sessions.",
              );
              if (!confirmed) return;
              setBusy(true);
              try {
                await deleteAccountAction();
                await logoutAction();
                window.location.reload();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to delete account.");
              } finally {
                setBusy(false);
              }
            }}
            className="mt-3 h-9 px-3 rounded-lg text-sm text-destructive hover:bg-destructive/10 disabled:opacity-60"
          >
            Delete account
          </button>
        </div>
      </div>
    );
  },
});
