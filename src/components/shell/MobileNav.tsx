import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { MOBILE_NAV, filterNavByFlags, useFeatureFlags } from "@/lib/feature-flags";

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { flags } = useFeatureFlags();
  const tabs = filterNavByFlags(MOBILE_NAV, flags);

  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass-strong rounded-2xl shadow-float">
      <ul
        className="grid"
        style={{ gridTemplateColumns: `repeat(${Math.max(tabs.length, 1)}, minmax(0, 1fr))` }}
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active =
            path === t.to ||
            (t.to === "/vault" && path === "/") ||
            (t.to.startsWith("/account") && path.startsWith("/account"));
          return (
            <li key={t.to} className="text-center">
              <Link
                to={t.to}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-[10px]",
                  active ? "text-brand" : "text-ink-muted",
                )}
              >
                <Icon className="size-5" />
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
