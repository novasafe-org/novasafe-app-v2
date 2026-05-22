import { KeyRound, Smartphone, Trash2, Plus, ShieldCheck } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

export function PasskeysGrid() {
  const passkeys = useVault((s) => s.passkeys);
  const revoke = useVault((s) => s.revokePasskey);
  const add = useVault((s) => s.addPasskey);

  return (
    <div className="h-full overflow-y-auto p-6 no-scrollbar">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Passkeys</h1>
          <p className="text-sm text-ink-muted">Phishing-resistant sign-ins synced across your devices</p>
        </div>
        <button onClick={() => { add({ service: "New service", domain: "example.com", device: "MacBook Pro 16″", platform: "macOS", synced: true, biometric: true }); toast.success("Passkey added"); }} className="h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm inline-flex items-center gap-1.5 shadow-float"><Plus className="size-4" />Add passkey</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {passkeys.map((p) => (
          <div key={p.id} className="rounded-2xl hairline bg-surface p-4 hover:shadow-float transition">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl brand-gradient-soft grid place-items-center"><KeyRound className="size-5 text-brand" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.service}</div>
                <div className="text-xs text-ink-muted truncate">{p.domain}</div>
              </div>
              <button onClick={() => { revoke(p.id); toast.success("Revoked"); }} className="size-8 rounded-md hover:bg-muted grid place-items-center text-destructive"><Trash2 className="size-3.5" /></button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
              <span className="inline-flex items-center gap-1"><Smartphone className="size-3" />{p.device}</span>
              <span>·</span>
              <span>{p.platform}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px]">
              {p.biometric && <span className="px-2 py-0.5 rounded-md bg-accent text-brand-ink inline-flex items-center gap-1"><ShieldCheck className="size-3" />Biometric</span>}
              {p.synced ? <span className="px-2 py-0.5 rounded-md bg-success/15 text-success">Synced</span> : <span className="px-2 py-0.5 rounded-md hairline text-ink-muted">Local only</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
