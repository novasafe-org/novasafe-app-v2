import { createFileRoute } from "@tanstack/react-router";
import { ActivitySettings } from "@/components/account/simple/ActivitySettings";
import { loadActivityAction } from "@/lib/account/server-actions";

export const Route = createFileRoute("/_app/account/activity")({
  head: () => ({ meta: [{ title: "Activity — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadActivityAction(),
  component: function ActivityRoute() {
    const data = Route.useLoaderData();
    return <ActivitySettings data={data} />;
  },
});
