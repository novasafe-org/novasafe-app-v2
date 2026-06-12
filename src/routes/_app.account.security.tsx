import { createFileRoute } from "@tanstack/react-router";
import { SecuritySettings } from "@/components/account/simple/SecuritySettings";
import {
  SettingsPageSkeleton,
  SettingsQueryError,
} from "@/components/account/simple/settings-ui";
import { useSecurityQuery } from "@/lib/account/account-queries";

export const Route = createFileRoute("/_app/account/security")({
  head: () => ({ meta: [{ title: "Security — NovaSafe" }] }),
  component: function SecurityRoute() {
    const query = useSecurityQuery();

    if (!query.data && query.isFetching) {
      return <SettingsPageSkeleton />;
    }

    if (query.isError || !query.data) {
      return (
        <SettingsQueryError
          onRetry={() => void query.refetch()}
          message={query.error instanceof Error ? query.error.message : undefined}
        />
      );
    }

    return <SecuritySettings data={query.data} />;
  },
});
