# Project Status

> Last updated: 2026-06-13 | By: Codex | Session: 404-and-bundle-optimization
>
> Update this file at the end of FE planning or implementation sessions.
> Keep it concise and decision-useful.

---

## Completed

- [x] FE scope aligned to the verified backend MVP
- [x] Stack decisions locked: React 19, TypeScript, Vite 7, Tailwind v4, shadcn/ui, TanStack Query, Zustand, Axios, SockJS/STOMP, pnpm 11, Vitest, Playwright
- [x] Hybrid feature-first architecture and feature-owned route exports composed in `app/router`
- [x] Public, seller, appraiser, and auth layouts/guards
- [x] Auth flow: login, register, pending verification, verify email, forgot/reset password, logout, and silent refresh at app boot
- [x] Shared Axios client with `ApiResponse<T>` unwrap, normalized errors, `401 -> refresh -> retry`, and credentialed requests
- [x] Zustand auth/session store and memory-first access-token model
- [x] TanStack Query provider and query-key conventions in active features
- [x] Public home page and auction list page at `/auctions`
- [x] Category API integration and auction list API integration
- [x] Account profile page with profile update and avatar upload flow
- [x] Wallet integration: dedicated Wallet page (`/wallet`) showing real balances and transaction logs table
- [x] VNPay Sandbox deposit flow: amount selector page (`/wallet/deposit`), result page (`/wallet/deposit/result`), and deposit history on `/wallet`
- [x] Backend buyer realtime contracts are available: participation context, bid history, and enriched `NEW_BID` WebSocket payload
- [x] Realtime bidding room cockpit layout at `/bidding/:auctionId` (WebSocket/SockJS client, price tick, countdown pulse, anti-sniper banner, ended outcome overlay)
- [x] Public auction detail page at `/auctions/:auctionId` with gallery, product/appraisal detail, price/deposit/step summary, status-aware CTA, and list/home cards routed through detail first
- [x] Buyer auction history at `/my-auctions` and buyer auction detail with order payment/receive integration
- [x] Order UI primitives: summary card and fee breakdown for buyer/seller views
- [x] Buyer `/orders` and seller `/seller/orders` pages with status tabs, pagination, payment, shipping, receive, and dispute actions
- [x] Dispute FE integration: evidence upload, buyer open/cancel/current state, seller read-only banner/state, and admin review/resolve flow
- [x] Dedicated admin layout with overview dashboard, revenue, dispute queue/detail, categories, users, and audit-log pages
- [x] Admin user management page wired to `/admin/users` (role/status filters, pagination, account/capability ban actions, and appraiser creation); appraisers are filtered through `/admin/users?role=ROLE_APPRAISER`
- [x] Seller capability suspension UI keeps historical data readable, shows the admin reason/time, disables commercial write actions, and preserves paid-order shipping
- [x] Admin overview dashboard aggregates total users, open disputes, and total revenue from existing endpoints
- [x] Shared `Pagination` component extracted to `shared/ui` and applied to admin revenue/disputes/users tables
- [x] Public certificate verification page and address book UI
- [x] Seller product detail page and `RETURNED` sale status display
- [x] Fulfillment API client and seller shipping confirmation UI on seller auction detail
- [x] Admin revenue page wired to backend revenue APIs
- [x] Automated FE unit test suite passes with 156 tests and 6 Playwright tests
- [x] Order tabs use backend `status` filter and buyer/seller status counts
- [x] Bidding room refetches detail, participation, and bid history after socket connect/reconnect
- [x] Buyer can withdraw once from a `WAITING` auction, receive the full deposit refund, and cannot register again
- [x] Auction countdown and seller auction validation use shared server clock offset from `/system/time`
- [x] Product fallback image centralized through `FALLBACK_PRODUCT_IMAGE`
- [x] Route pages lazy-load across auth, public secondary pages, auction, account, buyer, wallet, certificate, admin, seller, appraiser, blog, and bidding
- [x] Shared custom 404 page preserves the public, seller, appraiser, and admin layouts with role-appropriate return actions
- [x] Vite vendor chunks split React/router, data, forms, and realtime dependencies without raising `chunkSizeWarningLimit`
- [x] Seller appraisal route/menu removed; `/seller/appraisals` is no longer valid
- [x] Home category image mapping updated for the new flat seeded category slugs
- [x] Blog remains static/mock content, not a CMS/API-backed feature
- [x] Seller Portal v1: exact product KPIs, draft deletion, editable store name, action center, order detail, shipping address snapshots, revenue page, and seller auction realtime
- [x] Shared auction STOMP subscription used by buyer bidding and seller monitoring, with 10-second seller polling fallback
- [x] Frontend verification passes: typecheck, lint, 156 unit tests, 6 Playwright tests, and production build

