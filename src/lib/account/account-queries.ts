import { useQuery, type QueryClient } from "@tanstack/react-query";
import {
  loadActivityAction,
  loadDevicesAction,
  loadMembershipAction,
  loadProfileAction,
  loadRecoveryAction,
  loadSecurityAction,
} from "@/lib/account/server-actions";

const STALE_MS = 60_000;

export const accountQueryKeys = {
  profile: ["account", "profile"] as const,
  security: ["account", "security"] as const,
  devices: ["account", "devices"] as const,
  activity: ["account", "activity"] as const,
  recovery: ["account", "recovery"] as const,
  billing: ["account", "billing"] as const,
};

export type AccountPrefetchPage = keyof typeof accountQueryKeys;

const accountQueryDefs = {
  profile: {
    queryKey: accountQueryKeys.profile,
    queryFn: () => loadProfileAction(),
    staleTime: STALE_MS,
  },
  security: {
    queryKey: accountQueryKeys.security,
    queryFn: () => loadSecurityAction(),
    staleTime: STALE_MS,
  },
  devices: {
    queryKey: accountQueryKeys.devices,
    queryFn: () => loadDevicesAction(),
    staleTime: STALE_MS,
  },
  activity: {
    queryKey: accountQueryKeys.activity,
    queryFn: () => loadActivityAction(),
    staleTime: STALE_MS,
  },
  recovery: {
    queryKey: accountQueryKeys.recovery,
    queryFn: () => loadRecoveryAction(),
    staleTime: STALE_MS,
  },
  billing: {
    queryKey: accountQueryKeys.billing,
    queryFn: () => loadMembershipAction(),
    staleTime: STALE_MS,
  },
} as const;

export function prefetchAccountPage(queryClient: QueryClient, page: AccountPrefetchPage) {
  return queryClient.prefetchQuery(accountQueryDefs[page]);
}

export function useProfileQuery() {
  return useQuery(accountQueryDefs.profile);
}

export function useSecurityQuery() {
  return useQuery(accountQueryDefs.security);
}

export function useDevicesQuery() {
  return useQuery(accountQueryDefs.devices);
}

export function useActivityQuery() {
  return useQuery(accountQueryDefs.activity);
}

export function useRecoveryQuery() {
  return useQuery(accountQueryDefs.recovery);
}

export function useBillingQuery() {
  return useQuery(accountQueryDefs.billing);
}

export const ACCOUNT_NAV_PREFETCH: Record<string, AccountPrefetchPage> = {
  "/account/profile": "profile",
  "/account/security": "security",
  "/account/devices": "devices",
  "/account/activity": "activity",
  "/account/recovery": "recovery",
  "/account/billing": "billing",
};
