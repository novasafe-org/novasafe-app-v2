import { Link, useRouterState } from "@tanstack/react-router";
import { Shield, KeyRound, ShieldCheck, Files, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/vault",     label: "Vault",   icon: Shield },
  { to: "/passkeys",  label: "Keys",    icon: KeyRound },
  { to: "/otp",       label: "Codes",   icon: ShieldCheck },
  { to: "/documents", label: "Docs",    icon: Files },
  { to: "/account/profile", label: "Me", icon: User },
] as const;

export function MobileNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-40 glass-strong rounded-2xl shadow-float">
      <ul className="grid grid-cols-5">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = path === t.to || (t.to === "/vault" && path === "/") || (t.to.startsWith("/account") && path.startsWith("/account"));
          return (
            <li key={t.to} className="text-center">
              <Link to={t.to} className={cn("flex flex-col items-center gap-0.5 py-2.5 text-[10px]", active ? "text-brand" : "text-ink-muted")}>
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
