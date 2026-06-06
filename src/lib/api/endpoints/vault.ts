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

export interface CoreCustomField {
  id: string;
  credential_id?: string;
  field_label?: string;
  field_type?: string;
  field_value?: string;
  is_sensitive?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

export interface CorePasswordVersion {
  id: string;
  credential_id?: string;
  password?: string;
  is_expired?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
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
  password_versions?: CorePasswordVersion[];
  custom_fields?: CoreCustomField[];
  cardNumber?: string;
  cardHolder?: string;
  cardExpiry?: string;
  cardCvv?: string;
  breached?: boolean;
}

export interface CustomFieldPayload {
  field_label: string;
  field_type: string;
  field_value: string;
  is_sensitive?: boolean;
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

  addCustomField(token: string, itemId: string, payload: CustomFieldPayload) {
    return apiFetch<VaultItemResponse<CoreVaultItem>>(`${PREFIX}/items/${itemId}/custom-fields`, {
      method: "POST",
      token,
      body: payload,
    });
  },

  updateCustomField(
    token: string,
    itemId: string,
    fieldId: string,
    payload: Partial<CustomFieldPayload>,
  ) {
    return apiFetch<VaultItemResponse<CoreVaultItem>>(
      `${PREFIX}/items/${itemId}/custom-fields/${fieldId}`,
      {
        method: "PUT",
        token,
        body: payload,
      },
    );
  },

  deleteCustomField(token: string, itemId: string, fieldId: string) {
    return apiFetch<VaultItemResponse<CoreVaultItem>>(
      `${PREFIX}/items/${itemId}/custom-fields/${fieldId}`,
      {
        method: "DELETE",
        token,
      },
    );
  },

  deletePasswordVersion(token: string, itemId: string, versionId: string) {
    return apiFetch<VaultItemResponse<CoreVaultItem>>(
      `${PREFIX}/items/${itemId}/password-versions/${versionId}`,
      {
        method: "DELETE",
        token,
      },
    );
  },
};

export type VaultApi = typeof vaultApi;
