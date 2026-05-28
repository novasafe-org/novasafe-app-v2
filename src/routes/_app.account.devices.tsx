import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { useState } from "react";
import {
  loadDevicesAction,
  revokeDeviceSessionAction,
  revokeOtherSessionsAction,
} from "@/lib/account/server-actions";

export const Route = createFileRoute("/_app/account/devices")({
  head: () => ({ meta: [{ title: "Devices — NovaSafe" }] }),
  staleTime: 60_000,
  loader: async () => loadDevicesAction(),
  component: function Devices() {
    const initial = Route.useLoaderData();
    const [devices, setDevices] = useState(initial.sessions || []);
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-xl font-semibold">Devices</h1>
        <p className="text-sm text-ink-muted mb-4">Where you're signed in</p>
        <div className="mb-4">
          <button
            onClick={() =>
              revokeOtherSessionsAction()
                .then((result) => {
                  toast.success(result.message || "Signed out all other devices.");
                  setDevices((list) => list.filter((d) => d.isCurrent));
                })
                .catch((err) => toast.error(err instanceof Error ? err.message : "Failed to revoke sessions."))
            }
            className="h-8 px-3 rounded-md hairline text-xs"
          >
            Revoke all other sessions
          </button>
        </div>
        <div className="rounded-2xl hairline bg-surface divide-y divide-hairline">
          {devices.map((d) => (
            <div key={d.id} className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm font-medium flex items-center gap-2">
                  {d.parsedDevice?.displayName || "Unknown device"}{" "}
                  {d.isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent text-brand-ink">
                      This device
                    </span>
                  )}
                </div>
                <div className="text-xs text-ink-muted">
                  {d.parsedDevice?.platform || "web"} · {d.locationLabel || "Unknown location"}
                </div>
              </div>
              <button
                disabled
                className="h-8 px-2.5 rounded-md hairline text-xs"
              >
                {d.trustState === "trusted" ? "Trusted" : "Needs verification"}
              </button>
              {!d.isCurrent && (
                <button
                  onClick={() => {
                    revokeDeviceSessionAction({ data: { sessionId: d.id } })
                      .then(() => {
                        setDevices((list) => list.filter((item) => item.id !== d.id));
                        toast.success("Session revoked");
                      })
                      .catch((err) =>
                        toast.error(err instanceof Error ? err.message : "Failed to revoke session."),
                      );
                  }}
                  className="h-8 px-2.5 rounded-md text-xs text-destructive hover:bg-destructive/10"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  },
});
