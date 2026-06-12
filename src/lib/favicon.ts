import { collectVaultItemUrls } from "@/lib/vault-urls";
import type { VaultItem } from "@/lib/vault-types";

export function getHost(url: string) {
  try {
    const normalized = url.includes("://") ? url : `https://${url}`;
    return new URL(normalized).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function getFavicon(url: string) {
  const host = getHost(url);
  return `https://www.google.com/s2/favicons?domain=${host}&sz=64`;
}

export function resolveItemSiteUrl(
  item: Pick<VaultItem, "url" | "domain" | "customFields">,
): string | undefined {
  const urls = collectVaultItemUrls(item);
  return urls[0];
}
