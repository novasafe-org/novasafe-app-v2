import type { VaultItem } from "@/lib/vault-types";

export function toOptionalTimestamp(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatVaultDate(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeAgo(ts: number): string {
  if (!ts) return "Never";
  const seconds = Math.floor((Date.now() - ts) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  const days = Math.floor(seconds / 86400);
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export type VaultMonthGroup = {
  key: string;
  label: string;
  items: VaultItem[];
};

export function groupVaultItemsByMonth(items: VaultItem[]): VaultMonthGroup[] {
  const sorted = [...items].sort((a, b) => b.createdAt - a.createdAt);
  const groups = new Map<string, VaultMonthGroup>();

  for (const item of sorted) {
    const date = new Date(item.createdAt);
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, "0")}`;
    const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      groups.set(key, { key, label, items: [item] });
    }
  }

  return Array.from(groups.values());
}
