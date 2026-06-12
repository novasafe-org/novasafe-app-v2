import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Shield,
  ShieldCheck,
  KeyRound,
  Smartphone,
  Files,
  Lock,
  AlertTriangle,
  Copy,
  LogIn,
  CheckCircle2,
  Sparkles,
  Fingerprint,
  Cloud,
  Eye,
  RefreshCw,
  ChevronRight,
} from "lucide-react";
import type { loadProfileDashboardAction } from "@/lib/account/server-actions";
import { formatPlanLabel } from "@/lib/billing/subscription-display";
import { useVault } from "@/lib/vault-store";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  MetricTile,
  StatusPill,
  CircularScore,
  ProgressBar,
  PrimaryButton,
  GhostButton,
  ActionLink,
  type StatusTone,
} from "./profile-ui";
import {
  deriveInitials,
  formatMemberSince,
  vaultHealthLabel,
  accountStatusLabel,
  recoveryReadiness,
  formatRelativeTime,
  inactiveAccountEstimate,
} from "./profile-helpers";

type ProfileData = Awaited<ReturnType<typeof loadProfileDashboardAction>>;

type ProfileUser = {
  name?: string | null;
  email: string;
};

export function ProfileDashboard({ user, data }: { user: ProfileUser; data: ProfileData }) {
  const items = useVault((s) => s.items);
  const vaults = useVault((s) => s.vaults);

  const passwordCount = useMemo(
    () => items.filter((i) => !i.archived && (i.type === "password" || !i.type)).length,
    [items],
  );
  const noteCount = useMemo(
    () => items.filter((i) => !i.archived && i.type === "note").length,
    [items],
  );
  const collectionCount = useMemo(() => {
    const tags = new Set<string>();
    for (const item of items) {
      if (item.archived) continue;
      for (const tag of item.tags) tags.add(tag);
    }
    return tags.size;
  }, [items]);

  const displayName = user.name || "NovaSafe User";
  const initials = deriveInitials(user.name ?? undefined, user.email);
  const planLabel = formatPlanLabel(data.subscription);
  const memberSince = formatMemberSince(data.account.createdAt);
  const accountStatus = accountStatusLabel(data.security, data.settings);
  const vaultHealth = vaultHealthLabel(data.security.score);
  const recovery = recoveryReadiness(data.exportHistory.length > 0, data.settings.hasPassword);
  const inactiveAccounts = inactiveAccountEstimate(
    data.overview.totalItems,
    data.overview.recentlyUsed?.length ?? 0,
  );

  const recommendations = useMemo(() => {
    const list: Array<{ id: string; title: string; description: string; to: string }> = [];
    if (!data.settings.twoFactorEnabled) {
      list.push({
        id: "2fa",
        title: "Enable two-factor authentication",
        description: "Add an extra layer of protection to your account.",
        to: "/account/security",
      });
    }
    if (data.exportHistory.length === 0) {
      list.push({
        id: "recovery",
        title: "Generate recovery kit",
        description: "Create an encrypted export you can use if you lose access.",
        to: "/account/recovery",
      });
    }
    if (data.trustedDevices < data.sessions.length) {
      list.push({
        id: "devices",
        title: "Review trusted devices",
        description: "Verify every device signed into your NovaSafe account.",
        to: "/account/devices",
      });
    }
    if (!data.settings.cloudSyncEnabled) {
      list.push({
        id: "sync",
        title: "Enable secure cloud sync",
        description: "Keep your vault backed up and available across devices.",
        to: "/account/security",
      });
    }
    if (data.security.weak > 0 || data.security.reused > 0) {
      list.push({
        id: "vault",
        title: "Strengthen weak passwords",
        description: "Update credentials flagged in your security insights.",
        to: "/vault",
      });
    }
    return list;
  }, [data]);

  const activityIcons = {
    security: Shield,
    login: LogIn,
    item: KeyRound,
    share: Copy,
  } as const;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      {/* SECTION 1: Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface shadow-float">
        <div className="absolute inset-0 brand-gradient-soft opacity-60 pointer-events-none" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="size-16 md:size-20 rounded-2xl brand-gradient grid place-items-center text-white text-xl md:text-2xl font-semibold shadow-float shrink-0">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">{displayName}</h1>
                <p className="text-sm text-ink-muted truncate mt-0.5">{user.email}</p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <StatusPill tone="healthy">
                    <CheckCircle2 className="size-3" /> Verified
                  </StatusPill>
                  <StatusPill tone="neutral">{planLabel}</StatusPill>
                  <span className="text-xs text-ink-muted">Member since {memberSince}</span>
                </div>
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface/80 px-3 py-2">
                  <span className="text-xs text-ink-muted">Account status</span>
                  <StatusPill tone={accountStatus.tone}>{accountStatus.label}</StatusPill>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <GhostButton to="/account/appearance">Edit profile</GhostButton>
              <GhostButton to="/account/security">Change password</GhostButton>
              <PrimaryButton to="/account/billing">Manage subscription</PrimaryButton>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Account health */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <MetricTile
          icon={<CircularScore score={data.security.score} size={44} />}
          label="Security score"
          value={
            <span className="flex items-baseline gap-1.5">
              {data.security.score}
              <span className="text-sm font-normal text-ink-muted">/100</span>
            </span>
          }
          hint={
            data.security.score >= 85
              ? "Excellent protection level"
              : "Improve score by fixing flagged credentials"
          }
        />
        <MetricTile
          icon={<ShieldCheck className="size-5" />}
          label="Vault health"
          value={vaultHealth.label}
          hint={vaultHealth.hint}
        />
        <MetricTile
          icon={<Smartphone className="size-5" />}
          label="Device trust"
          value={`${data.trustedDevices} trusted`}
          hint={`${data.activeSessions} active session${data.activeSessions === 1 ? "" : "s"}`}
        />
        <MetricTile
          icon={<KeyRound className="size-5" />}
          label="Recovery readiness"
          value={recovery.label}
          hint={
            data.exportHistory.length > 0
              ? "Recovery export available on file"
              : "Generate a recovery kit to stay prepared"
          }
        />
      </div>

      {/* SECTION 3: Account summary */}
      <SectionCard title="Account summary" description="Your vault at a glance">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Passwords", value: passwordCount || data.overview.totalItems, icon: KeyRound },
            { label: "Secure notes", value: noteCount, icon: Files },
            { label: "Devices", value: data.sessions.length, icon: Smartphone },
            { label: "Sessions", value: data.activeSessions, icon: LogIn },
            { label: "Folders", value: vaults.length, icon: Files },
            { label: "Collections", value: collectionCount, icon: Sparkles },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-xl border border-hairline bg-muted/30 px-4 py-3 flex flex-col gap-2"
              >
                <div className="flex items-center gap-2 text-ink-muted">
                  <Icon className="size-3.5" />
                  <span className="text-[11px] font-medium uppercase tracking-wide">{stat.label}</span>
                </div>
                <span className="text-2xl font-semibold tabular-nums">{stat.value}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SECTION 4: Security status */}
        <SectionCard
          title="Security status"
          description="Critical protections for your account"
          action={<ActionLink to="/account/security">Security center</ActionLink>}
        >
          <ul className="space-y-3">
            <SecurityRow
              label="Master password"
              value={data.settings.hasPassword ? "Configured" : "Not configured"}
              tone={data.settings.hasPassword ? "healthy" : "risk"}
              actionLabel={data.settings.hasPassword ? "Change" : "Set up"}
              actionTo="/account/security"
            />
            <SecurityRow
              label="Two-factor authentication"
              value={data.settings.twoFactorEnabled ? "Enabled" : "Disabled"}
              tone={data.settings.twoFactorEnabled ? "healthy" : "attention"}
              actionLabel={data.settings.twoFactorEnabled ? "Manage" : "Enable"}
              actionTo="/account/security"
            />
            <SecurityRow
              label="Recovery kit"
              value={data.exportHistory.length > 0 ? "Generated" : "Not generated"}
              tone={data.exportHistory.length > 0 ? "healthy" : "attention"}
              actionLabel={data.exportHistory.length > 0 ? "View" : "Generate"}
              actionTo="/account/recovery"
            />
            <SecurityRow
              label="Email verification"
              value="Verified"
              tone="healthy"
              actionLabel="View"
              actionTo="/account/profile"
            />
            <SecurityRow
              label="Trusted devices"
              value={`${data.trustedDevices} device${data.trustedDevices === 1 ? "" : "s"}`}
              tone={data.trustedDevices > 0 ? "healthy" : "attention"}
              actionLabel="Review"
              actionTo="/account/devices"
            />
            <SecurityRow
              label="Cloud sync"
              value={data.settings.cloudSyncEnabled ? "Enabled" : "Disabled"}
              tone={data.settings.cloudSyncEnabled ? "healthy" : "neutral"}
              actionLabel="Manage"
              actionTo="/account/security"
            />
          </ul>
        </SectionCard>

        {/* SECTION 5: Activity */}
        <SectionCard
          title="Recent account activity"
          description="Latest events across your account"
          action={<ActionLink to="/account/activity">View all</ActionLink>}
        >
          {data.activity.length === 0 ? (
            <p className="text-sm text-ink-muted py-4">No recent activity yet.</p>
          ) : (
            <ul className="space-y-0">
              {data.activity.map((event, index) => {
                const Icon = activityIcons[event.kind];
                return (
                  <li key={event.id} className="relative flex gap-3 py-3">
                    {index < data.activity.length - 1 && (
                      <span className="absolute left-[17px] top-10 bottom-0 w-px bg-hairline" />
                    )}
                    <span className="size-9 rounded-lg bg-accent grid place-items-center text-brand shrink-0 z-[1]">
                      <Icon className="size-4" />
                    </span>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-medium text-ink truncate">{event.message}</p>
                      <p className="text-xs text-ink-muted mt-0.5 capitalize">
                        {event.kind} · {formatRelativeTime(event.at)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SECTION 6: Security insights */}
        <SectionCard title="Security insights" description="Items that may need your attention">
          <div className="grid grid-cols-2 gap-3">
            <InsightCard
              label="Weak passwords"
              value={data.security.weak}
              warn={data.security.weak > 0}
            />
            <InsightCard
              label="Reused passwords"
              value={data.security.reused}
              warn={data.security.reused > 0}
            />
            <InsightCard
              label="Breached accounts"
              value={data.security.breached}
              warn={data.security.breached > 0}
            />
            <InsightCard
              label="Inactive accounts"
              value={inactiveAccounts}
              warn={inactiveAccounts > 0}
            />
          </div>
          <div className="mt-4">
            <p className="text-xs text-ink-muted mb-2">Overall vault coverage</p>
            <ProgressBar value={data.security.score} />
          </div>
        </SectionCard>

        {/* SECTION 7: Recommended actions */}
        {recommendations.length > 0 && (
          <SectionCard title="Recommended actions" description="Complete these to strengthen your account">
            <ul className="space-y-2">
              {recommendations.map((rec) => (
                <li key={rec.id}>
                  <Link
                    to={rec.to}
                    className="group flex items-center gap-3 rounded-xl border border-hairline bg-surface-elev/50 px-4 py-3 hover:bg-muted/50 transition"
                  >
                    <span className="size-9 rounded-lg bg-warning/10 text-warning grid place-items-center shrink-0">
                      <AlertTriangle className="size-4" />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-ink block">{rec.title}</span>
                      <span className="text-xs text-ink-muted">{rec.description}</span>
                    </span>
                    <ChevronRight className="size-4 text-ink-faint group-hover:text-ink transition shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      {/* SECTION 8: Trust & privacy */}
      <SectionCard title="Trust & privacy" description="How NovaSafe protects your data">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Lock, text: "End-to-end encrypted" },
            { icon: Eye, text: "Zero-knowledge architecture" },
            { icon: Shield, text: "Encrypted before leaving your device" },
            { icon: Fingerprint, text: "Recovery protected" },
            { icon: Cloud, text: "Secure cloud sync enabled" },
            { icon: RefreshCw, text: "Continuous security monitoring" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.text}
                className="flex items-center gap-2.5 rounded-xl border border-hairline bg-muted/25 px-3 py-2.5"
              >
                <CheckCircle2 className="size-4 text-success shrink-0" />
                <Icon className="size-3.5 text-ink-muted shrink-0" />
                <span className="text-xs font-medium text-ink">{item.text}</span>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function SecurityRow({
  label,
  value,
  tone,
  actionLabel,
  actionTo,
}: {
  label: string;
  value: string;
  tone: StatusTone;
  actionLabel: string;
  actionTo: string;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-hairline bg-muted/20 px-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <p className="text-sm font-medium text-ink">{value}</p>
          <StatusPill tone={tone}>
            {tone === "healthy" ? "Healthy" : tone === "attention" ? "Needs review" : "At risk"}
          </StatusPill>
        </div>
      </div>
      <ActionLink to={actionTo}>{actionLabel}</ActionLink>
    </li>
  );
}

function InsightCard({
  label,
  value,
  warn,
}: {
  label: string;
  value: number;
  warn: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        warn ? "border-warning/30 bg-warning/5" : "border-hairline bg-muted/20",
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={cn("text-2xl font-semibold mt-1 tabular-nums", warn && "text-warning")}>{value}</p>
    </div>
  );
}
