import { createFileRoute } from "@tanstack/react-router";
import { Shield, LogIn, Files, Share2 } from "lucide-react";
import { loadActivityAction } from "@/lib/account/server-actions";

const ICONS = { security: Shield, login: LogIn, item: Files, share: Share2 } as const;

export const Route = createFileRoute("/_app/account/activity")({
  head: () => ({ meta: [{ title: "Activity — NovaSafe" }] }),
  loader: async () => loadActivityAction(),
  component: function Activity() {
    const { activity } = Route.useLoaderData();
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-semibold">Activity</h1>
        <p className="text-sm text-ink-muted mb-4">Recent events on your account</p>
        <ul className="rounded-2xl hairline bg-surface divide-y divide-hairline">
          {activity.map((e) => {
            const Icon = ICONS[e.kind];
            return (
              <li key={e.id} className="p-3.5 flex items-center gap-3">
                <div className="size-9 rounded-lg brand-gradient-soft grid place-items-center text-brand">
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 text-sm">{e.message}</div>
                <div className="text-xs text-ink-muted">{new Date(e.at).toLocaleString()}</div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  },
});
