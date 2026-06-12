import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ProfileSettings } from "@/components/account/simple/ProfileSettings";
import { loadProfileDashboardAction } from "@/lib/account/server-actions";

const appRoute = getRouteApi("/_app");

export const Route = createFileRoute("/_app/account/profile")({
  head: () => ({ meta: [{ title: "Profile — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadProfileDashboardAction(),
  component: function ProfilePage() {
    const { user } = appRoute.useRouteContext();
    const data = Route.useLoaderData();
    return <ProfileSettings user={user} data={data} />;
  },
});
