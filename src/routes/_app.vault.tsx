import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/components/vault/VaultPage";
export const Route = createFileRoute("/_app/vault")({
  head: () => ({ meta: [{ title: "Vault — NovaSafe" }] }),
  component: () => (
    <div className="h-full min-h-0">
      <VaultPage />
    </div>
  ),
});
