import type { SessionDevice } from "@/lib/api/endpoints/settings";
import type { DashboardOverview } from "@/lib/api/endpoints/dashboard";
import { formatActivityEventLabel } from "@/lib/billing/subscription-display";

export type AuditCategory =
  | "login"
  | "vault"
  | "devices"
  | "security"
  | "recovery"
  | "billing"
  | "subscription"
  | "api";

export type AuditSeverity = "info" | "warning" | "critical";

export type AuditEvent = {
  id: string;
  category: AuditCategory;
  severity: AuditSeverity;
  eventType: string;
  title: string;
  description: string;
  at: number;
  deviceName?: string;
  browser?: string;
  os?: string;
  location?: string;
  city?: string;
  country?: string;
  ipAddress?: string;
  userAgent?: string;
  riskLevel: "low" | "medium" | "high";
  relatedActions?: string[];
};

function parseLocationLabel(label?: string): { city: string; country: string; label: string } {
  const text = label?.trim() || "Unknown location";
  if (text === "Unknown location") return { city: "Unknown", country: "Unknown", label: text };
  const parts = text.split(",").map((p) => p.trim()).filter(Boolean);
  const country = parts.length > 1 ? parts[parts.length - 1] : parts[0] || "Unknown";
  const city = parts.length > 1 ? parts[0] : parts[0] || "Unknown";
  return { city, country, label: text };
}

function sessionMeta(session: SessionDevice) {
  const loc = parseLocationLabel(session.locationLabel);
  const deviceName =
    session.deviceName?.trim() && !/unknown/i.test(session.deviceName)
      ? session.deviceName
      : session.parsedDevice?.displayName || "Unknown device";
  return {
    deviceName,
    browser: session.parsedDevice?.browser || "Unknown",
    os: session.parsedDevice?.os || session.platform || "Unknown",
    location: loc.label,
    city: loc.city,
    country: loc.country,
    ipAddress: session.ipAddress,
    userAgent: session.userAgent,
  };
}

function vaultTitle(category?: string, title?: string): string {
  const cat = (category || "").toLowerCase();
  if (cat.includes("note")) return "Note Updated";
  if (cat.includes("login") || cat.includes("password")) return "Password Updated";
  if (cat.includes("card")) return "Card Updated";
  if (cat.includes("identity")) return "Identity Updated";
  return title ? "Vault Item Updated" : "Vault Item Updated";
}

function billingCategory(eventType: string): AuditCategory {
  const t = eventType.toUpperCase();
  if (t.includes("PRODUCT") || t.includes("RENEWAL") || t.includes("PURCHASE")) return "subscription";
  return "billing";
}

