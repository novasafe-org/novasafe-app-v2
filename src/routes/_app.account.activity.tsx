import { createFileRoute } from "@tanstack/react-router";
import { AuditCenter } from "@/components/account/audit/AuditCenter";
import { loadAuditCenterAction } from "@/lib/account/server-actions";

export const Route = createFileRoute("/_app/account/activity")({
  head: () => ({ meta: [{ title: "Activity — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadAuditCenterAction(),
  component: function ActivityRoute() {
    const data = Route.useLoaderData();
    return <AuditCenter data={data} />;
  },
});
