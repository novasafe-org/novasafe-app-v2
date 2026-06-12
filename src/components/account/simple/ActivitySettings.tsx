import type { loadActivityAction } from "@/lib/account/server-actions";
import { formatRelativeTime } from "@/components/account/profile/profile-helpers";
import {
  SettingsPage,
  SettingsCard,
  SimpleList,
  SimpleListItem,
} from "./settings-ui";

type ActivityData = Awaited<ReturnType<typeof loadActivityAction>>;

function eventCategory(kind: string): string {
  if (kind === "login") return "Sign in";
  if (kind === "item") return "Vault";
  if (kind === "billing") return "Billing";
  return "Account";
}

function eventMeta(event: ActivityData["activity"][number]): string {
  const parts: string[] = [formatRelativeTime(event.at)];
  if (event.device) parts.push(event.device);
  if (event.location) parts.push(event.location);
  return parts.join(" · ");
}

export function ActivitySettings({ data }: { data: ActivityData }) {
  const { activity } = data;

  return (
    <SettingsPage title="Activity" description="Recent activity on your account.">
      <SettingsCard title="Recent events">
        {activity.length === 0 ? (
          <p className="text-sm text-ink-muted">No recent activity yet.</p>
        ) : (
          <SimpleList>
            {activity.map((event) => (
              <SimpleListItem
                key={event.id}
                primary={event.message}
                secondary={eventCategory(event.kind)}
                meta={eventMeta(event)}
              />
            ))}
          </SimpleList>
        )}
      </SettingsCard>
    </SettingsPage>
  );
}
