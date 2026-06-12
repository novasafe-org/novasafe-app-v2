import { createFileRoute } from "@tanstack/react-router";
import { DevicesSettings } from "@/components/account/simple/DevicesSettings";
import { loadDevicesAction } from "@/lib/account/server-actions";

export const Route = createFileRoute("/_app/account/devices")({
  head: () => ({ meta: [{ title: "Devices — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadDevicesAction(),
  component: function DevicesRoute() {
    const data = Route.useLoaderData();
    return <DevicesSettings initial={data} />;
  },
});
