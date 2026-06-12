import { createFileRoute } from "@tanstack/react-router";
import { DeviceTrustCenter } from "@/components/account/devices/DeviceTrustCenter";
import { loadDeviceTrustCenterAction } from "@/lib/account/server-actions";

export const Route = createFileRoute("/_app/account/devices")({
  head: () => ({ meta: [{ title: "Devices — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadDeviceTrustCenterAction(),
  component: function DevicesRoute() {
    const data = Route.useLoaderData();
    return <DeviceTrustCenter data={data} />;
  },
});
