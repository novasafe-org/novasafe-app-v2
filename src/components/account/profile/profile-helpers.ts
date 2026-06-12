import type { DashboardSecuritySummary } from "@/lib/api";

export function deriveInitials(name: string | undefined, email: string): string {
  const source = (name && name.trim()) || email.split("@")[0] || "NS";
  const tokens = source.split(/[\s._-]+/).filter(Boolean);
  if (tokens.length === 0) return source.slice(0, 2).toUpperCase();
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase();
}

export function formatMemberSince(iso: string | undefined | null): string {
  if (!iso) return "Recently joined";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Recently joined";
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function vaultHealthLabel(score: number): { label: string; hint: string } {
  if (score >= 85) return { label: "Strong", hint: "Your vault meets excellent security standards" };
  if (score >= 70) return { label: "Good", hint: "Solid protection with room to improve" };
  if (score >= 50) return { label: "Fair", hint: "Address weak or reused passwords soon" };
  return { label: "At risk", hint: "Immediate attention recommended" };
}

export function accountStatusLabel(
  security: DashboardSecuritySummary,
  settings: { twoFactorEnabled: boolean; hasPassword: boolean },
): { label: string; tone: "healthy" | "attention" | "risk" } {
  if (!settings.hasPassword) return { label: "Setup required", tone: "attention" };
  if (security.breached > 0) return { label: "At risk", tone: "risk" };
  if (security.weak > 0 || security.reused > 0 || !settings.twoFactorEnabled) {
    return { label: "Protected", tone: "attention" };
  }
  if (security.score >= 80) return { label: "Healthy", tone: "healthy" };
  return { label: "Protected", tone: "healthy" };
}

export function recoveryReadiness(hasExport: boolean, hasPassword: boolean): {
  label: string;
  tone: "healthy" | "attention" | "risk";
} {
  if (!hasPassword) return { label: "Incomplete", tone: "attention" };
  if (hasExport) return { label: "Configured", tone: "healthy" };
  return { label: "Not configured", tone: "attention" };
}

export function formatRelativeTime(ts: number): string {
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function inactiveAccountEstimate(total: number, recentCount: number): number {
  return Math.max(0, total - recentCount);
}
