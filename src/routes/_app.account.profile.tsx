import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { loadAccountSettingsAction } from "@/lib/account/server-actions";

const appRoute = getRouteApi("/_app");
export const Route = createFileRoute("/_app/account/profile")({
  head: () => ({ meta: [{ title: "Profile — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadAccountSettingsAction(),
  component: function ProfilePage() {
    const { user } = appRoute.useRouteContext();
    const { settings, subscription } = Route.useLoaderData();
    const initials = (user.name || user.email || "NS")
      .split(" ")
      .map((part) => part[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-semibold mb-1">Profile</h1>
        <p className="text-sm text-ink-muted mb-5">Your NovaSafe identity</p>
        <div className="rounded-2xl hairline bg-surface p-5 flex items-center gap-4">
          <div className="size-16 rounded-2xl brand-gradient grid place-items-center text-white text-xl font-semibold">
            {initials}
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold">{user.name || "NovaSafe User"}</div>
            <div className="text-sm text-ink-muted">{user.email}</div>
            <div className="mt-2 flex gap-2 text-xs">
              <span className="px-2 py-0.5 rounded-md bg-accent text-brand-ink">
                {subscription.isPro ? "Pro" : "Free"} plan
              </span>
              <span className="px-2 py-0.5 rounded-md bg-success/15 text-success">Verified</span>
            </div>
            <div className="mt-3 text-xs text-ink-muted">
              2FA: {settings.twoFactorEnabled ? "Enabled" : "Disabled"} · Cloud sync:{" "}
              {settings.cloudSyncEnabled ? "Enabled" : "Disabled"}
            </div>
          </div>
        </div>
      </div>
    );
  },
});
