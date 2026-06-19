export function generatePassword(
  opts: { length?: number; symbols?: boolean; numbers?: boolean; upper?: boolean } = {},
) {
  const { length = 20, symbols = true, numbers = true, upper = true } = opts;
  let alphabet = "abcdefghijklmnopqrstuvwxyz";
  if (upper) alphabet += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (numbers) alphabet += "0123456789";
  if (symbols) alphabet += "!@#$%^&*()-_=+[]{}<>?";
  const arr = new Uint32Array(length);
  if (typeof crypto !== "undefined") crypto.getRandomValues(arr);
  else for (let i = 0; i < length; i++) arr[i] = Math.floor(Math.random() * 0xffffffff);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[arr[i] % alphabet.length];
  return out;
}

export function strength(pw: string | undefined): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "None" };
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 14) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  const score = Math.min(4, s) as 0 | 1 | 2 | 3 | 4;
  return { score, label: ["Weak", "Weak", "Fair", "Strong", "Excellent"][score] };
}

export function maskValue(v: string, visible = false) {
  if (visible || !v) return v;
  return "•".repeat(Math.min(v.length, 18));
}

/** True when a string is only masking bullets (must never be sent as a password). */
export function isMaskPlaceholder(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return [...trimmed].every((ch) => ch === "•");
}
