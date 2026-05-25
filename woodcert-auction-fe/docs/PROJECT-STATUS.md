# Project Status

> Last updated: 2026-05-25 | By: AI Agent | Session: appraiser-workflow-hardening
>
> Update this file at the end of FE planning or implementation sessions.
> Keep it concise and decision-useful.

---

## Completed

- [x] FE scope aligned to the verified backend MVP
- [x] Stack decisions locked: React, TypeScript, Vite, Tailwind, shadcn/ui, TanStack Query, Zustand, Axios, SockJS, STOMP, pnpm, Docker, nginx
- [x] Official FE architecture chosen as hybrid feature-first
- [x] FE routing model locked as feature-owned route exports composed in `app/router`
- [x] Auth model locked as memory-first access token with refresh flow support
- [x] Axios chosen as the standard HTTP client with interceptor-based refresh and retry
- [x] Realtime rules locked: feature-scoped websocket lifecycle, hot cache patch, reconnect refetch, REST source of truth
- [x] Clock synchronization rules locked for auction countdown accuracy
- [x] FE docs baseline created: architecture, rules, setup, API integration, UI, testing, ADR
- [x] Vite React TypeScript scaffold created
- [x] Tailwind v4 and shadcn/ui baseline configured
- [x] React Router v7 route composition scaffolded
- [x] Shared Axios client, auth store, QueryClient provider, typed env config, and app shell created
- [x] ESLint, Prettier, Husky, lint-staged, Vitest, MSW, and Playwright configured
- [x] Auth UI and logic (Login, Register, Verify Email) fully implemented in Vietnamese, integrating real BE APIs
- [x] ProtectedRoute component with three-state guard (`loading` → `anonymous` → `authenticated`)
- [x] Session recovery via silent refresh at app boot (`shared/auth/auth-initializer.ts`)
- [x] Backend refresh-cookie properties made configurable (`RefreshCookieProperties`), `Secure` flag disabled in local profile
- [x] Feature ownership refactored: auction hooks/components in `features/auction`, catalog hooks/components in `features/catalog`, `features/home` is pure composition only
- [x] `features/catalog` has public `index.ts` (`CategoryFilter`, `useCategories`, `Category` type)
- [x] `features/auction` has public `index.ts` (`AuctionListContent`, `usePublicAuctions`, `ArtAuctionCard`, types)
- [x] Query keys aligned to convention: `["auctions", "list", params]`, `["catalog", "categories"]`
- [x] **Appraiser workflow hoàn thiện** — queue → claim → appraise/reject → reviewed
  - `AppraiserQueuePage`: hiển thị hàng chờ, tab đang kiểm định, badge "Claim hết hạn" cho claim hết hạn, CTA "Nhận lại kiểm định"
  - `AppraiserProductDetailPage`: claim, release, form kiểm định (approve/reject), upload ảnh bằng chứng kèm mô tả, đọc report read-only (notes, sellerAccuracy, digitalSignature, proofImages), điều hướng sang reviewed tab sau submit
  - `AppraiserReviewedPage`: tab APPRAISED/REJECTED theo query param `?status=`, link xem chi tiết
  - `PublicAppraiserGuard`: redirect appraiser khỏi public routes
  - `AppraiserPortalGuard`: chặn non-appraiser vào portal với nút logout
  - Types: `AppraisalReportDetail` bao gồm `appraiserNotes`, `sellerAccuracy`, `proofImages[]`
  - API: `appraisalApi` — getQueue, getMyActive, getReviewed, getProductDetail, claimProduct, releaseClaimProduct, submitAppraisal, uploadProofImage
  - Test coverage: 50 unit tests pass — queue rendering (pending/expired/active), sidebar logout, proof image uploader description, appraisal API payload, guard redirects

## In Progress

- Auction detail page (`GET /auctions/{id}`) and route `/auctions/:id`

## Deferred

- `features/admin`
- order, fulfillment, shipping, dispute flows
- payment provider integration
- production runtime env injection strategy beyond the initial Docker + nginx baseline
- Public certificate verification (buyer/public lookup)
- Admin appraiser provisioning management

## Warnings

- Backend auction runtime is ready for FE integration, and FE foundation code now exists
- Backend docs contain some legacy status notes that should later be reconciled with the current passing test suite
- CSRF mitigation for cookie-authenticated flows relies on `SameSite` behavior; stronger CSRF token strategy is deferred

## Next Tasks

1. Auction detail: `GET /auctions/{id}` → page at `/auctions/:id`, wire `ProtectedRoute` for register/bid actions
2. Auction list page at `/auctions` with server-side filter by status/category and pagination
3. Wallet: `GET /wallets/me` → replace hardcoded balance in `Header`; `WalletWidget` receives real data from `features/wallet`
4. Implement buyer wallet and bidding room (Phase 3)
5. Add websocket runtime scoped to bidding room route

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

- [x] Category data wiring (`GET /categories` → `useCategories` → `CategoryFilter`)
- [x] Auction list (`GET /auctions` → `usePublicAuctions` → `AuctionListContent` on home page)
- [ ] Auction list page at `/auctions` with full filter/pagination
- [ ] Auction detail page at `/auctions/:id`
- [ ] Auction countdown display (server-time offset — `shared/time/`)

### Phase 3 - Buyer Runtime

- [x] Login and session recovery
- [x] Registration and verify email
- [ ] Wallet and transactions
- [ ] Auction registration
- [ ] Realtime bidding room

### Phase 4 - Seller and Appraiser Workflow

- [ ] Seller profile
- [ ] Product CRUD and media upload
- [x] Appraiser workflow — queue/claim/appraise/reviewed (hoàn thiện, có test)
- [ ] Seller auction create/list/cancel

### Phase 5 - Hardening

- [x] Automated tests (50 unit tests, no warnings)
- [ ] Responsive polish
- [ ] Production deploy readiness
- [ ] Deferred module planning for `admin`
