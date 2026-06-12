import type { ReactNode } from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  MapPin,
  Globe,
  Clock,
  Shield,
  ShieldCheck,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { SessionDevice } from "@/lib/api/endpoints/settings";
import { cn } from "@/lib/utils";
import { SectionCard, MetricTile, ProgressBar, ActionLink } from "@/components/account/profile/profile-ui";
import { HeroScoreRing } from "@/components/account/security/security-ui";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { formatRelativeTime } from "@/components/account/profile/profile-helpers";
import {
  browserLabel,
  computeDeviceTrustScore,
  deviceDisplayName,
  deviceRiskLevel,
  deviceTypeLabel,
  formatFullDate,
  formatTimestamp,
  maskIp,
  osLabel,
  parseLocation,
  resolveTrustStatus,
  trustStatusLabel,
  type DeviceTimelineEvent,
  type TrustStatus,
} from "./device-helpers";

export { SectionCard, MetricTile, ProgressBar, ActionLink, HeroScoreRing };

const trustBadgeStyles: Record<TrustStatus, string> = {
  trusted: "bg-success/12 text-success border-success/25",
  verified: "bg-brand/12 text-brand border-brand/25",
  needs_verification: "bg-warning/12 text-warning border-warning/25",
  suspicious: "bg-destructive/12 text-destructive border-destructive/25",
};

export function TrustBadge({ status, className }: { status: TrustStatus; className?: string }) {
  const Icon =
    status === "trusted"
      ? ShieldCheck
      : status === "verified"
        ? Shield
        : status === "suspicious"
          ? XCircle
          : AlertTriangle;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        trustBadgeStyles[status],
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {trustStatusLabel(status)}
    </span>
  );
}

