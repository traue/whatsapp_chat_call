# Handoff: WhatsOpener Redesign

## Overview
WhatsOpener is a tiny utility web app: open a WhatsApp chat with any phone number without saving the contact. The user picks a country (DDI), types a number, optionally adds a pre-filled message, and clicks "Abrir WhatsApp" — which opens `https://wa.me/<E.164>?text=<message>` in a new tab. The app also stores a local history of recent numbers (with editable aliases, favorites, and search), supports PT/EN, light/dark, and offers a QR-code of the link plus a "copy link" alternative.

## About the Design Files
The files in this bundle are **design references created in HTML+React via in-browser Babel** — prototypes showing intended look and behavior, not production code to copy directly. Recreate these designs in the target codebase's environment (React/Next.js, Vue, SwiftUI, native — whichever applies) using its established patterns and libraries. If no environment exists yet, **Next.js + React + TypeScript** is a sensible default for this kind of single-page utility.

The two HTML "variants" (`variant-a.jsx` and `variant-b.jsx`) are alternative designs presented side-by-side in a design canvas — pick one for production, or merge their best parts. Variant **A (Centered minimalist)** is recommended as the primary direction; variant B is for desktop-wide layouts where the history sidebar is always useful.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, copy, and interaction states are all set. Recreate pixel-perfectly using the target codebase's component library (or plain CSS modules / Tailwind if none exists).

## Screens / Views

### 1. Main view — Variant A (recommended)
- **Name**: WhatsOpener — Centered minimalist
- **Purpose**: Compose a WhatsApp link, open it, copy it, or scan its QR.
- **Layout**:
  - Single column, max-width **540 px**, centered horizontally.
  - Top header bar (full-width, padding `20px 32px`): logo + name on the left, language toggle (PT/EN segmented) + theme toggle on the right.
  - Main column flow (gap `28px` between blocks):
    1. **H1 tagline** ("Abrir WhatsApp." / "Open WhatsApp.") — 38px (regular density) or 44px (spacious), weight 600, letter-spacing -0.025em, line-height 1.05, text-wrap balance.
    2. **Number row**: pill-shaped (border-radius 14px) with country select on the left (flag + dial code, native `<select>` overlaid invisibly) | divider | numeric `<input>` (font-size 18px, tabular-nums, placeholder "DDD + número").
    3. **Message field**: small label "Mensagem (opcional)" + `<textarea>` (rows 2, min-height 56px, border-radius 12px).
    4. **Action row** (flex, gap 10px, wrap): primary "Abrir WhatsApp" button (flex 1 1 200px, accent color, 14px 18px padding, weight 600) + outline "Copiar link" + outline "QR code" toggle.
    5. **QR collapse** (only when valid + toggled): horizontal card with white-background QR (140px), hint text + monospace link preview.
    6. **Keyboard hint**: small `<kbd>Enter</kbd> abrir conversa` and `<kbd>⌘K</kbd> focar no número`.
    7. **History section**: H2 ("HISTÓRICO" small caps) + count + searchable list (see History component below).
    8. **Footer**: privacy line + "Pague-me um café" pill linking to Buy Me a Coffee.

### 2. Main view — Variant B (alt: desktop two-pane)
- **Layout**: CSS grid, columns `1fr 360px`. Accent strip (3px tall, gradient from accent→transparent) across the top.
- **Left pane** (padding `40px 56px`):
  - Eyebrow "WHATSOPENER" in accent, then large H1 (48px regular / 56px spacious, line-height 1.0, letter-spacing -0.03em).
  - Form **inside a card** (border-radius 18px, padding 24px, surface bg, subtle shadow): country+number row, message textarea, then a 2-column grid where the action stack (primary + copy) sits left and a 100×100px QR sits right.
  - Mono link preview below, separated by dashed border.
  - Footer at the very bottom of the column.
- **Right pane** (sidebar, sidebarBg color): always-visible compact history list with header ("HISTÓRICO" + count).

