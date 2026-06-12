import type { VaultItem } from "@/lib/vault-types";

const URL_FIELD_NAME_HINTS = ["url", "website", "site", "domain", "link", "login"];

const looksLikeUrl = (value: string): boolean => {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (/^https?:\/\//i.test(trimmed)) return true;
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+([\/?#].*)?$/i.test(trimmed);
};

/** Collect primary + custom website URLs stored on a vault item. */
export function collectVaultItemUrls(
  item: Pick<VaultItem, "url" | "domain" | "customFields">,
): string[] {
  const urls = new Set<string>();

  const primary = item.url?.trim();
  if (primary) urls.add(primary);

  const domain = item.domain?.trim();
  if (domain) urls.add(domain.includes("://") ? domain : `https://${domain}`);

  for (const field of item.customFields ?? []) {
    const value = field.value?.trim();
    if (!value) continue;

    const type = (field.type ?? "").toUpperCase();
    const name = field.name.toLowerCase();
    const isUrlField =
      type === "URL" ||
      URL_FIELD_NAME_HINTS.some((hint) => name.includes(hint)) ||
      looksLikeUrl(value);

    if (isUrlField) urls.add(value);
  }

  return Array.from(urls);
}
