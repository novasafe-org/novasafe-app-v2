import { useState } from "react";
import {
  Check,
  ChevronDown,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  History,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { CustomField, CustomFieldType, PasswordHistoryEntry } from "@/lib/vault-types";
import { cn } from "@/lib/utils";

export const formatHistoryDate = (ts: number) =>
  new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function useCopyAction() {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (value: string, key: string, label = "Value") => {
    if (!value) return;
    navigator.clipboard.writeText(value).then(() => {
      setCopied(key);
      toast.success(`${label} copied`);
      window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1500);
    });
  };

  return { copy, copied };
}

const editorInputClass =
  "h-9 w-full rounded-md border border-hairline bg-surface px-2.5 text-[13px] outline-none focus:border-transparent focus:shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_22%,transparent)]";

const FIELD_TYPES: { value: CustomFieldType; label: string }[] = [
  { value: "TEXT", label: "Text" },
  { value: "PASSWORD", label: "Password" },
  { value: "URL", label: "URL" },
  { value: "EMAIL", label: "Email" },
];

const SectionShell = ({
  label,
  icon,
  action,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between px-0.5">
      <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
        {icon}
        {label}
      </p>
      {action}
    </div>
    <div className="overflow-hidden rounded-xl hairline bg-surface/60">{children}</div>
  </div>
);

const Divider = () => <div className="mx-3 h-px bg-hairline" />;

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={cn(
      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
      active ? "bg-success/10 text-success" : "bg-muted text-ink-muted",
    )}
  >
    {active ? "Current" : "Previous"}
  </span>
);

export function CustomFieldsSection({
  fields,
  onAddField,
  onDeleteField,
}: {
  fields: CustomField[];
  onAddField?: () => void;
  onDeleteField?: (fieldId: string) => void;
}) {
  return (
    <SectionShell
      label="Custom Fields"
      action={
        onAddField ? (
          <button
            type="button"
            onClick={onAddField}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand transition hover:opacity-80"
          >
            <Plus className="h-3 w-3" /> Add Field
          </button>
        ) : undefined
      }
    >
      {fields.length === 0 ? (
        <p className="px-3 py-3 text-[12.5px] text-ink-muted">No custom fields added.</p>
      ) : (
        fields.map((field, i) => (
          <div key={field.id}>
            {i > 0 && <Divider />}
            <CustomFieldRow field={field} onDelete={onDeleteField} />
          </div>
        ))
      )}
    </SectionShell>
  );
}