## Interactions & Behavior

### Number input
- `inputMode="tel"`, accepts free-form digits; `replace(/\D/g, '')` is applied before building the link.
- Considered **valid** when stripped digits length ≥ 6.
- **Enter key** (when focused): triggers "Abrir WhatsApp".
- **⌘K / Ctrl-K** (anywhere on page): focuses the number input.

### Open chat
- Builds `https://wa.me/<dial><digits>` (or with `?text=<encoded>` if message present).
- Persists entry to history (upserts, increments `opens`, updates `lastOpened`).
- `window.open(link, '_blank', 'noopener,noreferrer')`.

### Copy link
- `navigator.clipboard.writeText(link)`. Same upsert. Button label flips to "Copiado!" / "Copied!" for 1500 ms.

### QR code
- Generated client-side (no external API). Encodes the same `wa.me` link.
- Variant A: toggled via QR button; appears in a card below actions.
- Variant B: always visible (100px) when number is valid.

### History
- Stored in `localStorage` under key `wo:history:v1` as an array, max 200 entries.
- Each entry: `{ id, dial, number, country, alias, favorite, message, lastOpened, opens }`.
- Sorted favorites first, then by `lastOpened` descending.
- **Search**: filters by alias / number / `+dial+number`.
- **Click on row**: refills the form (country, number, message) and focuses the input.
- **Star button**: toggles favorite (filled star in accent when on).
- **Pencil button**: inline-renames alias (placeholder "Ex.: vendedor da OLX"). Enter saves, Escape cancels, blur saves.
- **Trash button**: removes the entry immediately (no confirm).
- **Clear all**: confirms via `confirm()`, then empties the array.
- Empty state shows two-line message: "Seus números recentes aparecem aqui." / "Tudo fica salvo só no seu navegador."

### Theme toggle
- Persisted under `wo:theme:v1`. Initial value: localStorage if set, else `prefers-color-scheme`.
- Sun/moon icon in header.

### Language toggle
- Persisted under `wo:lang:v1`. Initial value: localStorage if set, else `navigator.language` starts-with `pt` → `pt`, else `en`.
- Segmented control "PT | EN" in header.

### Country detection
- On first load (no history): scan `navigator.language` for region (e.g. `pt-BR` → `BR`); fall back: `pt*` → `BR`, else `US`.

## State Management
React local state with these hooks:
- `useHistory()` — items array, `upsert`, `update(id, patch)`, `remove(id)`, `clearAll()`. Persists to `localStorage`.
- `useTheme()` — `[theme, setTheme]` ('light' | 'dark'). Persists.
- `useLang()` — `[lang, setLang]` ('pt' | 'en'). Persists.
- Component-local: `country`, `number`, `message`, `showQR` (variant A only), `copied`.

No backend. Nothing leaves the browser.

## Design Tokens

### Color — Light theme
| Token | Value |
|---|---|
| Page bg (A) | `#f6f4ef` |
| Page bg (B) | `#fbfaf6` |
| Sidebar bg (B) | `#f1ede4` |
| Surface | `#ffffff` |
| Foreground | `rgba(20,30,25,0.92)` |
| Muted text | `rgba(20,30,25,0.5)` |
| Border | `rgba(0,0,0,0.09)` |
| Chip bg | `rgba(0,0,0,0.04)` |

### Color — Dark theme
| Token | Value |
|---|---|
| Page bg (A) | `#0e1311` |
| Page bg (B) | `#0d1311` |
| Sidebar bg (B) | `#11181a` |
| Surface | `rgba(255,255,255,0.04)` |
| Foreground | `rgba(255,255,255,0.92)` |
| Muted text | `rgba(255,255,255,0.55)` |
| Border | `rgba(255,255,255,0.10)` |
| Chip bg | `rgba(255,255,255,0.06)` |

