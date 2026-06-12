import { createFileRoute } from "@tanstack/react-router";
import { DevicesSettings } from "@/components/account/simple/DevicesSettings";
import {
  SettingsPageSkeleton,
  SettingsQueryError,
} from "@/components/account/simple/settings-ui";
import { useDevicesQuery } from "@/lib/account/account-queries";

export const Route = createFileRoute("/_app/account/devices")({
  head: () => ({ meta: [{ title: "Devices — NovaSafe" }] }),
  component: function DevicesRoute() {
    const query = useDevicesQuery();

    if (!query.data && query.isFetching) {
      return <SettingsPageSkeleton cards={2} />;
    }

    if (query.isError || !query.data) {
      return (
        <SettingsQueryError
          onRetry={() => void query.refetch()}
          message={query.error instanceof Error ? query.error.message : undefined}
        />
      );
    }

    return <DevicesSettings initial={query.data} />;
  },
});
