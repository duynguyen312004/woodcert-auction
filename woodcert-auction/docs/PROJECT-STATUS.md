# Project Status

> Last updated: 2026-05-28 | By: Codex | Session: wallet-vnpay-ipn-authoritative-docs
>
> AI: update this file at the end of every backend session when asked.
> Follow this exact format. Keep it concise but decision-useful.

---

## Completed

- [x] Core app skeleton, shared DTO/exception layer, JWT infrastructure, RBAC, and modular-monolith baseline
- [x] Auth/session APIs with access token, refresh cookie/body support, refresh-token rotation, logout, cleanup job, and `@CurrentUserId`
- [x] Email verification and forgot/reset password with hashed one-time tokens, cooldown, safe mail logging, and refresh-token revocation after reset
- [x] Current-user profile GET/PUT/PATCH, avatar upload/confirm/delete, seller profile APIs, address APIs, and location master-data APIs
- [x] Shared media module: `media_assets` source of truth, signed Cloudinary upload intents, confirm-by-`assetId`, generated delivery URLs, and async cleanup
- [x] Catalog foundation: category seed/read APIs, seller draft product create/update/delete, media-backed product images, submit-for-appraisal flow
- [x] Appraiser workflow: claim/release, expired-claim visibility, immutable appraisal report, approve/reject, proof images, digital signature, certificate code, and seller reputation recalculation
- [x] Catalog read boundary hardened: `GET /api/v1/products` and `GET /api/v1/products/{id}` are internal seller/appraiser workflow APIs, not public marketplace APIs
- [x] Finance core: wallet, transactions, operation idempotency, lazy wallet creation, balance normalization, concurrency errors, internal freeze/unfreeze/deduct/deposit operations, and full-stack VNPay Sandbox integration
- [x] Auction foundation: `AuctionSession`, seller create/list/cancel, public list/detail, product/session locks, public filters, hidden reserve price, and seller summary enrichment
- [x] Auction runtime: participant registration, Redis-first bidding, Lua validation, anti-sniper extension, scheduler activation/close, STOMP broadcasts, async bid audit, and deposit settlement
- [x] Auction service refactor: facade plus command/query/assembler/policy/runtime services; grouped participant counts; `ProductImageHelper` reuse; Redis overlay for active read models
- [x] Backend unit/integration test suite passes with `mvn test` on 2026-05-28: 238 tests

## In Progress

- No backend feature is actively in progress in the current docs sync. Fulfillment/order flow is the next major backend domain.

## Deferred Issues

- Fulfillment/order/shipment/dispute implementation
- Category admin CRUD
- Admin appraiser provisioning and operational back office APIs
- Full controller/integration coverage with a dedicated test DB + Redis environment
- Repair job for rare close-time partial settlement after terminal auction DB commit

## Warnings

- `mvn test` passed on 2026-05-28: 238 tests, 0 failures.
- API and database docs may include planned fulfillment/order/dispute contracts, but no `feature/fulfillment` implementation exists yet.
- Do not start fulfillment/dispute before auction winner flow, finance settlement contract, and repair strategy are stable.

## Next Tasks

1. Add fulfillment/order flow on top of `ENDED_SUCCESS` auction results.
2. Add repair path for terminal auction sessions with remaining `FROZEN` deposits.
3. Add integration coverage for auction controller/runtime paths with test DB + Redis.
4. Add category/admin management only after core marketplace flows are stable.

## Milestones

### Phase 0 - Foundation

- [x] Core app skeleton, exception handling, JWT infrastructure, modular-monolith baseline

### Phase 1 - Identity & Access

- [x] Auth/session APIs
- [x] Email verification
- [x] Forgot/reset password with hashed one-time tokens, cooldown, and refresh-token revocation
- [x] Profile, seller profile, address, and location APIs
- [x] Avatar APIs under identity using shared media services

### Phase 2 - Catalog & Appraisal Workflow

- [x] Category read API + seed data
- [x] Seller draft product lifecycle with media-backed images
- [x] Product submit-for-appraisal flow
- [x] Appraiser claim/release and expired-claim handling
- [x] Appraiser report submission with immutable report, proof images, digital signature, and seller accuracy
- [x] Internal catalog list/detail rules for seller and appraiser only
- [x] Catalog is explicitly no longer the buyer/public marketplace read module

### Phase 3.1 - Auction Foundation

- [x] Auction session domain, repository, service, controller, and DTOs
- [x] Seller create/list/cancel flow for seller-owned `APPRAISED` products
- [x] One open `WAITING` / `ACTIVE` session per product, with multiple sessions over time allowed
- [x] Public auction list/detail APIs with reserve price hidden
- [x] Validation rules for `startingPrice`, `reservePrice`, `stepPrice`, `depositAmount`, `startTime`, and `endTime`

### Phase 3.2 - Finance Core For Auction

- [x] Wallet and wallet transaction model
- [x] Wallet operation idempotency lifecycle
- [x] Internal `deposit`, `freeze`, `unfreeze`, and `deductFrozen`
- [x] `GET /wallets/me`
- [x] `GET /wallets/me/transactions`
- [x] VNPay Sandbox integration (`POST /wallets/me/deposit`, `GET /wallets/vnpay/return`, `GET /wallets/vnpay/ipn`)
- [x] VNPay transaction query and history APIs (`GET /wallets/me/deposits`, `GET /wallets/me/deposits/{txnRef}`)

### Phase 3.3 - Auction Runtime

- [x] Auction participants and bids
- [x] Auction registration with deposit freeze
- [x] Redis runtime hash and bidder set
- [x] Lua bid validation and anti-sniper extension
- [x] Redis-first bid flow with async DB audit
- [x] WebSocket/STOMP auction broadcasts
- [x] Scheduler activation and close with idempotent settlement
- [x] Runtime docs: `CONTEXT.md`, `AUCTION_RUNTIME_INVARIANTS.md`, `AUCTION_RUNTIME_SEQUENCE.md`

### Phase 4 - Fulfillment & Dispute

- [ ] Order, shipment, and dispute domain
- [ ] Escrow remainder payment and release/refund flows
- [ ] Auto-complete and dispute resolution
