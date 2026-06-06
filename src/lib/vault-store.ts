import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  VaultItem,
  ItemType,
  Passkey,
  OtpAccount,
  VaultDocument,
  ShareInvite,
  Device,
  Session,
  ActivityEvent,
  Invoice,
} from "./vault-types";
import {
  seedPasskeys,
  seedOtp,
  seedDocs,
  seedInvites,
  seedDevices,
  seedSessions,
  seedActivity,
  seedInvoices,
} from "./dummy-data";

export type Theme = "light" | "dark";
export type Density = "comfortable" | "compact";

interface State {
  items: VaultItem[];
  vaults: string[];
  passkeys: Passkey[];
  otps: OtpAccount[];
  documents: VaultDocument[];
  invites: ShareInvite[];
  devices: Device[];
  sessions: Session[];
  activity: ActivityEvent[];
  invoices: Invoice[];
  selectedId: string | null;
  theme: Theme;
  density: Density;
  notificationsEnabled: boolean;
  plan: "Free" | "Pro" | "Family";
}

interface Actions {
  replaceItems: (items: VaultItem[]) => void;
  upsertItem: (item: VaultItem) => void;
  setSelected: (id: string | null) => void;
  createItem: (partial: Partial<VaultItem> & { type: ItemType; title: string }) => string;
  updateItem: (id: string, patch: Partial<VaultItem>) => void;
  deleteItem: (id: string) => void;
  archiveItem: (id: string) => void;
  unarchiveItem: (id: string) => void;
  duplicateItem: (id: string) => void;
  toggleFavorite: (id: string) => void;
  moveItem: (id: string, vault: string) => void;
  setTags: (id: string, tags: string[]) => void;
  changePassword: (id: string, password: string) => void;
  touchOpened: (id: string) => void;
  createVault: (name: string) => void;

  addPasskey: (pk: Omit<Passkey, "id" | "createdAt" | "lastUsedAt">) => void;
  revokePasskey: (id: string) => void;

  addOtp: (otp: Omit<OtpAccount, "id" | "addedAt">) => void;
  removeOtp: (id: string) => void;
  toggleOtpFav: (id: string) => void;

  addDocument: (doc: Omit<VaultDocument, "id" | "uploadedAt">) => void;
  renameDocument: (id: string, name: string) => void;
  removeDocument: (id: string) => void;
  shareDocument: (id: string, email: string) => void;

  invite: (inv: Omit<ShareInvite, "id" | "createdAt" | "state">) => void;
  setInviteState: (id: string, state: ShareInvite["state"]) => void;

  trustDevice: (id: string, trusted: boolean) => void;
  removeDevice: (id: string) => void;
  endSession: (id: string) => void;

  setTheme: (t: Theme) => void;
  setDensity: (d: Density) => void;
  setNotifications: (v: boolean) => void;
  setPlan: (p: State["plan"]) => void;

  logEvent: (kind: ActivityEvent["kind"], message: string) => void;
}

const uid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;
const PERSIST_KEY = "novasafe-vault-v1";
const LAST_USER_KEY = "ns_last_user_id";

