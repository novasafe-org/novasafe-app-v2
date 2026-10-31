import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/components/vault/VaultPage";
import { featureFlagBeforeLoad } from "@/lib/feature-flags";

export const Route = createFileRoute("/_app/favorites")({
  beforeLoad: featureFlagBeforeLoad("favorites"),
  head: () => ({ meta: [{ title: "Favorites — NovaSafe" }] }),
  component: () => <VaultPage filter={(i) => !i.archived && i.favorite} />,
});
