import { useEffect, useState } from "react";

import { deriveItemInitials, itemAvatarBackground } from "@/lib/item-avatar";
import { getFavicon, resolveItemSiteUrl } from "@/lib/favicon";
import { cn } from "@/lib/utils";
import type { VaultItem } from "@/lib/vault-types";

function ItemInitialsAvatar({
  item,
  size,
  className,
}: {
  item: VaultItem;
  size: number;
  className?: string;
}) {
  const px = `${size}px`;
  const seed = item.id || item.title;
  const initials = deriveItemInitials(item.title);

  return (
    <span
      className={cn(
        "rounded-full grid place-items-center shrink-0 font-semibold text-white select-none",
        className,
      )}
      style={{
        width: px,
        height: px,
        backgroundColor: itemAvatarBackground(seed),
        fontSize: Math.max(10, Math.round(size * 0.36)),
        letterSpacing: "0.02em",
      }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

export function ItemFavicon({
  item,
  size = 28,
  className,
}: {
  item: VaultItem;
  size?: number;
  className?: string;
  /** @deprecated Icons replaced by initials fallback; kept for API compatibility */
  iconClassName?: string;
}) {
  const siteUrl = resolveItemSiteUrl(item);
  const [err, setErr] = useState(false);
  const px = `${size}px`;

  useEffect(() => {
    setErr(false);
  }, [item.id, siteUrl]);

  if (!siteUrl || err) {
    return <ItemInitialsAvatar item={item} size={size} className={className} />;
  }

  const normalizedUrl = siteUrl.includes("://") ? siteUrl : `https://${siteUrl}`;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface ring-1 ring-hairline",
        className,
      )}
      style={{ width: px, height: px }}
    >
      <img
        src={getFavicon(normalizedUrl)}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        onError={() => setErr(true)}
        className="h-full w-full object-cover"
      />
    </span>
  );
}
