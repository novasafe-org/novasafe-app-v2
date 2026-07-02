import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { featureFlagBeforeLoad } from "@/lib/feature-flags";

const TeamsHomePage = lazy(() =>
  import("@/features/teams/TeamsHomePage").then((m) => ({ default: m.TeamsHomePage })),
);

export const Route = createFileRoute("/_app/teams")({
  beforeLoad: featureFlagBeforeLoad("teams"),
  head: () => ({ meta: [{ title: "Teams — NovaSafe" }] }),
  component: TeamsRoute,
});

function TeamsRoute() {
  return (
    <Suspense fallback={<FeatureLoading label="Teams" />}>
      <TeamsHomePage />
    </Suspense>
  );
}

function FeatureLoading({ label }: { label: string }) {
  return <div className="p-6 text-sm text-ink-muted">Loading {label}…</div>;
}
