/** Initials for vault item avatar fallback (e.g. "My Server" → "MS"). */
export function deriveItemInitials(title: string): string {
  const source = (title || "Item").trim();
  const tokens = source.split(/[\s._-]+/).filter(Boolean);
  if (tokens.length >= 2) {
    return (tokens[0][0] + tokens[1][0]).toUpperCase();
  }
  if (tokens.length === 1) {
    return tokens[0].slice(0, 2).toUpperCase();
  }
  return "IT";
}

const AVATAR_HUES = [195, 210, 225, 250, 270, 300, 330, 15, 35, 145, 165, 185];

/** Stable accent color per item — same item always gets the same hue. */
export function itemAvatarBackground(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hue = AVATAR_HUES[hash % AVATAR_HUES.length];
  return `hsl(${hue} 52% 44%)`;
}
