import { createFileRoute } from "@tanstack/react-router";
import { ActivitySettings } from "@/components/account/simple/ActivitySettings";
import {
  SettingsPageSkeleton,
  SettingsQueryError,
} from "@/components/account/simple/settings-ui";
import { useActivityQuery } from "@/lib/account/account-queries";

export const Route = createFileRoute("/_app/account/activity")({
  head: () => ({ meta: [{ title: "Activity — NovaSafe" }] }),
  component: function ActivityRoute() {
    const query = useActivityQuery();

    if (!query.data && query.isFetching) {
      return <SettingsPageSkeleton cards={1} />;
    }

    if (query.isError || !query.data) {
      return (
        <SettingsQueryError
          onRetry={() => void query.refetch()}
          message={query.error instanceof Error ? query.error.message : undefined}
        />
      );
    }

    return <ActivitySettings data={query.data} />;
  },
});
