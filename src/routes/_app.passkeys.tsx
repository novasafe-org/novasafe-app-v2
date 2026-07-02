import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { featureFlagBeforeLoad } from "@/lib/feature-flags";

const PasskeysGrid = lazy(() =>
  import("@/components/passkeys/PasskeysGrid").then((m) => ({ default: m.PasskeysGrid })),
);

export const Route = createFileRoute("/_app/passkeys")({
  beforeLoad: featureFlagBeforeLoad("passkeys"),
  head: () => ({ meta: [{ title: "Passkeys — NovaSafe" }] }),
  component: PasskeysRoute,
});

function PasskeysRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-ink-muted">Loading passkeys…</div>}>
      <PasskeysGrid />
    </Suspense>
  );
}