function CustomFieldRow({
  field,
  onDelete,
}: {
  field: CustomField;
  onDelete?: (fieldId: string) => void;
}) {
  const { copy, copied } = useCopyAction();
  const [revealed, setRevealed] = useState(false);
  const copyKey = `cf-${field.id}`;
  const fieldType = (field.type || "TEXT").toUpperCase();
  const isUrl = fieldType === "URL" || /^https?:\/\//i.test(field.value);

  if (field.isSensitive || fieldType === "PASSWORD") {
    return (
      <div className="px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] text-ink-muted">{field.name}</p>
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${field.name}"?`)) onDelete(field.id);
              }}
              aria-label="Delete field"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-muted transition hover:bg-muted hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="min-w-0 flex-1 truncate font-mono text-[13px] font-medium tracking-wide">
            {revealed ? field.value : "••••••••••••••••"}
          </p>
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-[11px] font-semibold text-ink transition hover:bg-muted"
          >
            {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            {revealed ? "Hide" : "Reveal"}
          </button>
          <button
            type="button"
            onClick={() => copy(field.value, copyKey, field.name)}
            className="inline-flex items-center gap-1 rounded-md border border-hairline px-2 py-1 text-[11px] font-semibold text-ink transition hover:bg-muted"
          >
            {copied === copyKey ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
            Copy
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/40">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-ink-muted">{field.name}</p>
        <p className="mt-0.5 truncate text-[13.5px] font-medium">{field.value}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {isUrl && (
          <button
            type="button"
            onClick={() => window.open(field.value, "_blank", "noopener,noreferrer")}
            className="grid h-7 w-7 place-items-center rounded-md text-ink-muted transition hover:bg-muted hover:text-brand"
            aria-label="Open link"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => copy(field.value, copyKey, field.name)}
          className="grid h-7 w-7 place-items-center rounded-md text-ink-muted transition hover:bg-muted hover:text-ink"
          aria-label={`Copy ${field.name}`}
        >
          {copied === copyKey ? (
            <Check className="h-3.5 w-3.5 text-success" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete "${field.name}"?`)) onDelete(field.id);
            }}
            aria-label="Delete field"
            className="grid h-7 w-7 place-items-center rounded-md text-ink-muted opacity-0 transition group-hover:opacity-100 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export function PasswordHistorySection({
  entries,
  collapsible = true,
  defaultOpen = true,
  onDeleteEntry,
}: {
  entries: PasswordHistoryEntry[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  onDeleteEntry?: (id: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => collapsible && setOpen((o) => !o)}
        className={cn(
          "mb-1.5 flex w-full items-center justify-between px-0.5",
          collapsible && "cursor-pointer",
        )}
        disabled={!collapsible}
      >
        <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-faint">
          <History className="h-3 w-3" />
          Password History
        </p>
        {collapsible && (
          <ChevronDown
            className={cn("h-3.5 w-3.5 text-ink-muted transition", open && "rotate-180")}
          />
        )}
      </button>
      {open && (
        <div className="overflow-hidden rounded-xl hairline bg-surface/60">
          {entries.length === 0 ? (
            <p className="px-3 py-3 text-[12.5px] text-ink-muted">No password history.</p>
          ) : (
            entries.map((entry, i) => (
              <div key={entry.id}>
                {i > 0 && <Divider />}
                <PasswordHistoryRow entry={entry} onDelete={onDeleteEntry} />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function PasswordHistoryRow({
  entry,
  onDelete,
}: {
  entry: PasswordHistoryEntry;
  onDelete?: (id: string) => void;
}) {
  const { copy, copied } = useCopyAction();
  const [revealed, setRevealed] = useState(false);
  const copyKey = `ph-${entry.id}`;

  return (
    <div className="px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-ink-muted">Created on {formatHistoryDate(entry.createdAt)}</p>
        <StatusBadge active={entry.active} />
      </div>
      <p className="mt-1.5 font-mono text-[13px] tracking-wide">
        {revealed ? entry.password : "•••••••••••••••"}
      </p>
      <div className="mt-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setRevealed((r) => !r)}
          className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2 py-1 text-[11px] font-semibold transition hover:bg-muted"
        >
          {revealed ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
          {revealed ? "Hide" : "Reveal"}
        </button>
        <button
          type="button"
          onClick={() => copy(entry.password, copyKey, "Password")}
          className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2 py-1 text-[11px] font-semibold transition hover:bg-muted"
        >
          {copied === copyKey ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
          Copy
        </button>
        {!entry.active && onDelete && (
          <button
            type="button"
            onClick={() => {
              if (confirm("Delete this password version?")) onDelete(entry.id);
            }}
            className="inline-flex items-center gap-1 rounded-md border border-hairline bg-surface px-2 py-1 text-[11px] font-semibold text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 className="h-3 w-3" />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}

export function CustomFieldsEditor({
  fields,
  onChange,
}: {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}) {
  const addField = () => {
    onChange([
      ...fields,
      { id: crypto.randomUUID(), name: "", value: "", isSensitive: false, type: "TEXT" },
    ]);
  };

  const updateField = (id: string, patch: Partial<CustomField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    const field = fields.find((entry) => entry.id === id);
    if (field?.name && !confirm(`Delete "${field.name}"?`)) return;
    onChange(fields.filter((f) => f.id !== id));
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-faint">
          Custom Fields
        </span>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand transition hover:opacity-80"
        >
          <Plus className="h-3 w-3" /> Add Field
        </button>
      </div>
      {fields.length === 0 ? (
        <p className="rounded-xl hairline bg-surface/60 px-3 py-3 text-[12.5px] text-ink-muted">
          No custom fields added.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {fields.map((field) => (
            <div key={field.id} className="rounded-xl hairline bg-surface/60 p-3">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1 space-y-2">
                  <input
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    placeholder="Field name"
                    className={editorInputClass}
                  />
                  <input
                    value={field.value}
                    onChange={(e) => updateField(field.id, { value: e.target.value })}
                    placeholder="Field value"
                    type={field.isSensitive ? "password" : "text"}
                    className={cn(editorInputClass, "mono")}
                  />
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={(field.type || "TEXT").toUpperCase()}
                      onChange={(e) =>
                        updateField(field.id, { type: e.target.value as CustomFieldType })
                      }
                      className={cn(editorInputClass, "h-8 w-auto text-[12px]")}
                    >
                      {FIELD_TYPES.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-[12px] text-ink-muted">
                      <input
                        type="checkbox"
                        checked={field.isSensitive}
                        onChange={(e) => updateField(field.id, { isSensitive: e.target.checked })}
                        className="rounded border-hairline"
                      />
                      Sensitive field
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  aria-label="Remove field"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-ink-muted transition hover:bg-muted hover:text-destructive"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
