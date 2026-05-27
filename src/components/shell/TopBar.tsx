import { Search, Plus, Wifi, Bell } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { UserMenu } from "./UserMenu";

export function TopBar({
  query,
  onQuery,
  onNew,
}: {
  query: string;
  onQuery: (v: string) => void;
  onNew: () => void;
}) {
  const sync = useVault((s) => s.notificationsEnabled);
  return (
    <header className="h-14 px-4 flex items-center gap-3 border-b border-hairline bg-surface/60">
      <div className="flex-1 max-w-2xl mx-auto w-full">
        <label className="group flex items-center gap-2 h-10 px-3 rounded-xl bg-muted/70 hairline focus-within:bg-surface focus-within:shadow-float transition">
          <Search className="size-4 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search your vault…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-ink-faint"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center px-1.5 rounded bg-surface hairline text-[10px] text-ink-muted mono">
            ⌘K
          </kbd>
        </label>
      </div>
      <div className="hidden md:flex items-center gap-1.5 text-xs text-ink-muted">
        <Wifi className="size-3.5 text-success" />
        <span>Synced</span>
      </div>
      <button
        className="size-9 rounded-lg grid place-items-center text-ink-muted hover:text-ink hover:bg-muted transition relative"
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {sync && <span className="absolute top-1.5 right-2 size-1.5 rounded-full bg-brand" />}
      </button>
      <button
        onClick={onNew}
        className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm font-medium shadow-float hover:opacity-95 transition"
      >
        <Plus className="size-4" /> New
      </button>
      <UserMenu />
    </header>
  );
}
