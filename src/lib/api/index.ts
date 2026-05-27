export { ApiError, apiFetch } from "./http";
export type { RequestOptions, ApiErrorBody } from "./http";

export { authApi } from "./endpoints/auth";
export type { AuthApi, AuthUser, ValidateSessionResponse } from "./endpoints/auth";

export { subscriptionsApi } from "./endpoints/subscriptions";
export type {
  SubscriptionsApi,
  SubscriptionState,
  SubscriptionEnvelope,
  SubscriptionEntitlements,
  SubscriptionLimits,
  PlanTier,
  SubscriptionLifecycleStatus,
} from "./endpoints/subscriptions";

export { vaultApi } from "./endpoints/vault";
export type { VaultApi, CoreVaultItem } from "./endpoints/vault";

export { settingsApi } from "./endpoints/settings";
export type { SettingsApi, SessionDevice } from "./endpoints/settings";

export { dashboardApi } from "./endpoints/dashboard";
export type { DashboardApi, DashboardOverview, DashboardSecuritySummary } from "./endpoints/dashboard";
