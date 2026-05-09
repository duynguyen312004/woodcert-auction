# Project Status

> Last updated: 2026-05-09 | By: Codex | Session: fe-foundation-scaffold
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

## In Progress

- Next major step is implementing the public auction list/detail experience

## Deferred

- `features/admin`
- order, fulfillment, shipping, dispute flows
- payment provider integration
- production runtime env injection strategy beyond the initial Docker + nginx baseline

## Warnings

- Backend auction runtime is ready for FE integration, and FE foundation code now exists
- Backend docs contain some legacy status notes that should later be reconciled with the current passing test suite
- Cookie-authenticated refresh flow requires backend CORS and CSRF behavior to stay aligned with FE docs

## Next Tasks

1. Implement public auction list and detail
2. Implement buyer wallet, registration, and bidding room
3. Implement seller and appraiser workflows
4. Add websocket runtime only when auction detail or bidding room lifecycle is implemented
5. Expand automated coverage as feature flows are added

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

- [ ] Category data wiring
- [ ] Auction list
- [ ] Auction detail
- [ ] Auction countdown display

### Phase 3 - Buyer Runtime

- [ ] Login and session recovery
- [ ] Wallet and transactions
- [ ] Auction registration
- [ ] Realtime bidding room

### Phase 4 - Seller and Appraiser Workflow

- [ ] Seller profile
- [ ] Product CRUD and media upload
- [ ] Appraisal workflow
- [ ] Seller auction create/list/cancel

### Phase 5 - Hardening

- [ ] Automated tests
- [ ] Responsive polish
- [ ] Production deploy readiness
- [ ] Deferred module planning for `admin`
