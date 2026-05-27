export type { SessionRecord, AuthUser } from "./types";

export {
  setClientSession,
  getClientSession,
  clearClientSession,
  subscribeToClientSession,
  assertBrowserSessionContext,
  type ClientSession,
} from "./session-cache";

export {
  loadCurrentUserAction,
  logoutAction,
  type CurrentUserResult,
  type LogoutResult,
} from "./server-actions";

/**
 * Server-only helpers (cookie read/write/clear) live in `./session.server`.
 * Importing them directly keeps them out of the browser bundle.
 */
