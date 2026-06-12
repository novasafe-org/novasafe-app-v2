import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  ShieldAlert,
  Monitor,
  AlertTriangle,
  Sparkles,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { loadDeviceTrustCenterAction } from "@/lib/account/server-actions";
import {
  revokeDeviceSessionAction,
  revokeOtherSessionsAction,
} from "@/lib/account/server-actions";
import type { SessionDevice } from "@/lib/api/endpoints/settings";
import {
  buildDeviceTimeline,
  buildLocationInsights,
  resolveTrustStatus,
} from "./device-helpers";
import {
  SectionCard,
  ProgressBar,
  ActionLink,
  DeviceMetricCard,
  CurrentDevicePanel,
  DeviceCard,
  DeviceDetailsDrawer,
  DeviceTimelineItem,
  SessionRow,
  LocationInsightCard,
  LocationMapPlaceholder,
  DangerZoneAction,
  TrustScorePanel,
} from "./device-ui";

type DeviceTrustData = Awaited<ReturnType<typeof loadDeviceTrustCenterAction>>;

export function DeviceTrustCenter({ data }: { data: DeviceTrustData }) {
  const [devices, setDevices] = useState<SessionDevice[]>(data.sessions);
  const [selected, setSelected] = useState<SessionDevice | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const currentDevice = devices.find((d) => d.isCurrent) ?? devices[0];
  const trustedDevices = devices.filter(
    (d) => resolveTrustStatus(d) === "trusted" || resolveTrustStatus(d) === "verified",
  );
  const otherDevices = devices.filter((d) => !d.isCurrent);

  const timeline = useMemo(() => buildDeviceTimeline(devices), [devices]);
  const locationInsights = useMemo(() => buildLocationInsights(devices), [devices]);

  const recommendations = useMemo(() => {
    const list: Array<{
      id: string;
      title: string;
      description: string;
      done: boolean;
      action?: () => void;
      to?: string;
    }> = [
      {
        id: "verify",
        title: "Verify device",
        description: "Confirm identity on devices awaiting verification.",
        done: data.stats.pending === 0 && data.stats.suspicious === 0,
        action: () => toast.info("Open a pending device and sign in again to verify."),
      },
      {
        id: "old",
        title: "Remove old devices",
        description: "Revoke sessions on devices you no longer use.",
        done: !devices.some((d) => !d.isCurrent && d.activityState === "offline"),
        to: "/account/devices",
      },
      {
        id: "suspicious",
        title: "Review suspicious activity",
        description: "Investigate sign-ins flagged as suspicious.",
        done: data.stats.suspicious === 0,
        action: () => {
          const suspicious = devices.find((d) => resolveTrustStatus(d) === "suspicious");
          if (suspicious) openDevice(suspicious);
          else toast.success("No suspicious devices detected.");
        },
      },
      {
        id: "rename",
        title: "Update device names",
        description: "Use recognizable names to identify your devices quickly.",
        done: devices.every((d) => d.deviceName && !/unknown/i.test(d.deviceName)),
        action: () => toast.info("Device renaming will be available in an upcoming update."),
      },
      {
        id: "2fa",
        title: "Enable two-factor authentication",
        description: "Protect every device sign-in with 2FA.",
        done: data.settings.twoFactorEnabled,
        to: "/account/security",
      },
    ];
    return list;
  }, [data, devices]);

  const pendingRecs = recommendations.filter((r) => !r.done);
  const completionPct = Math.round(
    ((recommendations.length - pendingRecs.length) / recommendations.length) * 100,
  );

  function openDevice(device: SessionDevice) {
    setSelected(device);
    setDrawerOpen(true);
  }

  async function handleRevoke(sessionId: string) {
    if (!window.confirm("Sign out this device? It will need to sign in again.")) return;
    setBusy(true);
    try {
      await revokeDeviceSessionAction({ data: { sessionId } });
      setDevices((list) => list.filter((d) => d.id !== sessionId));
      if (selected?.id === sessionId) {
        setDrawerOpen(false);
        setSelected(null);
      }
      toast.success("Session revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke session.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeAll() {
    if (!window.confirm("Sign out all other devices? You will stay signed in here.")) return;
    setBusy(true);
    try {
      const result = await revokeOtherSessionsAction();
      setDevices((list) => list.filter((d) => d.isCurrent));
      toast.success(result.message || "Signed out all other devices.");
      setDrawerOpen(false);
      setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke sessions.");
    } finally {
      setBusy(false);
    }
  }

  function handleVerify() {
    toast.success("This device is verified for your current session.");
  }

  function handleRename() {
    toast.info("Device renaming will be available in an upcoming update.");
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface shadow-float">
        <div className="absolute inset-0 brand-gradient-soft opacity-50 pointer-events-none" />
        <div className="relative p-6 md:p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Device Trust Center
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink mt-1">
            Where you&apos;re signed in
          </h1>
          <p className="text-sm text-ink-muted mt-2 max-w-2xl">
            Monitor every device with access to your NovaSafe account. Review trust status, locations,
            and sessions — and revoke access instantly.
          </p>
        </div>
      </div>

      {/* SECTION 1: Device Security Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <DeviceMetricCard
          icon={<ShieldCheck className="size-5" />}
          label="Trusted Devices"
          value={data.stats.trusted}
          description="Protected and verified devices"
          tone="success"
        />
        <DeviceMetricCard
          icon={<ShieldAlert className="size-5" />}
          label="Pending Verification"
          value={data.stats.pending}
          description="Devices awaiting your review"
          tone={data.stats.pending > 0 ? "warning" : "default"}
        />
        <DeviceMetricCard
          icon={<Monitor className="size-5" />}
          label="Active Sessions"
          value={data.stats.activeSessions}
          description="Currently signed-in sessions"
        />
        <DeviceMetricCard
          icon={<AlertTriangle className="size-5" />}
          label="Suspicious Devices"
          value={data.stats.suspicious}
          description="Flagged for unusual access"
          tone={data.stats.suspicious > 0 ? "danger" : "default"}
        />
      </div>

      {/* SECTION 2: Current Device */}
      {currentDevice && (
        <SectionCard
          title="Current device"
          description="This is the device you're using right now"
        >
          <CurrentDevicePanel
            session={currentDevice}
            onVerify={handleVerify}
            onRename={handleRename}
            onViewDetails={() => openDevice(currentDevice)}
          />
        </SectionCard>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* SECTION 6: Device Trust Score */}
        <SectionCard
          title="Device trust score"
          description="Composite trust across your device fleet"
          className="xl:col-span-1"
        >
          <TrustScorePanel sessions={devices} />
        </SectionCard>

        {/* SECTION 7: Location & Access Insights */}
        <SectionCard
          title="Location & access insights"
          description="Where your account has been accessed"
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {locationInsights.countries.length === 0 ? (
              <p className="text-sm text-ink-muted col-span-2">No location data available yet.</p>
            ) : (
              locationInsights.countries.map((c) => (
                <LocationInsightCard
                  key={c.country}
                  country={c.country}
                  deviceCount={c.deviceCount}
                  cities={c.cities}
                  isNew={c.isNew}
                />
              ))
            )}
          </div>
          <LocationMapPlaceholder />
          {(locationInsights.knownLocations.length > 0 ||
            locationInsights.newLocations.length > 0) && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {locationInsights.knownLocations.length > 0 && (
                <div className="rounded-lg border border-hairline p-3">
                  <p className="font-medium text-ink flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-success" />
                    Known locations
                  </p>
                  <ul className="mt-2 space-y-1 text-ink-muted">
                    {locationInsights.knownLocations.slice(0, 4).map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
              {locationInsights.newLocations.length > 0 && (
                <div className="rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <p className="font-medium text-ink flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-warning" />
                    New locations
                  </p>
                  <ul className="mt-2 space-y-1 text-ink-muted">
                    {locationInsights.newLocations.slice(0, 4).map((l) => (
                      <li key={l}>{l}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </SectionCard>
      </div>

      {/* SECTION 3: Trusted Devices */}
      <SectionCard
        title="Trusted devices"
        description={`${trustedDevices.length} protected device${trustedDevices.length === 1 ? "" : "s"}`}
        action={
          otherDevices.length > 0 ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleRevokeAll}
              className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
            >
              Sign out all others
            </button>
          ) : undefined
        }
      >
        {devices.length === 0 ? (
          <p className="text-sm text-ink-muted">No devices found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[...devices]
              .sort((a, b) => (a.isCurrent ? -1 : b.isCurrent ? 1 : 0))
              .map((device) => (
                <DeviceCard
                  key={device.id}
                  session={device}
                  onClick={() => openDevice(device)}
                  showSignOut
                  onSignOut={() => handleRevoke(device.id)}
                />
              ))}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SECTION 5: Device Activity Timeline */}
        <SectionCard title="Device activity" description="Recent login and trust events">
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-muted">No recent device activity.</p>
          ) : (
            <div className="pl-1">
              {timeline.map((event) => (
                <DeviceTimelineItem key={event.id} event={event} />
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-hairline">
            <ActionLink to="/account/activity">View full activity</ActionLink>
          </div>
        </SectionCard>

        {/* SECTION 9: Security Recommendations */}
        <SectionCard
          title="Security recommendations"
          description={`${recommendations.length - pendingRecs.length} of ${recommendations.length} completed`}
          action={
            <span className="text-xs font-medium text-ink-muted tabular-nums">{completionPct}%</span>
          }
        >
          <ProgressBar value={completionPct} className="mb-4" />
          {pendingRecs.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <Sparkles className="size-4" />
              All device security recommendations complete
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-hairline bg-surface-elev/40 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{rec.title}</div>
                    <p className="text-xs text-ink-muted mt-0.5">{rec.description}</p>
                  </div>
                  {rec.to ? (
                    <Link
                      to={rec.to}
                      className="shrink-0 h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition inline-flex items-center justify-center"
                    >
                      Take action
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={rec.action}
                      className="shrink-0 h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition disabled:opacity-50"
                    >
                      Take action
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* SECTION 8: Active Sessions */}
      <SectionCard
        title="Active sessions"
        description="All current sign-in sessions across devices"
        action={
          <button
            type="button"
            disabled={busy || otherDevices.length === 0}
            onClick={handleRevokeAll}
            className="h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition disabled:opacity-50"
          >
            Sign out all
          </button>
        }
      >
        <div className="space-y-2">
          {devices.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              onSignOut={() => handleRevoke(session.id)}
            />
          ))}
        </div>
      </SectionCard>

      {/* SECTION 10: Device Management Actions */}
      <SectionCard
        title="Device management"
        description="Trust, verify, and revoke device access"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {[
            { label: "Verify device", onClick: handleVerify },
            { label: "Rename device", onClick: handleRename },
            {
              label: "Trust device",
              onClick: () =>
                toast.info("Mobile apps are automatically trusted. Web sessions verify on sign-in."),
            },
            {
              label: "Revoke trust",
              onClick: () => toast.info("Revoke trust by signing out the device."),
            },
            {
              label: "Sign out device",
              onClick: () => {
                const target = selected ?? otherDevices[0];
                if (target) void handleRevoke(target.id);
                else toast.info("No other devices to sign out.");
              },
            },
            {
              label: "View device details",
              onClick: () => {
                if (currentDevice) openDevice(currentDevice);
              },
            },
          ].map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={busy}
              onClick={action.onClick}
              className="h-10 px-4 rounded-xl hairline text-sm font-medium hover:bg-muted transition text-left disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>

        <div className="pt-4 border-t border-hairline space-y-3">
          <p className="text-xs font-medium uppercase tracking-wide text-destructive/80">
            Danger zone
          </p>
          <DangerZoneAction
            title="Delete device session"
            description="Permanently revoke access for a device. Equivalent to signing out."
            actionLabel="Revoke session"
            disabled={busy || otherDevices.length === 0}
            onClick={() => {
              const target = otherDevices[0];
              if (target) void handleRevoke(target.id);
            }}
          />
          <DangerZoneAction
            title="Sign out all devices"
            description="End every session except this one. Use if you suspect unauthorized access."
            actionLabel="Sign out all"
            disabled={busy || otherDevices.length === 0}
            onClick={() => void handleRevokeAll()}
          />
        </div>
      </SectionCard>

      {/* SECTION 4: Device Details Drawer */}
      <DeviceDetailsDrawer
        session={selected}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSignOut={
          selected && !selected.isCurrent
            ? () => void handleRevoke(selected.id)
            : undefined
        }
        onSignOutAll={otherDevices.length > 0 ? () => void handleRevokeAll() : undefined}
      />
    </div>
  );
}
