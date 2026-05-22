import { useState } from "react";
import { X, Mail } from "lucide-react";
import { useUI } from "@/lib/ui-store";
import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

export function ShareModal() {
  const { shareOpen, shareTarget, closeShare } = useUI();
  const invite = useVault((s) => s.invite);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [temp, setTemp] = useState(false);

  if (!shareOpen || !shareTarget) return null;

  const send = () => {
    if (!email.includes("@")) { toast.error("Enter a valid email"); return; }
    invite({ itemTitle: shareTarget, sharedWith: email, role, expiresAt: temp ? Date.now() + 7 * 86_400_000 : undefined });
    toast.success(`Invite sent to ${email}`);
    setEmail(""); setTemp(false); setRole("viewer");
    closeShare();
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/30 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md glass-strong rounded-2xl shadow-float overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-hairline">
          <div>
            <div className="text-sm font-semibold">Share securely</div>
            <div className="text-xs text-ink-muted truncate">{shareTarget}</div>
          </div>
          <button onClick={closeShare} className="size-8 rounded-lg hover:bg-muted grid place-items-center"><X className="size-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <label className="block">
            <span className="block text-xs font-medium text-ink-muted mb-1.5">Recipient email</span>
            <div className="flex items-center gap-2 h-10 px-3 rounded-lg hairline bg-surface">
              <Mail className="size-4 text-ink-faint" />
              <input value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="name@example.com" className="flex-1 bg-transparent outline-none text-sm" />
            </div>
          </label>
          <div className="flex gap-2">
            {(["viewer","editor"] as const).map((r) => (
              <button key={r} onClick={()=>setRole(r)} className={`flex-1 h-9 rounded-lg text-sm capitalize ${role===r?"bg-brand text-brand-foreground":"hairline"}`}>{r}</button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input type="checkbox" checked={temp} onChange={(e)=>setTemp(e.target.checked)} />
            Temporary access (7 days)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={closeShare} className="h-10 px-3 rounded-lg hairline text-sm">Cancel</button>
            <button onClick={send} className="h-10 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-medium shadow-float">Send invite</button>
          </div>
        </div>
      </div>
    </div>
  );
}
