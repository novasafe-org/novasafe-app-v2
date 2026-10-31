import { createFileRoute } from "@tanstack/react-router";
import { VaultPage } from "@/components/vault/VaultPage";
import { featureFlagBeforeLoad } from "@/lib/feature-flags";

export const Route = createFileRoute("/_app/archive")({
  beforeLoad: featureFlagBeforeLoad("archive"),
  head: () => ({ meta: [{ title: "Archive — NovaSafe" }] }),
  component: () => <VaultPage filter={(i) => !!i.archived} />,
});
