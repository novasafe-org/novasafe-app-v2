export type ItemType =
  | "password" | "apikey" | "card" | "identity" | "note"
  | "ssh" | "wifi" | "server" | "crypto" | "document" | "license" | "database";

export interface PasswordHistory { password: string; changedAt: number; }
export interface CustomField { label: string; value: string; secret: boolean; }

export interface VaultItem {
  id: string;
  type: ItemType;
  title: string;
  domain?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
  archived?: boolean;
  vault: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
  history: PasswordHistory[];
  otpSecret?: string;
  breached?: boolean;
  customFields?: CustomField[];
  // type-specific
  cardNumber?: string; cardHolder?: string; cardExpiry?: string; cardCvv?: string;
  identity?: { fullName: string; number: string; country: string; expiry?: string };
  sshKey?: string;
}

export interface Passkey {
  id: string; service: string; domain: string;
  device: string; platform: string;
  createdAt: number; lastUsedAt: number;
  synced: boolean; biometric: boolean;
}

export interface OtpAccount {
  id: string; issuer: string; account: string; secret: string; favorite: boolean; addedAt: number;
}

export interface VaultDocument {
  id: string; name: string; folder: string; size: number;
  kind: "pdf" | "image" | "doc" | "other";
  uploadedAt: number; shared: string[]; tags: string[]; versions: number;
}

export interface ShareInvite {
  id: string; itemTitle: string; sharedWith: string;
  role: "viewer" | "editor"; state: "pending" | "accepted" | "revoked";
  createdAt: number; expiresAt?: number;
}

export interface Device {
  id: string; name: string; platform: string; location: string;
  lastActive: number; trusted: boolean; current: boolean;
}

export interface Session { id: string; device: string; ip: string; location: string; startedAt: number; }
export interface ActivityEvent { id: string; kind: "login" | "item" | "share" | "security"; message: string; at: number; }
export interface Invoice { id: string; number: string; amount: number; currency: string; paidAt: number; status: "paid" | "pending"; }
