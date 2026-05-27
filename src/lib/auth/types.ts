import type { AuthUser } from "@/lib/api";

/** Decoded session shared with novasafe-auth-v2's `SessionRecord`. */
export interface SessionRecord {
  token: string;
  user: AuthUser;
  pending: boolean;
  pendingProvider?: "google" | "apple";
}

export type { AuthUser };
