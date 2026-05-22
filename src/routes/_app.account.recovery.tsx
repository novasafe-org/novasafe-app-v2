import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/account/recovery")({
  head: () => ({ meta: [{ title: "Recovery — NovaSafe" }] }),
  component: function Recovery() {
    const [kit, setKit] = useState<string | null>(null);
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Recovery</h1>
        <p className="text-sm text-ink-muted">Generate a recovery kit and choose a trusted contact.</p>
        <div className="rounded-2xl hairline bg-surface p-5">
          <div className="text-sm font-medium mb-2">Recovery kit</div>
          {kit ? (
            <pre className="mono text-xs bg-muted/60 p-3 rounded-lg whitespace-pre-wrap break-all">{kit}</pre>
          ) : (
            <p className="text-xs text-ink-muted">Generate a one-time kit to regain access if you lose your master password.</p>
          )}
          <button onClick={()=>{ const k = Array.from(crypto.getRandomValues(new Uint8Array(20))).map(b=>b.toString(16).padStart(2,"0")).join("").match(/.{1,4}/g)!.join("-"); setKit(k); toast.success("Recovery kit generated"); }} className="mt-3 h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm">Generate new kit</button>
        </div>
        <div className="rounded-2xl hairline bg-surface p-5">
          <div className="text-sm font-medium">Trusted contact</div>
          <div className="text-xs text-ink-muted mt-1">partner@novasafe.io · Verified</div>
        </div>
      </div>
    );
  },
});
