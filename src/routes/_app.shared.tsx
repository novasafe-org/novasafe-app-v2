import { createFileRoute } from "@tanstack/react-router";

import { SharedView } from "@/components/vault/SharedView";
import { featureFlagBeforeLoad } from "@/lib/feature-flags";

export const Route = createFileRoute("/_app/shared")({
  beforeLoad: featureFlagBeforeLoad("sharing"),
  head: () => ({ meta: [{ title: "Shared — NovaSafe" }] }),
  component: () => <SharedView />,
});
