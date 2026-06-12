import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { RecoveryCenter } from "@/components/account/recovery/RecoveryCenter";
import { loadRecoveryCenterAction } from "@/lib/account/server-actions";

const appRoute = getRouteApi("/_app");

export const Route = createFileRoute("/_app/account/recovery")({
  head: () => ({ meta: [{ title: "Recovery — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadRecoveryCenterAction(),
  component: function RecoveryRoute() {
    const { user } = appRoute.useRouteContext();
    const data = Route.useLoaderData();
    return <RecoveryCenter data={data} userEmail={user.email} />;
  },
});
