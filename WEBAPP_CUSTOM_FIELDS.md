# Web App — Custom Fields

## Analysis

### Extension (source of truth)

| Layer | Path |
|-------|------|
| Service | `novasafe-extension/src/extension/vault/vaultCustomFieldService.ts` |
| API | `novasafe-extension/src/extension/api/vault.ts` |
| Mapper | `vaultMapper.ts` → `mapCoreCustomField` |
| View UI | `item-sections.tsx` → `CustomFieldsSection`, `CustomFieldRow` |
| Edit UI | `item-sections.tsx` → `CustomFieldsEditor`; wired in `EditItem.tsx` |
| State | `syncCustomFields` on save; `deleteCustomField` from detail view |

### Backend contracts

| Operation | Endpoint |
|-----------|----------|
| List (with values) | `GET /api/v1/vault/items/:id?revealSensitive=true` or sync pull |
| Create | `POST /api/v1/vault/items/:id/custom-fields` |
| Update | `PUT /api/v1/vault/items/:id/custom-fields/:fieldId` |
| Delete | `DELETE /api/v1/vault/items/:id/custom-fields/:fieldId` |

Wire payload:

```json
{
  "field_label": "Recovery email",
  "field_type": "TEXT | PASSWORD | URL | EMAIL",
  "field_value": "...",
  "is_sensitive": false
}
```

### App-v2 before this work

- `VaultItem.customFields` typed as `{ label, value, secret }` but **never rendered**
- No custom-field API methods in `vaultApi`
- Create/edit flows had no custom fields UI
- Mapper used wrong field names (`label` vs `field_label`)

## Implementation

### Types (`src/lib/vault-types.ts`)

```typescript
interface CustomField {
  id: string;
  name: string;
  value: string;
  isSensitive: boolean;
  type?: "TEXT" | "PASSWORD" | "URL" | "EMAIL" | string;
}
```

`VaultItem.customFields` is required (defaults to `[]`).

### API (`src/lib/api/endpoints/vault.ts`)

- `CoreCustomField`, `CustomFieldPayload`
- `addCustomField`, `updateCustomField`, `deleteCustomField`

### Server actions (`src/lib/vault/server-actions.ts`)

| Action | Purpose |
|--------|---------|
| `syncCustomFieldsAction` | Diff previous vs next: DELETE removed, POST new, PUT changed, then refresh item |
| `deleteCustomFieldAction` | Delete single field from detail view |
| `createVaultItemAction` | Create item, then sync initial custom fields if provided |

Sync logic mirrors `vaultCustomFieldService.syncCustomFields` in the extension:

1. Remove fields absent from `next`
2. POST fields with IDs not in `previous`
3. PUT fields where label/value/sensitivity/type changed
4. `GET` item with `revealSensitive=true` and return mapped result

### UI (`src/components/vault/item-sections.tsx`)

| Component | Used in |
|-----------|---------|
| `CustomFieldsSection` | Item detail (view mode) |
| `CustomFieldRow` | Per-field reveal/copy/open-link/delete |
| `CustomFieldsEditor` | Create modal + item edit mode |

**View mode**

- Plain fields: show value + copy; URL fields get open-link action
- Sensitive fields: masked, Reveal/Hide/Copy
- Delete with confirm (calls API immediately)

**Edit mode**

- Add/remove rows locally
- Field name, value, type select (Text/Password/URL/Email), sensitive toggle
- Synced to API when user exits edit mode (pencil → Done)

### Create flow (`src/components/vault/NewItemModal.tsx`)

Section order: Name → Credentials → URL → Notes → **Custom Fields** → Save

On save: `createVaultItemAction` creates the item, then `syncCustomFieldsInternal` posts fields.

### Detail / edit flow (`src/components/vault/VaultPage.tsx`)

1. Item select → `getVaultItemAction` loads fields with sensitive values
2. View: `CustomFieldsSection` below Security, above Password History
3. Edit: `CustomFieldsEditor`; sync on exit edit mode
4. Inline delete from view mode via `deleteCustomFieldAction`

### State management

- No full-page reloads
- `upsertItem` after every successful mutation
- TanStack Query list invalidated on patch/delete (existing pattern)
- Item detail re-fetched on selection for sensitive data

## Testing checklist

- [ ] Create item with multiple custom fields — fields appear in detail
- [ ] Edit item: add, change, remove fields — persists after Done
- [ ] Sensitive field masked until Reveal
- [ ] URL field shows open-link action
- [ ] Delete field from detail removes it without reload
- [ ] Empty state: "No custom fields added."
