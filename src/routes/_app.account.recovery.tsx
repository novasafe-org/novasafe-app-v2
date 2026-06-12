import { createFileRoute } from "@tanstack/react-router";
import { RecoverySettings } from "@/components/account/simple/RecoverySettings";
import { loadRecoveryAction } from "@/lib/account/server-actions";

export const Route = createFileRoute("/_app/account/recovery")({
  head: () => ({ meta: [{ title: "Recovery — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadRecoveryAction(),
  component: function RecoveryRoute() {
    const data = Route.useLoaderData();
    return <RecoverySettings data={data} />;
  },
});
