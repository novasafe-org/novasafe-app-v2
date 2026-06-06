import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  ApiError,
  vaultApi,
  type CoreCustomField,
  type CorePasswordVersion,
  type CoreVaultItem,
  type CustomFieldPayload,
} from "@/lib/api";
import type { CustomField, ItemType, VaultItem } from "@/lib/vault-types";
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

function mapCoreCustomField(field: CoreCustomField): CustomField {
  return {
    id: field.id,
    name: field.field_label ?? "",
    value: field.field_value ?? "",
    isSensitive: Boolean(field.is_sensitive),
    type: field.field_type,
  };
}

function mapCorePasswordVersions(versions: CorePasswordVersion[] | undefined) {
  if (!Array.isArray(versions)) return [];
  return versions
    .filter((version) => Boolean(version.password))
    .map((version) => ({
      id: version.id,
      password: version.password ?? "",
      createdAt: toTs(version.created_at ?? version.updated_at),
      active: !version.is_expired,
    }));
}

export function mapCoreItem(item: CoreVaultItem): VaultItem {
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
    history: mapCorePasswordVersions(item.password_versions),
    customFields: Array.isArray(item.custom_fields)
      ? item.custom_fields.map(mapCoreCustomField)
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

async function refreshVaultItem(token: string, itemId: string): Promise<VaultItem> {
  const response = await vaultApi.getItem(token, itemId, { revealSensitive: true });
  return mapCoreItem(response.data);
}

const toApiFieldType = (field: CustomField): string => {
  if (field.type) return field.type;
  return field.isSensitive ? "PASSWORD" : "TEXT";
};

const toApiPayload = (field: CustomField): CustomFieldPayload => ({
  field_label: field.name.trim(),
  field_type: toApiFieldType(field),
  field_value: field.value,
  is_sensitive: field.isSensitive,
});

const fieldChanged = (previous: CustomField, next: CustomField): boolean =>
  previous.name.trim() !== next.name.trim() ||
  previous.value !== next.value ||
  previous.isSensitive !== next.isSensitive ||
  toApiFieldType(previous) !== toApiFieldType(next);

const isPersistedFieldId = (id: string, previous: CustomField[]): boolean =>
  previous.some((field) => field.id === id);

async function syncCustomFieldsInternal(
  token: string,
  itemId: string,
  previous: CustomField[],
  next: CustomField[],
): Promise<VaultItem> {
  const normalizedNext = next.filter((field) => field.name.trim());

  const removed = previous.filter(
    (field) => !normalizedNext.some((entry) => entry.id === field.id),
  );

  for (const field of removed) {
    await vaultApi.deleteCustomField(token, itemId, field.id);
  }

  for (const field of normalizedNext) {
    const payload = toApiPayload(field);
    if (!isPersistedFieldId(field.id, previous)) {
      await vaultApi.addCustomField(token, itemId, payload);
      continue;
    }
    const existing = previous.find((entry) => entry.id === field.id);
    if (existing && fieldChanged(existing, field)) {
      await vaultApi.updateCustomField(token, itemId, field.id, payload);
    }
  }

  return refreshVaultItem(token, itemId);
}

export const listVaultItemsAction = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: VaultItem[] }> => {
    const token = requireToken();
    const response = await vaultApi.pullSync(token);
    return { items: (response.data || []).map(mapCoreItem) };
  },
);

const getItemSchema = z.object({
  id: z.string().min(1),
  revealSensitive: z.boolean().optional(),
});

export const getVaultItemAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => getItemSchema.parse(input))
  .handler(async ({ data }): Promise<{ item: VaultItem }> => {
    const token = requireToken();
    const response = await vaultApi.getItem(token, data.id, {
      revealSensitive: data.revealSensitive ?? true,
    });
    return { item: mapCoreItem(response.data) };
  });

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

    if (data.password !== undefined) {
      return { item: await refreshVaultItem(token, data.id) };
    }

    return { item: mapCoreItem(response.data) };
  });

const customFieldInputSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  value: z.string(),
  isSensitive: z.boolean(),
  type: z.string().optional(),
});

const syncCustomFieldsSchema = z.object({
  itemId: z.string().min(1),
  previous: z.array(customFieldInputSchema),
  next: z.array(customFieldInputSchema),
});

export const syncCustomFieldsAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => syncCustomFieldsSchema.parse(input))
  .handler(async ({ data }): Promise<{ item: VaultItem }> => {
    const token = requireToken();
    const item = await syncCustomFieldsInternal(
      token,
      data.itemId,
      data.previous,
      data.next,
    );
    return { item };
  });

const deleteCustomFieldSchema = z.object({
  itemId: z.string().min(1),
  fieldId: z.string().min(1),
});

export const deleteCustomFieldAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deleteCustomFieldSchema.parse(input))
  .handler(async ({ data }): Promise<{ item: VaultItem }> => {
    const token = requireToken();
    await vaultApi.deleteCustomField(token, data.itemId, data.fieldId);
    return { item: await refreshVaultItem(token, data.itemId) };
  });

const deletePasswordVersionSchema = z.object({
  itemId: z.string().min(1),
  versionId: z.string().min(1),
});

export const deletePasswordVersionAction = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => deletePasswordVersionSchema.parse(input))
  .handler(async ({ data }): Promise<{ item: VaultItem }> => {
    const token = requireToken();
    const response = await vaultApi.deletePasswordVersion(token, data.itemId, data.versionId);
    return { item: mapCoreItem(response.data) };
  });

const createItemSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  username: z.string().optional(),
  password: z.string().optional(),
  url: z.string().optional(),
  notes: z.string().optional(),
  customFields: z.array(customFieldInputSchema).optional(),
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

    const created = mapCoreItem(response.data);
    const fields = data.customFields?.filter((field) => field.name.trim()) ?? [];
    if (fields.length === 0) {
      return { item: created };
    }

    const item = await syncCustomFieldsInternal(token, created.id, [], fields);
    return { item };
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