### Accent presets
| Name | Hex |
|---|---|
| Sage (default) | `#3a7d5c` |
| Forest | `#1f5d44` |
| Olive | `#5a6b3a` |
| Graphite | `#2a2e2c` |
| Amber | `#a16438` |

### Typography
- Default: **Geist** (Google Fonts), weights 400/500/600/700.
- Alternates exposed via tweak: **Inter**, **Instrument Serif**.
- Mono for link previews / kbd: `ui-monospace, SFMono-Regular, Menlo, monospace`.
- Feature settings on body: `"ss01","cv11"`.
- H1 sizes: 38/44 (A) or 48/56 (B), letter-spacing -0.025em / -0.03em.
- Section headings: 13px, weight 600, uppercase, letter-spacing 0.04em.

### Spacing & shape
- Container padding: 32–56 px outer; 24px inside cards.
- Block gap: 28 px.
- Border-radius: 8 (chips), 10–12 (rows/buttons), 14 (input pill), 18 (cards), 999 (BMC pill).
- Shadows (light only): `0 1px 0 rgba(0,0,0,0.02), 0 24px 48px -32px rgba(20,30,25,0.12)` on the variant-B card.

## Internationalization
All copy keys are in `i18n.js` under `WO_I18N.pt` / `WO_I18N.en`. Both languages must be implemented; toggle is user-visible. Country names are also localized (`name.pt` / `name.en`).

## Tweakable surface (optional in production)
The prototype exposes a Tweaks panel with: accent color (5 presets + custom picker), font family (Geist / Inter / Instrument Serif), density (regular / spacious). In production these can be theme settings or simply locked to defaults — not user-facing must-haves.

## Country list
20 countries in `WO_COUNTRIES`, ordered Brazil-first (since this is a Brazilian-leaning utility). Each has `code`, `dial`, `flag` emoji, and `name.pt` / `name.en`.

## QR code generation
`qr.js` is a self-contained QR encoder (byte mode, EC level M, versions 1–10). Returns a `{size, data: bool[][]}` matrix; rendered as SVG `<rect>`s. **In production, replace with a maintained library** (e.g. `qrcode` npm package) — the inlined version was written for portability of the prototype and isn't worth maintaining.

## Footer & "Buy me a coffee"
- Footer text:
  - PT: "Tudo salvo localmente. Nada vai pra nenhum servidor." + "Sem afiliação com WhatsApp ou Meta."
  - EN: "Saved locally. Nothing leaves your browser." + "Not affiliated with WhatsApp or Meta."
- BMC pill: rounded outline, coffee icon + label. **Update the `href`** to the project's actual Buy Me a Coffee URL before shipping.

## Files in this bundle
- `WhatsOpener.html` — entry HTML, mounts both variants in a design-canvas viewport.
- `i18n.js` — translation strings, country list, link/format/relTime helpers, country auto-detect.
- `qr.js` — self-contained QR encoder (replace in prod).
- `opener-core.jsx` — shared hooks (`useHistory`, `useTheme`, `useLang`) and shared components (`QRPanel`, `CountrySelect`, `HistoryList`, `Footer`).
- `variant-a.jsx` — Centered minimalist design (recommended).
- `variant-b.jsx` — Two-pane / sidebar design.
- `design-canvas.jsx`, `tweaks-panel.jsx` — prototyping shell only; **do not port to production**.

## Implementation checklist for the dev
- [ ] Pick variant A or B (or merge — A's structure with B's always-visible QR is a strong combo).
- [ ] Replace `qr.js` with `qrcode` (or equivalent) npm dep.
- [ ] Move strings to your i18n framework (next-intl, react-i18next, etc.).
- [ ] Set the real Buy Me a Coffee URL in the footer.
- [ ] Decide whether the Tweaks panel ships (probably not).
- [ ] Consider rate-limiting `localStorage` writes if the history list gets edited rapidly (not a real concern at current scale).
- [ ] Add basic input validation feedback (the current "valid = ≥ 6 digits" rule is intentionally lax).
