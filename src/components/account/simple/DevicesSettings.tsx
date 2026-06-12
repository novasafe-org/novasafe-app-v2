import { useState } from "react";
import { toast } from "sonner";
import type { SessionDevice } from "@/lib/api/endpoints/settings";
import {
  loadDevicesAction,
  revokeDeviceSessionAction,
  revokeOtherSessionsAction,
} from "@/lib/account/server-actions";
import { formatRelativeTime } from "@/components/account/profile/profile-helpers";
import {
  SettingsPage,
  SettingsCard,
  SettingsRow,
  SettingsButton,
  SimpleList,
  SimpleListItem,
  StatusBadge,
} from "./settings-ui";

type DevicesData = Awaited<ReturnType<typeof loadDevicesAction>>;

function deviceLabel(session: SessionDevice): string {
  return (
    session.deviceName?.trim() ||
    session.parsedDevice?.displayName ||
    "Unknown device"
  );
}

export function DevicesSettings({ initial }: { initial: DevicesData }) {
  const [devices, setDevices] = useState<SessionDevice[]>(initial.sessions || []);
  const [busy, setBusy] = useState(false);

  const current = devices.find((d) => d.isCurrent);
  const others = devices.filter((d) => !d.isCurrent);

  async function handleRemove(sessionId: string) {
    if (!window.confirm("Remove this device? It will need to sign in again.")) return;
    setBusy(true);
    try {
      await revokeDeviceSessionAction({ data: { sessionId } });
      setDevices((list) => list.filter((d) => d.id !== sessionId));
      toast.success("Device removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove device.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOutAll() {
    if (!window.confirm("Sign out all other devices?")) return;
    setBusy(true);
    try {
      const result = await revokeOtherSessionsAction();
      setDevices((list) => list.filter((d) => d.isCurrent));
      toast.success(result.message || "Signed out all other devices.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign out devices.");
    } finally {
      setBusy(false);
    }
  }

  function renderDevice(session: SessionDevice, showRemove: boolean) {
    const browser = session.parsedDevice?.browser || "Browser";
    const os = session.parsedDevice?.os || session.platform || "Unknown OS";
    const lastActive = session.lastActivity
      ? formatRelativeTime(new Date(session.lastActivity).getTime())
      : "Unknown";

    return (
      <SimpleListItem
        key={session.id}
        primary={deviceLabel(session)}
        secondary={`${browser} · ${os}`}
        meta={`Last active ${lastActive}${session.locationLabel ? ` · ${session.locationLabel}` : ""}`}
        action={
          <div className="flex items-center gap-2 shrink-0">
            {session.isCurrent ? (
              <StatusBadge variant="success">This device</StatusBadge>
            ) : showRemove ? (
              <SettingsButton
                disabled={busy}
                variant="danger"
                onClick={() => void handleRemove(session.id)}
              >
                Remove
              </SettingsButton>
            ) : null}
          </div>
        }
      />
    );
  }

  return (
    <SettingsPage title="Devices" description="See where you're signed in to NovaSafe.">
      {current && (
        <SettingsCard title="Current device">
          <SimpleList>{renderDevice(current, false)}</SimpleList>
        </SettingsCard>
      )}

      <SettingsCard
        title="Trusted devices"
        description={others.length === 0 ? "No other devices signed in." : undefined}
      >
        {others.length > 0 ? (
          <SimpleList>{others.map((d) => renderDevice(d, true))}</SimpleList>
        ) : (
          <p className="text-sm text-ink-muted">You're only signed in on this device.</p>
        )}
      </SettingsCard>

      {others.length > 0 && (
        <SettingsCard>
          <SettingsRow
            label="Sign out everywhere else"
            description="Keep this device signed in."
            action={
              <SettingsButton disabled={busy} variant="danger" onClick={() => void handleSignOutAll()}>
                Sign out all devices
              </SettingsButton>
            }
          />
        </SettingsCard>
      )}
    </SettingsPage>
  );
}
