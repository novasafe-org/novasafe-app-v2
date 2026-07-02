import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { featureFlagBeforeLoad } from "@/lib/feature-flags";

const EnterpriseHomePage = lazy(() =>
  import("@/features/enterprise/EnterpriseHomePage").then((m) => ({
    default: m.EnterpriseHomePage,
  })),
);

export const Route = createFileRoute("/_app/enterprise")({
  beforeLoad: featureFlagBeforeLoad("enterprise"),
  head: () => ({ meta: [{ title: "Enterprise — NovaSafe" }] }),
  component: EnterpriseRoute,
});

function EnterpriseRoute() {
  return (
    <Suspense fallback={<FeatureLoading label="Enterprise" />}>
      <EnterpriseHomePage />
    </Suspense>
  );
}

function FeatureLoading({ label }: { label: string }) {
  return <div className="p-6 text-sm text-ink-muted">Loading {label}…</div>;
}
