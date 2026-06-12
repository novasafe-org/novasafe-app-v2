import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { SecurityCenterDashboard } from "@/components/account/security/SecurityCenterDashboard";
import { loadSecurityCenterAction } from "@/lib/account/server-actions";

const appRoute = getRouteApi("/_app");

export const Route = createFileRoute("/_app/account/security")({
  head: () => ({ meta: [{ title: "Security — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadSecurityCenterAction(),
  component: function SecurityRoute() {
    const { user } = appRoute.useRouteContext();
    const data = Route.useLoaderData();
    return <SecurityCenterDashboard data={data} userEmail={user.email} />;
  },
});
