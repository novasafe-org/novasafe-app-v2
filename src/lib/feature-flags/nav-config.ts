import type { LucideIcon } from "lucide-react";
import {
  Archive,
  Building2,
  Files,
  FileText,
  KeyRound,
  Share2,
  Shield,
  ShieldCheck,
  Star,
  User,
  Users,
} from "lucide-react";

import { isFlagEnabled } from "./defaults";
import type { FeatureFlagKey } from "./types";

export type AppNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** When set, the item is hidden unless this flag is enabled. */
  flag?: FeatureFlagKey;
};

export const DESKTOP_NAV: AppNavItem[] = [
  { to: "/vault", label: "Vault", icon: Shield, flag: "vault" },
  { to: "/favorites", label: "Favorites", icon: Star, flag: "favorites" },
  { to: "/archive", label: "Archive", icon: Archive, flag: "archive" },
  { to: "/passkeys", label: "Passkeys", icon: KeyRound, flag: "passkeys" },
  { to: "/otp", label: "Authenticator", icon: ShieldCheck, flag: "otp" },
  { to: "/notes", label: "Secure Notes", icon: FileText, flag: "secure_notes" },
  { to: "/documents", label: "Documents", icon: Files, flag: "documents" },
  { to: "/shared", label: "Shared", icon: Share2, flag: "sharing" },
  { to: "/teams", label: "Teams", icon: Users, flag: "teams" },
  { to: "/enterprise", label: "Enterprise", icon: Building2, flag: "enterprise" },
];

export const MOBILE_NAV: AppNavItem[] = [
  { to: "/vault", label: "Vault", icon: Shield, flag: "vault" },
  { to: "/passkeys", label: "Keys", icon: KeyRound, flag: "passkeys" },
  { to: "/otp", label: "Codes", icon: ShieldCheck, flag: "otp" },
  { to: "/documents", label: "Docs", icon: Files, flag: "documents" },
  { to: "/account/profile", label: "Me", icon: User },
];

export function filterNavByFlags(
  items: readonly AppNavItem[],
  flags: Record<string, boolean>,
): AppNavItem[] {
  return items.filter((item) => !item.flag || isFlagEnabled(flags, item.flag));
}
