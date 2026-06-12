import { useEffect, useState } from "react";

import { TYPE_META } from "@/lib/item-meta";
import { getFavicon, resolveItemSiteUrl } from "@/lib/favicon";
import { cn } from "@/lib/utils";
import type { VaultItem } from "@/lib/vault-types";

export function ItemFavicon({
  item,
  size = 36,
  className,
  iconClassName,
}: {
  item: VaultItem;
  size?: number;
  className?: string;
  iconClassName?: string;
}) {
  const M = TYPE_META[item.type];
  const Icon = M.icon;
  const siteUrl = resolveItemSiteUrl(item);
  const [err, setErr] = useState(false);
  const px = `${size}px`;

  useEffect(() => {
    setErr(false);
  }, [item.id, siteUrl]);

  if (!siteUrl || err) {
    return (
      <span
        className={cn("rounded-lg grid place-items-center shrink-0", M.tint, className)}
        style={{ width: px, height: px }}
      >
        <Icon className={iconClassName ?? "size-4"} />
      </span>
    );
  }

  const normalizedUrl = siteUrl.includes("://") ? siteUrl : `https://${siteUrl}`;

  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface ring-1 ring-hairline",
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
