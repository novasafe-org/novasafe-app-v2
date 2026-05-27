import { apiFetch } from "../http";

const PREFIX = "/api/v1/dashboard";

export interface DashboardSecuritySummary {
  score: number;
  weak: number;
  reused: number;
  breached: number;
  total: number;
}

export interface DashboardOverview {
  totalItems: number;
  weakPasswordsCount: number;
  reusedPasswordsCount: number;
  breachedPasswordsCount: number;
  recentlyUsed: Array<{
    id: string;
    title?: string;
    category?: string;
    updatedAt?: string;
  }>;
}

export const dashboardApi = {
  getOverview(token: string) {
    return apiFetch<{ success: boolean; source?: string; data: DashboardOverview }>(`${PREFIX}/overview`, {
      method: "GET",
      token,
    });
  },

  getSecuritySummary(token: string) {
    return apiFetch<{ success: boolean; source?: string; data: DashboardSecuritySummary }>(
      `${PREFIX}/security/summary`,
      {
        method: "GET",
        token,
      },
    );
  },
};

export type DashboardApi = typeof dashboardApi;
