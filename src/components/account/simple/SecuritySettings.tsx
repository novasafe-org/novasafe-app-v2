import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import type { loadSecurityAction } from "@/lib/account/server-actions";
import {
  changeMasterPasswordAction,
  createExportAction,
  revokeOtherSessionsAction,
  toggleTwoFactorAction,
} from "@/lib/account/server-actions";
import {
  SettingsPage,
  SettingsCard,
  SettingsRow,
  SettingsButton,
  StatusBadge,
} from "./settings-ui";

type SecurityData = Awaited<ReturnType<typeof loadSecurityAction>>;

function securityStatus(
  data: SecurityData,
): { label: string; variant: "success" | "warning" } {
  const { settings } = data;
  if (!settings.hasPassword || !settings.twoFactorEnabled) {
    return { label: "Needs attention", variant: "warning" };
  }
  return { label: "Protected", variant: "success" };
}

export function SecuritySettings({ data }: { data: SecurityData }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const status = securityStatus(data);
  const { settings, activeSessions } = data;

  async function handleChangePassword() {
    const currentPassword = window.prompt("Current password");
    const newPassword = window.prompt("New password (min 8 characters)");
    if (!currentPassword || !newPassword) return;
    setBusy(true);
    try {
      const result = await changeMasterPasswordAction({
        data: { currentPassword, newPassword },
      });
      toast.success(result.message || "Password updated.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle2FA() {
    setBusy(true);
    try {
      const next = !settings.twoFactorEnabled;
      await toggleTwoFactorAction({ data: { enabled: next } });
      toast.success(next ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update 2FA.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRecoveryKit() {
    setBusy(true);
    try {
      await createExportAction();
      toast.success("Recovery kit created. Download it from the Recovery page.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create recovery kit.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOutAll() {
    if (!window.confirm("Sign out all other devices?")) return;
    setBusy(true);
    try {
      const result = await revokeOtherSessionsAction();
      toast.success(result.message || "Signed out all other devices.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign out devices.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SettingsPage title="Security" description="Protect your account and vault.">
      <SettingsCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Security status</p>
            <p className="text-xs text-ink-muted mt-0.5">
              {status.variant === "success"
                ? "Your account has the basics covered."
                : "A few steps can make your account safer."}
            </p>
          </div>
          <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
        </div>
      </SettingsCard>

      <SettingsCard title="Master password">
        <SettingsRow
          label="Password"
          description="Used to unlock your vault on this device."
          value={settings.hasPassword ? "Configured" : "Not set"}
          action={
            <SettingsButton disabled={busy} onClick={handleChangePassword}>
              Change password
            </SettingsButton>
          }
        />
      </SettingsCard>

      <SettingsCard title="Two-factor authentication">
        <SettingsRow
          label="Authenticator app"
          description="Add a second step when signing in."
          value={settings.twoFactorEnabled ? "Enabled" : "Disabled"}
          action={
            <SettingsButton disabled={busy} onClick={handleToggle2FA}>
              {settings.twoFactorEnabled ? "Disable" : "Enable"}
            </SettingsButton>
          }
        />
      </SettingsCard>

      <SettingsCard title="Recovery kit">
        <SettingsRow
          label="Offline backup"
          description="Save a copy in case you forget your password."
          action={
            <SettingsButton disabled={busy} onClick={handleRecoveryKit}>
              Generate
            </SettingsButton>
          }
        />
      </SettingsCard>

      <SettingsCard title="Sessions">
        <SettingsRow
          label="Active sessions"
          description="Devices where you're signed in."
          value={activeSessions === 1 ? "1 device" : `${activeSessions} devices`}
          action={
            <SettingsButton disabled={busy} variant="danger" onClick={handleSignOutAll}>
              Sign out all devices
            </SettingsButton>
          }
        />
      </SettingsCard>
    </SettingsPage>
  );
}
