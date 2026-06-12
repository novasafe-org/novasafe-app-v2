import { formatRelativeTime } from "@/components/account/profile/profile-helpers";

export type RecoveryLevel = "excellent" | "good" | "needs_attention" | "at_risk";

export type RecoveryStatus = "fully_recoverable" | "partially_recoverable" | "at_risk";

export type RecoveryBreakdown = {
  recoveryKit: number;
  trustedDevices: number;
  twoFactor: number;
  verifiedEmail: number;
  emergencyContact: number;
  total: number;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  action?: string;
  to?: string;
};

export type RecoveryTimelineEvent = {
  id: string;
  title: string;
  at: number;
  device?: string;
  location?: string;
  type: string;
};

export type RecoveryRecommendation = {
  id: string;
  title: string;
  description: string;
  done: boolean;
  to?: string;
};

export function recoveryLevel(score: number): { level: RecoveryLevel; label: string } {
  if (score >= 90) return { level: "excellent", label: "Excellent" };
  if (score >= 75) return { level: "good", label: "Good" };
  if (score >= 50) return { level: "needs_attention", label: "Needs attention" };
  return { level: "at_risk", label: "At risk" };
}

export function accountRecoveryStatus(score: number, hasExport: boolean): {
  label: string;
  tone: "healthy" | "attention" | "risk";
} {
  if (!hasExport || score < 50) {
    return { label: "Recovery risk detected", tone: "risk" };
  }
  if (score >= 80) return { label: "Fully recoverable", tone: "healthy" };
  return { label: "Partially recoverable", tone: "attention" };
}

export function computeRecoveryScore(input: {
  hasExport: boolean;
  trustedDevices: number;
  totalSessions: number;
  twoFactorEnabled: boolean;
  hasEmail: boolean;
  hasEmergencyContact: boolean;
}): RecoveryBreakdown {
  const recoveryKit = input.hasExport ? 25 : 0;
  const trustedDevices =
    input.totalSessions === 0
      ? 0
      : Math.round(25 * Math.min(1, input.trustedDevices / Math.max(1, input.totalSessions)));
  const twoFactor = input.twoFactorEnabled ? 20 : 0;
  const verifiedEmail = input.hasEmail ? 15 : 0;
  const emergencyContact = input.hasEmergencyContact ? 15 : 0;
  const total = recoveryKit + trustedDevices + twoFactor + verifiedEmail + emergencyContact;
  return {
    recoveryKit,
    trustedDevices,
    twoFactor,
    verifiedEmail,
    emergencyContact,
    total,
  };
}

export function buildChecklist(input: {
  hasEmail: boolean;
  hasExport: boolean;
  trustedDevices: number;
  twoFactorEnabled: boolean;
  hasEmergencyContact: boolean;
}): ChecklistItem[] {
  return [
    {
      id: "email",
      label: "Email verified",
      done: input.hasEmail,
      to: "/account/profile",
    },
    {
      id: "kit",
      label: "Recovery kit generated",
      done: input.hasExport,
    },
    {
      id: "device",
      label: "Trusted device configured",
      done: input.trustedDevices > 0,
      to: "/account/devices",
    },
    {
      id: "2fa",
      label: "2FA enabled",
      done: input.twoFactorEnabled,
      to: "/account/security",
    },
    {
      id: "contact",
      label: "Emergency contact added",
      done: input.hasEmergencyContact,
    },
  ];
}

export function buildRecommendations(input: {
  hasExport: boolean;
  twoFactorEnabled: boolean;
  hasEmail: boolean;
  hasEmergencyContact: boolean;
  trustedDevices: number;
  totalSessions: number;
}): RecoveryRecommendation[] {
  const items: RecoveryRecommendation[] = [];
  if (!input.hasExport) {
    items.push({
      id: "kit",
      title: "Generate recovery kit",
      description: "Create an encrypted offline backup to regain access.",
      done: false,
    });
  }
  if (!input.twoFactorEnabled) {
    items.push({
      id: "2fa",
      title: "Enable 2FA",
      description: "Protect recovery flows with two-factor authentication.",
      done: false,
      to: "/account/security",
    });
  }
  if (!input.hasEmail) {
    items.push({
      id: "email",
      title: "Verify recovery email",
      description: "Confirm your email for account recovery notifications.",
      done: false,
      to: "/account/profile",
    });
  }
  if (!input.hasEmergencyContact) {
    items.push({
      id: "contact",
      title: "Add trusted contact",
      description: "Designate someone who can help in an emergency.",
      done: false,
    });
  }
  if (input.trustedDevices < input.totalSessions) {
    items.push({
      id: "devices",
      title: "Review trusted devices",
      description: "Verify every device that can recover your account.",
      done: false,
      to: "/account/devices",
    });
  }
  return items;
}