## In Progress

- Full browser acceptance from a clean database with real SMTP, Cloudinary, and VNPay Sandbox credentials.
- Responsive acceptance for public, buyer, seller, appraiser, and admin screens.

## Deferred

- Production runtime env injection beyond initial static Vite assumptions
- Stored winner/loser notifications
- Sound/vibration and advanced realtime effects
- Advanced Playwright realtime/concurrency suite

## Warnings

- Backend auction runtime and buyer realtime contracts are integrated through public detail and bidding room.
- FE should consume the backend contracts directly; do not add local workarounds for participation context, bid history, or live bid payloads.
- Wallet funding must use VNPay Sandbox. Do not add local wallet funding shortcuts.
- Seller auction detail consumes shared STOMP events immediately and retains 10-second polling for operational reconciliation.
- Order status tabs must keep using backend `status` filters and status-count endpoints; do not reintroduce page-local filtering.
- Cookie refresh/logout uses backend double-submit CSRF via `GET /auth/csrf` and `X-XSRF-TOKEN`.
- Production build has no JavaScript chunk over 500 KB. Main entry is 410.76 KB (127.91 KB gzip), down from about 889 KB; the largest forced vendor chunk is 101.72 KB.

## Next Tasks

1. Run the clean-database browser checklist with real SMTP, Cloudinary, and VNPay Sandbox.
2. Verify realtime bidding, reconnect recovery, settlement, payment, shipping, and both dispute outcomes.
3. Complete the responsive acceptance pass.

## Milestones

### Phase 0 - FE Docs Foundation

- [x] Architecture decisions locked
- [x] Rules and conventions documented
- [x] Integration constraints documented
- [x] Testing stack documented

### Phase 1 - FE Scaffold and Core Infrastructure

- [x] Vite React TypeScript scaffold
- [x] Tailwind and shadcn/ui setup
- [x] Axios client and interceptor chain
- [x] Zustand auth store
- [x] TanStack Query provider
- [x] Router composition

### Phase 2 - Public Auction Experience

- [x] Category data wiring
- [x] Auction list on home page and `/auctions`
- [x] Auction detail page at `/auctions/:id`
- [x] Detail countdown from REST auction start/end time

### Phase 3 - Buyer Runtime

- [x] Login and session recovery
- [x] Registration and email verification
- [x] Wallet balance in header
- [x] Wallet balance, wallet transactions, VNPay deposit form, result page, and deposit history
- [x] VNPay Sandbox deposit integration (amount selector, redirect, result page, deposit history)
- [x] Auction registration
- [x] STOMP/SockJS realtime client
- [x] Buyer bid history from `GET /auctions/{id}/bids`
- [x] Realtime bidding room
- [x] Ended overlay with participation refetch for winner/loser state
- [x] Buyer auction history and detail pages with order payment/receive actions

### Phase 4 - Seller and Appraiser Workflow

- [x] Seller profile/register/dashboard/product list/product create-edit
- [x] Product media upload
- [x] Seller auction create/list/cancel/detail real flows
- [x] Seller shipping confirmation from auction detail when order is paid
- [x] Seller order list and seller product detail page
- [x] Appraiser queue/claim/appraise/reviewed workflow

### Phase 5 - Hardening

- [x] Automated tests: 156 unit tests and 6 Playwright tests
- [ ] Responsive polish
- [x] Unit tests for server clock, reconnect callback, category slug mapping, order status API params/counts, fallback image, and seller appraisal route removal
- [ ] Further unit tests for bid-history dedupe, countdown thresholds, bid form validation, and participation-driven action states
- [ ] Production deploy readiness
