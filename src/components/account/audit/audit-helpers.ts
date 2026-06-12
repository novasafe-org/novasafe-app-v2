import type { AuditEvent, AuditCategory, AuditSeverity } from "@/lib/account/audit";
import { formatRelativeTime } from "@/components/account/profile/profile-helpers";

export type AuditFilterCategory =
  | "all"
  | AuditCategory;

export type DateRangePreset = "all" | "24h" | "7d" | "30d" | "custom";

export type AuditStats = {
  today: number;
  login: number;
  security: number;
  vault: number;
  billing: number;
  trends: {
    today: number;
    login: number;
    security: number;
    vault: number;
    billing: number;
  };
};

export type TimelineGroup = {
  label: string;
  events: AuditEvent[];
};

export type LoginAnalytics = {
  successful: number;
  failed: number;
  newDevices: number;
  newLocations: number;
  successRate: number;
  countries: Array<{ country: string; count: number }>;
  topDevices: Array<{ device: string; count: number }>;
};

export type VaultMetrics = {
  passwordsAdded: number;
  passwordsUpdated: number;
  passwordsDeleted: number;
  notesCreated: number;
  notesUpdated: number;
  exportsGenerated: number;
};

export type AccountInsight = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "success" | "warning";
};

export type AnomalyItem = {
  id: string;
  title: string;
  description: string;
  severity: AuditSeverity;
  eventId?: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function isToday(at: number): boolean {
  return startOfDay(at) === startOfDay(Date.now());
}

function isYesterday(at: number): boolean {
  return startOfDay(at) === startOfDay(Date.now() - DAY_MS);
}

function trendPct(today: number, yesterday: number): number {
  if (yesterday === 0) return today > 0 ? 100 : 0;
  return Math.round(((today - yesterday) / yesterday) * 100);
}

export function computeAuditStats(events: AuditEvent[]): AuditStats {
  const todayEvents = events.filter((e) => isToday(e.at));
  const yesterdayEvents = events.filter((e) => isYesterday(e.at));

  const count = (list: AuditEvent[], pred: (e: AuditEvent) => boolean) =>
    list.filter(pred).length;

  const loginPred = (e: AuditEvent) => e.category === "login" || e.category === "devices";
  const securityPred = (e: AuditEvent) => e.category === "security" || e.category === "recovery";
  const vaultPred = (e: AuditEvent) => e.category === "vault";
  const billingPred = (e: AuditEvent) =>
    e.category === "billing" || e.category === "subscription";

  return {
    today: todayEvents.length,
    login: count(todayEvents, loginPred),
    security: count(todayEvents, securityPred),
    vault: count(todayEvents, vaultPred),
    billing: count(todayEvents, billingPred),
    trends: {
      today: trendPct(todayEvents.length, yesterdayEvents.length),
      login: trendPct(count(todayEvents, loginPred), count(yesterdayEvents, loginPred)),
      security: trendPct(count(todayEvents, securityPred), count(yesterdayEvents, securityPred)),
      vault: trendPct(count(todayEvents, vaultPred), count(yesterdayEvents, vaultPred)),
      billing: trendPct(count(todayEvents, billingPred), count(yesterdayEvents, billingPred)),
    },
  };
}

export function filterAuditEvents(
  events: AuditEvent[],
  opts: {
    category: AuditFilterCategory;
    search: string;
    severity: AuditSeverity | "all";
    device: string;
    location: string;
    dateRange: DateRangePreset;
    customFrom?: number;
    customTo?: number;
  },
): AuditEvent[] {
  const now = Date.now();
  let from = 0;
  let to = now;

  if (opts.dateRange === "24h") from = now - DAY_MS;
  else if (opts.dateRange === "7d") from = now - 7 * DAY_MS;
  else if (opts.dateRange === "30d") from = now - 30 * DAY_MS;
  else if (opts.dateRange === "custom" && opts.customFrom) {
    from = opts.customFrom;
    to = opts.customTo ?? now;
  }

  const q = opts.search.trim().toLowerCase();

  return events.filter((e) => {
    if (e.at < from || e.at > to) return false;
    if (opts.category !== "all" && e.category !== opts.category) return false;
    if (opts.severity !== "all" && e.severity !== opts.severity) return false;
    if (opts.device !== "all" && (e.deviceName || "") !== opts.device) return false;
    if (opts.location !== "all" && (e.location || "") !== opts.location) return false;
    if (!q) return true;
    const haystack = [
      e.title,
      e.description,
      e.deviceName,
      e.browser,
      e.os,
      e.location,
      e.eventType,
      e.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function groupEventsByDate(events: AuditEvent[]): TimelineGroup[] {
  const groups: TimelineGroup[] = [];
  const today: AuditEvent[] = [];
  const yesterday: AuditEvent[] = [];
  const last7: AuditEvent[] = [];
  const older: AuditEvent[] = [];

  const weekAgo = Date.now() - 7 * DAY_MS;

  for (const e of events) {
    if (isToday(e.at)) today.push(e);
    else if (isYesterday(e.at)) yesterday.push(e);
    else if (e.at >= weekAgo) last7.push(e);
    else older.push(e);
  }

  if (today.length) groups.push({ label: "Today", events: today });
  if (yesterday.length) groups.push({ label: "Yesterday", events: yesterday });
  if (last7.length) groups.push({ label: "Last 7 Days", events: last7 });
  if (older.length) groups.push({ label: "Earlier", events: older });

  return groups;
}

export function uniqueDevices(events: AuditEvent[]): string[] {
  return Array.from(
    new Set(events.map((e) => e.deviceName).filter((d): d is string => Boolean(d))),
  ).sort();
}

export function uniqueLocations(events: AuditEvent[]): string[] {
  return Array.from(
    new Set(events.map((e) => e.location).filter((l): l is string => Boolean(l && l !== "—"))),
  ).sort();
}

export function computeLoginAnalytics(events: AuditEvent[]): LoginAnalytics {
  const loginEvents = events.filter(
    (e) => e.category === "login" || e.category === "devices",
  );
  const successful = loginEvents.filter(
    (e) => e.eventType.includes("login") || e.eventType === "session_activity",
  ).length;
  const failed = events.filter((e) => e.eventType.includes("failed")).length;
  const newDevices = events.filter((e) => e.eventType === "new_device_login").length;

  const locationSet = new Set<string>();
  const newLocationSet = new Set<string>();
  const locationCounts = new Map<string, number>();
  for (const e of loginEvents) {
    if (!e.country || e.country === "Unknown" || e.country === "—") continue;
    locationCounts.set(e.country, (locationCounts.get(e.country) ?? 0) + 1);
    locationSet.add(e.location || e.country);
  }
  for (const [loc, count] of locationCounts) {
    if (count === 1) newLocationSet.add(loc);
  }

  const deviceCounts = new Map<string, number>();
  for (const e of loginEvents) {
    if (!e.deviceName) continue;
    deviceCounts.set(e.deviceName, (deviceCounts.get(e.deviceName) ?? 0) + 1);
  }

  const total = successful + failed;
  const successRate = total > 0 ? Math.round((successful / total) * 100) : 100;

  return {
    successful,
    failed,
    newDevices,
    newLocations: newLocationSet.size,
    successRate,
    countries: Array.from(locationCounts.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    topDevices: Array.from(deviceCounts.entries())
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };
}

export function computeVaultMetrics(events: AuditEvent[]): VaultMetrics {
  const vault = events.filter((e) => e.category === "vault");
  const recovery = events.filter((e) => e.category === "recovery");
  return {
    passwordsAdded: vault.filter((e) => e.eventType.includes("created")).length,
    passwordsUpdated: vault.filter((e) => e.title.toLowerCase().includes("password")).length,
    passwordsDeleted: vault.filter((e) => e.eventType.includes("deleted")).length,
    notesCreated: vault.filter((e) => e.title.toLowerCase().includes("note created")).length,
    notesUpdated: vault.filter((e) => e.title.toLowerCase().includes("note")).length,
    exportsGenerated: recovery.length,
  };
}

export function computeSecurityEvents(events: AuditEvent[]): AuditEvent[] {
  return events.filter(
    (e) =>
      e.category === "security" ||
      e.category === "recovery" ||
      e.category === "devices" ||
      e.eventType.includes("two_factor") ||
      e.eventType.includes("password") ||
      e.eventType.includes("verification") ||
      e.eventType.includes("revoke"),
  );
}

export function computeAccountInsights(events: AuditEvent[]): AccountInsight[] {
  const deviceCounts = new Map<string, number>();
  const browserCounts = new Map<string, number>();
  const locationCounts = new Map<string, number>();
  let warningCount = 0;

  for (const e of events) {
    if (e.deviceName) deviceCounts.set(e.deviceName, (deviceCounts.get(e.deviceName) ?? 0) + 1);
    if (e.browser) browserCounts.set(e.browser, (browserCounts.get(e.browser) ?? 0) + 1);
    if (e.location && e.location !== "—")
      locationCounts.set(e.location, (locationCounts.get(e.location) ?? 0) + 1);
    if (e.severity === "warning" || e.severity === "critical") warningCount++;
  }

  const topDevice = [...deviceCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topBrowser = [...browserCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topLocation = [...locationCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  const recentWarnings = events.filter((e) => e.severity !== "info").slice(0, 3);

  return [
    {
      id: "device",
      label: "Most active device",
      value: topDevice?.[0] || "—",
      hint: topDevice ? `${topDevice[1]} events` : undefined,
    },
    {
      id: "browser",
      label: "Most active browser",
      value: topBrowser?.[0] || "—",
      hint: topBrowser ? `${topBrowser[1]} events` : undefined,
    },
    {
      id: "location",
      label: "Most active location",
      value: topLocation?.[0] || "—",
      hint: topLocation ? `${topLocation[1]} events` : undefined,
    },
    {
      id: "unusual",
      label: "Unusual activity",
      value: warningCount > 0 ? `${warningCount} flagged event${warningCount === 1 ? "" : "s"}` : "None detected",
      tone: warningCount > 0 ? "warning" : "success",
      hint: recentWarnings[0]?.title,
    },
    {
      id: "trend",
      label: "Security trend",
      value: warningCount > 2 ? "Elevated" : warningCount > 0 ? "Moderate" : "Stable",
      tone: warningCount > 2 ? "warning" : warningCount > 0 ? "neutral" : "success",
      hint: "Based on warning and critical events",
    },
  ];
}

export function detectAnomalies(events: AuditEvent[]): AnomalyItem[] {
  const items: AnomalyItem[] = [];

  const suspiciousLogins = events.filter(
    (e) =>
      e.eventType === "new_device_login" ||
      e.eventType === "device_verification_required",
  );
  for (const e of suspiciousLogins.slice(0, 3)) {
    items.push({
      id: `anomaly-login-${e.id}`,
      title: e.title,
      description: e.description,
      severity: e.severity,
      eventId: e.id,
    });
  }

  const unknownDevices = events.filter(
    (e) => e.riskLevel === "high" || e.severity === "critical",
  );
  if (unknownDevices.length === 0 && suspiciousLogins.length === 0) {
    items.push({
      id: "anomaly-clear",
      title: "No anomalies detected",
      description: "NovaSafe has not flagged suspicious activity in the current audit window.",
      severity: "info",
    });
  }

  const failed = events.filter((e) => e.eventType.includes("failed"));
  if (failed.length >= 3) {
    items.push({
      id: "anomaly-failed",
      title: "Multiple failed login attempts",
      description: `${failed.length} failed authentication events detected.`,
      severity: "critical",
    });
  }

  const locations = new Set(
    events.filter((e) => e.eventType === "new_device_login").map((e) => e.country),
  );
  if (locations.size > 2) {
    items.push({
      id: "anomaly-locations",
      title: "Unknown locations detected",
      description: `Sign-ins from ${locations.size} countries in the audit period.`,
      severity: "warning",
    });
  }

  return items;
}

export function formatEventTime(at: number): string {
  return formatRelativeTime(at);
}

export function formatEventDateTime(at: number): string {
  return new Date(at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function exportAuditCsv(events: AuditEvent[]): void {
  const headers = [
    "Event ID",
    "Timestamp",
    "Category",
    "Severity",
    "Title",
    "Description",
    "Device",
    "Browser",
    "OS",
    "Location",
    "IP Address",
    "Risk Level",
  ];
  const rows = events.map((e) =>
    [
      e.id,
      new Date(e.at).toISOString(),
      e.category,
      e.severity,
      e.title,
      e.description,
      e.deviceName || "",
      e.browser || "",
      e.os || "",
      e.location || "",
      e.ipAddress || "",
      e.riskLevel,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  downloadBlob(csv, "novasafe-audit.csv", "text/csv");
}

export function exportAuditJson(events: AuditEvent[]): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    eventCount: events.length,
    events,
  };
  downloadBlob(JSON.stringify(payload, null, 2), "novasafe-audit.json", "application/json");
}

export function exportAuditReport(events: AuditEvent[]): void {
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>NovaSafe Audit Report</title>
<style>
body{font-family:system-ui,sans-serif;padding:40px;color:#111}
h1{font-size:22px} table{width:100%;border-collapse:collapse;margin-top:24px;font-size:12px}
th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f5f5f5}
.meta{color:#666;font-size:13px;margin-bottom:24px}
</style></head><body>
<h1>NovaSafe Audit Report</h1>
<p class="meta">Generated ${new Date().toLocaleString()} · ${events.length} events</p>
<table>
<thead><tr><th>Time</th><th>Severity</th><th>Category</th><th>Title</th><th>Device</th><th>Location</th></tr></thead>
<tbody>
${events
  .map(
    (e) =>
      `<tr><td>${formatEventDateTime(e.at)}</td><td>${e.severity}</td><td>${e.category}</td><td>${e.title}</td><td>${e.deviceName || "—"}</td><td>${e.location || "—"}</td></tr>`,
  )
  .join("")}
</tbody></table></body></html>`;
  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  }
}

function downloadBlob(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const CATEGORY_LABELS: Record<AuditFilterCategory, string> = {
  all: "All Events",
  login: "Logins",
  vault: "Vault",
  devices: "Devices",
  security: "Security",
  recovery: "Recovery",
  billing: "Billing",
  subscription: "Subscription",
  api: "API",
};
