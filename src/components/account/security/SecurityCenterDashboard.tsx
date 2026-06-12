import { useMemo, useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Smartphone,
  Cloud,
  Mail,
  AlertTriangle,
  CheckCircle2,
  LogIn,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { loadSecurityCenterAction } from "@/lib/account/server-actions";
import {
  changeMasterPasswordAction,
  createExportAction,
  deleteAccountAction,
  revokeOtherSessionsAction,
  toggleTwoFactorAction,
} from "@/lib/account/server-actions";
import { logoutAction } from "@/lib/auth/server-actions";
import { formatRelativeTime } from "@/components/account/profile/profile-helpers";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  accountSecurityStatus,
  computeScoreBreakdown,
  formatSessionDevice,
  oldPasswordEstimate,
  overallRiskLevel,
  securityLevel,
} from "./security-helpers";
import {
  HeroScoreRing,
  ScoreBreakdownRow,
  ProtectionCard,
  HealthMetric,
  healthSeverity,
  RiskFinding,
  TimelineEntry,
  TrustIndicator,
  DangerAction,
  SectionCard,
  StatusPill,
  ProgressBar,
  ActionLink,
} from "./security-ui";

type SecurityData = Awaited<ReturnType<typeof loadSecurityCenterAction>>;

export function SecurityCenterDashboard({
  data,
  userEmail,
}: {
  data: SecurityData;
  userEmail: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const { settings, security, overview, exportHistory, timeline, deviceStats, currentSession } =
    data;

  const displayScore = security.score;
  const level = securityLevel(displayScore);
  const accountStatus = accountSecurityStatus(displayScore, security, settings);
  const breakdown = computeScoreBreakdown(
    security,
    settings,
    exportHistory.length,
    deviceStats.trusted,
    data.sessions.length,
  );
  const oldPasswords = oldPasswordEstimate(
    overview.totalItems,
    overview.recentlyUsed?.length ?? 0,
  );
  const sessionInfo = formatSessionDevice(currentSession);
  const riskLevel = overallRiskLevel(security, settings, deviceStats.pending);

  const lastExport = exportHistory[0];
  const lastExportDate = lastExport?.createdAt
    ? new Date(lastExport.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Never";

  const recommendations = useMemo(() => {
    const all: Array<{
      id: string;
      title: string;
      description: string;
      done: boolean;
      action?: () => void;
      to?: string;
    }> = [
      {
        id: "2fa",
        title: "Enable two-factor authentication",
        description: "Protect sign-ins with a second verification step.",
        done: settings.twoFactorEnabled,
        action: () => handleToggle2FA(true),
      },
      {
        id: "recovery",
        title: "Generate recovery kit",
        description: "Create an encrypted backup for account recovery.",
        done: exportHistory.length > 0,
        action: () => handleCreateExport(),
      },
      {
        id: "devices",
        title: "Review trusted devices",
        description: "Verify every device with access to your vault.",
        done: deviceStats.pending === 0 && deviceStats.suspicious === 0,
        to: "/account/devices",
      },
      {
        id: "weak",
        title: "Update weak passwords",
        description: `${security.weak} credential${security.weak === 1 ? "" : "s"} need strengthening.`,
        done: security.weak === 0,
        to: "/vault",
      },
      {
        id: "reused",
        title: "Fix reused passwords",
        description: "Use unique passwords for every account.",
        done: security.reused === 0,
        to: "/vault",
      },
      {
        id: "password",
        title: "Set a master password",
        description: "Required to encrypt and protect your vault.",
        done: settings.hasPassword,
        action: () => handleChangePassword(),
      },
    ];
    return all;
  }, [settings, security, exportHistory, deviceStats]);

  const pendingRecommendations = recommendations.filter((r) => !r.done);
  const completedCount = recommendations.length - pendingRecommendations.length;
  const completionPct = Math.round((completedCount / recommendations.length) * 100);

  const riskFindings = useMemo(() => {
    const findings: Array<{
      id: string;
      title: string;
      explanation: string;
      action: string;
      level: "low" | "medium" | "high";
      onAction?: () => void;
      to?: string;
    }> = [];

    if (!settings.hasPassword) {
      findings.push({
        id: "no-password",
        title: "Master password not configured",
        explanation: "Your vault cannot be fully protected until a master password is set.",
        action: "Set password",
        level: "high",
        onAction: () => handleChangePassword(),
      });
    }
    if (!settings.twoFactorEnabled) {
      findings.push({
        id: "no-2fa",
        title: "Two-factor authentication is off",
        explanation: "Accounts without 2FA are more vulnerable to credential theft.",
        action: "Enable 2FA",
        level: "medium",
        onAction: () => handleToggle2FA(true),
      });
    }
    if (security.breached > 0) {
      findings.push({
        id: "breached",
        title: `${security.breached} breached password${security.breached === 1 ? "" : "s"} detected`,
        explanation: "These credentials appeared in known data breaches. Change them immediately.",
        action: "Review breached",
        level: "high",
        to: "/vault",
      });
    }
    if (security.weak > 0) {
      findings.push({
        id: "weak",
        title: `${security.weak} weak password${security.weak === 1 ? "" : "s"} found`,
        explanation: "Weak passwords are easier to guess or crack in automated attacks.",
        action: "Review weak",
        level: "medium",
        to: "/vault",
      });
    }
    if (deviceStats.pending > 0) {
      findings.push({
        id: "devices-pending",
        title: `${deviceStats.pending} device${deviceStats.pending === 1 ? "" : "s"} require verification`,
        explanation: "Unverified devices should be reviewed to prevent unauthorized access.",
        action: "Review devices",
        level: "medium",
        to: "/account/devices",
      });
    }
    if (exportHistory.length === 0 && settings.hasPassword) {
      findings.push({
        id: "no-recovery",
        title: "Recovery kit not generated",
        explanation: "Without a recovery export, account recovery may be difficult if you lose access.",
        action: "Generate kit",
        level: "medium",
        onAction: () => handleCreateExport(),
      });
    }

    return findings;
  }, [settings, security, deviceStats, exportHistory]);

  async function handleChangePassword() {
    const currentPassword = window.prompt("Current password");
    const newPassword = window.prompt("New password (min 8 characters)");
    if (!currentPassword || !newPassword) return;
    setBusy(true);
    try {
      const result = await changeMasterPasswordAction({
        data: { currentPassword, newPassword },
      });
      toast.success(result.message || "Password updated.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle2FA(enabled?: boolean) {
    const next = enabled ?? !settings.twoFactorEnabled;
    setBusy(true);
    try {
      await toggleTwoFactorAction({ data: { enabled: next } });
      toast.success(next ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to toggle 2FA.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateExport() {
    setBusy(true);
    try {
      await createExportAction();
      toast.success("Recovery export created.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create export.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOutAll() {
    if (!window.confirm("Sign out all other devices? You will stay signed in on this device.")) return;
    setBusy(true);
    try {
      const result = await revokeOtherSessionsAction();
      toast.success(result.message || "Signed out all other devices.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to sign out devices.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (
      !window.confirm(
        "Permanently delete your NovaSafe account? This cannot be undone and all vault data will be lost.",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deleteAccountAction();
      await logoutAction();
      toast.success("Account deleted.");
      window.location.href = "/";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account.");
    } finally {
      setBusy(false);
    }
  }

  const levelBadgeTone =
    level.level === "excellent" || level.level === "good"
      ? "healthy"
      : level.level === "fair"
        ? "attention"
        : "risk";

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      {/* SECTION 1: Security Score Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface shadow-float">
        <div className="absolute inset-0 brand-gradient-soft opacity-50 pointer-events-none" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <HeroScoreRing score={displayScore} />
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Security Center
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink mt-1">
                  Security Score
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <StatusPill tone={levelBadgeTone}>{level.label}</StatusPill>
                  <StatusPill tone={accountStatus.tone}>
                    <Shield className="size-3" />
                    {accountStatus.label}
                  </StatusPill>
                </div>
              </div>
              <p className="text-sm text-ink-muted max-w-xl">
                NovaSafe continuously monitors your account posture. Address recommendations below to
                reach excellent protection.
              </p>
            </div>
            <div className="lg:w-72 space-y-3 shrink-0">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Score breakdown
              </p>
              <ScoreBreakdownRow label="Master Password" points={breakdown.masterPassword} max={25} />
              <ScoreBreakdownRow label="2FA" points={breakdown.twoFactor} max={20} />
              <ScoreBreakdownRow label="Recovery Kit" points={breakdown.recoveryKit} max={15} />
              <ScoreBreakdownRow label="Trusted Devices" points={breakdown.trustedDevices} max={15} />
              <ScoreBreakdownRow label="Password Health" points={breakdown.passwordHealth} max={25} />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Protection Status */}
      <SectionCard
        title="Protection status"
        description="Core account defenses and how they're configured"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <ProtectionCard
            icon={<Lock className="size-4" />}
            title="Master Password"
            status={settings.hasPassword ? "Configured" : "Not set"}
            statusTone={settings.hasPassword ? "healthy" : "attention"}
            rows={[
              {
                label: "Strength",
                value: settings.hasPassword ? "Strong" : "—",
              },
            ]}
            actionLabel="Change Password"
            onAction={handleChangePassword}
            disabled={busy}
          />
          <ProtectionCard
            icon={<ShieldCheck className="size-4" />}
            title="Two-Factor Authentication"
            status={settings.twoFactorEnabled ? "Enabled" : "Disabled"}
            statusTone={settings.twoFactorEnabled ? "healthy" : "attention"}
            rows={[
              {
                label: "Method",
                value: settings.twoFactorEnabled ? "Authenticator App" : "—",
              },
            ]}
            actionLabel={settings.twoFactorEnabled ? "Disable" : "Configure"}
            onAction={() => handleToggle2FA()}
            disabled={busy}
          />
          <ProtectionCard
            icon={<KeyRound className="size-4" />}
            title="Recovery Kit"
            status={exportHistory.length > 0 ? "Generated" : "Not generated"}
            statusTone={exportHistory.length > 0 ? "healthy" : "attention"}
            rows={[{ label: "Last updated", value: lastExportDate }]}
            actionLabel="Regenerate"
            onAction={handleCreateExport}
            disabled={busy}
          />
          <ProtectionCard
            icon={<Cloud className="size-4" />}
            title="Secure Cloud Sync"
            status={settings.cloudSyncEnabled ? "Enabled" : "Disabled"}
            statusTone={settings.cloudSyncEnabled ? "healthy" : "neutral"}
            actionLabel="Manage"
            action={<ActionLink to="/account/profile">Manage</ActionLink>}
          />
          <ProtectionCard
            icon={<Mail className="size-4" />}
            title="Email Verification"
            status="Verified"
            statusTone="healthy"
            rows={[{ label: "Email", value: userEmail }]}
            actionLabel="Manage"
            action={<ActionLink to="/account/profile">Manage</ActionLink>}
          />
          <ProtectionCard
            icon={<Smartphone className="size-4" />}
            title="Trusted Devices"
            status={`${deviceStats.trusted} Device${deviceStats.trusted === 1 ? "" : "s"}`}
            statusTone={deviceStats.pending > 0 ? "attention" : "healthy"}
            actionLabel="Review Devices"
            action={<ActionLink to="/account/devices">Review Devices</ActionLink>}
          />
        </div>
      </SectionCard>

      {/* SECTION 3: Password Health */}
      <SectionCard
        title="Password health"
        description="Vault credential analysis across your saved items"
        action={
          security.weak > 0 || security.reused > 0 ? (
            <StatusPill tone="attention">
              <AlertTriangle className="size-3" />
              Action needed
            </StatusPill>
          ) : (
            <StatusPill tone="healthy">
              <CheckCircle2 className="size-3" />
              Healthy
            </StatusPill>
          )
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          <HealthMetric
            label="Weak Passwords"
            count={security.weak}
            severity={healthSeverity(security.weak, "default")}
          />
          <HealthMetric
            label="Reused Passwords"
            count={security.reused}
            severity={healthSeverity(security.reused, "default")}
          />
          <HealthMetric
            label="Breached Passwords"
            count={security.breached}
            severity={healthSeverity(security.breached, "breached")}
          />
          <HealthMetric
            label="Old Passwords"
            count={oldPasswords}
            severity={healthSeverity(oldPasswords, "default")}
          />
          <HealthMetric
            label="Unsecured Accounts"
            count={0}
            severity="healthy"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {security.weak > 0 && (
            <ActionLink to="/vault">Review Weak Passwords</ActionLink>
          )}
          {security.reused > 0 && (
            <ActionLink to="/vault">Review Reused Passwords</ActionLink>
          )}
          {security.weak === 0 && security.reused === 0 && (
            <span className="text-xs text-ink-muted">No password issues require review.</span>
          )}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SECTION 4: Account Risk Analysis */}
        <SectionCard
          title="Account risk analysis"
          description={
            riskFindings.length === 0
              ? "No active threats detected"
              : `${riskFindings.length} security recommendation${riskFindings.length === 1 ? "" : "s"} found`
          }
          action={
            <StatusPill
              tone={
                riskLevel === "high" ? "risk" : riskLevel === "medium" ? "attention" : "healthy"
              }
            >
              {riskLevel === "high"
                ? "High risk"
                : riskLevel === "medium"
                  ? "Medium risk"
                  : "Low risk"}
            </StatusPill>
          }
        >
          {riskFindings.length === 0 ? (
            <div className="rounded-xl border border-success/20 bg-success/5 p-5 text-center">
              <CheckCircle2 className="size-8 text-success mx-auto mb-2" />
              <p className="text-sm font-medium text-ink">No active threats detected</p>
              <p className="text-xs text-ink-muted mt-1">
                Your account meets NovaSafe&apos;s recommended security baseline.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {riskFindings.map((finding) => (
                <RiskFinding
                  key={finding.id}
                  title={finding.title}
                  explanation={finding.explanation}
                  action={finding.action}
                  level={finding.level}
                  to={finding.to}
                  onAction={finding.onAction}
                />
              ))}
            </div>
          )}
        </SectionCard>

        {/* SECTION 5: Security Timeline */}
        <SectionCard title="Security timeline" description="Recent security events on your account">
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-muted">No recent security events.</p>
          ) : (
            <div className="pl-1">
              {timeline.map((event) => (
                <TimelineEntry
                  key={event.id}
                  title={event.title}
                  timestamp={formatRelativeTime(event.at)}
                  severity={event.severity}
                  type={event.type}
                />
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-hairline">
            <ActionLink to="/account/activity">View full activity</ActionLink>
          </div>
        </SectionCard>
      </div>

      {/* SECTION 6: Security Recommendations */}
      <SectionCard
        title="Security recommendations"
        description={`${completedCount} of ${recommendations.length} completed`}
        action={
          <span className="text-xs font-medium text-ink-muted tabular-nums">{completionPct}%</span>
        }
      >
        <ProgressBar value={completionPct} className="mb-4" />
        {pendingRecommendations.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-success">
            <Sparkles className="size-4" />
            All recommendations complete — excellent work!
          </div>
        ) : (
          <div className="space-y-2">
            {pendingRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-hairline bg-surface-elev/40 p-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink">{rec.title}</div>
                  <p className="text-xs text-ink-muted mt-0.5">{rec.description}</p>
                </div>
                {rec.to ? (
                  <ActionLink to={rec.to}>Take action</ActionLink>
                ) : (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={rec.action}
                    className="h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition disabled:opacity-50 shrink-0"
                  >
                    Take action
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SECTION 7: Device Security Overview */}
        <SectionCard title="Device security" description="Trust posture across signed-in devices">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: "Trusted", value: deviceStats.trusted, tone: "text-success" },
              { label: "Pending", value: deviceStats.pending, tone: "text-warning" },
              { label: "Suspicious", value: deviceStats.suspicious, tone: "text-destructive" },
              { label: "Revoked", value: deviceStats.revoked, tone: "text-ink-muted" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-hairline bg-surface-elev/50 p-4 text-center"
              >
                <div className={cn("text-2xl font-semibold tabular-nums", stat.tone)}>
                  {stat.value}
                </div>
                <div className="text-xs text-ink-muted mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
          <ActionLink to="/account/devices">Manage Devices</ActionLink>
        </SectionCard>

        {/* SECTION 8: Login & Session Security */}
        <SectionCard title="Login & session security" description="Current session details">
          <div className="rounded-xl border border-hairline bg-surface-elev/40 p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg brand-gradient-soft grid place-items-center text-brand">
                <LogIn className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink">
                  {sessionInfo.browser} · {sessionInfo.os}
                </div>
                <div className="text-xs text-ink-muted">This device</div>
              </div>
            </div>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-ink-muted">Active sessions</dt>
                <dd className="font-medium text-ink mt-0.5">{data.activeSessions}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Last login</dt>
                <dd className="font-medium text-ink mt-0.5">{sessionInfo.lastLogin}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-ink-muted">Recent location</dt>
                <dd className="font-medium text-ink mt-0.5">{sessionInfo.location}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-3">
            <ActionLink to="/account/devices">Review all sessions</ActionLink>
          </div>
        </SectionCard>
      </div>

      {/* SECTION 9: Data Protection Status */}
      <SectionCard
        title="Data protection"
        description="How NovaSafe keeps your vault private and encrypted"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <TrustIndicator label="End-to-End Encryption" enabled hint="Only you can decrypt your data" />
          <TrustIndicator label="Zero-Knowledge Security" enabled hint="NovaSafe cannot read your vault" />
          <TrustIndicator label="AES-256 Encryption" enabled hint="Industry-standard cipher" />
          <TrustIndicator
            label="Encrypted Vault"
            enabled={settings.hasPassword}
            hint={settings.hasPassword ? "Vault keys protected by master password" : "Set master password"}
          />
          <TrustIndicator
            label="Secure Cloud Sync"
            enabled={settings.cloudSyncEnabled}
            hint="Encrypted sync across your devices"
          />
          <TrustIndicator
            label="Biometric Unlock"
            enabled={settings.authMethods?.includes("webauthn") ?? false}
            hint="Fast unlock on supported devices"
          />
        </div>
      </SectionCard>

      {/* SECTION 10: Emergency Security Actions */}
      <SectionCard
        title="Emergency actions"
        description="High-impact actions — use only when necessary"
        className="border-destructive/20"
      >
        <div className="space-y-3">
          <DangerAction
            title="Sign out all devices"
            description="End every session except this one. Use if you suspect unauthorized access."
            actionLabel="Sign out all"
            onClick={handleSignOutAll}
            disabled={busy}
          />
          <DangerAction
            title="Rotate encryption keys"
            description="NovaSafe rotates keys automatically. Contact support for manual rotation."
            actionLabel="Learn more"
            onClick={() =>
              toast.info("Encryption keys are rotated automatically. Contact support if you need assistance.")
            }
            disabled={busy}
          />
          <DangerAction
            title="Regenerate recovery kit"
            description="Create a new encrypted export. Previous kits may no longer reflect your vault."
            actionLabel="Regenerate"
            onClick={handleCreateExport}
            disabled={busy}
          />
          <DangerAction
            title="Delete account"
            description="Permanently remove your NovaSafe account and all vault data."
            actionLabel="Delete account"
            onClick={handleDeleteAccount}
            disabled={busy}
            variant="destructive"
          />
        </div>
      </SectionCard>
    </div>
  );
}
