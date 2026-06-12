import { createFileRoute } from "@tanstack/react-router";
import { RecoverySettings } from "@/components/account/simple/RecoverySettings";
import {
  SettingsPageSkeleton,
  SettingsQueryError,
} from "@/components/account/simple/settings-ui";
import { useRecoveryQuery } from "@/lib/account/account-queries";

export const Route = createFileRoute("/_app/account/recovery")({
  head: () => ({ meta: [{ title: "Recovery — NovaSafe" }] }),
  component: function RecoveryRoute() {
    const query = useRecoveryQuery();

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

    return <RecoverySettings data={query.data} />;
  },
});
