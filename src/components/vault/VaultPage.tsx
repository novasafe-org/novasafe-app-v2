import { useEffect, useMemo, useRef, useState } from "react";
import {
  Star,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  Archive,
  Trash2,
  RefreshCw,
  Loader2,
  Files,
  Globe,
  Pencil,
  Check,
} from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { useUI } from "@/lib/ui-store";
import { TYPE_META } from "@/lib/item-meta";
import { generatePassword, maskValue, isMaskPlaceholder } from "@/lib/password";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { VaultItem } from "@/lib/vault-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listVaultItemsAction,
  patchVaultItemAction,
  deleteVaultItemAction,
  getVaultItemAction,
  deletePasswordVersionAction,
  deleteCustomFieldAction,
  syncCustomFieldsAction,
  toActionMessage,
} from "@/lib/vault/server-actions";
import {
  CustomFieldsEditor,
  CustomFieldsSection,
  PasswordHistorySection,
} from "@/components/vault/item-sections";
import type { CustomField } from "@/lib/vault-types";
import { ItemFavicon } from "@/components/vault/ItemFavicon";
import {
  formatRelativeAgo,
  formatVaultDate,
  groupVaultItemsByMonth,
} from "@/lib/vault-dates";

const VAULT_ITEMS_QUERY_KEY = ["vault", "items"] as const;

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  const d = Math.floor(s / 86400);
  if (d < 30) return `${d}d`;
  if (d < 365) return `${Math.floor(d / 30)}mo`;
  return `${Math.floor(d / 365)}y`;
}

const copy = (v: string | undefined, label: string) => {
  if (!v) return;
  navigator.clipboard.writeText(v).then(() => toast.success(`${label} copied`));
};

