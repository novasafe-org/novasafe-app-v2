#!/usr/bin/env node
/**
 * Ensures parked app routes declare featureFlagBeforeLoad guards.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const routesDir = resolve(root, 'src/routes');

const REQUIRED_GUARDS = [
  { file: '_app.vault.tsx', flag: 'vault' },
  { file: '_app.favorites.tsx', flag: 'favorites' },
  { file: '_app.archive.tsx', flag: 'archive' },
  { file: '_app.passkeys.tsx', flag: 'passkeys' },
  { file: '_app.otp.tsx', flag: 'otp' },
  { file: '_app.teams.tsx', flag: 'teams' },
  { file: '_app.enterprise.tsx', flag: 'enterprise' },
  { file: '_app.shared.tsx', flag: 'sharing' },
  { file: '_app.notes.tsx', flag: 'secure_notes' },
  { file: '_app.documents.tsx', flag: 'documents' },
];

const failures = [];

for (const { file, flag } of REQUIRED_GUARDS) {
  const path = resolve(routesDir, file);
  let source = '';
  try {
    source = readFileSync(path, 'utf8');
  } catch {
    failures.push(`${file}: missing route file`);
    continue;
  }

  const pattern = new RegExp(`featureFlagBeforeLoad\\(\\s*['"]${flag}['"]\\s*\\)`);
  if (!pattern.test(source)) {
    failures.push(`${file}: missing featureFlagBeforeLoad("${flag}")`);
  }
}

const routeFiles = readdirSync(routesDir).filter(
  (name) => name.startsWith('_app.') && name.endsWith('.tsx'),
);
for (const file of routeFiles) {
  const source = readFileSync(resolve(routesDir, file), 'utf8');
  if (!source.includes('featureFlagBeforeLoad')) {
    continue;
  }
  if (!source.includes('from "@/lib/feature-flags"') && !source.includes("from '@/lib/feature-flags'")) {
    failures.push(`${file}: uses featureFlagBeforeLoad without importing from @/lib/feature-flags`);
  }
}

if (failures.length > 0) {
  console.error('[feature-flag-guards] Route guard check failed:');
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log('[feature-flag-guards] All flagged routes have feature flag guards.');
