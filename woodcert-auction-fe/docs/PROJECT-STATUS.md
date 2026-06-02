# Project Status

> Last updated: 2026-06-02 | By: Codex | Session: order-fulfillment-review-followup
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
- [x] Fulfillment API client and seller shipping confirmation UI on seller auction detail
- [x] Admin revenue page wired to backend revenue APIs
- [x] Automated FE unit test suite passes with 86 tests

## In Progress

- Responsive polish, order list pages, and advanced realtime/concurrency hardening.

## Deferred

- Address book UI
- Admin module beyond revenue page
- Public certificate verification
- Dedicated buyer/seller order list pages
- Dispute flows
- Production runtime env injection beyond initial static Vite assumptions
- Stored winner/loser notifications
- Sound/vibration and advanced realtime effects
- Advanced Playwright realtime/concurrency suite

## Warnings

- Backend auction runtime and buyer realtime contracts are integrated through public detail and bidding room.
- FE should consume the backend contracts directly; do not add local workarounds for participation context, bid history, or live bid payloads.
- Wallet funding must use VNPay Sandbox. Do not add mock wallet top-up, dev top-up, or any `POST /wallets/me/top-up` integration.
- Seller auction detail and shipping confirmation are implemented (polling is used for operational safety); realtime monitoring remains deferred until the buyer bidding cockpit is stable.
- CSRF mitigation for cookie-authenticated flows relies on backend `SameSite` behavior; explicit CSRF token strategy is deferred.

## Next Tasks

1. Add dedicated buyer/seller order list pages using `/orders/my-purchases` and `/orders/my-sales`.
2. Add focused unit tests for countdown thresholds, bid form validation, and participation-driven action states.
3. Add advanced Playwright coverage for realtime bidding and websocket reconnect recovery.

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
- [x] Appraiser queue/claim/appraise/reviewed workflow
- [ ] Seller product detail page

### Phase 5 - Hardening

- [x] Automated tests: 86 unit tests and 2 Playwright smoke tests
- [ ] Responsive polish
- [ ] Unit tests for event parsing, bid-history dedupe, countdown thresholds, bid form validation, and participation-driven action states
- [ ] Production deploy readiness
- [ ] Deferred module planning for `admin`
