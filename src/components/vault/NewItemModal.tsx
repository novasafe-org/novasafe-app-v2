import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { TYPE_META, TYPE_LIST } from "@/lib/item-meta";
import { useVault } from "@/lib/vault-store";
import { generatePassword } from "@/lib/password";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function NewItemModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createItem = useVault((s) => s.createItem);
  const navigate = useNavigate();
  const [step, setStep] = useState<"pick" | "form">("pick");
  const [type, setType] = useState<keyof typeof TYPE_META>("password");
  const [title, setTitle] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setStep("pick");
      setType("password");
      setTitle("");
      setUsername("");
      setPassword("");
      setUrl("");
      setNotes("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onCreate = () => {
    if (!title.trim()) {
      toast.error("Give the item a name");
      return;
    }
    createItem({ type, title: title.trim(), username, password, url, notes });
    toast.success(`${TYPE_META[type].label} saved`);
    onClose();
    navigate({ to: "/vault" });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-ink/30 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl glass-strong rounded-2xl shadow-float overflow-hidden animate-scale-in">
        <div className="flex items-center justify-between px-5 py-3 border-b border-hairline">
          <div>
            <div className="text-sm font-semibold">
              {step === "pick" ? "New item" : `New ${TYPE_META[type].label}`}
            </div>
            <div className="text-xs text-ink-muted">
              {step === "pick" ? "Choose a category" : "Fill in the details"}
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-lg hover:bg-muted grid place-items-center"
          >
            <X className="size-4" />
          </button>
        </div>

        {step === "pick" ? (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYPE_LIST.map((t) => {
              const M = TYPE_META[t];
              const Icon = M.icon;
              return (
                <button
                  key={t}
                  onClick={() => {
                    setType(t);
                    setStep("form");
                  }}
                  className="group flex items-center gap-3 p-3 rounded-xl hairline hover:shadow-float hover:-translate-y-0.5 transition text-left bg-surface"
                >
                  <span className={`size-10 rounded-xl grid place-items-center ${M.tint}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="text-sm font-medium">{M.label}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-5 space-y-3">
            <Field label="Name">
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. GitHub"
                className="input"
              />
            </Field>
            {["password", "apikey", "wifi", "server", "ssh", "license", "database"].includes(
              type,
            ) && (
              <>
                <Field label="Username">
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input"
                  />
                </Field>
                <Field label="Password / secret">
                  <div className="flex gap-2">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input flex-1 mono"
                    />
                    <button
                      type="button"
                      onClick={() => setPassword(generatePassword({ length: 20 }))}
                      className="h-10 px-3 rounded-lg bg-brand text-brand-foreground text-sm"
                    >
                      Generate
                    </button>
                  </div>
                </Field>
              </>
            )}
            {["password", "apikey", "server", "wifi"].includes(type) && (
              <Field label="URL">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                  className="input"
                />
              </Field>
            )}
            <Field label="Notes">
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input resize-none"
              />
            </Field>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setStep("pick")}
                className="text-sm text-ink-muted hover:text-ink"
              >
                ← Change type
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="h-10 px-3 rounded-lg hairline text-sm">
                  Cancel
                </button>
                <button
                  onClick={onCreate}
                  className="h-10 px-4 rounded-lg bg-brand text-brand-foreground text-sm font-medium shadow-float"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`.input{height:40px;padding:0 12px;border-radius:10px;border:1px solid var(--hairline);background:var(--surface);font-size:14px;width:100%;outline:none;}.input:focus{box-shadow:0 0 0 3px color-mix(in oklab, var(--brand) 22%, transparent);border-color:transparent}textarea.input{height:auto;padding:10px 12px}`}</style>
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
