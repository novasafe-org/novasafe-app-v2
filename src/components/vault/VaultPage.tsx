import { useEffect, useMemo, useRef, useState } from "react";
import {
  Star,
  Copy,
  Eye,
  EyeOff,
  ExternalLink,
  MoreHorizontal,
  Archive,
  Trash2,
  Share2,
  RefreshCw,
  Files,
  Globe,
} from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { useUI } from "@/lib/ui-store";
import { TYPE_META } from "@/lib/item-meta";
import { generatePassword, strength, maskValue } from "@/lib/password";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { VaultItem } from "@/lib/vault-types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listVaultItemsAction,
  patchVaultItemAction,
  deleteVaultItemAction,
  toActionMessage,
} from "@/lib/vault/server-actions";

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
    staleTime: 15000,
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

  const selected = list.find((i) => i.id === selectedId) ?? list[0] ?? null;

  return (
    <div className="h-full flex min-w-0">
      <ItemList
        items={list}
        selectedId={selected?.id ?? null}
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
      <div className="flex-1 min-w-0 border-l border-hairline bg-surface/40">
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

function ItemList({
  items,
  selectedId,
  onSelect,
}: {
  items: VaultItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggleFavorite: (item: VaultItem) => void;
}) {
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
        <ul className="space-y-1">
          {items.map((it) => {
            const M = TYPE_META[it.type];
            const Icon = M.icon;
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
                  <span
                    className={cn("size-9 rounded-lg grid place-items-center shrink-0", M.tint)}
                  >
                    <Icon className="size-4" />
                  </span>
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
                    <span>{timeAgo(it.updatedAt)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(it);
                      }}
                      className="hover:text-warning"
                      aria-label="Favorite"
                    >
                      <Star
                        className={cn("size-3.5", it.favorite ? "fill-warning text-warning" : "")}
                      />
                    </button>
                  </span>
                </button>
              </li>
            );
          })}
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
  const [reveal, setReveal] = useState(false);
  const updateItem = useVault((s) => s.updateItem);
  const openShare = useUI((s) => s.openShare);
  const M = TYPE_META[item.type];
  const Icon = M.icon;
  const str = strength(item.password);

  async function commitPatch(patch: Record<string, unknown>) {
    try {
      const result = await onPatch(item.id, patch);
      onUpsert(result.item);
    } catch (err) {
      toast.error(toActionMessage(err));
    }
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="px-6 pt-6 pb-4 flex items-start gap-4 border-b border-hairline">
        <div className={cn("size-14 rounded-2xl grid place-items-center", M.tint)}>
          <Icon className="size-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              value={item.title}
              onChange={(e) => updateItem(item.id, { title: e.target.value })}
              onBlur={(e) => commitPatch({ title: e.target.value })}
              className="text-xl font-semibold bg-transparent outline-none flex-1 min-w-0"
            />
            <button
              onClick={() => {
                const next = !item.favorite;
                onUpsert({ ...item, favorite: next });
                commitPatch({ favorite: next });
              }}
              className="size-9 rounded-lg hover:bg-muted grid place-items-center"
            >
              <Star className={cn("size-4", item.favorite && "fill-warning text-warning")} />
            </button>
            <button
              onClick={() => openShare(item.title)}
              className="size-9 rounded-lg hover:bg-muted grid place-items-center"
              title="Share"
            >
              <Share2 className="size-4" />
            </button>
            <button className="size-9 rounded-lg hover:bg-muted grid place-items-center">
              <MoreHorizontal className="size-4" />
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

      <div className="flex-1 overflow-y-auto p-6 space-y-5 no-scrollbar">
        {item.username !== undefined && (
          <Row label="Username">
            <input
              value={item.username ?? ""}
              onChange={(e) => updateItem(item.id, { username: e.target.value })}
              onBlur={(e) => commitPatch({ username: e.target.value })}
              className="field"
            />
            <ActionBtn onClick={() => copy(item.username, "Username")}>
              <Copy className="size-3.5" />
            </ActionBtn>
          </Row>
        )}

        {item.password !== undefined && (
          <Row label="Password">
            <input
              value={reveal ? (item.password ?? "") : maskValue(item.password ?? "")}
              readOnly={!reveal}
              onChange={(e) => updateItem(item.id, { password: e.target.value })}
              onBlur={(e) => commitPatch({ password: e.target.value })}
              className="field mono"
            />
            <ActionBtn onClick={() => setReveal((v) => !v)}>
              {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </ActionBtn>
            <ActionBtn onClick={() => copy(item.password, "Password")}>
              <Copy className="size-3.5" />
            </ActionBtn>
            <ActionBtn
              onClick={() => {
                const generated = generatePassword({ length: 20 });
                updateItem(item.id, { password: generated });
                commitPatch({ password: generated });
                toast.success("New password generated");
              }}
            >
              <RefreshCw className="size-3.5" />
            </ActionBtn>
          </Row>
        )}

        {item.password !== undefined && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted">Strength</span>
              <span
                className={cn(
                  "font-medium",
                  str.score >= 3
                    ? "text-success"
                    : str.score === 2
                      ? "text-warning"
                      : "text-destructive",
                )}
              >
                {str.label}
              </span>
            </div>
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full",
                    i < str.score ? "bg-brand" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {item.url && (
          <Row label="Website">
            <input
              value={item.url}
              onChange={(e) => updateItem(item.id, { url: e.target.value })}
              onBlur={(e) => commitPatch({ url: e.target.value })}
              className="field"
            />
            <ActionBtn onClick={() => window.open(item.url, "_blank")}>
              <ExternalLink className="size-3.5" />
            </ActionBtn>
          </Row>
        )}

        {item.type === "card" && (
          <>
            <Row label="Card number">
              <input value={item.cardNumber ?? ""} readOnly className="field mono" />
              <ActionBtn onClick={() => copy(item.cardNumber, "Card")}>
                <Copy className="size-3.5" />
              </ActionBtn>
            </Row>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Holder">
                <input value={item.cardHolder ?? ""} readOnly className="field" />
              </Field>
              <Field label="Expiry">
                <input value={item.cardExpiry ?? ""} readOnly className="field mono" />
              </Field>
              <Field label="CVV">
                <input
                  value={reveal ? (item.cardCvv ?? "") : "•••"}
                  readOnly
                  className="field mono"
                />
              </Field>
            </div>
          </>
        )}

        {item.identity && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name">
              <input value={item.identity.fullName} readOnly className="field" />
            </Field>
            <Field label="Number">
              <input value={item.identity.number} readOnly className="field mono" />
            </Field>
            <Field label="Country">
              <input value={item.identity.country} readOnly className="field" />
            </Field>
            <Field label="Expiry">
              <input value={item.identity.expiry ?? ""} readOnly className="field" />
            </Field>
          </div>
        )}

        <Field label="Notes">
          <textarea
            value={item.notes ?? ""}
            onChange={(e) => updateItem(item.id, { notes: e.target.value })}
            onBlur={(e) => commitPatch({ notes: e.target.value })}
            rows={3}
            className="field resize-none py-2.5"
            placeholder="Add notes…"
          />
        </Field>

        {item.url && (
          <div className="flex items-center gap-2 text-xs text-ink-muted">
            <Globe className="size-3.5" /> {item.url.replace(/^https?:\/\//, "")}
          </div>
        )}

        <Section title="Security overview">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat
              label="Strength"
              value={str.label}
              tone={str.score >= 3 ? "good" : str.score === 2 ? "warn" : "bad"}
            />
            <Stat
              label="Breach"
              value={item.breached ? "Detected" : "Clean"}
              tone={item.breached ? "bad" : "good"}
            />
            <Stat
              label="2FA"
              value={item.otpSecret ? "Enabled" : "Off"}
              tone={item.otpSecret ? "good" : "warn"}
            />
          </div>
        </Section>

        {item.history.length > 0 && (
          <Section title="Password history">
            <ul className="space-y-1.5">
              {item.history.map((h, i) => (
                <li key={i} className="flex items-center justify-between text-xs">
                  <span className="mono text-ink-muted">{maskValue(h.password)}</span>
                  <span className="text-ink-faint">{timeAgo(h.changedAt)} ago</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Metadata">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <Meta k="Created" v={new Date(item.createdAt).toLocaleDateString()} />
            <Meta k="Modified" v={new Date(item.updatedAt).toLocaleDateString()} />
            <Meta k="Last opened" v={timeAgo(item.lastOpenedAt) + " ago"} />
            <Meta k="Vault" v={item.vault} />
          </div>
        </Section>
      </div>

      <div className="px-6 py-3 border-t border-hairline flex items-center justify-between bg-surface/60">
        <div className="text-xs text-ink-faint">End-to-end encrypted</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              onUpsert({ ...item, archived: true });
              commitPatch({ archived: true });
            }}
            className="h-9 px-3 rounded-lg hairline text-sm inline-flex items-center gap-1.5"
          >
            <Archive className="size-3.5" />
            Archive
          </button>
          <button
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
