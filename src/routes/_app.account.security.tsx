import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock, KeyRound } from "lucide-react";
export const Route = createFileRoute("/_app/account/security")({
  head: () => ({ meta: [{ title: "Security — NovaSafe" }] }),
  component: () => (
    <div className="p-6 max-w-2xl space-y-3">
      <h1 className="text-xl font-semibold">Security</h1>
      <p className="text-sm text-ink-muted mb-2">Account-wide protections</p>
      {[
        { icon: Lock, title: "Master password", desc: "Last changed 4 months ago", cta: "Change" },
        { icon: ShieldCheck, title: "Two-factor authentication", desc: "TOTP via Authenticator", cta: "Manage" },
        { icon: KeyRound, title: "Recovery kit", desc: "Generated 14 days ago", cta: "Re-generate" },
      ].map(({icon:Icon,title,desc,cta}) => (
        <div key={title} className="rounded-xl hairline bg-surface p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg brand-gradient-soft grid place-items-center text-brand"><Icon className="size-4" /></div>
          <div className="flex-1"><div className="text-sm font-medium">{title}</div><div className="text-xs text-ink-muted">{desc}</div></div>
          <button className="h-9 px-3 rounded-lg hairline text-sm">{cta}</button>
        </div>
      ))}
    </div>
  ),
});
