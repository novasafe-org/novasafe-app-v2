import { useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { MobileNav } from "./MobileNav";
import { NewItemModal } from "@/components/vault/NewItemModal";
import { ShareModal } from "@/components/vault/ShareModal";
import { useVault } from "@/lib/vault-store";
import { useUI } from "@/lib/ui-store";

export function AppShell() {
  const theme = useVault((s) => s.theme);
  const { query, setQuery, newOpen, setNewOpen } = useUI();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setNewOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('input[placeholder="Search your vault…"]');
        el?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setNewOpen]);

  return (
    <div className="canvas-bg min-h-screen w-full">
      <div className="mx-auto max-w-[1480px] px-3 md:px-6 py-3 md:py-5">
        <div className="glass-strong rounded-3xl overflow-hidden shadow-float min-h-[calc(100vh-2.5rem)] flex">
          <Sidebar onNew={() => setNewOpen(true)} />
          <div className="flex-1 flex flex-col min-w-0">
            <TopBar query={query} onQuery={setQuery} onNew={() => setNewOpen(true)} />
            <main className="flex-1 min-h-0 overflow-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
      <MobileNav />
      <NewItemModal open={newOpen} onClose={() => setNewOpen(false)} />
      <ShareModal />
    </div>
  );
}
