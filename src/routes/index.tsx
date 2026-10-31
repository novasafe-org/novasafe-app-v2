import { createFileRoute, redirect } from "@tanstack/react-router";

import { DESKTOP_NAV, filterNavByFlags, isFlagEnabled, resolveFeatureFlagSnapshot } from "@/lib/feature-flags";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    const snapshot = await resolveFeatureFlagSnapshot();
    const firstEnabled = DESKTOP_NAV.find(
      (item) => !item.flag || isFlagEnabled(snapshot.flags, item.flag),
    );
    throw redirect({ to: firstEnabled?.to ?? "/account/profile" });
  },
});
