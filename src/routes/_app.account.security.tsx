import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Lock, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  changeMasterPasswordAction,
  createExportAction,
  loadSecurityAction,
  toggleTwoFactorAction,
} from "@/lib/account/server-actions";
export const Route = createFileRoute("/_app/account/security")({
  head: () => ({ meta: [{ title: "Security — NovaSafe" }] }),
  loader: async () => loadSecurityAction(),
  component: function SecurityRoute() {
    const { security, settings } = Route.useLoaderData();
    const [isSubmitting, setIsSubmitting] = useState(false);
    return (
      <div className="p-6 max-w-2xl space-y-3">
      <h1 className="text-xl font-semibold">Security</h1>
      <p className="text-sm text-ink-muted mb-2">Account-wide protections</p>
      {[
        {
          icon: Lock,
          title: "Master password",
          desc: settings.hasPassword ? "Configured" : "Not configured",
          cta: "Change",
          onClick: async () => {
            const currentPassword = window.prompt("Current password");
            const newPassword = window.prompt("New password (min 8 chars)");
            if (!currentPassword || !newPassword) return;
            setIsSubmitting(true);
            try {
              const result = await changeMasterPasswordAction({
                data: { currentPassword, newPassword },
              });
              toast.success(result.message || "Password updated.");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to update password.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
        {
          icon: ShieldCheck,
          title: "Two-factor authentication",
          desc: settings.twoFactorEnabled ? "Enabled" : "Disabled",
          cta: settings.twoFactorEnabled ? "Disable" : "Enable",
          onClick: async () => {
            setIsSubmitting(true);
            try {
              const next = !settings.twoFactorEnabled;
              await toggleTwoFactorAction({ data: { enabled: next } });
              toast.success(next ? "2FA enabled." : "2FA disabled.");
              window.location.reload();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to toggle 2FA.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
        {
          icon: KeyRound,
          title: "Recovery kit",
          desc: "Download encrypted CSV backup",
          cta: "Generate export",
          onClick: async () => {
            setIsSubmitting(true);
            try {
              await createExportAction();
              toast.success("Recovery export created.");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Failed to create export.");
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ].map(({ icon: Icon, title, desc, cta, onClick }) => (
        <div key={title} className="rounded-xl hairline bg-surface p-4 flex items-center gap-3">
          <div className="size-10 rounded-lg brand-gradient-soft grid place-items-center text-brand">
            <Icon className="size-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium">{title}</div>
            <div className="text-xs text-ink-muted">{desc}</div>
          </div>
          <button
            disabled={isSubmitting}
            onClick={onClick}
            className="h-9 px-3 rounded-lg hairline text-sm disabled:opacity-60"
          >
            {cta}
          </button>
        </div>
      ))}
      <div className="rounded-xl hairline bg-surface p-4 text-xs text-ink-muted">
        Security score: <span className="font-medium text-foreground">{security.score}</span> · Weak{" "}
        {security.weak} · Reused {security.reused} · Breached {security.breached}
      </div>
    </div>
    );
  },
});
