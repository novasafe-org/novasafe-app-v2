import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { AppShell } from "@/components/shell/AppShell";
import { setClientSession, type AuthUser } from "@/lib/auth";
import { ensureAuthenticatedUser } from "@/lib/auth/session-gate";
import { FeatureFlagsProvider } from "@/lib/feature-flags";
import { syncVaultScopeForUser } from "@/lib/vault-store";

/**
 * `_app` is the protected layout that hosts every authenticated screen.
 *
 * `beforeLoad` runs on both SSR and client navigation. The server-side
 * implementation reads the HttpOnly session cookie, validates it against the
 * backend, and either resolves the current user (passed into the route
 * context) or throws a `redirect({ href })` to the auth project — preserving
 * a `next=` round-trip so the user lands back where they tried to go.
 */
/** Authenticated shell — SSR auth gate avoids loading assets before redirect. */
export const Route = createFileRoute("/_app")({
  staleTime: 5 * 60 * 1000,
  beforeLoad: async ({ location }) => {
    const result = await ensureAuthenticatedUser(location.href);

    if (result.status !== "ok") {
      throw redirect({ href: result.redirectTo, statusCode: 302 });
    }

    return { user: result.user };
  },
  component: AppLayout,
});

function AppLayout() {
  const { user } = Route.useRouteContext();
  useHydrateClientSession(user);
  return (
    <FeatureFlagsProvider authenticated>
      <AppShell />
    </FeatureFlagsProvider>
  );
}

function useHydrateClientSession(user: AuthUser): void {
  useEffect(() => {
    syncVaultScopeForUser(user.id);
    setClientSession({ user, pending: false });
  }, [user]);
}
