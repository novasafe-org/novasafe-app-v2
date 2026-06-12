import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { buildAuditEvents } from "@/lib/account/audit";
import { dashboardApi, settingsApi, subscriptionsApi, type DashboardSecuritySummary } from "@/lib/api";
import { readSessionToken } from "@/lib/auth/session.server";
import { normalizeSubscriptionState } from "@/lib/billing/subscription-display";

function requireToken(): string {
  const token = readSessionToken();
  if (!token) throw new Error("Missing session. Please sign in again.");
  return token;
}

export const syncSubscriptionAfterUpgradeAction = createServerFn({ method: "POST" }).handler(async () => {
  const token = requireToken();
  const response = await subscriptionsApi.syncState(token);
  return response.data;
});

async function fetchMembershipData(token: string) {
  const membership = await subscriptionsApi.getMembership(token);
  const data = membership.data;
  if (!data?.subscription) {
    return {
      ok: false as const,
      message: "Billing data was incomplete. Please try again.",
    };
  }
  const normalized = {
    ...data,
    purchases: data.purchases ?? [],
    recentActivity: data.recentActivity ?? [],
    subscription: normalizeSubscriptionState(data.subscription),
  };
  return {
    ok: true as const,
    membership: normalized,
    state: normalized.subscription,
  };
}

export const loadMembershipAction = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await fetchMembershipData(requireToken());
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load billing information right now.";
    return {
      ok: false as const,
      message,
    };
  }
});

export const loadBillingCenterAction = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const token = requireToken();
    const [membershipResult, overviewRes, sessionsRes] = await Promise.all([
      fetchMembershipData(token),
      dashboardApi.getOverview(token),
      settingsApi.getSessions(token),
    ]);

    if (!membershipResult.ok) {
      return membershipResult;
    }

    const sessions = sessionsRes.sessions || [];
    return {
      ok: true as const,
      membership: membershipResult.membership,
      state: membershipResult.state,
      usage: {
        totalItems: overviewRes.data.totalItems,
        deviceCount: sessions.length,
        trustedDevices:
          sessionsRes.securityOverview?.trustedDevices ??
          sessions.filter((s) => s.trustState === "trusted" || s.isCurrent).length,
      },
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Couldn't load billing information right now.";
    return {
      ok: false as const,
      message,
    };
  }
});

export const loadDevicesAction = createServerFn({ method: "GET" }).handler(async () => {
  const token = requireToken();
  return settingsApi.getSessions(token);
});

export const loadDeviceTrustCenterAction = createServerFn({ method: "GET" }).handler(async () => {
  const token = requireToken();
  const [sessionsRes, settingsRes] = await Promise.all([
    settingsApi.getSessions(token),
    settingsApi.getSettings(token),
  ]);

  const sessions = sessionsRes.sessions || [];
  const overview = sessionsRes.securityOverview;
  const trusted =
    overview?.trustedDevices ?? sessions.filter((s) => s.trustState === "trusted" || s.isCurrent).length;
  const suspicious =
    overview?.suspiciousSessions ??
    sessions.filter(
      (s) => !s.isCurrent && s.trustState === "needs_verification" && s.activityState !== "recently_active",
    ).length;
  const pending = sessions.filter(
    (s) =>
      !s.isCurrent &&
      s.trustState === "needs_verification" &&
      s.activityState === "recently_active",
  ).length;

  return {
    sessions,
    count: sessionsRes.count,
    securityOverview: overview,
    settings: settingsRes.settings,
    stats: {
      trusted,
      pending,
      activeSessions: overview?.activeSessions ?? sessions.length,
      suspicious,
    },
  };
});

const sessionIdSchema = z.object({ sessionId: z.string().min(1) });

export const revokeDeviceSessionAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => sessionIdSchema.parse(input))
  .handler(async ({ data }) => {
    const token = requireToken();
    return settingsApi.revokeSession(token, data.sessionId);
  });

export const revokeOtherSessionsAction = createServerFn({ method: "POST" }).handler(async () => {
  const token = requireToken();
  return settingsApi.revokeOtherSessions(token);
});

export const loadAccountSettingsAction = createServerFn({ method: "GET" }).handler(async () => {
  const token = requireToken();
  const [settings, state] = await Promise.all([
    settingsApi.getSettings(token),
    subscriptionsApi.getState(token),
  ]);
  return {
    settings: settings.settings,
    subscription: state.data,
  };
});

