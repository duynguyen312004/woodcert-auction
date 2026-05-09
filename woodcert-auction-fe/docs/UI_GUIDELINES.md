# UI Guidelines

## Design Direction

The FE should feel operational, reliable, and fast.

Principles:

- clear information hierarchy
- strong readability for money and time
- low-friction workflows
- explicit state transitions
- responsive but not visually noisy

## Styling Foundation

- Tailwind is the styling base.
- shadcn/ui provides primitives, not finished feature design.
- Project-specific wrappers and tokens should define final identity.

## Layout Rules

- Use stable application layouts from `app/layouts`.
- Page shell, sidebar, header, and content regions should be composable but predictable.
- Avoid card-in-card compositions for normal page structure.
- Use cards for repeated items, dialogs, and isolated tools only.

## Typography

- Prefer one primary UI typeface and one optional accent typeface.
- Prioritize legibility over decorative styles in auction and finance flows.
- Money, timestamps, and bid values must remain easy to scan.

## Color

- Define semantic tokens early:
  - background
  - surface
  - border
  - text
  - muted text
  - success
  - warning
  - danger
  - accent
- Avoid relying on purple-heavy defaults.
- Use color to clarify status, not to decorate everything.

## Component Rules

Use shared or wrapped components for:

- buttons
- inputs
- selects
- dialogs
- tabs
- data tables
- status badges
- loading skeletons

Feature-specific components should live inside the feature unless they are clearly reusable.

## Page State Rules

Every major screen must explicitly handle:

- loading
- empty
- error
- success
- refetching or stale state when relevant

Realtime auction screens must also show:

- disconnected or reconnecting websocket state
- stale countdown fallback behavior when needed

## Auction UX Rules

### Auction List

- prioritize product image, title, status, current price, deposit, and time window
- default public view should emphasize `WAITING` and `ACTIVE`

### Auction Detail

- show current price prominently
- show countdown clearly
- show deposit and step price near bidding controls
- do not expose reserve price publicly

### Bidding Room

- bid input should default to `currentPrice + stepPrice`
- submit state must clearly indicate pending and disabled reasons
- websocket patches may update visible values immediately
- background refetch must remain invisible unless it changes meaningful state

## Forms

- Use React Hook Form and Zod once code scaffold begins.
- Validation errors should appear close to the field.
- Money and datetime inputs must be formatted consistently.
- Product and appraisal media uploads must show per-file progress and status.

## Wallet and Money Display

- All money must be formatted consistently in VND.
- Available and frozen balances should be visually distinct.
- Wallet transaction types should map to predictable status colors and labels.

## Responsive Rules

- Mobile is required from the start.
- Prevent text overflow in action buttons and auction cards.
- Critical auction room actions must remain reachable on narrow screens.
- Keep dense data readable without horizontal scrolling whenever possible.
