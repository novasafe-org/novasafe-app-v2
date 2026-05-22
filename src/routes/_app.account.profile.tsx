import { createFileRoute } from "@tanstack/react-router";
import { useVault } from "@/lib/vault-store";
export const Route = createFileRoute("/_app/account/profile")({
  head: () => ({ meta: [{ title: "Profile — NovaSafe" }] }),
  component: function ProfilePage() {
    const plan = useVault((s)=>s.plan);
    return (
      <div className="p-6 max-w-2xl">
        <h1 className="text-xl font-semibold mb-1">Profile</h1>
        <p className="text-sm text-ink-muted mb-5">Your NovaSafe identity</p>
        <div className="rounded-2xl hairline bg-surface p-5 flex items-center gap-4">
          <div className="size-16 rounded-2xl brand-gradient grid place-items-center text-white text-xl font-semibold">PT</div>
          <div className="flex-1">
            <div className="text-base font-semibold">Pavankumar Tidke</div>
            <div className="text-sm text-ink-muted">pavank@novasafe.io</div>
            <div className="mt-2 flex gap-2 text-xs"><span className="px-2 py-0.5 rounded-md bg-accent text-brand-ink">{plan} plan</span><span className="px-2 py-0.5 rounded-md bg-success/15 text-success">Verified</span></div>
          </div>
        </div>
      </div>
    );
  },
});
