import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { User, Shield, Smartphone, Activity, KeyRound, CreditCard, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/account/profile", label: "Profile", icon: User },
  { to: "/account/security", label: "Security", icon: Shield },
  { to: "/account/devices", label: "Devices", icon: Smartphone },
  { to: "/account/activity", label: "Activity", icon: Activity },
  { to: "/account/recovery", label: "Recovery", icon: KeyRound },
  { to: "/account/billing", label: "Billing", icon: CreditCard },
  { to: "/account/appearance", label: "Appearance", icon: Palette },
] as const;

export function AccountLayout() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="h-full flex min-w-0">
      <aside className="w-56 shrink-0 p-4 border-r border-hairline">
        <div className="text-[11px] uppercase tracking-wider text-ink-faint mb-2 px-2">Account</div>
        <nav className="space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = path === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm",
                  active
                    ? "bg-accent text-brand-ink font-medium"
                    : "text-ink-muted hover:bg-muted hover:text-ink",
                )}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0 overflow-y-auto no-scrollbar">
        <Outlet />
      </div>
    </div>
  );
}
