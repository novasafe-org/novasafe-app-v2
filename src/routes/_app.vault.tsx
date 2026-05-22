import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/components/vault/VaultPage";
export const Route = createFileRoute("/_app/vault")({
  head: () => ({ meta: [{ title: "Vault — NovaSafe" }] }),
  component: () => <VaultPage />,
});
