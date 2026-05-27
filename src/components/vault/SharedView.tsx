import { useVault } from "@/lib/vault-store";
import { toast } from "sonner";

export function SharedView() {
  const invites = useVault((s) => s.invites);
  const setInviteState = useVault((s) => s.setInviteState);
  return (
    <div className="h-full overflow-y-auto p-6 no-scrollbar">
      <h1 className="text-xl font-semibold">Shared</h1>
      <p className="text-sm text-ink-muted mb-5">Items you've shared and pending invites</p>
      <div className="rounded-2xl hairline bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-xs text-ink-muted bg-muted/40">
            <tr>
              <th className="text-left p-3 font-medium">Item</th>
              <th className="text-left p-3 font-medium">Shared with</th>
              <th className="text-left p-3 font-medium">Role</th>
              <th className="text-left p-3 font-medium">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {invites.map((i) => (
              <tr key={i.id} className="border-t border-hairline">
                <td className="p-3 font-medium">{i.itemTitle}</td>
                <td className="p-3 text-ink-muted">{i.sharedWith}</td>
                <td className="p-3 capitalize">{i.role}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs ${i.state === "accepted" ? "bg-success/15 text-success" : i.state === "pending" ? "bg-warning/15 text-warning" : "bg-muted text-ink-muted"}`}
                  >
                    {i.state}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {i.state !== "revoked" && (
                    <button
                      onClick={() => {
                        setInviteState(i.id, "revoked");
                        toast.success("Access revoked");
                      }}
                      className="text-xs text-destructive hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {invites.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12 text-ink-muted text-sm">
                  Nothing shared yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
