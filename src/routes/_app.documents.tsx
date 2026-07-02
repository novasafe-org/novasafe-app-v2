import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { featureFlagBeforeLoad } from "@/lib/feature-flags";

const DocumentsView = lazy(() =>
  import("@/components/docs/DocumentsView").then((m) => ({ default: m.DocumentsView })),
);

export const Route = createFileRoute("/_app/documents")({
  beforeLoad: featureFlagBeforeLoad("documents"),
  head: () => ({ meta: [{ title: "Documents — NovaSafe" }] }),
  component: DocumentsRoute,
});

function DocumentsRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-ink-muted">Loading documents…</div>}>
      <DocumentsView />
    </Suspense>
  );
}