export const loadSecurityAction = createServerFn({ method: "GET" }).handler(
  async (): Promise<{
    security: DashboardSecuritySummary;
    settings: {
      twoFactorEnabled: boolean;
      cloudSyncEnabled: boolean;
      notificationsEnabled: boolean;
      hasPassword: boolean;
      authMethods: string[];
      canSetLoginPassword: boolean;
      updatedAt: string | null;
    };
  }> => {
    const token = requireToken();
    const [settings, security] = await Promise.all([
      settingsApi.getSettings(token),
      dashboardApi.getSecuritySummary(token),
    ]);
    return {
      security: security.data,
      settings: settings.settings,
    };
  },
);

export const loadSecurityCenterAction = createServerFn({ method: "GET" }).handler(async () => {
  const token = requireToken();
  const [settingsRes, securityRes, overviewRes, sessionsRes, exportRes] = await Promise.all([
    settingsApi.getSettings(token),
    dashboardApi.getSecuritySummary(token),
    dashboardApi.getOverview(token),
    settingsApi.getSessions(token),
    settingsApi.getExportHistory(token).catch(() => ({
      history: [] as Array<{ id: string; createdAt?: string; status?: string }>,
    })),
  ]);

  const settings = settingsRes.settings;
  const security = securityRes.data;
  const overview = overviewRes.data;
  const sessions = sessionsRes.sessions || [];
  const exportHistory = exportRes.history || [];
  const overviewSecurity = sessionsRes.securityOverview;

  const timeline: Array<{
    id: string;
    title: string;
    at: number;
    severity: "info" | "success" | "warning" | "critical";
    type: string;
  }> = [];

  if (settings.twoFactorEnabled) {
    timeline.push({
      id: "2fa-enabled",
      title: "Two-factor authentication enabled",
      at: settings.updatedAt ? new Date(settings.updatedAt).getTime() : Date.now(),
      severity: "success",
      type: "2fa",
    });
  }

  for (const entry of exportHistory.slice(0, 3)) {
    const ts = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now();
    timeline.push({
      id: `export-${entry.id}`,
      title: "Recovery kit generated",
      at: ts,
      severity: "success",
      type: "recovery",
    });
  }

  if (settings.updatedAt && settings.hasPassword) {
    timeline.push({
      id: "password-updated",
      title: "Master password updated",
      at: new Date(settings.updatedAt).getTime(),
      severity: "info",
      type: "password",
    });
  }

  for (const session of sessions) {
    const ts = session.lastActivity
      ? new Date(session.lastActivity).getTime()
      : session.createdAt
        ? new Date(session.createdAt).getTime()
        : Date.now();
    timeline.push({
      id: `session-${session.id}`,
      title: session.isCurrent
        ? "Successful login on this device"
        : `Session activity: ${session.parsedDevice?.displayName || "Unknown device"}`,
      at: ts,
      severity: session.trustState === "trusted" ? "success" : "warning",
      type: session.isCurrent ? "login" : "device",
    });
  }

  timeline.sort((a, b) => b.at - a.at);

  const trustedDevices =
    overviewSecurity?.trustedDevices ?? sessions.filter((s) => s.trustState === "trusted").length;
  const suspiciousDevices = overviewSecurity?.suspiciousSessions ?? 0;
  const pendingDevices = Math.max(
    0,
    sessions.filter((s) => !s.isCurrent && s.trustState !== "trusted").length - suspiciousDevices,
  );

  const currentSession = sessions.find((s) => s.isCurrent) ?? sessions[0];

  return {
    settings,
    security,
    overview,
    sessions,
    exportHistory,
    timeline: timeline.slice(0, 8),
    deviceStats: {
      trusted: trustedDevices,
      pending: pendingDevices,
      suspicious: suspiciousDevices,
      revoked: 0,
    },
    activeSessions: overviewSecurity?.activeSessions ?? sessions.length,
    currentSession,
  };
});

const toggleTwoFactorSchema = z.object({ enabled: z.boolean() });
export const toggleTwoFactorAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => toggleTwoFactorSchema.parse(input))
  .handler(async ({ data }) => {
    const token = requireToken();
    return settingsApi.toggleTwoFactor(token, data.enabled);
  });

const changeMasterSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
export const changeMasterPasswordAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => changeMasterSchema.parse(input))
  .handler(async ({ data }) => {
    const token = requireToken();
    return settingsApi.changeMasterPassword(token, data.currentPassword, data.newPassword);
  });

export const createExportAction = createServerFn({ method: "POST" }).handler(async () => {
  const token = requireToken();
  return settingsApi.createExport(token);
});

export const loadRecoveryAction = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchRecoveryCenterData(requireToken());
  return {
    summary: data.summary,
    history: data.exportHistory,
  };
});