export function DeviceIcon({
  session,
  className,
}: {
  session: SessionDevice;
  className?: string;
}) {
  const type = session.parsedDevice?.deviceType;
  const Icon =
    type === "mobile" ? Smartphone : type === "tablet" ? Tablet : Laptop;
  return (
    <div
      className={cn(
        "size-10 rounded-xl brand-gradient-soft grid place-items-center text-brand shrink-0",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden />
    </div>
  );
}

export function DeviceMetricCard({
  icon,
  label,
  value,
  description,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number | string;
  description: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const valueTone =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : tone === "danger"
          ? "text-destructive"
          : "text-ink";

  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/80 p-4 flex flex-col gap-3 min-h-[120px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
          {label}
        </span>
        <span className="text-ink-muted">{icon}</span>
      </div>
      <div className={cn("text-2xl font-semibold tracking-tight tabular-nums", valueTone)}>
        {value}
      </div>
      <p className="text-xs text-ink-muted leading-relaxed">{description}</p>
    </div>
  );
}

export function DeviceCard({
  session,
  onClick,
  onSignOut,
  showSignOut,
}: {
  session: SessionDevice;
  onClick: () => void;
  onSignOut?: () => void;
  showSignOut?: boolean;
}) {
  const trust = resolveTrustStatus(session);
  const location = parseLocation(session.locationLabel);

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-hairline bg-surface-elev/60 p-4 text-left hover:border-brand/30 hover:bg-surface-elev transition w-full"
    >
      <div className="flex items-start gap-3">
        <DeviceIcon session={session} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink truncate">
              {deviceDisplayName(session)}
            </h3>
            {session.isCurrent && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-brand/12 text-brand font-medium border border-brand/20">
                This Device
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted mt-0.5">
            {osLabel(session)} · {browserLabel(session)}
          </p>
        </div>
        <TrustBadge status={trust} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
        <div>
          <dt className="text-ink-faint">Type</dt>
          <dd className="font-medium text-ink mt-0.5">{deviceTypeLabel(session)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">Location</dt>
          <dd className="font-medium text-ink mt-0.5 truncate">{location.label}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">IP</dt>
          <dd className="font-medium text-ink mt-0.5 font-mono text-[11px]">
            {maskIp(session.ipAddress)}
          </dd>
        </div>
        <div>
          <dt className="text-ink-faint">Last seen</dt>
          <dd className="font-medium text-ink mt-0.5">{formatTimestamp(session.lastActivity)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-ink-faint">First seen</dt>
          <dd className="font-medium text-ink mt-0.5">{formatFullDate(session.createdAt)}</dd>
        </div>
      </dl>

      {showSignOut && !session.isCurrent && onSignOut && (
        <div className="mt-3 pt-3 border-t border-hairline">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSignOut();
            }}
            className="text-xs font-medium text-destructive hover:underline"
          >
            Sign out device
          </button>
        </div>
      )}
    </button>
  );
}

export function CurrentDevicePanel({
  session,
  onVerify,
  onRename,
  onViewDetails,
}: {
  session: SessionDevice;
  onVerify: () => void;
  onRename: () => void;
  onViewDetails: () => void;
}) {
  const location = parseLocation(session.locationLabel);
  const trust = resolveTrustStatus(session);

  return (
    <div className="rounded-xl border border-brand/20 bg-brand/4 p-5 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        <DeviceIcon session={session} className="size-14 rounded-2xl" />
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold text-ink">{deviceDisplayName(session)}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand text-brand-foreground font-semibold">
              This Device
            </span>
            <TrustBadge status={trust} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide">Operating System</p>
              <p className="font-medium text-ink mt-0.5">{osLabel(session)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide">Browser</p>
              <p className="font-medium text-ink mt-0.5">{browserLabel(session)}</p>
            </div>
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide">IP Address</p>
              <p className="font-medium text-ink mt-0.5 font-mono text-xs">
                {session.ipAddress && session.ipAddress !== "Unknown"
                  ? session.ipAddress
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink-faint uppercase tracking-wide">Location</p>
              <p className="font-medium text-ink mt-0.5">{location.label}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-ink-faint uppercase tracking-wide">Last Active</p>
              <p className="font-medium text-ink mt-0.5">
                {session.isCurrent ? "Just now" : formatTimestamp(session.lastActivity)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onVerify}
              className="h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition"
            >
              Verify Device
            </button>
            <button
              type="button"
              onClick={onRename}
              className="h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition"
            >
              Rename Device
            </button>
            <button
              type="button"
              onClick={onViewDetails}
              className="h-8 px-3 rounded-lg bg-brand text-brand-foreground text-xs font-medium hover:opacity-95 transition"
            >
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DeviceDetailsDrawer({
  session,
  open,
  onOpenChange,
  onSignOut,
  onSignOutAll,
}: {
  session: SessionDevice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut?: () => void;
  onSignOutAll?: () => void;
}) {
  if (!session) return null;

  const location = parseLocation(session.locationLabel);
  const trust = resolveTrustStatus(session);
  const { score, factors } = computeDeviceTrustScore(session);
  const risk = deviceRiskLevel(session);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto bg-surface border-hairline">
        <SheetHeader className="text-left pb-4 border-b border-hairline">
          <div className="flex items-center gap-3 pr-8">
            <DeviceIcon session={session} className="size-12 rounded-xl" />
            <div>
              <SheetTitle className="text-ink">{deviceDisplayName(session)}</SheetTitle>
              <SheetDescription className="text-ink-muted">
                {osLabel(session)} · {browserLabel(session)}
              </SheetDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <TrustBadge status={trust} />
            {session.isCurrent && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand/12 text-brand font-medium border border-brand/20">
                This Device
              </span>
            )}
          </div>
        </SheetHeader>

        <div className="py-5 space-y-6">
          <div className="flex items-center gap-4">
            <HeroScoreRing score={score} size={88} />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Trust Score
              </p>
              <p className="text-lg font-semibold text-ink">{score} / 100</p>
              <p className="text-xs text-ink-muted mt-1">
                Risk:{" "}
                <span
                  className={cn(
                    "font-medium",
                    risk === "high"
                      ? "text-destructive"
                      : risk === "medium"
                        ? "text-warning"
                        : "text-success",
                  )}
                >
                  {risk === "high" ? "High" : risk === "medium" ? "Medium" : "Low"}
                </span>
              </p>
            </div>
          </div>

          <dl className="grid grid-cols-1 gap-3 text-sm">
            {[
              { label: "Browser", value: browserLabel(session) },
              { label: "OS", value: osLabel(session) },
              { label: "Device type", value: deviceTypeLabel(session) },
              { label: "IP address", value: session.ipAddress || "—", mono: true },
              { label: "Location", value: location.label },
              { label: "City", value: location.city },
              { label: "Country", value: location.country },
              { label: "Timezone", value: location.timezone },
              { label: "First login", value: formatFullDate(session.createdAt) },
              { label: "Last login", value: formatFullDate(session.lastActivity) },
              { label: "Session status", value: session.activityState === "recently_active" ? "Active" : "Idle" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-3 py-2 border-b border-hairline last:border-0"
              >
                <dt className="text-ink-muted text-xs">{row.label}</dt>
                <dd
                  className={cn(
                    "font-medium text-ink text-right text-xs",
                    row.mono && "font-mono",
                  )}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint mb-2">
              Trust factors
            </p>
            <ul className="space-y-1.5">
              {factors.map((f) => (
                <li key={f.label} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      f.met ? "bg-success" : "bg-muted-foreground/40",
                    )}
                  />
                  <span className={f.met ? "text-ink" : "text-ink-muted"}>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2 pt-2">
            {!session.isCurrent && onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="w-full h-9 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition"
              >
                Sign Out Device
              </button>
            )}
            {onSignOutAll && (
              <button
                type="button"
                onClick={onSignOutAll}
                className="w-full h-9 rounded-lg hairline text-sm font-medium hover:bg-muted transition"
              >
                Sign Out All Other Devices
              </button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function DeviceTimelineItem({ event }: { event: DeviceTimelineEvent }) {
  const dotClass =
    event.severity === "critical"
      ? "bg-destructive"
      : event.severity === "warning"
        ? "bg-warning"
        : event.severity === "success"
          ? "bg-success"
          : "bg-brand";

  const typeLabel =
    event.type === "login"
      ? "Login"
      : event.type === "verification"
        ? "Verification"
        : event.type === "trust"
          ? "Trust"
          : event.type === "revocation"
            ? "Revocation"
            : "Browser";

  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      <div className="flex flex-col items-center">
        <div className={cn("size-2.5 rounded-full ring-4 ring-surface shrink-0", dotClass)} />
        <div className="w-px flex-1 bg-hairline mt-1" />
      </div>
      <div className="flex-1 min-w-0 -mt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{event.title}</span>
          <span className="text-[10px] uppercase tracking-wide text-ink-faint font-medium">
            {typeLabel}
          </span>
        </div>
        <time className="text-xs text-ink-muted">{formatRelativeTime(event.at)}</time>
      </div>
    </div>
  );
}

export function SessionRow({
  session,
  onSignOut,
}: {
  session: SessionDevice;
  onSignOut: () => void;
}) {
  const location = parseLocation(session.locationLabel);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-hairline bg-surface-elev/40 p-4">
      <DeviceIcon session={session} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-ink">{deviceDisplayName(session)}</span>
          {session.isCurrent && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand/12 text-brand font-medium">
              Current
            </span>
          )}
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          {browserLabel(session)} · {osLabel(session)} · {location.city}
        </p>
        <p className="text-xs text-ink-faint mt-0.5">
          Last active {formatTimestamp(session.lastActivity)}
        </p>
      </div>
      {!session.isCurrent ? (
        <button
          type="button"
          onClick={onSignOut}
          className="shrink-0 h-8 px-3 rounded-lg hairline text-xs font-medium text-destructive hover:bg-destructive/10 transition"
        >
          Sign Out
        </button>
      ) : (
        <span className="text-xs text-success font-medium shrink-0">Active now</span>
      )}
    </div>
  );
}

export function LocationInsightCard({
  country,
  deviceCount,
  cities,
  isNew,
}: {
  country: string;
  deviceCount: number;
  cities: string[];
  isNew?: boolean;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-surface-elev/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-ink-muted" aria-hidden />
          <span className="text-sm font-semibold text-ink">{country}</span>
        </div>
        {isNew && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/12 text-warning font-medium border border-warning/20">
            New
          </span>
        )}
      </div>
      <p className="text-xs text-ink-muted mt-2">
        {deviceCount} device{deviceCount === 1 ? "" : "s"}
        {cities.length > 0 && ` · ${cities.slice(0, 2).join(", ")}`}
      </p>
    </div>
  );
}

export function LocationMapPlaceholder() {
  return (
    <div
      className="rounded-xl border border-dashed border-hairline bg-muted/30 p-8 flex flex-col items-center justify-center text-center min-h-[160px]"
      aria-hidden
    >
      <MapPin className="size-8 text-ink-faint mb-2" />
      <p className="text-xs text-ink-muted max-w-xs">
        Geographic access map — ready for future map integration
      </p>
    </div>
  );
}

export function DangerZoneAction({
  title,
  description,
  actionLabel,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink">{title}</div>
        <p className="text-xs text-ink-muted mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="shrink-0 h-9 px-4 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition disabled:opacity-50"
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function TrustScorePanel({ sessions }: { sessions: SessionDevice[] }) {
  const scores = sessions.map((s) => computeDeviceTrustScore(s).score);
  const avg = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0;
  const factors = [
    { label: "Verified devices", met: sessions.some((s) => s.isCurrent || s.trustState === "trusted") },
    { label: "Known browsers", met: sessions.every((s) => s.parsedDevice?.browser) },
    { label: "Known locations", met: sessions.some((s) => s.locationLabel && s.locationLabel !== "Unknown location") },
    { label: "Recent activity", met: sessions.some((s) => s.activityState === "recently_active" || s.isCurrent) },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <HeroScoreRing score={avg} size={120} />
      <div className="flex-1 w-full space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Trust Score</p>
          <p className="text-2xl font-semibold text-ink">{avg} / 100</p>
          <p className="text-xs text-ink-muted mt-1">Average across all active devices</p>
        </div>
        <ul className="space-y-2">
          {factors.map((f) => (
            <li key={f.label} className="flex items-center gap-2 text-xs">
              <Clock className="size-3 text-ink-faint" aria-hidden />
              <span className={f.met ? "text-ink" : "text-ink-muted"}>{f.label}</span>
              {f.met && <ShieldCheck className="size-3 text-success ml-auto" aria-hidden />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
