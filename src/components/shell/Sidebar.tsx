import { Link, useRouterState } from "@tanstack/react-router";
import {
  Shield,
  KeyRound,
  ShieldCheck,
  FileText,
  Files,
  Share2,
  Star,
  Archive,
  // Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/vault", label: "Vault", icon: Shield },
  { to: "/favorites", label: "Favorites", icon: Star },
  { to: "/archive", label: "Archive", icon: Archive },

  // TODO: Add these back in when we have the features
  // { to: "/passkeys", label: "Passkeys", icon: KeyRound },
  // { to: "/otp", label: "Authenticator", icon: ShieldCheck },
  // { to: "/notes", label: "Secure Notes", icon: FileText },
  // { to: "/documents", label: "Documents", icon: Files },
  // { to: "/shared", label: "Shared", icon: Share2 },
] as const;

const BRAND_ICON_URL = "/brand-icon.png";

export function Sidebar({ onNew }: { onNew?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => path === to || (to === "/vault" && path === "/");

  return (
    <aside className="hidden md:flex w-[68px] shrink-0 flex-col items-center py-4 gap-2 border-r border-hairline bg-surface/60">
      <Link to="/vault" className="mb-2 shrink-0" aria-label="NovaSafe">
        <img
          src={BRAND_ICON_URL}
          alt="NovaSafe"
          className="size-10 rounded-xl object-cover shadow-float"
        />
      </Link>

      {/* New-item shortcut hidden until product enables sidebar create */}
      {/* <button
        onClick={onNew}
        className="size-10 rounded-xl bg-brand text-brand-foreground grid place-items-center shadow-float hover:scale-[1.04] transition ring-brand-soft"
        aria-label="New item"
        title="New item (⌘N)"
      >
        <Plus className="size-5" />
      </button> */}

      <div className="mt-2 flex flex-col gap-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const active = isActive(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "size-10 rounded-xl grid place-items-center transition relative group",
                active
                  ? "bg-accent text-brand-ink"
                  : "text-ink-muted hover:text-ink hover:bg-muted",
              )}
              title={n.label}
            >
              <Icon className="size-[18px]" />
              <span className="pointer-events-none absolute left-12 z-50 whitespace-nowrap rounded-md bg-ink text-background text-xs px-2 py-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition">
                {n.label}
              </span>
              {active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-brand" />
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
