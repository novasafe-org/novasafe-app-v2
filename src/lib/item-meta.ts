import type { ItemType } from "@/lib/vault-types";
import {
  KeyRound, Code2, CreditCard, IdCard, FileText, TerminalSquare,
  Wifi, Server, Coins, Files, BadgeCheck, Database, type LucideIcon,
} from "lucide-react";

export const TYPE_META: Record<ItemType, { label: string; icon: LucideIcon; tint: string }> = {
  password:  { label: "Password",       icon: KeyRound,       tint: "bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] text-brand" },
  apikey:    { label: "API Key",        icon: Code2,          tint: "bg-[color-mix(in_oklab,oklch(0.72_0.16_55)_14%,transparent)] text-[oklch(0.55_0.16_55)]" },
  card:      { label: "Bank Card",      icon: CreditCard,     tint: "bg-[color-mix(in_oklab,oklch(0.65_0.18_300)_12%,transparent)] text-[oklch(0.5_0.18_300)]" },
  identity:  { label: "Identity",       icon: IdCard,         tint: "bg-[color-mix(in_oklab,oklch(0.7_0.15_180)_14%,transparent)] text-[oklch(0.45_0.14_190)]" },
  note:      { label: "Secure Note",    icon: FileText,       tint: "bg-[color-mix(in_oklab,oklch(0.7_0.13_240)_12%,transparent)] text-[oklch(0.46_0.12_240)]" },
  ssh:       { label: "SSH Key",        icon: TerminalSquare, tint: "bg-[color-mix(in_oklab,oklch(0.7_0.14_140)_12%,transparent)] text-[oklch(0.45_0.13_150)]" },
  wifi:      { label: "WiFi",           icon: Wifi,           tint: "bg-[color-mix(in_oklab,oklch(0.7_0.14_220)_12%,transparent)] text-[oklch(0.45_0.14_220)]" },
  server:    { label: "Server",         icon: Server,         tint: "bg-[color-mix(in_oklab,oklch(0.65_0.11_265)_14%,transparent)] text-[oklch(0.4_0.12_265)]" },
  crypto:    { label: "Crypto Wallet",  icon: Coins,          tint: "bg-[color-mix(in_oklab,oklch(0.78_0.16_85)_14%,transparent)] text-[oklch(0.5_0.15_75)]" },
  document:  { label: "Document",       icon: Files,          tint: "bg-[color-mix(in_oklab,oklch(0.7_0.12_200)_12%,transparent)] text-[oklch(0.45_0.12_200)]" },
  license:   { label: "License",        icon: BadgeCheck,     tint: "bg-[color-mix(in_oklab,oklch(0.7_0.14_160)_12%,transparent)] text-[oklch(0.42_0.13_160)]" },
  database:  { label: "Database",       icon: Database,       tint: "bg-[color-mix(in_oklab,oklch(0.7_0.13_30)_12%,transparent)] text-[oklch(0.45_0.13_30)]" },
};

export const TYPE_LIST = Object.keys(TYPE_META) as ItemType[];
