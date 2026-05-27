import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { ApiError, vaultApi, type CoreVaultItem } from "@/lib/api";
import type { ItemType, VaultItem } from "@/lib/vault-types";
import { readSessionToken } from "@/lib/auth/session.server";

function toTs(value: string | Date | null | undefined): number {
  if (!value) return Date.now();
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function toItemType(raw: string | undefined): ItemType {
  const value = (raw || "password").toLowerCase();
  if (value === "login") return "password";
  const valid: ItemType[] = [
    "password",
    "apikey",
    "card",
    "identity",
    "note",
    "ssh",
    "wifi",
    "server",
    "crypto",
    "document",
    "license",
    "database",
  ];
  return valid.includes(value as ItemType) ? (value as ItemType) : "password";
}

function mapCoreItem(item: CoreVaultItem): VaultItem {
  return {
    id: item.id,
    type: toItemType(item.type || item.category),
    title: item.title || "Untitled",
    username: item.username ?? "",
    password: item.password ?? "",
    url: item.url ?? "",
    domain: (() => {
      try {
        return item.url ? new URL(item.url).hostname : "";
      } catch {
        return "";
      }
    })(),
    notes: item.notes ?? "",
    tags: item.tags ?? [],
    favorite: Boolean(item.isFavorite),
    archived: false,
    vault: "Personal",
    createdAt: toTs(item.createdAt),
    updatedAt: toTs(item.updatedAt),
    lastOpenedAt: toTs(item.lastAccessedAt),
    history: Array.isArray(item.password_versions)
      ? item.password_versions
          .map((entry) => ({
            password: entry.password || "",
            changedAt: toTs(entry.changedAt || entry.createdAt),
          }))
          .filter((entry) => entry.password.length > 0)
      : [],
    customFields: Array.isArray(item.custom_fields)
      ? item.custom_fields.map((field) => ({
          label: field.label || "",
          value: field.value || "",
          secret: Boolean(field.secret),
        }))
      : [],
    cardNumber: item.cardNumber,
    cardHolder: item.cardHolder,
    cardExpiry: item.cardExpiry,
    cardCvv: item.cardCvv,
    breached: item.breached,
  };
}

function requireToken(): string {
  const token = readSessionToken();
  if (!token) throw new Error("Missing session. Please sign in again.");
  return token;
}

export const listVaultItemsAction = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: VaultItem[] }> => {
    const token = requireToken();
    const response = await vaultApi.pullSync(token);
    return { items: (response.data || []).map(mapCoreItem) };
  },
);

const patchItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvv: z.string().optional(),
});

export const patchVaultItemAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => patchItemSchema.parse(input))
  .handler(async ({ data }): Promise<{ item: VaultItem }> => {
    const token = requireToken();
    const payload: Record<string, unknown> = {};
    if (data.title !== undefined) payload.title = data.title;
    if (data.username !== undefined) payload.username = data.username;
    if (data.password !== undefined) payload.password = data.password;
    if (data.url !== undefined) payload.url = data.url;
    if (data.notes !== undefined) payload.notes = data.notes;
    if (data.tags !== undefined) payload.tags = data.tags;
    if (data.favorite !== undefined) payload.isFavorite = data.favorite;
    if (data.archived !== undefined) payload.archived = data.archived;
    if (data.cardNumber !== undefined) payload.cardNumber = data.cardNumber;
    if (data.cardHolder !== undefined) payload.cardHolder = data.cardHolder;
    if (data.cardExpiry !== undefined) payload.cardExpiry = data.cardExpiry;
    if (data.cardCvv !== undefined) payload.cardCvv = data.cardCvv;

    const response = await vaultApi.updateItem(token, data.id, payload);
    return { item: mapCoreItem(response.data) };
  });

const createItemSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
});

export const createVaultItemAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => createItemSchema.parse(input))
  .handler(async ({ data }): Promise<{ item: VaultItem }> => {
    const token = requireToken();
    const category = data.type === "password" ? "login" : data.type;
    const response = await vaultApi.createItem(token, {
      title: data.title,
      category,
      type: category,
      username: data.username,
      password: data.password,
      url: data.url,
      notes: data.notes,
      tags: [],
      isFavorite: false,
    });
    return { item: mapCoreItem(response.data) };
  });

const deleteItemSchema = z.object({ id: z.string().min(1) });

export const deleteVaultItemAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteItemSchema.parse(input))
  .handler(async ({ data }): Promise<{ status: "ok" }> => {
    const token = requireToken();
    await vaultApi.deleteItem(token, data.id);
    return { status: "ok" };
  });

export function toActionMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "Request failed. Try again.";
}
