import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { dashboardApi, settingsApi, subscriptionsApi, type DashboardSecuritySummary } from "@/lib/api";
import { readSessionToken } from "@/lib/auth/session.server";

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

export const loadMembershipAction = createServerFn({ method: "GET" }).handler(async () => {
  const token = requireToken();
  try {
    const membership = await subscriptionsApi.getMembership(token);
    return {
      ok: true as const,
      membership: membership.data,
      state: membership.data.subscription,
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
  const token = requireToken();
  const [summary, history] = await Promise.all([
    settingsApi.getAccountSummary(token),
    settingsApi.getExportHistory(token),
  ]);
  return {
    summary: summary.summary,
    history: history.history,
  };
});

export const deleteAccountAction = createServerFn({ method: "POST" }).handler(async () => {
  const token = requireToken();
  return settingsApi.deleteAccount(token);
});

export const loadActivityAction = createServerFn({ method: "GET" }).handler(async () => {
  const token = requireToken();
  const [membership, overview, sessions] = await Promise.all([
    subscriptionsApi.getMembership(token),
    dashboardApi.getOverview(token),
    settingsApi.getSessions(token),
  ]);

  const events: Array<{
    id: string;
    kind: "security" | "login" | "item" | "share";
    message: string;
    at: number;
  }> = [];

  for (const entry of membership.data.recentActivity || []) {
    const ts = entry.processedAt ? new Date(entry.processedAt).getTime() : Date.now();
    events.push({
      id: `billing-${entry.eventType}-${ts}`,
      kind: "security",
      message: `Billing event: ${entry.eventType.replaceAll("_", " ")}`,
      at: ts,
    });
  }

  for (const item of overview.data.recentlyUsed || []) {
    const ts = item.updatedAt ? new Date(item.updatedAt).getTime() : Date.now();
    events.push({
      id: `item-${item.id}-${ts}`,
      kind: "item",
      message: `Vault item updated: ${item.title || "Untitled item"}`,
      at: ts,
    });
  }

  for (const session of sessions.sessions || []) {
    const ts = session.lastActivity ? new Date(session.lastActivity).getTime() : Date.now();
    events.push({
      id: `session-${session.id}-${ts}`,
      kind: "login",
      message: `Session activity: ${session.parsedDevice?.displayName || "Unknown device"}`,
      at: ts,
    });
  }

  events.sort((a, b) => b.at - a.at);
  return { activity: events.slice(0, 50) };
});
