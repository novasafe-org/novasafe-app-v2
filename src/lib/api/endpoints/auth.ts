import { apiFetch } from "../http";

/**
 * Auth endpoints used by the authenticated app.
 *
 * The app project mostly cares about session validation + logout. Login,
 * signup, OAuth flows etc. live in novasafe-auth-v2.
 */

const PREFIX = "/api/v1/auth";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface ValidateSessionResponse {
  success: boolean;
  source?: string;
  user?: AuthUser;
  pendingNovaSafeEmailVerification?: boolean;
  pendingOtpProvider?: "google" | "apple";
  message?: string;
}

export const authApi = {
  validateSession(token: string) {
    return apiFetch<ValidateSessionResponse>(`${PREFIX}/validate-session`, {
      method: "GET",
      token,
    });
  },

  logout(token: string) {
    return apiFetch<{ success: boolean; message?: string }>(`${PREFIX}/logout`, {
      method: "POST",
      body: {},
      token,
    });
  },
};

export type AuthApi = typeof authApi;
