import type { SessionDevice } from "@/lib/api/endpoints/settings";
import { formatRelativeTime } from "@/components/account/profile/profile-helpers";

export type TrustStatus = "trusted" | "verified" | "needs_verification" | "suspicious";

export type ParsedLocation = {
  label: string;
  city: string;
  country: string;
  timezone: string;
};

export type DeviceTimelineEvent = {
  id: string;
  title: string;
  at: number;
  type: "login" | "verification" | "trust" | "revocation" | "browser";
  severity: "info" | "success" | "warning" | "critical";
};

export function deviceDisplayName(session: SessionDevice): string {
  const name = session.deviceName?.trim();
  if (name && !/unknown/i.test(name)) return name;
  return session.parsedDevice?.displayName || "Unknown device";
}

export function resolveTrustStatus(session: SessionDevice): TrustStatus {
  if (session.isCurrent) return "verified";
  if (session.trustState === "trusted") return "trusted";
  if (session.trustState === "needs_verification") {
    if (session.activityState === "recently_active") return "needs_verification";
    return "suspicious";
  }
  return "needs_verification";
}

export function trustStatusLabel(status: TrustStatus): string {
  switch (status) {
    case "trusted":
      return "Trusted";
    case "verified":
      return "Verified";
    case "needs_verification":
      return "Needs Verification";
    case "suspicious":
      return "Suspicious";
  }
}

export function parseLocation(locationLabel?: string): ParsedLocation {
  const label = locationLabel?.trim() || "Unknown location";
  if (label === "Unknown location") {
    return { label, city: "Unknown", country: "Unknown", timezone: "UTC" };
  }
  const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
  const country = parts.length > 1 ? parts[parts.length - 1] : parts[0] || "Unknown";
  const city = parts.length > 1 ? parts[0] : parts[0] || "Unknown";
  const timezone = guessTimezone(country);
  return { label, city, country, timezone };
}

function guessTimezone(country: string): string {
  const map: Record<string, string> = {
    India: "Asia/Kolkata",
    Germany: "Europe/Berlin",
    "United States": "America/New_York",
    USA: "America/New_York",
    UK: "Europe/London",
    "United Kingdom": "Europe/London",
    Japan: "Asia/Tokyo",
    Australia: "Australia/Sydney",
  };
  return map[country] || "UTC";
}

export function maskIp(ip?: string): string {
  if (!ip || ip === "Unknown") return "—";
  const parts = ip.split(".");
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
  if (ip.includes(":")) return `${ip.slice(0, 8)}:xxxx`;
  return ip;
}

export function formatTimestamp(iso?: string): string {
  if (!iso) return "—";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  return formatRelativeTime(ts);
}

export function formatFullDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function computeDeviceTrustScore(session: SessionDevice): {
  score: number;
  factors: Array<{ label: string; met: boolean }>;
} {
  const factors = [
    {
      label: "Verified device",
      met: session.isCurrent || session.trustState === "trusted",
    },
    {
      label: "Known browser",
      met: Boolean(session.parsedDevice?.browser && session.parsedDevice.browser !== "NovaSafe Mobile"),
    },
    {
      label: "Known location",
      met: Boolean(session.locationLabel && session.locationLabel !== "Unknown location"),
    },
    {
      label: "Recent activity",
      met: session.isCurrent || session.activityState === "recently_active",
    },
  ];
  const score = factors.filter((f) => f.met).length * 25;
  return { score, factors };
}

export function deviceRiskLevel(session: SessionDevice): "low" | "medium" | "high" {
  const status = resolveTrustStatus(session);
  if (status === "suspicious") return "high";
  if (status === "needs_verification") return "medium";
  return "low";
}

export function buildDeviceTimeline(sessions: SessionDevice[]): DeviceTimelineEvent[] {
  const events: DeviceTimelineEvent[] = [];

  for (const session of sessions) {
    const name = deviceDisplayName(session);

    if (session.createdAt) {
      events.push({
        id: `${session.id}-login`,
        title: `New login — ${name}`,
        at: new Date(session.createdAt).getTime(),
        type: "login",
        severity: "info",
      });
    }

    if (session.trustState === "trusted" || session.isCurrent) {
      const at = session.createdAt
        ? new Date(session.createdAt).getTime()
        : session.lastActivity
          ? new Date(session.lastActivity).getTime()
          : Date.now();
      events.push({
        id: `${session.id}-verified`,
        title: `Device verified — ${name}`,
        at,
        type: "verification",
        severity: "success",
      });
    }

    if (session.lastActivity && session.createdAt) {
      const last = new Date(session.lastActivity).getTime();
      const created = new Date(session.createdAt).getTime();
      if (last - created > 60_000) {
        events.push({
          id: `${session.id}-activity`,
          title: `Session activity — ${name}`,
          at: last,
          type: "login",
          severity: session.isCurrent ? "success" : "info",
        });
      }
    }

    if (session.trustState === "needs_verification" && !session.isCurrent) {
      events.push({
        id: `${session.id}-trust`,
        title: `Trust review required — ${name}`,
        at: session.lastActivity
          ? new Date(session.lastActivity).getTime()
          : Date.now(),
        type: "trust",
        severity: "warning",
      });
    }
  }

  events.sort((a, b) => b.at - a.at);
  return events.slice(0, 12);
}

export type LocationInsight = {
  country: string;
  deviceCount: number;
  cities: string[];
  isNew: boolean;
};

export function buildLocationInsights(sessions: SessionDevice[]): {
  countries: LocationInsight[];
  knownLocations: string[];
  newLocations: string[];
} {
  const byCountry = new Map<string, { devices: Set<string>; cities: Set<string> }>();

  for (const session of sessions) {
    const { country, city, label } = parseLocation(session.locationLabel);
    if (country === "Unknown") continue;
    const entry = byCountry.get(country) ?? { devices: new Set(), cities: new Set() };
    entry.devices.add(session.id);
    if (city !== "Unknown") entry.cities.add(city);
    byCountry.set(country, entry);
  }

  const locationCounts = new Map<string, number>();
  for (const session of sessions) {
    const label = session.locationLabel || "Unknown";
    locationCounts.set(label, (locationCounts.get(label) ?? 0) + 1);
  }

  const knownLocations: string[] = [];
  const newLocations: string[] = [];
  for (const [label, count] of locationCounts) {
    if (label === "Unknown location") continue;
    if (count > 1) knownLocations.push(label);
    else newLocations.push(label);
  }

  const countries: LocationInsight[] = Array.from(byCountry.entries())
    .map(([country, data]) => ({
      country,
      deviceCount: data.devices.size,
      cities: Array.from(data.cities),
      isNew: !knownLocations.some((l) => l.includes(country)),
    }))
    .sort((a, b) => b.deviceCount - a.deviceCount);

  return { countries, knownLocations, newLocations };
}

export function deviceTypeLabel(session: SessionDevice): string {
  const type = session.parsedDevice?.deviceType;
  if (type === "mobile") return "Mobile";
  if (type === "tablet") return "Tablet";
  return "Desktop";
}

export function browserLabel(session: SessionDevice): string {
  const browser = session.parsedDevice?.browser || "Unknown";
  return browser;
}

export function osLabel(session: SessionDevice): string {
  return session.parsedDevice?.os || session.platform || "Unknown";
}
