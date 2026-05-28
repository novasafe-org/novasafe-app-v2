import { useEffect, useRef } from "react";

import { buildLoginUrl } from "@/config";
import { clearAuthGateCache } from "@/lib/auth/session-gate";
import {
  clearWebSessionStarted,
  isWebSessionExpired,
  webSessionExpiresAt,
} from "@/lib/auth/session-lifetime";
import { clearClientSession, logoutAction } from "@/lib/auth";

/**
 * Force logout when the 30-minute web session window elapses.
 */
export function useSessionTimeout(): void {
  const expiringRef = useRef(false);

  useEffect(() => {
    const forceLogout = async () => {
      if (expiringRef.current) return;
      expiringRef.current = true;
      try {
        await logoutAction();
      } catch {
        /* still clear local state */
      } finally {
        clearAuthGateCache();
        clearClientSession();
        clearWebSessionStarted();
        window.location.assign(buildLoginUrl());
      }
    };

    const check = () => {
      if (isWebSessionExpired()) void forceLogout();
    };

    check();
    const interval = window.setInterval(check, 15_000);
    const expiresAt = webSessionExpiresAt();
    const timeout =
      expiresAt != null
        ? window.setTimeout(() => void forceLogout(), Math.max(0, expiresAt - Date.now()))
        : undefined;

    return () => {
      window.clearInterval(interval);
      if (timeout != null) window.clearTimeout(timeout);
    };
  }, []);
}
