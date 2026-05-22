## NovaSafe — Premium Vault Redesign

A full rebuild around a centered, floating 3-pane vault experience — minimal icon sidebar, center item list, right inspector. Apple/Linear/Arc/1Password feel. No dashboard charts, no Coming Soon labels, no full-bleed enterprise layout. Everything functional with realistic dummy data.

### Design system

- Single brand color `#0178E5` with derived tints/shades only (icy blue, pale cyan, steel, frosted white, deep navy for dark).
- Tokens in `src/styles.css` (oklch): `--brand`, `--brand-soft`, `--brand-glow`, `--surface`, `--surface-elev`, `--hairline`, `--ink`, `--ink-muted`, plus `--shadow-float`, `--shadow-inset`, `--blur-glass`.
- Typography: Inter (UI) + JetBrains Mono (secrets/codes). Calm sizing, generous line-height.
- Radii: 12 / 16 / 20. Hairline borders (1px, low-contrast). Subtle glass: `backdrop-blur` + 70–85% surface alpha. No loud gradients.
- Motion: 150–220ms spring-ish ease, soft hover lift, focus ring in `--brand-soft`.

### Shell & layout

- Centered app shell with breathing margins on large screens (max ~1440, soft outer background). Floating panels with `--shadow-float`.
- Desktop: `[Sidebar 72px] [List 360px] [Inspector flex]` inside the floating shell.
- Tablet: collapse list+inspector into stacked panels with back nav.
- Mobile: full-screen with bottom nav (Vault / Passkeys / OTP / Docs / Account).
- Top bar: lightweight — global search (⌘K styling), quick add (+), sync dot, profile. No giant titles.

### Sidebar (final list — no Coming Soon)

Vault · Passkeys · OTP / TOTP · Secure Notes · Documents · Shared · Favorites · Archive. Bottom: account switcher with sync/device state. Account Center (Profile / Security / Devices / Activity / Recovery / Billing / Appearance) is a separate route, not in main nav.

### Center list

Dense but airy rows: type icon, title, username, tag chips, security dot, favorite star, last-used time, hover quick actions (copy user / copy pw / launch). Selection state uses `--brand-soft` left rail + subtle glass. Keyboard nav (↑↓, ⌘C, ⌘⇧C, /, ⌘N).

### Right inspector

The signature surface. Sections:
- Header: logo, title, type chip, vault, favorite, tags, last modified
- Credentials: username, password (reveal/copy/regen), website (launch), custom fields
- Security: strength meter, breach status, reuse warning, score
- History: password history with timestamps, version diff
- Linked: OTP code (live), attachments, linked identities
- Metadata: created, modified, last opened, device, sharing
- Bottom action bar: autofill · copy · share · move · archive · delete

### Working dummy flows (all wired in-memory via Zustand)

CRUD on items; favorite; archive; tag; duplicate; move vault; search/filter; password generator + strength; reveal/hide; copy with toast; password history; breach simulator. Passkeys: add/revoke/sync state, device binding. OTP: add via simulated QR / manual secret, rotating 30s codes (real TOTP via `otpauth`), copy. Documents: drag-drop (object URL previews), rename, tag, share, version list. Sharing: invite modal, role, revoke, temporary access, access history. Recovery kit generation. Trusted devices + sessions. Appearance: light/dark/compact. Billing: plan view, invoices list, upgrade modal (glassy card inspired by the mobile screenshot). Notifications prefs. Every state covered: loading, empty, success, error, hover, focus.

### Create-item flow

Centered glass modal, 12 item types (Password, API Key, Bank Card, Identity, Secure Note, SSH Key, WiFi, Server, Crypto Wallet, Document, License, Database) each with tinted icon. Keyboard-driven, auto-save dummy state, generator helpers.

### Routes

```
/                      → redirect to /vault
/vault                 → 3-pane vault (list + inspector)
/passkeys              → passkey grid
/otp                   → authenticator
/notes                 → secure notes (same 3-pane)
/documents             → documents split layout
/shared                → sharing center
/favorites · /archive  → filtered vault views
/account               → Account Center layout
  /account/profile · /security · /devices · /activity · /recovery · /billing · /appearance
```

### Tech notes

- TanStack Start route files under `src/routes/` using flat naming (`vault.tsx`, `account.profile.tsx`, etc.).
- Dummy data + actions in `src/lib/vault-store.ts` (Zustand, persisted to localStorage so flows survive reload).
- Components grouped: `src/components/shell/`, `src/components/vault/`, `src/components/inspector/`, `src/components/otp/`, `src/components/docs/`, `src/components/ui/*` (existing shadcn, restyled via tokens — no ad-hoc colors).
- Add deps: `zustand`, `otpauth`, `cmdk` (already via shadcn command), `framer-motion` for micro-interactions.
- Replace `src/styles.css` tokens; remove any old "Coming Soon" UI.
- SEO/meta per route; sitemap + robots.

### Out of scope (this pass)

Real backend, real encryption, real auth, real billing. All simulated locally so every flow demos end-to-end.

### Build order

1. Tokens + shell + sidebar + top bar + routes scaffolding
2. Zustand store with seeded dummy data
3. Vault 3-pane (list + inspector + create modal + generator)
4. OTP (live codes), Passkeys, Notes (reuse 3-pane)
5. Documents split layout
6. Shared, Favorites, Archive
7. Account Center (all sub-pages with working dummy actions)
8. Polish pass: motion, empty/error states, mobile bottom nav, glass billing card
