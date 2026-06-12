import { useMemo, useState } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { Sparkles, Shield } from "lucide-react";
import { toast } from "sonner";
import type { loadRecoveryCenterAction } from "@/lib/account/server-actions";
import {
  createExportAction,
  deleteAccountAction,
  revokeOtherSessionsAction,
} from "@/lib/account/server-actions";
import { logoutAction } from "@/lib/auth/server-actions";
import { formatRelativeTime } from "@/components/account/profile/profile-helpers";
import {
  accountRecoveryStatus,
  buildChecklist,
  buildRecommendations,
  buildRecoveryTimeline,
  computeRecoveryScore,
  downloadRecoveryKit,
  formatRecoveryDate,
  generateLocalRecoveryKit,
  recoveryLevel,
  resilienceInsight,
} from "./recovery-helpers";
import {
  SectionCard,
  StatusPill,
  HeroScoreRing,
  ScoreBreakdownRow,
  RecoveryProtectionCard,
  RecoveryChecklist,
  RecoveryKitPanel,
  EmergencyAccessPanel,
  RecoveryTimelineItem,
  ResilienceInsightCard,
  EducationCard,
  EmergencyAction,
  RECOVERY_ICONS,
} from "./recovery-ui";

type RecoveryData = Awaited<ReturnType<typeof loadRecoveryCenterAction>>;