export function VaultPage({ filter }: { filter?: (it: VaultItem) => boolean }) {
  const items = useVault((s) => s.items);
  const selectedId = useVault((s) => s.selectedId);
  const setSelected = useVault((s) => s.setSelected);
  const replaceItems = useVault((s) => s.replaceItems);
  const upsertItem = useVault((s) => s.upsertItem);
  const deleteLocalItem = useVault((s) => s.deleteItem);
  const hydratedRef = useRef(false);
  const queryClient = useQueryClient();
  const query = useUI((s) => s.query);

  const itemsQuery = useQuery({
    queryKey: VAULT_ITEMS_QUERY_KEY,
    queryFn: () => listVaultItemsAction(),
    staleTime: 60_000,
  });

  const patchMutation = useMutation({
    mutationFn: (data: { id: string; patch: Record<string, unknown> }) =>
      patchVaultItemAction({ data: { id: data.id, ...data.patch } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VAULT_ITEMS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVaultItemAction({ data: { id } }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VAULT_ITEMS_QUERY_KEY });
    },
  });

  useEffect(() => {
    if (!itemsQuery.data?.items) return;
    if (!hydratedRef.current) hydratedRef.current = true;
    replaceItems(itemsQuery.data.items);
  }, [itemsQuery.data, replaceItems]);

  useEffect(() => {
    if (!itemsQuery.error) return;
    console.error("[VaultPage] failed loading items", itemsQuery.error);
    toast.error("Could not load vault items from server.");
  }, [itemsQuery.error]);

  const list = useMemo(() => {
    const base = items.filter((i) => (filter ? filter(i) : !i.archived));
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.username?.toLowerCase().includes(q) ||
        i.domain?.toLowerCase().includes(q) ||
        i.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [items, query, filter]);

  const selected = selectedId ? (list.find((i) => i.id === selectedId) ?? null) : null;
  const loadingInitialData = !itemsQuery.data && itemsQuery.isFetching;

  if (loadingInitialData) {
    return <VaultLoadingSkeleton />;
  }

  return (
    <div className="h-full min-h-0 flex min-w-0">
      <ItemList
        items={list}
        selectedId={selectedId}
        onSelect={(id) => setSelected(id)}
        onToggleFavorite={async (item) => {
          const next = !item.favorite;
          upsertItem({ ...item, favorite: next });
          try {
            const result = await patchMutation.mutateAsync({ id: item.id, patch: { favorite: next } });
            upsertItem(result.item);
          } catch (err) {
            upsertItem(item);
            toast.error(toActionMessage(err));
          }
        }}
      />
      <div className="flex-1 min-w-0 min-h-0 border-l border-hairline bg-surface/40 flex flex-col">
        {selected ? (
          <Inspector
            item={selected}
            onUpsert={upsertItem}
            onDelete={deleteLocalItem}
            onPatch={async (id, patch) => patchMutation.mutateAsync({ id, patch })}
            onDeleteRemote={async (id) => deleteMutation.mutateAsync(id)}
          />
        ) : (
          <EmptyInspector />
        )}
      </div>
    </div>
  );
}

function VaultLoadingSkeleton() {
  return (
    <div className="h-full min-h-0 flex min-w-0 animate-pulse">
      <div className="w-full md:w-[360px] shrink-0 flex flex-col min-h-0">
        <div className="px-4 py-3">
          <div className="h-4 w-20 rounded bg-muted/70" />
          <div className="h-3 w-14 rounded bg-muted/60 mt-2" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-hairline p-3 bg-surface/70">
              <div className="flex items-center gap-3">
                <div className="size-7 rounded-full bg-muted/70 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="h-3.5 w-2/3 rounded bg-muted/70" />
                  <div className="h-3 w-1/2 rounded bg-muted/60 mt-2" />
                </div>
                <div className="h-3 w-8 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0 min-h-0 border-l border-hairline bg-surface/40 flex flex-col">
        <div className="shrink-0 px-4 md:px-6 lg:px-[10%] xl:px-[18%] pt-6 pb-4 border-b border-hairline">
          <div className="flex items-start gap-4">
            <div className="size-11 rounded-full bg-muted/70 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="h-6 w-48 rounded bg-muted/70" />
              <div className="h-3.5 w-64 rounded bg-muted/60 mt-3" />
            </div>
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-2xl px-4 md:px-6 lg:px-8 xl:px-0 py-6 space-y-4 lg:max-w-xl xl:max-w-2xl">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i}>
                <div className="h-3 w-24 rounded bg-muted/60 mb-2" />
                <div className="h-10 rounded-xl bg-muted/70" />
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 px-4 md:px-6 lg:px-[10%] xl:px-[18%] py-3 border-t border-hairline flex justify-between">
          <div className="h-3.5 w-28 rounded bg-muted/60" />
          <div className="flex gap-2">
            <div className="h-9 w-20 rounded-lg bg-muted/70" />
            <div className="h-9 w-20 rounded-lg bg-muted/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ItemList({
  items,
  selectedId,
  onSelect,
  onToggleFavorite,
}: {
  items: VaultItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (item: VaultItem) => void;
}) {
  const monthGroups = groupVaultItemsByMonth(items);

  return (
    <div className="w-full md:w-[360px] shrink-0 flex flex-col min-h-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold">All items</div>
          <div className="text-xs text-ink-muted">
            {items.length} {items.length === 1 ? "item" : "items"}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 no-scrollbar">
        {items.length === 0 && (
          <div className="text-center py-12 text-sm text-ink-muted">No items match</div>
        )}
        <ul className="space-y-3">
          {monthGroups.map((group) => (
            <li key={group.key}>
              <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                {group.label}
              </div>
              <ul className="space-y-1">
                {group.items.map((it) => {
                  const active = it.id === selectedId;
                  return (
                    <li key={it.id}>
                      <button
                        onClick={() => onSelect(it.id)}
                        className={cn(
                          "w-full text-left flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition relative",
                          active ? "bg-accent" : "hover:bg-muted/70",
                        )}
                      >
                        {active && (
                          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-brand" />
                        )}
                        <ItemFavicon item={it} size={28} />
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="text-sm font-medium truncate">{it.title}</span>
                            {it.breached && (
                              <span
                                className="size-1.5 rounded-full bg-destructive"
                                title="Breach detected"
                              />
                            )}
                          </span>
                          <span className="text-xs text-ink-muted truncate block">
                            {it.username || it.domain || it.vault}
                          </span>
                        </span>
                        <span className="flex items-center gap-2 text-[11px] text-ink-faint">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(it);
                            }}
                            className="hover:text-warning"
                            aria-label="Favorite"
                          >
                            <Star
                              className={cn(
                                "size-3.5",
                                it.favorite ? "fill-warning text-warning" : "",
                              )}
                            />
                          </button>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EmptyInspector() {
  return (
    <div className="h-full grid place-items-center text-center p-10 text-ink-muted">
      <div>
        <div className="size-16 mx-auto rounded-2xl brand-gradient-soft grid place-items-center mb-4">
          <Files className="size-7 text-brand" />
        </div>
        <div className="text-sm font-medium text-ink">Select an item</div>
        <div className="text-xs mt-1">Pick anything from the list to view its details</div>
      </div>
    </div>
  );
}

type EditDraft = {
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
};

function snapshotFromItem(item: VaultItem): EditDraft {
  return {
    title: item.title,
    username: item.username ?? "",
    password: item.password ?? "",
    url: item.url ?? "",
    notes: item.notes ?? "",
  };
}

function Inspector({
  item,
  onUpsert,
  onDelete,
  onPatch,
  onDeleteRemote,
}: {
  item: VaultItem;
  onUpsert: (item: VaultItem) => void;
  onDelete: (id: string) => void;
  onPatch: (id: string, patch: Record<string, unknown>) => Promise<{ item: VaultItem }>;
  onDeleteRemote: (id: string) => Promise<{ status: "ok" }>;
}) {
  const [editing, setEditing] = useState(false);
  const [revealPassword, setRevealPassword] = useState(false);
  const [customFieldsDraft, setCustomFieldsDraft] = useState<CustomField[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const editSnapshotRef = useRef<EditDraft | null>(null);
  const committingRef = useRef(false);
  const displayLastOpenedRef = useRef(item.lastOpenedAt);
  const [displayLastOpenedAt, setDisplayLastOpenedAt] = useState(item.lastOpenedAt);
  const M = TYPE_META[item.type];

  useEffect(() => {
    setEditing(false);
    setSaving(false);
    setRevealPassword(false);
    setCustomFieldsDraft([]);
    setEditDraft(null);
    editSnapshotRef.current = null;
    displayLastOpenedRef.current = item.lastOpenedAt;
    setDisplayLastOpenedAt(item.lastOpenedAt);
  }, [item.id]);

  useEffect(() => {
    let cancelled = false;
    setLoadingDetails(true);
    getVaultItemAction({ data: { id: item.id, revealSensitive: true } })
      .then((result) => {
        if (!cancelled) {
          const pinnedLastOpened = displayLastOpenedRef.current;
          onUpsert({ ...result.item, lastOpenedAt: pinnedLastOpened });
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("[Inspector] failed loading item details", err);
      })
      .finally(() => {
        if (!cancelled) setLoadingDetails(false);
      });
    return () => {
      cancelled = true;
    };
  }, [item.id, onUpsert]);

  useEffect(() => {
    if (editing) {
      setCustomFieldsDraft(item.customFields.map((field) => ({ ...field })));
    }
  }, [editing, item.customFields]);

  function beginEdit() {
    const snapshot = snapshotFromItem(item);
    editSnapshotRef.current = snapshot;
    setEditDraft(snapshot);
    setEditing(true);
  }

  function updateDraft<K extends keyof EditDraft>(key: K, value: EditDraft[K]) {
    setEditDraft((draft) => (draft ? { ...draft, [key]: value } : draft));
  }

  function buildPatchFromDraft(
    draft: EditDraft,
    snapshot: EditDraft,
  ): Record<string, unknown> | null {
    const patch: Record<string, unknown> = {};
    if (draft.title !== snapshot.title) patch.title = draft.title;
    if (draft.username !== snapshot.username) patch.username = draft.username;
    if (draft.url !== snapshot.url) patch.url = draft.url;
    if (draft.notes !== snapshot.notes) patch.notes = draft.notes;
    if (
      draft.password !== snapshot.password &&
      !isMaskPlaceholder(draft.password)
    ) {
      patch.password = draft.password;
    }
    return Object.keys(patch).length > 0 ? patch : null;
  }

  async function applyPatch(patch: Record<string, unknown>) {
    const result = await onPatch(item.id, patch);
    onUpsert(result.item);
    if (editSnapshotRef.current) {
      const next = { ...editSnapshotRef.current };
      if (patch.title !== undefined) next.title = String(patch.title);
      if (patch.username !== undefined) next.username = String(patch.username);
      if (patch.url !== undefined) next.url = String(patch.url);
      if (patch.notes !== undefined) next.notes = String(patch.notes);
      if (patch.password !== undefined) {
        next.password = result.item.password ?? String(patch.password);
      }
      editSnapshotRef.current = next;
      setEditDraft(next);
    }
    return result;
  }

  async function commitFieldOnBlur(field: keyof EditDraft, value: string) {
    if (!editing || committingRef.current) return;
    const snapshot = editSnapshotRef.current;
    if (!snapshot || value === snapshot[field]) return;
    if (field === "password" && isMaskPlaceholder(value)) return;

    const patch: Record<string, unknown> = { [field]: value };
    committingRef.current = true;
    try {
      await applyPatch(patch);
    } catch (err) {
      toast.error(toActionMessage(err));
    } finally {
      committingRef.current = false;
    }
  }

  async function flushPendingDraft() {
    const snapshot = editSnapshotRef.current;
    const draft = editDraft;
    if (!snapshot || !draft) return;
    const patch = buildPatchFromDraft(draft, snapshot);
    if (!patch) return;
    await applyPatch(patch);
  }

  async function commitPatch(patch: Record<string, unknown>) {
    if (committingRef.current) return;
    committingRef.current = true;
    try {
      await applyPatch(patch);
    } catch (err) {
      toast.error(toActionMessage(err));
    } finally {
      committingRef.current = false;
    }
  }

  async function toggleEditing() {
    if (saving || committingRef.current) return;
    if (editing) {
      setSaving(true);
      try {
        await flushPendingDraft();
        const result = await syncCustomFieldsAction({
          data: {
            itemId: item.id,
            previous: item.customFields,
            next: customFieldsDraft,
          },
        });
        onUpsert(result.item);
        setEditing(false);
        setEditDraft(null);
        editSnapshotRef.current = null;
      } catch (err) {
        toast.error(toActionMessage(err));
      } finally {
        setSaving(false);
      }
      return;
    }
    if (loadingDetails) {
      toast.message("Loading secure fields…");
      return;
    }
    beginEdit();
  }

  async function handleDeletePasswordVersion(versionId: string) {
    try {
      const result = await deletePasswordVersionAction({
        data: { itemId: item.id, versionId },
      });
      onUpsert(result.item);
      toast.success("Password version deleted");
    } catch (err) {
      toast.error(toActionMessage(err));
    }
  }

  async function handleDeleteCustomField(fieldId: string) {
    try {
      const result = await deleteCustomFieldAction({
        data: { itemId: item.id, fieldId },
      });
      onUpsert(result.item);
      toast.success("Custom field deleted");
    } catch (err) {
      toast.error(toActionMessage(err));
    }
  }

  const draft = editDraft;

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="shrink-0 px-4 md:px-6 pt-6 pb-4 flex items-start gap-4 border-b border-hairline">
        <ItemFavicon item={item} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {editing && draft ? (
              <input
                value={draft.title}
                onChange={(e) => updateDraft("title", e.target.value)}
                onBlur={(e) => void commitFieldOnBlur("title", e.target.value)}
                className="text-xl font-semibold bg-transparent outline-none flex-1 min-w-0 field border-0 shadow-none px-0 h-auto"
              />
            ) : (
              <h1 className="text-xl font-semibold flex-1 min-w-0 truncate">{item.title}</h1>
            )}
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => void toggleEditing()}
              disabled={saving || (loadingDetails && !editing)}
              className={cn(
                "size-9 rounded-lg grid place-items-center transition",
                editing ? "bg-accent text-brand-ink" : "hover:bg-muted",
                (saving || (loadingDetails && !editing)) && "opacity-80 cursor-wait",
              )}
              title={
                saving
                  ? "Saving…"
                  : editing
                    ? "Save changes"
                    : loadingDetails
                      ? "Loading secure fields…"
                      : "Edit item"
              }
              aria-pressed={editing}
              aria-busy={saving}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editing ? (
                <Check className="size-4" />
              ) : (
                <Pencil className="size-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !item.favorite;
                onUpsert({ ...item, favorite: next });
                void commitPatch({ favorite: next });
              }}
              className="size-9 rounded-lg hover:bg-muted grid place-items-center"
            >
              <Star className={cn("size-4", item.favorite && "fill-warning text-warning")} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-ink-muted">
            <span className="px-2 py-0.5 rounded-md hairline">{M.label}</span>
            <span>·</span>
            <span>{item.vault}</span>
            <span>·</span>
            <span>Updated {timeAgo(item.updatedAt)} ago</span>
            {item.tags.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-accent text-brand-ink">
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
        <div className="mx-auto w-full px-4 md:px-6 py-6 space-y-5 lg:px-[12%] xl:px-[18%] 2xl:px-[22%]">
          {item.username !== undefined &&
            (editing && draft ? (
              <Row label="Username">
                <input
                  value={draft.username}
                  onChange={(e) => updateDraft("username", e.target.value)}
                  onBlur={(e) => void commitFieldOnBlur("username", e.target.value)}
                  className="field"
                />
              </Row>
            ) : (
              <ViewField label="Username" value={item.username ?? ""} />
            ))}

          {item.password !== undefined &&
            (editing && draft ? (
              <>
                <Row label="Password">
                  <input
                    value={draft.password}
                    onChange={(e) => updateDraft("password", e.target.value)}
                    onBlur={(e) => void commitFieldOnBlur("password", e.target.value)}
                    className="field mono"
                  />
                  <ActionBtn
                    onClick={() => {
                      const generated = generatePassword({ length: 20 });
                      updateDraft("password", generated);
                      void commitFieldOnBlur("password", generated);
                      toast.success("New password generated");
                    }}
                  >
                    <RefreshCw className="size-3.5" />
                  </ActionBtn>
                </Row>
              </>
            ) : (
              <ViewField
                label="Password"
                value={item.password ?? ""}
                secret
                revealed={revealPassword}
                onToggleReveal={() => setRevealPassword((v) => !v)}
              />
            ))}

          {item.url &&
            (editing && draft ? (
              <Row label="Website">
                <input
                  value={draft.url}
                  onChange={(e) => updateDraft("url", e.target.value)}
                  onBlur={(e) => void commitFieldOnBlur("url", e.target.value)}
                  className="field"
                />
                <ActionBtn onClick={() => window.open(draft.url || item.url, "_blank")}>
                  <ExternalLink className="size-3.5" />
                </ActionBtn>
              </Row>
            ) : (
              <ViewField
                label="Website"
                value={item.url.replace(/^https?:\/\//, "")}
                onCopy={() => copy(item.url, "Website")}
              />
            ))}

          {item.type === "card" && !editing && (
            <>
              <ViewField label="Card number" value={item.cardNumber ?? ""} secret mono />
              <div className="grid grid-cols-3 gap-3">
                <ViewField label="Holder" value={item.cardHolder ?? ""} compact />
                <ViewField label="Expiry" value={item.cardExpiry ?? ""} compact mono />
                <ViewField label="CVV" value={item.cardCvv ?? ""} secret compact mono />
              </div>
            </>
          )}

          {item.identity && !editing && (
            <div className="grid grid-cols-2 gap-3">
              <ViewField label="Full name" value={item.identity.fullName} compact />
              <ViewField label="Number" value={item.identity.number} compact mono />
              <ViewField label="Country" value={item.identity.country} compact />
              <ViewField label="Expiry" value={item.identity.expiry ?? ""} compact />
            </div>
          )}

          {editing && draft ? (
            <Field label="Notes">
              <textarea
                value={draft.notes}
                onChange={(e) => updateDraft("notes", e.target.value)}
                onBlur={(e) => void commitFieldOnBlur("notes", e.target.value)}
                rows={3}
                className="field resize-none py-2.5"
                placeholder="Add notes…"
              />
            </Field>
          ) : (
            <ViewField label="Notes" value={item.notes?.trim() ? item.notes : "Add notes…"} mutedEmpty />
          )}

          {item.url && !editing && (
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <Globe className="size-3.5 shrink-0" />
              <span className="truncate">{item.url.replace(/^https?:\/\//, "")}</span>
            </div>
          )}

          {editing ? (
            <CustomFieldsEditor fields={customFieldsDraft} onChange={setCustomFieldsDraft} />
          ) : (
            <CustomFieldsSection
              fields={item.customFields}
              onAddField={() => void toggleEditing()}
              onDeleteField={handleDeleteCustomField}
            />
          )}

          {item.password !== undefined && (
            <PasswordHistorySection
              entries={item.history}
              onDeleteEntry={handleDeletePasswordVersion}
            />
          )}

          {loadingDetails && item.history.length === 0 && item.customFields.length === 0 && (
            <p className="text-xs text-ink-muted">Loading secure fields…</p>
          )}

          <Section title="Metadata">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Meta k="Created" v={formatVaultDate(item.createdAt)} />
              <Meta k="Modified" v={formatVaultDate(item.updatedAt)} />
              <Meta k="Last opened" v={formatRelativeAgo(displayLastOpenedAt)} />
              <Meta k="Vault" v={item.vault} />
            </div>
          </Section>
        </div>
      </div>

      <div className="shrink-0 px-4 md:px-6 py-3 border-t border-hairline flex items-center justify-between bg-surface/60">
        <div className="text-xs text-ink-faint">End-to-end encrypted</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onUpsert({ ...item, archived: true });
              void commitPatch({ archived: true });
            }}
            className="h-9 px-3 rounded-lg hairline text-sm inline-flex items-center gap-1.5"
          >
            <Archive className="size-3.5" />
            Archive
          </button>
          <button
            type="button"
            onClick={() => {
              onDeleteRemote(item.id)
                .then(() => {
                  onDelete(item.id);
                  toast.success("Deleted");
                })
                .catch((err) => toast.error(toActionMessage(err)));
            }}
            className="h-9 px-3 rounded-lg text-sm inline-flex items-center gap-1.5 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      <style>{`.field{height:38px;padding:0 12px;border-radius:10px;border:1px solid var(--hairline);background:var(--surface);font-size:13.5px;width:100%;outline:none}.field:focus{box-shadow:0 0 0 3px color-mix(in oklab, var(--brand) 22%, transparent);border-color:transparent}`}</style>
    </div>
  );
}

function ViewField({
  label,
  value,
  secret,
  revealed,
  onToggleReveal,
  onCopy,
  mono,
  compact,
  mutedEmpty,
}: {
  label: string;
  value: string;
  secret?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
  onCopy?: () => void;
  mono?: boolean;
  compact?: boolean;
  mutedEmpty?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const display =
    secret && !revealed ? maskValue(value) : value || (mutedEmpty ? "Add notes…" : "—");

  const handleCopy = () => {
    if (mutedEmpty && !value.trim()) return;
    if (onCopy) onCopy();
    else copy(value, label);
  };

  return (
    <div className={compact ? "" : ""}>
      <div className="text-xs font-medium text-ink-muted mb-1.5">{label}</div>
      <button
        type="button"
        onClick={handleCopy}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className={cn(
          "group w-full text-left relative flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors",
          hover && "bg-muted/45",
          mutedEmpty && !value.trim() && "text-ink-faint",
        )}
      >
        <span className={cn("flex-1 min-w-0 text-sm truncate", mono && "mono", secret && "mono")}>
          {display}
        </span>
        <span
          className={cn(
            "flex items-center gap-0.5 shrink-0 text-ink-muted w-[68px] justify-end transition-opacity",
            hover ? "opacity-100" : "opacity-0",
          )}
        >
            {secret && onToggleReveal && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleReveal();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleReveal();
                  }
                }}
                className="size-8 rounded-lg hover:bg-surface/80 grid place-items-center"
                aria-label={revealed ? "Hide value" : "Reveal value"}
              >
                {revealed ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </span>
            )}
            <span className="size-8 rounded-lg hover:bg-surface/80 grid place-items-center">
              <Copy className="size-3.5" />
            </span>
        </span>
      </button>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-ink-muted mb-1.5">{label}</div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-muted mb-1.5">{label}</span>
      {children}
    </label>
  );
}
function ActionBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="size-9 rounded-lg hairline hover:bg-muted grid place-items-center shrink-0"
    >
      {children}
    </button>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl hairline bg-surface/60 p-4">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-3">
        {title}
      </div>
      {children}
    </div>
  );
}
function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "good" | "warn" | "bad";
}) {
  const c =
    tone === "good" ? "text-success" : tone === "warn" ? "text-warning" : "text-destructive";
  return (
    <div className="rounded-lg bg-muted/60 py-2.5">
      <div className={cn("text-sm font-semibold", c)}>{value}</div>
      <div className="text-[11px] text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}
function Meta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}
