import { createFileRoute } from "@tanstack/react-router";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/account/devices")({
  head: () => ({ meta: [{ title: "Devices — NovaSafe" }] }),
  component: function Devices() {
    const devices = useVault((s)=>s.devices);
    const trust = useVault((s)=>s.trustDevice);
    const remove = useVault((s)=>s.removeDevice);
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-xl font-semibold">Devices</h1>
        <p className="text-sm text-ink-muted mb-4">Where you're signed in</p>
        <div className="rounded-2xl hairline bg-surface divide-y divide-[var(--hairline)]">
          {devices.map((d)=>(
            <div key={d.id} className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium flex items-center gap-2">{d.name} {d.current && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-brand-ink">This device</span>}</div>
                <div className="text-xs text-ink-muted">{d.platform} · {d.location}</div>
              </div>
              <button onClick={()=>{trust(d.id,!d.trusted);toast.success(d.trusted?"Untrusted":"Trusted");}} className="h-8 px-2.5 rounded-md hairline text-xs">{d.trusted?"Untrust":"Trust"}</button>
              {!d.current && <button onClick={()=>{remove(d.id);toast.success("Removed");}} className="h-8 px-2.5 rounded-md text-xs text-destructive hover:bg-destructive/10">Remove</button>}
            </div>
          ))}
        </div>
      </div>
    );
  },
});
