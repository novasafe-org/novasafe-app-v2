import { Sun, Moon, Monitor } from "lucide-react";
import { toast } from "sonner";
import type { loadProfileDashboardAction } from "@/lib/account/server-actions";
import { formatPlanLabel } from "@/lib/billing/subscription-display";
import { deriveInitials, formatMemberSince } from "@/components/account/profile/profile-helpers";
import { useVault, type Theme } from "@/lib/vault-store";
import { cn } from "@/lib/utils";
import {
  SettingsPage,
  SettingsCard,
  SettingsRow,
  SettingsButton,
  StatusBadge,
} from "./settings-ui";

type ProfileData = Awaited<ReturnType<typeof loadProfileDashboardAction>>;

export function ProfileSettings({
  user,
  data,
}: {
  user: { name?: string | null; email: string };
  data: ProfileData;
}) {
  const theme = useVault((s) => s.theme);
  const setTheme = useVault((s) => s.setTheme);

  const displayName = user.name || "NovaSafe User";
  const initials = deriveInitials(user.name ?? undefined, user.email);
  const planLabel = formatPlanLabel(data.subscription);
  const memberSince = formatMemberSince(data.account.createdAt);

  const themeOptions: Array<{ id: Theme; label: string; icon: typeof Sun }> = [
    { id: "light", label: "Light", icon: Sun },
    { id: "dark", label: "Dark", icon: Moon },
    { id: "system", label: "System", icon: Monitor },
  ];

  return (
    <SettingsPage title="Profile" description="Your account details and preferences.">
      <SettingsCard>
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl brand-gradient grid place-items-center text-white text-xl font-semibold shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-semibold text-ink truncate">{displayName}</p>
            <p className="text-sm text-ink-muted truncate">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <StatusBadge variant="success">Verified</StatusBadge>
              <StatusBadge variant="neutral">{planLabel}</StatusBadge>
            </div>
          </div>
        </div>
      </SettingsCard>

      <SettingsCard title="Account">
        <SettingsRow
          label="Full name"
          value={displayName}
          action={
            <SettingsButton onClick={() => toast.info("Name editing will be available soon.")}>
              Edit profile
            </SettingsButton>
          }
        />
        <SettingsRow
          label="Email address"
          value={user.email}
          action={
            <SettingsButton onClick={() => toast.info("Contact support to change your email.")}>
              Change email
            </SettingsButton>
          }
        />
        <SettingsRow label="Current plan" value={planLabel} />
        <SettingsRow label="Member since" value={memberSince} />
      </SettingsCard>

      <SettingsCard title="Theme" description="Choose how NovaSafe looks on this device.">
        <div className="grid grid-cols-3 gap-2">
          {themeOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={cn(
                "h-11 rounded-xl inline-flex flex-col items-center justify-center gap-1 text-xs font-medium transition",
                theme === id ? "bg-accent text-brand-ink" : "hairline hover:bg-muted",
              )}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>
      </SettingsCard>
    </SettingsPage>
  );
}
