import { apiFetch } from "../http";

const PREFIX = "/api/v1/vault";

export interface VaultListEnvelope<T> {
  success: boolean;
  source?: string;
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  };
}

export interface VaultItemResponse<T> {
  success: boolean;
  source?: string;
  data: T;
}

export interface VaultDeleteResponse {
  success: boolean;
  source?: string;
  message?: string;
}

export interface CoreVaultItem {
  id: string;
  type?: string;
  category?: string;
  title?: string;
  username?: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
  updatedAt?: string | Date;
  createdAt?: string | Date;
  lastAccessedAt?: string | Date | null;
  password_versions?: Array<{ password?: string; changedAt?: string | Date; createdAt?: string | Date }>;
  custom_fields?: Array<{ label?: string; value?: string; secret?: boolean }>;
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  breached?: boolean;
}

export const vaultApi = {
  listItems(token: string, options: { page?: number; limit?: number } = {}) {
    return apiFetch<VaultListEnvelope<CoreVaultItem>>(`${PREFIX}/items`, {
      method: "GET",
      token,
      query: {
        page: options.page ?? 1,
        limit: options.limit ?? 100,
      },
    });
  },

  getItem(token: string, id: string, options: { revealSensitive?: boolean } = {}) {
    return apiFetch<VaultItemResponse<CoreVaultItem>>(`${PREFIX}/items/${id}`, {
      method: "GET",
      token,
      query: { revealSensitive: options.revealSensitive ? "true" : "false" },
    });
  },

  pullSync(token: string, since?: string) {
    return apiFetch<VaultListEnvelope<CoreVaultItem>>(`${PREFIX}/sync/pull`, {
      method: "GET",
      token,
      query: { since },
    });
  },

  createItem(token: string, payload: Record<string, unknown>) {
    return apiFetch<VaultItemResponse<CoreVaultItem>>(`${PREFIX}/items`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateItem(token: string, id: string, payload: Record<string, unknown>) {
    return apiFetch<VaultItemResponse<CoreVaultItem>>(`${PREFIX}/items/${id}`, {
      method: "PUT",
      token,
      body: payload,
    });
  },

  deleteItem(token: string, id: string) {
    return apiFetch<VaultDeleteResponse>(`${PREFIX}/items/${id}`, {
      method: "DELETE",
      token,
    });
  },
};

export type VaultApi = typeof vaultApi;
