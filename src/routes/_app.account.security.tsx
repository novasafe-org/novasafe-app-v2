import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettings } from "@/components/account/simple/SecuritySettings";
import { loadSecurityAction } from "@/lib/account/server-actions";

export const Route = createFileRoute("/_app/account/security")({
  head: () => ({ meta: [{ title: "Security — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadSecurityAction(),
  component: function SecurityRoute() {
    const data = Route.useLoaderData();
    return <SecuritySettings data={data} />;
  },
});
