import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/components/vault/VaultPage";
export const Route = createFileRoute("/_app/archive")({
  head: () => ({ meta: [{ title: "Archive — NovaSafe" }] }),
  component: () => <VaultPage filter={(i) => !!i.archived} />,
});
