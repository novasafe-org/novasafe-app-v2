import { useEffect, useState } from "react";
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
  Settings,
  Sun,
  Moon,
  // Plus,
} from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { getClientSession, subscribeToClientSession, type ClientSession } from "@/lib/auth";
import { appConfig } from "@/config";
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

const LANDING_LOGO_URL = `${appConfig.urls.landing}/logo.svg`;

export function Sidebar({ onNew }: { onNew?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const theme = useVault((s) => s.theme);
  const setTheme = useVault((s) => s.setTheme);
  const session = useClientSession();
  const isActive = (to: string) => path === to || (to === "/vault" && path === "/");
  const initials = session ? deriveInitials(session.user.name, session.user.email) : "··";
  const fullName = session?.user.name || session?.user.email || "Account";

  return (
    <aside className="hidden md:flex w-[68px] shrink-0 flex-col items-center py-4 gap-2 border-r border-hairline bg-surface/60">
      <Link
        to="/vault"
        className="size-10 rounded-xl brand-gradient grid place-items-center text-white shadow-float mb-2"
        aria-label="NovaSafe"
      >
        <img src={LANDING_LOGO_URL} alt="NovaSafe" className="size-5 object-contain" />
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

      <div className="mt-auto flex flex-col items-center gap-1">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="size-10 rounded-xl grid place-items-center text-ink-muted hover:text-ink hover:bg-muted transition"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </button>
        <Link
          to="/account/profile"
          className={cn(
            "size-10 rounded-xl grid place-items-center transition",
            path.startsWith("/account")
              ? "bg-accent text-brand-ink"
              : "text-ink-muted hover:text-ink hover:bg-muted",
          )}
          title="Account"
        >
          <Settings className="size-[18px]" />
        </Link>
        <Link
          to="/account/profile"
          className="size-9 rounded-full brand-gradient grid place-items-center text-white text-xs font-semibold mt-1"
          title={fullName}
        >
          {initials}
        </Link>
      </div>
    </aside>
  );
}

function useClientSession(): ClientSession | null {
  const [session, setSession] = useState<ClientSession | null>(() => getClientSession());
  useEffect(() => subscribeToClientSession(setSession), []);
  return session;
}

function deriveInitials(name: string | undefined, email: string): string {
  const source = (name && name.trim()) || email.split("@")[0] || "?";
  const tokens = source.split(/[\s._-]+/).filter(Boolean);
  if (tokens.length === 0) return source.slice(0, 2).toUpperCase();
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
}
