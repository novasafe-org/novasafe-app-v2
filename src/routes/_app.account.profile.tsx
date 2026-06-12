import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { ProfileSettings } from "@/components/account/simple/ProfileSettings";
import {
  SettingsPageSkeleton,
  SettingsQueryError,
} from "@/components/account/simple/settings-ui";
import { useProfileQuery } from "@/lib/account/account-queries";

const appRoute = getRouteApi("/_app");

export const Route = createFileRoute("/_app/account/profile")({
  head: () => ({ meta: [{ title: "Profile — NovaSafe" }] }),
  component: function ProfilePage() {
    const { user } = appRoute.useRouteContext();
    const query = useProfileQuery();

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

    return <ProfileSettings user={user} data={query.data} />;
  },
});
