import { apiFetch } from "../http";

const PREFIX = "/api/v1/settings";

export interface SettingsEnvelope<T extends Record<string, unknown>> {
  success: boolean;
  source?: string;
  settings: T;
}

export interface SessionDevice {
  id: string;
  isCurrent: boolean;
  deviceName?: string;
  platform?: string;
  ipAddress?: string;
  userAgent?: string;
  source?: string;
  locationLabel?: string;
  createdAt?: string;
  lastActivity?: string;
  activityState?: "recently_active" | "offline";
  parsedDevice?: {
    displayName?: string;
    platform?: string;
    os?: string;
    browser?: string;
    deviceType?: "desktop" | "mobile" | "tablet";
    model?: string | null;
  };
  trustState?: string;
}

export interface SessionsEnvelope {
  success: boolean;
  source?: string;
  count: number;
  sessions: SessionDevice[];
  securityOverview?: {
    activeSessions: number;
    trustedDevices: number;
    suspiciousSessions: number;
    recentActivity: number;
    lastSyncAt: string | null;
  };
}

export const settingsApi = {
  getSettings(token: string) {
    return apiFetch<
      SettingsEnvelope<{
        twoFactorEnabled: boolean;
        cloudSyncEnabled: boolean;
        notificationsEnabled: boolean;
        hasPassword: boolean;
        authMethods: string[];
        canSetLoginPassword: boolean;
        updatedAt: string | null;
      }>
    >(`${PREFIX}/`, {
      method: "GET",
      token,
    });
  },

  getSessions(token: string) {
    return apiFetch<SessionsEnvelope>(`${PREFIX}/sessions`, {
      method: "GET",
      token,
    });
  },

  revokeSession(token: string, sessionId: string) {
    return apiFetch<{ success: boolean; message?: string }>(`${PREFIX}/sessions/${sessionId}/revoke`, {
      method: "POST",
      token,
      body: {},
    });
  },

  revokeOtherSessions(token: string) {
    return apiFetch<{ success: boolean; revokedCount?: number; message?: string }>(
      `${PREFIX}/sessions/revoke-others`,
      {
        method: "POST",
        token,
        body: {},
      },
    );
  },

  getTwoFactorStatus(token: string) {
    return apiFetch<{ success: boolean; source?: string; enabled: boolean }>(`${PREFIX}/2fa/status`, {
      method: "GET",
      token,
    });
  },

  toggleTwoFactor(token: string, enabled: boolean) {
    return apiFetch<{ success: boolean; source?: string; enabled: boolean }>(`${PREFIX}/2fa/toggle`, {
      method: "POST",
      token,
      body: { enabled },
    });
  },

  changeMasterPassword(token: string, currentPassword: string, newPassword: string) {
    return apiFetch<{ success: boolean; source?: string; message?: string }>(
      `${PREFIX}/change-master-password`,
      {
        method: "POST",
        token,
        body: { currentPassword, newPassword },
      },
    );
  },

  createExport(token: string) {
    return apiFetch<{ success: boolean; source?: string; message?: string; data?: { id?: string } }>(
      `${PREFIX}/export`,
      {
        method: "POST",
        token,
        body: { format: "csv" },
      },
    );
  },

  getExportHistory(token: string) {
    return apiFetch<{
      success: boolean;
      source?: string;
      history: Array<{
        id: string;
        format: string;
        status: string;
        itemCount: number;
        fileName: string;
        createdAt?: string;
      }>;
    }>(`${PREFIX}/export/history`, {
      method: "GET",
      token,
    });
  },

  getAccountSummary(token: string) {
    return apiFetch<{
      success: boolean;
      source?: string;
      summary: {
        email?: string;
        name?: string;
        itemCount: number;
        sessionCount: number;
        exportCount: number;
        createdAt?: string;
      };
    }>(`${PREFIX}/account-summary`, {
      method: "GET",
      token,
    });
  },

  deleteAccount(token: string) {
    return apiFetch<{ success: boolean; source?: string; message?: string }>(`${PREFIX}/delete-account`, {
      method: "POST",
      token,
      body: {},
    });
  },
};

export type SettingsApi = typeof settingsApi;