export function RecoveryCenter({
  data,
  userEmail,
}: {
  data: RecoveryData;
  userEmail: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [localKit, setLocalKit] = useState<string | null>(null);
  const [lastDownloadAt, setLastDownloadAt] = useState<number | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const hasExport = data.exportHistory.length > 0;
  const latestExport = data.exportHistory[0];
  const hasEmergencyContact = false;

  const breakdown = computeRecoveryScore({
    hasExport: hasExport || Boolean(localKit),
    trustedDevices: data.trustedDevices,
    totalSessions: data.sessions.length,
    twoFactorEnabled: data.settings.twoFactorEnabled,
    hasEmail: Boolean(userEmail || data.summary.email),
    hasEmergencyContact,
  });

  const score = breakdown.total;
  const level = recoveryLevel(score);
  const recoveryStatus = accountRecoveryStatus(score, hasExport || Boolean(localKit));

  const checklist = useMemo(
    () =>
      buildChecklist({
        hasEmail: Boolean(userEmail || data.summary.email),
        hasExport: hasExport || Boolean(localKit),
        trustedDevices: data.trustedDevices,
        twoFactorEnabled: data.settings.twoFactorEnabled,
        hasEmergencyContact,
      }),
    [data, userEmail, localKit, hasExport, hasEmergencyContact],
  );

  const completionPct = Math.round(
    (checklist.filter((i) => i.done).length / checklist.length) * 100,
  );

  const recommendations = useMemo(
    () =>
      buildRecommendations({
        hasExport: hasExport || Boolean(localKit),
        twoFactorEnabled: data.settings.twoFactorEnabled,
        hasEmail: Boolean(userEmail || data.summary.email),
        hasEmergencyContact,
        trustedDevices: data.trustedDevices,
        totalSessions: data.sessions.length,
      }),
    [data, userEmail, localKit, hasExport, hasEmergencyContact],
  );

  const pendingRecs = recommendations.filter((r) => !r.done);
  const insight = resilienceInsight(score, hasExport || Boolean(localKit), pendingRecs.length);

  const timeline = useMemo(
    () =>
      buildRecoveryTimeline({
        exportHistory: data.exportHistory,
        sessions: data.sessions,
        settings: data.settings,
        email: userEmail || data.summary.email,
      }),
    [data, userEmail],
  );

  const levelTone =
    level.level === "excellent" || level.level === "good"
      ? "healthy"
      : level.level === "needs_attention"
        ? "attention"
        : "risk";

  async function handleGenerateKit() {
    setBusy(true);
    try {
      await createExportAction();
      const kit = generateLocalRecoveryKit();
      setLocalKit(kit);
      toast.success("Recovery kit generated. Store it offline immediately.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate recovery kit.");
    } finally {
      setBusy(false);
    }
  }

  function handleDownloadKit() {
    if (localKit) {
      downloadRecoveryKit(localKit);
      setLastDownloadAt(Date.now());
      toast.success("Recovery kit downloaded.");
      return;
    }
    if (hasExport && latestExport?.fileName) {
      toast.info(
        `Encrypted export "${latestExport.fileName}" is on file. Regenerate to download a fresh local recovery code.`,
      );
      return;
    }
    toast.info("Generate a recovery kit first.");
  }

  async function handleRegenerateKit() {
    if (
      !window.confirm(
        "Regenerate recovery kit? Previous codes may no longer be valid. Store the new kit offline.",
      )
    ) {
      return;
    }
    await handleGenerateKit();
  }

  async function handleSignOutAll() {
    if (!window.confirm("Sign out all other devices?")) return;
    setBusy(true);
    try {
      const result = await revokeOtherSessionsAction();
      toast.success(result.message || "All other sessions revoked.");
      await router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke sessions.");
    } finally {
      setBusy(false);
    }
  }

  const backupHealthy =
    data.settings.cloudSyncEnabled && hasExport && data.settings.hasPassword;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 pb-10">
      {/* SECTION 1: Recovery Readiness Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-hairline bg-surface shadow-float">
        <div className="absolute inset-0 brand-gradient-soft opacity-50 pointer-events-none" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-8">
            <HeroScoreRing score={score} />
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                  Recovery Center
                </p>
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-ink mt-1">
                  Recovery Readiness
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <StatusPill tone={levelTone}>{level.label}</StatusPill>
                  <StatusPill tone={recoveryStatus.tone}>
                    <Shield className="size-3" />
                    {recoveryStatus.label}
                  </StatusPill>
                </div>
              </div>
              <p className="text-sm text-ink-muted max-w-xl">
                Your account resilience dashboard. Ensure you can recover access even if you lose a
                device or forget your master password.
              </p>
            </div>
            <div className="lg:w-72 space-y-3 shrink-0">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">
                Contributing factors
              </p>
              <ScoreBreakdownRow label="Recovery Kit" points={breakdown.recoveryKit} max={25} />
              <ScoreBreakdownRow label="Trusted Devices" points={breakdown.trustedDevices} max={25} />
              <ScoreBreakdownRow label="2FA" points={breakdown.twoFactor} max={20} />
              <ScoreBreakdownRow label="Verified Email" points={breakdown.verifiedEmail} max={15} />
              <ScoreBreakdownRow
                label="Emergency Contact"
                points={breakdown.emergencyContact}
                max={15}
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Recovery Protection Status */}
      <SectionCard title="Recovery protection" description="Configured safeguards for account recovery">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <RecoveryProtectionCard
            icon={<RECOVERY_ICONS.kit className="size-4" />}
            title="Recovery Kit"
            status={hasExport || localKit ? "Generated" : "Not generated"}
            statusTone={hasExport || localKit ? "healthy" : "attention"}
            rows={[
              {
                label: "Last updated",
                value: formatRecoveryDate(latestExport?.createdAt),
              },
            ]}
            actionLabel="Download again"
            onAction={handleDownloadKit}
          />
          <RecoveryProtectionCard
            icon={<RECOVERY_ICONS.email className="size-4" />}
            title="Verified Email"
            status="Verified"
            statusTone="healthy"
            rows={[{ label: "Email", value: userEmail || data.summary.email || "—" }]}
            actionLabel="Manage"
            actionTo="/account/profile"
          />
          <RecoveryProtectionCard
            icon={<RECOVERY_ICONS.devices className="size-4" />}
            title="Trusted Devices"
            status={`${data.trustedDevices} device${data.trustedDevices === 1 ? "" : "s"}`}
            statusTone={data.trustedDevices > 0 ? "healthy" : "attention"}
            actionLabel="Review"
            actionTo="/account/devices"
          />
          <RecoveryProtectionCard
            icon={<RECOVERY_ICONS.twoFa className="size-4" />}
            title="Two-Factor Authentication"
            status={data.settings.twoFactorEnabled ? "Enabled" : "Disabled"}
            statusTone={data.settings.twoFactorEnabled ? "healthy" : "attention"}
            actionLabel="Manage"
            actionTo="/account/security"
          />
          <RecoveryProtectionCard
            icon={<RECOVERY_ICONS.contact className="size-4" />}
            title="Emergency Contact"
            status={hasEmergencyContact ? "Configured" : "Missing"}
            statusTone={hasEmergencyContact ? "healthy" : "attention"}
            actionLabel="Setup"
            onAction={() => toast.info("Emergency contacts will be available in an upcoming update.")}
          />
          <RecoveryProtectionCard
            icon={<RECOVERY_ICONS.backup className="size-4" />}
            title="Backup Status"
            status={backupHealthy ? "Healthy" : "Needs review"}
            statusTone={backupHealthy ? "healthy" : "attention"}
            rows={[
              {
                label: "Cloud sync",
                value: data.settings.cloudSyncEnabled ? "Enabled" : "Disabled",
              },
            ]}
            actionLabel="Review"
            actionTo="/account/security"
          />
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SECTION 3: Recovery Checklist */}
        <SectionCard title="Recovery checklist" description="Steps to full account recoverability">
          <RecoveryChecklist items={checklist} completionPct={completionPct} />
        </SectionCard>

        {/* SECTION 7: Account Resilience Insights */}
        <SectionCard title="Resilience insights" description="Your recovery posture at a glance">
          <ResilienceInsightCard
            headline={insight.headline}
            body={insight.body}
            tone={insight.tone}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-hairline p-3">
              <p className="text-xs text-ink-faint">Vault items</p>
              <p className="font-semibold text-ink mt-0.5">{data.summary.itemCount}</p>
            </div>
            <div className="rounded-lg border border-hairline p-3">
              <p className="text-xs text-ink-faint">Active sessions</p>
              <p className="font-semibold text-ink mt-0.5">{data.activeSessions}</p>
            </div>
            <div className="rounded-lg border border-hairline p-3">
              <p className="text-xs text-ink-faint">Exports on file</p>
              <p className="font-semibold text-ink mt-0.5">{data.summary.exportCount}</p>
            </div>
            <div className="rounded-lg border border-hairline p-3">
              <p className="text-xs text-ink-faint">Readiness score</p>
              <p className="font-semibold text-ink mt-0.5">{score}/100</p>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* SECTION 4: Recovery Kit Center */}
      <SectionCard title="Recovery kit center" description="Offline backup for emergency account access">
        <RecoveryKitPanel
          hasKit={hasExport}
          generatedAt={formatRecoveryDate(latestExport?.createdAt)}
          lastDownload={
            lastDownloadAt ? formatRelativeTime(lastDownloadAt) : "Not recorded"
          }
          version={hasExport ? `v${data.exportHistory.length}` : "—"}
          localKit={localKit}
          busy={busy}
          onGenerate={handleGenerateKit}
          onDownload={handleDownloadKit}
          onRegenerate={handleRegenerateKit}
          onViewInstructions={() => setShowInstructions((v) => !v)}
        />
        {showInstructions && (
          <div className="mt-4 rounded-lg border border-hairline bg-surface-elev/40 p-4 text-sm text-ink-muted space-y-2">
            <p className="font-medium text-ink">How to use your recovery kit</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Generate and download your recovery kit.</li>
              <li>Store the file or code offline — safe deposit box or encrypted USB.</li>
              <li>Never email or message your recovery kit.</li>
              <li>If locked out, use the kit with NovaSafe account recovery.</li>
              <li>Regenerate after any suspected compromise.</li>
            </ol>
          </div>
        )}
      </SectionCard>

      {/* SECTION 5: Emergency Access */}
      <SectionCard title="Emergency access" description="Trusted contact recovery (coming soon)">
        <EmergencyAccessPanel
          onConfigure={() => toast.info("Emergency access configuration coming soon.")}
          onUpdateContact={() => toast.info("Trusted contact setup coming soon.")}
          onDisable={() => toast.info("Emergency access is not enabled.")}
        />
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* SECTION 6: Recovery History */}
        <SectionCard title="Recovery history" description="Recent recovery-related events">
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-muted">No recovery events yet.</p>
          ) : (
            <div className="pl-1">
              {timeline.map((event) => (
                <RecoveryTimelineItem key={event.id} event={event} />
              ))}
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-hairline">
            <Link
              to="/account/activity"
              className="text-xs font-medium text-brand hover:underline"
            >
              View full audit log
            </Link>
          </div>
        </SectionCard>

        {/* SECTION 8: Recovery Recommendations */}
        <SectionCard
          title="Recommendations"
          description={
            pendingRecs.length === 0
              ? "All recovery steps complete"
              : `${pendingRecs.length} action${pendingRecs.length === 1 ? "" : "s"} recommended`
          }
        >
          {pendingRecs.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-success">
              <Sparkles className="size-4" />
              Your recovery plan is complete
            </div>
          ) : (
            <div className="space-y-2">
              {pendingRecs.map((rec) => (
                <div
                  key={rec.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-hairline bg-surface-elev/40 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink">{rec.title}</div>
                    <p className="text-xs text-ink-muted mt-0.5">{rec.description}</p>
                  </div>
                  {rec.to ? (
                    <Link
                      to={rec.to}
                      className="shrink-0 h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition inline-flex items-center justify-center"
                    >
                      Take action
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={rec.id === "kit" ? handleGenerateKit : undefined}
                      className="shrink-0 h-8 px-3 rounded-lg hairline text-xs font-medium hover:bg-muted transition disabled:opacity-50"
                    >
                      Take action
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* SECTION 9: Recovery Education */}
      <SectionCard title="Recovery education" description="Understand how NovaSafe protects your access">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EducationCard
            title="What is a Recovery Kit?"
            description="An encrypted offline backup that lets you regain vault access if you lose your master password."
            onClick={() => setShowInstructions(true)}
          />
          <EducationCard
            title="How account recovery works"
            description="Combine your recovery kit, verified email, and trusted devices to securely restore access."
          />
          <EducationCard
            title="Best practices for secure recovery"
            description="Store kits offline, enable 2FA, and review trusted devices regularly."
          />
          <EducationCard
            title="What to do if a device is lost"
            description="Sign out all devices, regenerate your recovery kit, and verify remaining sessions."
            onClick={() => void handleSignOutAll()}
          />
        </div>
      </SectionCard>

      {/* SECTION 10: Emergency Action Center */}
      <SectionCard
        title="Emergency action center"
        description="High-impact actions for account compromise or device loss"
        className="border-destructive/20"
      >
        <div className="space-y-3">
          <EmergencyAction
            title="Sign out all devices"
            description="Revoke every session except this one. Use immediately if a device is lost."
            actionLabel="Sign out all"
            onClick={() => void handleSignOutAll()}
            disabled={busy}
          />
          <EmergencyAction
            title="Revoke all sessions"
            description="End all active sessions including this device. You will need to sign in again."
            actionLabel="Revoke sessions"
            onClick={() => {
              if (window.confirm("Revoke all sessions? You will be signed out.")) {
                void handleSignOutAll();
              }
            }}
            disabled={busy}
          />
          <EmergencyAction
            title="Rotate encryption keys"
            description="NovaSafe rotates keys automatically. Contact support for manual rotation."
            actionLabel="Learn more"
            onClick={() =>
              toast.info("Encryption keys rotate automatically. Contact support if needed.")
            }
            disabled={busy}
          />
          <EmergencyAction
            title="Generate new recovery kit"
            description="Invalidate previous kits and create a fresh offline backup."
            actionLabel="Generate new kit"
            onClick={() => void handleRegenerateKit()}
            disabled={busy}
          />
          <EmergencyAction
            title="Lock account"
            description="Temporarily prevent new sign-ins while you investigate suspicious activity."
            actionLabel="Lock account"
            onClick={() => toast.info("Account lock will be available in an upcoming update.")}
            disabled={busy}
          />
          <EmergencyAction
            title="Delete account"
            description="Permanently delete your NovaSafe account and all vault data. This cannot be undone."
            actionLabel="Delete account"
            disabled={busy}
            variant="destructive"
            onClick={async () => {
              if (
                !window.confirm(
                  "Delete account permanently? This cannot be undone and will revoke all sessions.",
                )
              ) {
                return;
              }
              setBusy(true);
              try {
                await deleteAccountAction();
                await logoutAction();
                window.location.href = "/";
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to delete account.");
              } finally {
                setBusy(false);
              }
            }}
          />
        </div>
      </SectionCard>
    </div>
  );
}
