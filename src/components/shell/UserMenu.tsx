import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { LogOut, Settings, ShieldCheck } from "lucide-react";

import {
  clearClientSession,
  getClientSession,
  logoutAction,
  subscribeToClientSession,
  type ClientSession,
} from "@/lib/auth";
import { clearAuthGateCache } from "@/lib/auth/session-gate";
import { clearVaultSessionData } from "@/lib/vault-store";
import { buildLoginUrl } from "@/config";
import { cn } from "@/lib/utils";

/**
 * Minimal authenticated-user menu rendered in the top-right of the TopBar.
 *
 * Reads from the in-memory client session cache (hydrated by `_app`'s
 * `beforeLoad` → `setClientSession`). Logout calls the server function so
 * the HttpOnly cookie is cleared on the response, then redirects back to
 * the auth project's `/login`.
 */
export function UserMenu() {
  const [session, setSession] = useState<ClientSession | null>(() => getClientSession());
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => subscribeToClientSession(setSession), []);

  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!session?.user) return null;

  const initials = deriveInitials(session.user.name, session.user.email);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await logoutAction();
    } catch (err) {
      console.error("[UserMenu] logout failed", err);
    } finally {
      clearAuthGateCache();
      clearVaultSessionData();
      clearClientSession();
      window.location.assign(buildLoginUrl());
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="size-9 rounded-full brand-gradient grid place-items-center text-white text-xs font-semibold shadow-float hover:opacity-95 transition"
        title={session.user.name || session.user.email}
      >
        {initials}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-11 z-50 w-64 rounded-2xl border border-hairline bg-surface shadow-float p-1.5",
            "animate-in fade-in-0 zoom-in-95",
          )}
        >
          <div className="px-3 py-2.5">
            <div className="text-sm font-medium truncate">{session.user.name || "Signed in"}</div>
            <div className="text-xs text-ink-muted truncate">{session.user.email}</div>
          </div>

          <div className="h-px bg-hairline my-1" />

          <Link
            to="/account/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink hover:bg-muted transition"
            role="menuitem"
          >
            <Settings className="size-4 text-ink-muted" /> Account settings
          </Link>
          <Link
            to="/account/security"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink hover:bg-muted transition"
            role="menuitem"
          >
            <ShieldCheck className="size-4 text-ink-muted" /> Security
          </Link>

          <div className="h-px bg-hairline my-1" />

          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink hover:bg-muted transition disabled:opacity-60"
            role="menuitem"
          >
            <LogOut className="size-4 text-ink-muted" />
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}

function deriveInitials(name: string | undefined, email: string): string {
  const source = (name && name.trim()) || email.split("@")[0] || "?";
  const tokens = source.split(/[\s._-]+/).filter(Boolean);
  if (tokens.length === 0) return source.slice(0, 2).toUpperCase();
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
}
