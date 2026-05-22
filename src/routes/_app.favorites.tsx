import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/components/vault/VaultPage";
export const Route = createFileRoute("/_app/favorites")({
  head: () => ({ meta: [{ title: "Favorites — NovaSafe" }] }),
  component: () => <VaultPage filter={(i) => !i.archived && i.favorite} />,
});
