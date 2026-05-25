# Project Status

> Last updated: 2026-05-26 | By: Codex | Session: seller-auction-workflow-mvp
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
- [x] Wallet balance hook `useWalletBalance` wired into the public header `WalletWidget`
- [x] Seller portal guard/layout/sidebar
- [x] Seller register/profile/dashboard/product list/product create-edit/media upload flows
- [x] Seller auction create/list/cancel/detail workflow using POST /auctions, GET /auctions/me, PATCH /auctions/{id}/cancel, and GET /auctions/me/{id}
- [x] Seller appraisal tracking route exists as placeholder only
- [x] Appraiser workflow complete: queue, active/expired claims, detail, claim/release, proof upload, approve/reject, reviewed tabs
- [x] Public appraiser guard redirects appraisers away from public routes
- [x] Automated FE unit test suite passes: `pnpm test` on 2026-05-26, 21 files, 59 tests

## In Progress

- No FE implementation is actively in progress in this docs sync.

## Deferred

- Auction detail page at `/auctions/:id`
- Auction registration and realtime bidding room
- Full wallet page and transaction history page
- Buyer bid history
- Address book UI
- Admin module beyond structural placeholder
- Public certificate verification
- Order, fulfillment, shipping, dispute flows
- Payment provider integration
- Production runtime env injection beyond initial static Vite assumptions

## Warnings

- Backend auction runtime is ready for FE integration, but FE has only public auction list so far.
- Wallet header balance uses real API; there is no full wallet page yet.
- Seller auction detail is implemented (polling is used for operational safety); realtime monitoring remains deferred until the buyer bidding cockpit is stable.
- CSRF mitigation for cookie-authenticated flows relies on backend `SameSite` behavior; explicit CSRF token strategy is deferred.

## Next Tasks

1. Auction detail: `GET /auctions/{id}` -> page at `/auctions/:id`.
2. Auction registration: `POST /auctions/{id}/register` from detail/bidding entry points.
3. Wallet page: `GET /wallets/me`, `GET /wallets/me/transactions`, `POST /wallets/me/top-up`.
4. Realtime bidding room with feature-scoped STOMP lifecycle and REST reconciliation.
5. Seller auction realtime monitoring only after public detail and bidding room are stable (basic detail is already implemented).

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
- [ ] Auction detail page at `/auctions/:id`
- [ ] Auction countdown display with server-time offset

### Phase 3 - Buyer Runtime

- [x] Login and session recovery
- [x] Registration and email verification
- [x] Wallet balance in header
- [ ] Wallet and transactions page
- [ ] Auction registration
- [ ] Realtime bidding room

### Phase 4 - Seller and Appraiser Workflow

- [x] Seller profile/register/dashboard/product list/product create-edit
- [x] Product media upload
- [x] Seller auction create/list/cancel/detail real flows
- [x] Appraiser queue/claim/appraise/reviewed workflow
- [ ] Seller product detail page

### Phase 5 - Hardening

- [x] Automated tests: 59 unit tests
- [ ] Responsive polish
- [ ] Production deploy readiness
- [ ] Deferred module planning for `admin`