export const useVault = create<State & Actions>()(
  persist(
    (set, get) => ({
      items: [],
      vaults: ["Personal", "Work", "Family"],
      passkeys: seedPasskeys,
      otps: seedOtp,
      documents: seedDocs,
      invites: seedInvites,
      devices: seedDevices,
      sessions: seedSessions,
      activity: seedActivity,
      invoices: seedInvoices,
      selectedId: null,
      theme: "light",
      density: "comfortable",
      notificationsEnabled: true,
      plan: "Pro",

      replaceItems: (items) =>
        set((s) => ({
          items,
          selectedId: items.some((it) => it.id === s.selectedId) ? s.selectedId : (items[0]?.id ?? null),
        })),
      upsertItem: (item) =>
        set((s) => {
          const exists = s.items.some((it) => it.id === item.id);
          if (!exists) return { items: [item, ...s.items], selectedId: item.id };
          return {
            items: s.items.map((it) => (it.id === item.id ? item : it)),
          };
        }),

      setSelected: (id) => set({ selectedId: id }),

      createItem: (partial) => {
        const id = uid("itm");
        const item: VaultItem = {
          id,
          tags: [],
          favorite: false,
          vault: "Personal",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          lastOpenedAt: Date.now(),
          history: [],
          customFields: [],
          ...partial,
        };
        set((s) => ({ items: [item, ...s.items], selectedId: id }));
        get().logEvent("item", `Created ${item.title}`);
        return id;
      },
      updateItem: (id, patch) =>
        set((s) => ({
          items: s.items.map((it) =>
            it.id === id ? { ...it, ...patch, updatedAt: Date.now() } : it,
          ),
        })),
      deleteItem: (id) => {
        const t = get().items.find((i) => i.id === id)?.title;
        set((s) => ({
          items: s.items.filter((i) => i.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        }));
        if (t) get().logEvent("item", `Deleted ${t}`);
      },
      archiveItem: (id) => get().updateItem(id, { archived: true }),
      unarchiveItem: (id) => get().updateItem(id, { archived: false }),
      duplicateItem: (id) => {
        const it = get().items.find((i) => i.id === id);
        if (!it) return;
        const copy: VaultItem = {
          ...it,
          id: uid("itm"),
          title: `${it.title} (copy)`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((s) => ({ items: [copy, ...s.items], selectedId: copy.id }));
      },
      toggleFavorite: (id) =>
        set((s) => ({
          items: s.items.map((it) => (it.id === id ? { ...it, favorite: !it.favorite } : it)),
        })),
      moveItem: (id, vault) => get().updateItem(id, { vault }),
      setTags: (id, tags) => get().updateItem(id, { tags }),
      changePassword: (id, password) => {
        const it = get().items.find((i) => i.id === id);
        if (!it) return;
        const history = it.password
          ? [
              {
                id: `local-${Date.now()}`,
                password: it.password,
                createdAt: Date.now(),
                active: false,
              },
              ...it.history,
            ].slice(0, 10)
          : it.history;
        get().updateItem(id, { password, history });
      },
      touchOpened: (id) => get().updateItem(id, { lastOpenedAt: Date.now() }),
      createVault: (name) =>
        set((s) => (s.vaults.includes(name) ? s : { vaults: [...s.vaults, name] })),

      addPasskey: (pk) =>
        set((s) => ({
          passkeys: [
            { ...pk, id: uid("pk"), createdAt: Date.now(), lastUsedAt: Date.now() },
            ...s.passkeys,
          ],
        })),
      revokePasskey: (id) => set((s) => ({ passkeys: s.passkeys.filter((p) => p.id !== id) })),

      addOtp: (o) =>
        set((s) => ({ otps: [{ ...o, id: uid("otp"), addedAt: Date.now() }, ...s.otps] })),
      removeOtp: (id) => set((s) => ({ otps: s.otps.filter((o) => o.id !== id) })),
      toggleOtpFav: (id) =>
        set((s) => ({
          otps: s.otps.map((o) => (o.id === id ? { ...o, favorite: !o.favorite } : o)),
        })),

      addDocument: (d) =>
        set((s) => ({
          documents: [{ ...d, id: uid("doc"), uploadedAt: Date.now() }, ...s.documents],
        })),
      renameDocument: (id, name) =>
        set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, name } : d)) })),
      removeDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),
      shareDocument: (id, email) =>
        set((s) => ({
          documents: s.documents.map((d) =>
            d.id === id ? { ...d, shared: [...d.shared, email] } : d,
          ),
        })),

      invite: (inv) =>
        set((s) => ({
          invites: [
            { ...inv, id: uid("sh"), createdAt: Date.now(), state: "pending" },
            ...s.invites,
          ],
        })),
      setInviteState: (id, state) =>
        set((s) => ({ invites: s.invites.map((i) => (i.id === id ? { ...i, state } : i)) })),

      trustDevice: (id, trusted) =>
        set((s) => ({ devices: s.devices.map((d) => (d.id === id ? { ...d, trusted } : d)) })),
      removeDevice: (id) => set((s) => ({ devices: s.devices.filter((d) => d.id !== id) })),
      endSession: (id) => set((s) => ({ sessions: s.sessions.filter((x) => x.id !== id) })),

      setTheme: (t) => {
        set({ theme: t });
        if (typeof document !== "undefined")
          document.documentElement.classList.toggle("dark", t === "dark");
      },
      setDensity: (d) => set({ density: d }),
      setNotifications: (v) => set({ notificationsEnabled: v }),
      setPlan: (p) => set({ plan: p }),

      logEvent: (kind, message) =>
        set((s) => ({
          activity: [{ id: uid("ev"), kind, message, at: Date.now() }, ...s.activity].slice(0, 50),
        })),
    }),
    {
      name: "novasafe-vault-v1",
      partialize: (s) => ({
        items: s.items,
        vaults: s.vaults,
        passkeys: s.passkeys,
        otps: s.otps,
        documents: s.documents,
        invites: s.invites,
        devices: s.devices,
        sessions: s.sessions,
        activity: s.activity,
        invoices: s.invoices,
        theme: s.theme,
        density: s.density,
        notificationsEnabled: s.notificationsEnabled,
        plan: s.plan,
      }),
    },
  ),
);

/**
 * Clear account-scoped vault data so user A's cached records never flash for user B.
 */
export function clearVaultSessionData(): void {
  const current = useVault.getState();
  useVault.setState({
    items: [],
    selectedId: null,
    passkeys: [],
    otps: [],
    documents: [],
    invites: [],
    devices: [],
    sessions: [],
    activity: [],
    invoices: [],
    vaults: ["Personal", "Work", "Family"],
    plan: "Free",
    theme: current.theme,
    density: current.density,
    notificationsEnabled: current.notificationsEnabled,
  });

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(PERSIST_KEY);
    window.localStorage.removeItem(LAST_USER_KEY);
  }
}

/**
 * Ensure persisted vault data is bound to the currently authenticated user.
 */
export function syncVaultScopeForUser(userId: string): void {
  if (typeof window === "undefined") return;
  const previous = window.localStorage.getItem(LAST_USER_KEY);
  if (previous && previous !== userId) {
    clearVaultSessionData();
  }
  window.localStorage.setItem(LAST_USER_KEY, userId);
}