export function buildRecoveryTimeline(input: {
  exportHistory: Array<{ id: string; createdAt?: string; fileName?: string }>;
  sessions: Array<{
    id: string;
    parsedDevice?: { displayName?: string };
    locationLabel?: string;
    createdAt?: string;
    trustState?: string;
  }>;
  settings: { updatedAt: string | null; twoFactorEnabled: boolean };
  email?: string;
}): RecoveryTimelineEvent[] {
  const events: RecoveryTimelineEvent[] = [];

  for (const entry of input.exportHistory) {
    const at = entry.createdAt ? new Date(entry.createdAt).getTime() : Date.now();
    events.push({
      id: `export-${entry.id}`,
      title: "Recovery kit generated",
      at,
      device: "NovaSafe Vault",
      location: "Encrypted export",
      type: "kit",
    });
  }

  if (input.settings.twoFactorEnabled && input.settings.updatedAt) {
    events.push({
      id: "2fa-updated",
      title: "Two-factor authentication updated",
      at: new Date(input.settings.updatedAt).getTime(),
      device: "Account Security",
      type: "security",
    });
  }

  for (const session of input.sessions) {
    if (session.trustState === "trusted" || session.trustState === "needs_verification") {
      const at = session.createdAt ? new Date(session.createdAt).getTime() : Date.now();
      events.push({
        id: `device-${session.id}`,
        title: "Trusted device added",
        at,
        device: session.parsedDevice?.displayName || "Unknown device",
        location: session.locationLabel || "Unknown location",
        type: "device",
      });
    }
  }

  if (input.email) {
    events.push({
      id: "email-verified",
      title: "Recovery email verified",
      at: input.settings.updatedAt
        ? new Date(input.settings.updatedAt).getTime()
        : Date.now(),
      device: "Account",
      type: "email",
    });
  }

  events.sort((a, b) => b.at - a.at);
  return events.slice(0, 10);
}

export function resilienceInsight(
  score: number,
  hasExport: boolean,
  pendingRecs: number,
): { headline: string; body: string; tone: "success" | "warning" | "risk" } {
  if (!hasExport) {
    return {
      headline: "Recovery kit missing",
      body: "Without a recovery kit, account recovery may be difficult if you lose your master password.",
      tone: "risk",
    };
  }
  if (score >= 85 && pendingRecs === 0) {
    return {
      headline: "Recovery readiness is excellent",
      body: "All critical recovery mechanisms are configured. Your account is well protected.",
      tone: "success",
    };
  }
  if (pendingRecs > 0) {
    return {
      headline: `${pendingRecs} recommendation${pendingRecs === 1 ? "" : "s"} remain`,
      body: "Complete the remaining steps to reach full recovery readiness.",
      tone: "warning",
    };
  }
  return {
    headline: "Recovery posture is solid",
    body: "Core protections are in place. Consider adding an emergency contact for extra resilience.",
    tone: "success",
  };
}

export function formatRecoveryDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRecoveryDateTime(iso?: string): string {
  if (!iso) return "—";
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return "—";
  return formatRelativeTime(ts);
}

export function generateLocalRecoveryKit(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(20)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .match(/.{1,4}/g)!
    .join("-");
}

export function downloadRecoveryKit(kit: string, filename = "novasafe-recovery-kit.txt"): void {
  const content = `NovaSafe Recovery Kit\nGenerated: ${new Date().toISOString()}\n\n${kit}\n\nStore offline. Do not share.`;
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
