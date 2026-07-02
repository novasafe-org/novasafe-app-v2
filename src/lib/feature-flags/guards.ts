import { notFound } from "@tanstack/react-router";

import { isFlagEnabled } from "./defaults";
import { resolveBootstrapSnapshot } from "./resolve";
import { fetchPlatformFeatureFlagsAction } from "./server-actions";
import type { FeatureFlagKey } from "./types";

/** Resolves the current flag snapshot (remote → cache → catalog defaults). */
export async function resolveFeatureFlagSnapshot() {
  const remote = await fetchPlatformFeatureFlagsAction();
  return resolveBootstrapSnapshot(remote).snapshot;
}

/** Route guard: deep links return Not Found when the flag is off. */
export async function requireFeatureFlag(key: FeatureFlagKey): Promise<void> {
  const snapshot = await resolveFeatureFlagSnapshot();
  if (!isFlagEnabled(snapshot.flags, key)) {
    throw notFound();
  }
}

export function featureFlagBeforeLoad(key: FeatureFlagKey) {
  return () => requireFeatureFlag(key);
}
