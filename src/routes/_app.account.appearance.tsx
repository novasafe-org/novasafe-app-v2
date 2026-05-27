import { createFileRoute } from "@tanstack/react-router";
import { useVault } from "@/lib/vault-store";
import { Sun, Moon, Rows3, Rows4 } from "lucide-react";

export const Route = createFileRoute("/_app/account/appearance")({
  head: () => ({ meta: [{ title: "Appearance — NovaSafe" }] }),
  component: function Appearance() {
    const { theme, setTheme, density, setDensity, notificationsEnabled, setNotifications } =
      useVault();
    return (
      <div className="p-6 max-w-2xl space-y-4">
        <h1 className="text-xl font-semibold">Appearance</h1>
        <div className="rounded-2xl hairline bg-surface p-5">
          <div className="text-sm font-medium mb-3">Theme</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setTheme("light")}
              className={`h-12 rounded-xl inline-flex items-center justify-center gap-2 text-sm ${theme === "light" ? "bg-accent text-brand-ink" : "hairline"}`}
            >
              <Sun className="size-4" />
              Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`h-12 rounded-xl inline-flex items-center justify-center gap-2 text-sm ${theme === "dark" ? "bg-accent text-brand-ink" : "hairline"}`}
            >
              <Moon className="size-4" />
              Dark
            </button>
          </div>
        </div>
        <div className="rounded-2xl hairline bg-surface p-5">
          <div className="text-sm font-medium mb-3">Density</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setDensity("comfortable")}
              className={`h-12 rounded-xl inline-flex items-center justify-center gap-2 text-sm ${density === "comfortable" ? "bg-accent text-brand-ink" : "hairline"}`}
            >
              <Rows3 className="size-4" />
              Comfortable
            </button>
            <button
              onClick={() => setDensity("compact")}
              className={`h-12 rounded-xl inline-flex items-center justify-center gap-2 text-sm ${density === "compact" ? "bg-accent text-brand-ink" : "hairline"}`}
            >
              <Rows4 className="size-4" />
              Compact
            </button>
          </div>
        </div>
        <div className="rounded-2xl hairline bg-surface p-5 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium">Notifications</div>
            <div className="text-xs text-ink-muted">Security alerts and sync events</div>
          </div>
          <button
            onClick={() => setNotifications(!notificationsEnabled)}
            className={`relative h-6 w-11 rounded-full transition ${notificationsEnabled ? "bg-brand" : "bg-muted"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition ${notificationsEnabled ? "translate-x-5" : ""}`}
            />
          </button>
        </div>
      </div>
    );
  },
});
