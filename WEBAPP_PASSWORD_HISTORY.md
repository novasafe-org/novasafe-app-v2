# Web App — Password History

## Analysis

### Extension (source of truth)

| Layer | Path |
|-------|------|
| Service | `novasafe-extension/src/extension/vault/vaultPasswordHistoryService.ts` |
| API | `novasafe-extension/src/extension/api/vault.ts` → `deletePasswordVersion`, `getVaultItem` |
| Mapper | `novasafe-extension/src/extension/vault/vaultMapper.ts` → `mapCorePasswordVersions` |
| UI | `novasafe-extension/src/components/novasafe/item-sections.tsx` → `PasswordHistorySection` |
| State | `stateManager.saveItem` refreshes history after password change; `deletePasswordHistory` upserts cache |

### Backend contracts

| Operation | Endpoint |
|-----------|----------|
| Load history (with plaintext) | `GET /api/v1/vault/items/:id?revealSensitive=true` |
| Auto-create version | `PUT /api/v1/vault/items/:id` when `password` changes |
| Delete previous version | `DELETE /api/v1/vault/items/:id/password-versions/:versionId` |

Response wire format (`password_versions[]`):

- `id` — version UUID
- `password` — plaintext (only when `revealSensitive=true`)
- `is_expired` — `false` = current, `true` = previous
- `created_at` / `updated_at`

### App-v2 before this work

- `VaultItem.history` existed but used `{ password, changedAt }` without `id` or `active`
- Inspector showed a minimal masked list (no reveal/copy/delete)
- `vaultApi.getItem` existed but was never called from the UI
- `pullSync` list data does not reliably include full sensitive history

## Implementation

### Types (`src/lib/vault-types.ts`)

```typescript
interface PasswordHistoryEntry {
  id: string;
  password: string;
  createdAt: number;
  active: boolean; // true = Current, false = Previous
}
```

### API (`src/lib/api/endpoints/vault.ts`)

- `CorePasswordVersion` type aligned with extension
- `deletePasswordVersion(token, itemId, versionId)`

### Server actions (`src/lib/vault/server-actions.ts`)

| Action | Purpose |
|--------|---------|
| `getVaultItemAction` | Fetch single item with `revealSensitive=true` |
| `deletePasswordVersionAction` | Delete a previous version; returns updated item |
| `patchVaultItemAction` | After password patch, re-fetches item so history updates immediately |

`mapCoreItem` maps `password_versions` → `history` using the same `is_expired` → `active` logic as the extension.

### UI (`src/components/vault/item-sections.tsx`)

`PasswordHistorySection` — collapsible card matching extension UX:

- Created date per entry
- Current / Previous badge
- Masked password by default
- Reveal / Hide / Copy per row
- Delete on previous versions only (never on current)

### Vault detail flow (`src/components/vault/VaultPage.tsx`)

1. On item select → `getVaultItemAction({ revealSensitive: true })` → `upsertItem`
2. Section order: Security overview → Custom Fields → **Password History** → Metadata
3. Password edit (`onBlur` patch) → server creates version → refreshed item includes new history
4. Delete → `deletePasswordVersionAction` → `upsertItem` (no page reload)

### Security

- Passwords are never auto-revealed; user must click **Reveal**
- Sensitive values only loaded via `revealSensitive=true` on explicit item detail fetch
- Current version cannot be deleted in the UI

## Testing checklist

- [ ] Open item with history — entries show with Current/Previous badges
- [ ] Reveal / Hide / Copy work per entry
- [ ] Delete removes previous version only; current has no delete button
- [ ] Edit password → save → history updates without reload
- [ ] Pro entitlement errors surface via toast (403 from API)
