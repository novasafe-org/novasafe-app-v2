import { Search, Plus, Sun, Moon } from "lucide-react";
import { useVault } from "@/lib/vault-store";
import { UserMenu } from "./UserMenu";

/** Matches `ItemList` width in `VaultPage` so search aligns with the detail pane. */
const ITEM_LIST_WIDTH = "360px";

export function TopBar({
  query,
  onQuery,
  onNew,
}: {
  query: string;
  onQuery: (v: string) => void;
  onNew: () => void;
}) {
  const theme = useVault((s) => s.theme);
  const setTheme = useVault((s) => s.setTheme);
  return (
    <header className="h-14 px-4 flex items-center gap-3 border-b border-hairline bg-surface/60">
      <div
        className="hidden md:block shrink-0"
        style={{ width: ITEM_LIST_WIDTH }}
        aria-hidden
      />
      <div className="flex-1 min-w-0 max-w-2xl">
        <label className="group flex items-center gap-2 h-10 px-3 rounded-xl bg-muted/70 hairline focus-within:bg-surface focus-within:shadow-float transition">
          <Search className="size-4 text-ink-faint shrink-0" />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search your vault…"
            className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-ink-faint"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center px-1.5 rounded bg-surface hairline text-[10px] text-ink-muted mono shrink-0">
            ⌘K
          </kbd>
        </label>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="size-9 rounded-lg grid place-items-center text-ink-muted hover:text-ink hover:bg-muted transition"
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
        <button
          type="button"
          onClick={onNew}
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-brand text-brand-foreground text-sm font-medium shadow-float hover:opacity-95 transition"
        >
          <Plus className="size-4" /> New
        </button>
        <UserMenu />
      </div>
    </header>
  );
}
