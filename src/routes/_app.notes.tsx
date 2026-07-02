import { createFileRoute } from "@tanstack/react-router";

import { VaultPage } from "@/components/vault/VaultPage";
import { featureFlagBeforeLoad } from "@/lib/feature-flags";

export const Route = createFileRoute("/_app/notes")({
  beforeLoad: featureFlagBeforeLoad("secure_notes"),
  head: () => ({ meta: [{ title: "Secure Notes — NovaSafe" }] }),
  component: () => <VaultPage filter={(i) => !i.archived && i.type === "note"} />,
});
