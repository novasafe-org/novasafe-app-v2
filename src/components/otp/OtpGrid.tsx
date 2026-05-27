import { useEffect, useState } from "react";
import { TOTP, Secret } from "otpauth";
import { Star, Copy, Trash2, Plus } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function generate(secret: string) {
  try {
    const t = new TOTP({
      secret: Secret.fromBase32(secret.replace(/\s/g, "").toUpperCase()),
      digits: 6,
      period: 30,
    });
    return { code: t.generate(), remaining: 30 - Math.floor((Date.now() / 1000) % 30) };
  } catch {
    return { code: "------", remaining: 30 };
  }
}

export function OtpGrid() {
  const otps = useVault((s) => s.otps);
  const removeOtp = useVault((s) => s.removeOtp);
  const toggleFav = useVault((s) => s.toggleOtpFav);
  const addOtp = useVault((s) => s.addOtp);
  const [tick, setTick] = useState(0);
  const [adding, setAdding] = useState(false);
  const [issuer, setIssuer] = useState("");
  const [account, setAccount] = useState("");
  const [secret, setSecret] = useState("");

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(i);
  }, []);
  void tick;

  return (
    <div className="h-full overflow-y-auto p-6 no-scrollbar">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold">Authenticator</h1>
          <p className="text-sm text-ink-muted">Rotating one-time codes for your accounts</p>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm inline-flex items-center gap-1.5 shadow-float"
        >
          <Plus className="size-4" />
          Add account
        </button>
      </div>

      {adding && (
        <div className="mb-4 p-4 rounded-2xl hairline bg-surface space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <input
              placeholder="Issuer"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className="h-9 px-3 rounded-lg hairline bg-surface text-sm"
            />
            <input
              placeholder="Account"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className="h-9 px-3 rounded-lg hairline bg-surface text-sm"
            />
            <input
              placeholder="Base32 secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="h-9 px-3 rounded-lg hairline bg-surface text-sm mono"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setAdding(false)}
              className="h-9 px-3 rounded-lg hairline text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!issuer || !secret) {
                  toast.error("Issuer & secret required");
                  return;
                }
                addOtp({ issuer, account, secret, favorite: false });
                setIssuer("");
                setAccount("");
                setSecret("");
                setAdding(false);
                toast.success("Added");
              }}
              className="h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {otps.map((o) => {
          const { code, remaining } = generate(o.secret);
          const pct = (remaining / 30) * 100;
          return (
            <div
              key={o.id}
              className="rounded-2xl hairline bg-surface p-4 shadow-float/40 hover:shadow-float transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{o.issuer}</div>
                  <div className="text-xs text-ink-muted truncate max-w-[180px]">{o.account}</div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleFav(o.id)}
                    className="size-7 rounded-md hover:bg-muted grid place-items-center"
                  >
                    <Star className={cn("size-3.5", o.favorite && "fill-warning text-warning")} />
                  </button>
                  <button
                    onClick={() => {
                      removeOtp(o.id);
                      toast.success("Removed");
                    }}
                    className="size-7 rounded-md hover:bg-muted grid place-items-center text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast.success("Code copied");
                }}
                className="mt-3 w-full text-left mono text-3xl tracking-[0.2em] tabular-nums hover:text-brand transition"
              >
                {code.slice(0, 3)} {code.slice(3)}
              </button>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-brand transition-[width] duration-1000 ease-linear"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] text-ink-muted tabular-nums w-6 text-right">
                  {remaining}s
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    toast.success("Code copied");
                  }}
                  className="size-7 rounded-md hover:bg-muted grid place-items-center"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