async function fetchRecoveryCenterData(token: string) {
  const [summaryRes, exportRes, settingsRes, sessionsRes] = await Promise.all([
    settingsApi.getAccountSummary(token),
    settingsApi.getExportHistory(token).catch(() => ({
      history: [] as Array<{
        id: string;
        format: string;
        status: string;
        itemCount: number;
        fileName: string;
        createdAt?: string;
      }>,
    })),
    settingsApi.getSettings(token),
    settingsApi.getSessions(token),
  ]);

  const sessions = sessionsRes.sessions || [];
  const exportHistory = exportRes.history || [];
  const settings = settingsRes.settings;
  const overview = sessionsRes.securityOverview;

  const trustedDevices =
    overview?.trustedDevices ?? sessions.filter((s) => s.trustState === "trusted" || s.isCurrent).length;

  return {
    summary: summaryRes.summary,
    exportHistory,
    settings,
    sessions,
    trustedDevices,
    activeSessions: overview?.activeSessions ?? sessions.length,
  };
}

export const loadRecoveryCenterAction = createServerFn({ method: "GET" }).handler(async () => {
  return fetchRecoveryCenterData(requireToken());
});

export const deleteAccountAction = createServerFn({ method: "POST" }).handler(async () => {
  const token = requireToken();
  return settingsApi.deleteAccount(token);
});

export const loadProfileDashboardAction = createServerFn({ method: "GET" }).handler(async () => {
  const token = requireToken();
  const [settingsRes, subscriptionRes, securityRes, overviewRes, sessionsRes, accountRes, exportRes] =
    await Promise.all([
      settingsApi.getSettings(token),
      subscriptionsApi.getState(token),
      dashboardApi.getSecuritySummary(token),
      dashboardApi.getOverview(token),
      settingsApi.getSessions(token),
      settingsApi.getAccountSummary(token),
      settingsApi.getExportHistory(token).catch(() => ({ history: [] as Array<{ id: string }> })),
    ]);

  const settings = settingsRes.settings;
  const subscription = subscriptionRes.data;
  const security = securityRes.data;
  const overview = overviewRes.data;
  const sessions = sessionsRes.sessions || [];
  const account = accountRes.summary;
  const exportHistory = exportRes.history || [];

  const events: Array<{
    id: string;
    kind: "security" | "login" | "item" | "share";
    message: string;
    at: number;
  }> = [];

  for (const item of overview.recentlyUsed || []) {
    const ts = item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now();
    events.push({
      id: `item-${item.id}-${ts}`,
      kind: "item",
      message: `${item.title || "Vault item"} updated`,
      at: ts,
    });
  }

  for (const session of sessions) {
    const ts = session.lastActivity ? new Date(session.lastActivity).getTime() : Date.now();
    events.push({
      id: `session-${session.id}-${ts}`,
      kind: "login",
      message: `Sign-in from ${session.parsedDevice?.displayName || "Unknown device"}`,
      at: ts,
    });
  }

  events.sort((a, b) => b.at - a.at);

  const trustedDevices =
    sessionsRes.securityOverview?.trustedDevices ??
    sessions.filter((s) => s.trustState === "trusted").length;

  return {
    settings,
    subscription,
    security,
    overview,
    sessions,
    account,
    exportHistory,
    activity: events.slice(0, 5),
    trustedDevices,
    activeSessions: sessionsRes.securityOverview?.activeSessions ?? sessions.length,
  };
});

async function fetchAuditCenterData(token: string) {
  const [membership, overview, sessionsRes, settingsRes, exportRes] = await Promise.all([
    subscriptionsApi.getMembership(token),
    dashboardApi.getOverview(token),
    settingsApi.getSessions(token),
    settingsApi.getSettings(token),
    settingsApi.getExportHistory(token).catch(() => ({
      history: [] as Array<{ id: string; createdAt?: string; fileName?: string }>,
    })),
  ]);

  const settings = settingsRes.settings;
  const events = buildAuditEvents({
    sessions: sessionsRes.sessions || [],
    overview: overview.data,
    billingActivity: membership.data.recentActivity || [],
    exportHistory: exportRes.history || [],
    settings,
  });

  return {
    events,
    sessions: sessionsRes.sessions || [],
    settings,
    securityOverview: sessionsRes.securityOverview,
  };
}

export const loadActivityAction = createServerFn({ method: "GET" }).handler(async () => {
  const data = await fetchAuditCenterData(requireToken());
  const activity = data.events.slice(0, 50).map((e) => ({
    id: e.id,
    kind:
      e.category === "login" || e.category === "devices"
        ? ("login" as const)
        : e.category === "vault"
          ? ("item" as const)
          : ("security" as const),
    message: e.description,
    at: e.at,
  }));
  return { activity };
});

export const loadAuditCenterAction = createServerFn({ method: "GET" }).handler(async () => {
  return fetchAuditCenterData(requireToken());
});