export function buildAuditEvents(input: {
  sessions: SessionDevice[];
  overview: DashboardOverview;
  billingActivity: Array<{ eventType: string; processedAt: string | null; status?: string }>;
  exportHistory: Array<{ id: string; createdAt?: string; fileName?: string }>;
  settings: {
    twoFactorEnabled: boolean;
    hasPassword: boolean;
    updatedAt: string | null;
    cloudSyncEnabled: boolean;
  };
}): AuditEvent[] {
  const events: AuditEvent[] = [];

  for (const session of input.sessions) {
    const meta = sessionMeta(session);
    const isNewDevice =
      session.createdAt &&
      Date.now() - new Date(session.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
    const needsReview =
      session.trustState === "needs_verification" && !session.isCurrent;

    if (session.createdAt) {
      const at = new Date(session.createdAt).getTime();
      events.push({
        id: `login-new-${session.id}`,
        category: isNewDevice ? "devices" : "login",
        severity: needsReview ? "warning" : "info",
        eventType: isNewDevice ? "new_device_login" : "successful_login",
        title: isNewDevice ? "New Device Login" : "Successful Login",
        description: isNewDevice
          ? `${meta.deviceName} signed in for the first time`
          : `${meta.deviceName} authenticated successfully`,
        at,
        ...meta,
        riskLevel: needsReview ? "medium" : "low",
        relatedActions: needsReview ? ["Review device", "Verify device"] : ["View device"],
      });
    }

    if (session.lastActivity) {
      const at = new Date(session.lastActivity).getTime();
      const created = session.createdAt ? new Date(session.createdAt).getTime() : 0;
      if (!created || at - created > 120_000) {
        events.push({
          id: `login-activity-${session.id}-${at}`,
          category: "login",
          severity: session.isCurrent ? "info" : needsReview ? "warning" : "info",
          eventType: "session_activity",
          title: session.isCurrent ? "Active Session" : "Session Activity",
          description: `${meta.deviceName} — ${meta.browser} on ${meta.os}`,
          at,
          ...meta,
          riskLevel: needsReview ? "medium" : "low",
        });
      }
    }

    if (needsReview) {
      events.push({
        id: `device-review-${session.id}`,
        category: "devices",
        severity: "warning",
        eventType: "device_verification_required",
        title: "Device Verification Required",
        description: `${meta.deviceName} needs verification before full trust`,
        at: session.lastActivity
          ? new Date(session.lastActivity).getTime()
          : Date.now(),
        ...meta,
        riskLevel: "medium",
        relatedActions: ["Verify device", "Sign out device"],
      });
    }
  }

  for (const item of input.overview.recentlyUsed || []) {
    const at = item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now();
    const title = vaultTitle(item.category, item.title);
    events.push({
      id: `vault-${item.id}-${at}`,
      category: "vault",
      severity: "info",
      eventType: "vault_item_updated",
      title,
      description: item.title
        ? `${item.title} credential updated in your vault`
        : "A vault item was updated",
      at,
      deviceName: "NovaSafe Vault",
      browser: "Cloud Sync",
      os: "Vault",
      location: "Encrypted vault",
      city: "—",
      country: "—",
      riskLevel: "low",
      relatedActions: ["View vault item"],
    });
  }

  for (const entry of input.billingActivity) {
    const at = entry.processedAt ? new Date(entry.processedAt).getTime() : Date.now();
    const label = formatActivityEventLabel(entry.eventType);
    const isIssue = /issue|cancel|expir|fail/i.test(entry.eventType);
    events.push({
      id: `billing-${entry.eventType}-${at}`,
      category: billingCategory(entry.eventType),
      severity: isIssue ? "warning" : "info",
      eventType: entry.eventType.toLowerCase(),
      title: label,
      description: `Billing event: ${label}`,
      at,
      deviceName: "NovaSafe Billing",
      riskLevel: isIssue ? "medium" : "low",
      relatedActions: ["View billing"],
    });
  }

  for (const entry of input.exportHistory) {
    const at = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now();
    events.push({
      id: `recovery-${entry.id}`,
      category: "recovery",
      severity: "info",
      eventType: "recovery_kit_generated",
      title: "Recovery Kit Generated",
      description: entry.fileName
        ? `Encrypted export created: ${entry.fileName}`
        : "Encrypted recovery export generated",
      at,
      deviceName: "NovaSafe Vault",
      riskLevel: "low",
      relatedActions: ["Download recovery kit"],
    });
  }

  if (input.settings.twoFactorEnabled && input.settings.updatedAt) {
    events.push({
      id: "security-2fa",
      category: "security",
      severity: "info",
      eventType: "two_factor_enabled",
      title: "Two-Factor Authentication Enabled",
      description: "Authenticator app 2FA is active on your account",
      at: new Date(input.settings.updatedAt).getTime(),
      deviceName: "Account Security",
      riskLevel: "low",
      relatedActions: ["Manage 2FA"],
    });
  }

  if (input.settings.hasPassword && input.settings.updatedAt) {
    events.push({
      id: "security-password",
      category: "security",
      severity: "info",
      eventType: "master_password_updated",
      title: "Master Password Updated",
      description: "Your master password was changed",
      at: new Date(input.settings.updatedAt).getTime(),
      deviceName: "Account Security",
      riskLevel: "low",
      relatedActions: ["Change password"],
    });
  }

  if (input.settings.cloudSyncEnabled) {
    events.push({
      id: "security-sync",
      category: "security",
      severity: "info",
      eventType: "cloud_sync_enabled",
      title: "Secure Cloud Sync Enabled",
      description: "Vault sync is active across your devices",
      at: input.settings.updatedAt
        ? new Date(input.settings.updatedAt).getTime()
        : Date.now(),
      deviceName: "NovaSafe Cloud",
      riskLevel: "low",
    });
  }

  events.sort((a, b) => b.at - a.at);

  const seen = new Set<string>();
  return events.filter((e) => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });
}
