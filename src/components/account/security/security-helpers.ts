import type { DashboardSecuritySummary } from "@/lib/api";
import type { SessionDevice } from "@/lib/api/endpoints/settings";

export type SecurityLevel = "excellent" | "good" | "fair" | "at_risk";

export function securityLevel(score: number): { level: SecurityLevel; label: string } {
  if (score >= 95) return { level: "excellent", label: "Excellent" };
  if (score >= 80) return { level: "good", label: "Good" };
  if (score >= 60) return { level: "fair", label: "Fair" };
  return { level: "at_risk", label: "At risk" };
}

export function accountSecurityStatus(
  score: number,
  security: DashboardSecuritySummary,
  settings: { hasPassword: boolean; twoFactorEnabled: boolean },
): { label: string; tone: "healthy" | "attention" | "risk" } {
  if (!settings.hasPassword || score < 60 || security.breached > 0) {
    return { label: "At risk", tone: "risk" };
  }
  if (!settings.twoFactorEnabled || security.weak > 0 || security.reused > 0 || score < 80) {
    return { label: "Needs attention", tone: "attention" };
  }
  return { label: "Protected", tone: "healthy" };
}

export type ScoreBreakdown = {
  masterPassword: number;
  twoFactor: number;
  recoveryKit: number;
  trustedDevices: number;
  passwordHealth: number;
  total: number;
};

export function computeScoreBreakdown(
  security: DashboardSecuritySummary,
  settings: {
    hasPassword: boolean;
    twoFactorEnabled: boolean;
  },
  exportCount: number,
  trustedDevices: number,
  totalSessions: number,
): ScoreBreakdown {
  const masterPassword = settings.hasPassword ? 25 : 0;
  const twoFactor = settings.twoFactorEnabled ? 20 : 0;
  const recoveryKit = exportCount > 0 ? 15 : 0;
  const trustedDevicesPts =
    totalSessions === 0 ? 15 : Math.round(15 * (trustedDevices / totalSessions));
  const penalty = Math.min(
    25,
    security.weak * 3 + security.reused * 4 + security.breached * 8,
  );
  const passwordHealth = Math.max(0, 25 - penalty);
  const total = masterPassword + twoFactor + recoveryKit + trustedDevicesPts + passwordHealth;
  return {
    masterPassword,
    twoFactor,
    recoveryKit,
    trustedDevices: trustedDevicesPts,
    passwordHealth,
    total: Math.min(100, Math.max(security.score, total)),
  };
}

export function overallRiskLevel(
  security: DashboardSecuritySummary,
  settings: { twoFactorEnabled: boolean; hasPassword: boolean },
  pendingDevices: number,
): "low" | "medium" | "high" {
  if (security.breached > 0 || !settings.hasPassword) return "high";
  if (
    !settings.twoFactorEnabled ||
    security.weak > 0 ||
    security.reused > 0 ||
    pendingDevices > 0
  ) {
    return "medium";
  }
  return "low";
}

export function formatSessionDevice(session: SessionDevice | undefined): {
  browser: string;
  os: string;
  location: string;
  lastLogin: string;
} {
  if (!session) {
    return { browser: "Unknown", os: "Unknown", location: "Unknown", lastLogin: "—" };
  }
  const platform = session.parsedDevice?.platform || "web";
  const display = session.parsedDevice?.displayName || "Unknown browser";
  const lastTs = session.lastActivity
    ? new Date(session.lastActivity).getTime()
    : Date.now();
  return {
    browser: display.split("·")[0]?.trim() || display,
    os: session.parsedDevice?.os || platform,
    location: session.locationLabel || "Unknown location",
    lastLogin: formatRelative(lastTs),
  };
}

function formatRelative(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export function oldPasswordEstimate(total: number, recentCount: number): number {
  return Math.max(0, total - recentCount);
}
