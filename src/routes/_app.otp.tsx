import { lazy, Suspense } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { featureFlagBeforeLoad } from "@/lib/feature-flags";

const OtpGrid = lazy(() =>
  import("@/components/otp/OtpGrid").then((m) => ({ default: m.OtpGrid })),
);

export const Route = createFileRoute("/_app/otp")({
  beforeLoad: featureFlagBeforeLoad("otp"),
  head: () => ({ meta: [{ title: "Authenticator — NovaSafe" }] }),
  component: OtpRoute,
});

function OtpRoute() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-ink-muted">Loading authenticator…</div>}>
      <OtpGrid />
    </Suspense>
  );
}
