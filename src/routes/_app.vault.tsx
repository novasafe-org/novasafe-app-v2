import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/components/vault/VaultPage";
import { featureFlagBeforeLoad } from "@/lib/feature-flags";

export const Route = createFileRoute("/_app/vault")({
  beforeLoad: featureFlagBeforeLoad("vault"),
  head: () => ({ meta: [{ title: "Vault — NovaSafe" }] }),
  component: () => (
    <div className="h-full min-h-0">
      <VaultPage />
    </div>
  ),
});
