# Project Status

> Last updated: 2026-05-08 | By: Codex | Session: auction-service-refactor-docs
>
> AI: update this file at the end of every session when asked.
> Follow this exact format. Keep it concise but decision-useful.

---

## Completed
- [x] Core app skeleton, shared DTO/exception layer, JWT infrastructure, and modular-monolith baseline
- [x] Security foundation: JWT auth, RBAC, refresh token rotation, `@CurrentUserId`, and method-level permission checks
- [x] Identity foundation: auth/session APIs, seller profile APIs, address APIs, and location master-data APIs
- [x] Current-user profile GET/PUT/PATCH with input hardening and phone normalization
- [x] Avatar APIs moved under `identity`, using shared media upload/confirm/delete flow
- [x] Shared media foundation: `media_assets` as source of truth instead of raw cloud URLs in domain tables
- [x] Shared media foundation: signed Cloudinary upload-intent + confirm-by-`assetId`
- [x] Shared media foundation: async cleanup with 3 phases for stale `PENDING`, orphan `ACTIVE`, and Cloudinary destroy retry
- [x] Catalog foundation: entities, repositories, DTOs, services, controllers, and category seed data
- [x] Seller product workflow: create/update/delete `DRAFT`, attach media-backed images, submit appraisal
- [x] Appraiser workflow: immutable appraisal report, certificate code generation, proof-image media flow
- [x] Catalog read APIs hardened as internal workflow APIs
- [x] `GET /api/v1/products` is no longer public-facing; it now serves seller/appraiser visibility only
- [x] `GET /api/v1/products/{id}` enforces owner/appraiser-only access with `PRODUCT_NOT_FOUND` fallback
- [x] Buyer/public product browse-detail responsibility is explicitly deferred to the future `auction` module
- [x] Catalog-media cleanup hardening: list thumbnail batch loading with fallback to first image when primary flag is missing
- [x] Test coverage expanded around catalog access control, image replacement/cleanup, image fallback, and avatar refactor
- [x] Auction foundation: `AuctionSession` domain, seller create/list/cancel flow, and public auction browse/detail APIs
- [x] Auction boundary rules finalized: one open session per product, `reservePrice >= startingPrice`, min step/deposit, and start/end time guards
- [x] Public auction detail hides `reservePrice`
- [x] Seller-side cancel endpoint uses `PATCH /api/v1/auctions/{id}/cancel` because cancellation is a status transition, not a hard delete
- [x] Finance core: wallet domain, transaction audit log, wallet read APIs, and dev/test top-up path
- [x] Finance core: internal wallet operations are available for next auction phase (`deposit`, `freeze`, `unfreeze`, `deductFrozen`)
- [x] Finance core hardened: idempotent wallet mutations, explicit concurrency error, money normalization, and top-up feature flag
- [x] Auction runtime complete: registration, Redis-first bidding, activation/close scheduler, WebSocket events, and deposit settlement
- [x] Auction service refactor: `AuctionServiceImpl` is now a facade over command/query services, response assembler, policy, and runtime snapshot service
- [x] Auction read model hardened: Redis overlays `ACTIVE` current price/end time with DB fallback
- [x] Auction create/cancel race hardening: product/session pessimistic locks for simple conflict protection
- [x] Auction list performance: participant counts use grouped query instead of per-session count loop
- [x] Auction media reuse: response assembly uses `ProductImageHelper`

## In Progress
- Fulfillment/order flow is the next major domain after auction winner settlement is stable

## Deferred Issues
- Full controller/integration test coverage
- Category admin CRUD
- Fulfillment/dispute implementation
- Repair job for rare close-time partial settlement after terminal DB commit

## Warnings
- `.\mvnw.cmd -Dtest=!WoodcertAuctionApplicationTests test` passed after the auction service refactor
- `.\mvnw.cmd clean test` still requires a reachable MySQL instance for `WoodcertAuctionApplicationTests.contextLoads`
- Do not start fulfillment/dispute before auction winner flow and finance settlement contract are stable

## Next Tasks
1. Add fulfillment/order flow on top of `ENDED_SUCCESS` auction results
2. Add integration coverage for auction controller/runtime paths with test DB + Redis
3. Add repair path for terminal sessions with remaining `FROZEN` deposits

## Milestones

### Phase 0 - Foundation
- [x] Core app skeleton, exception handling, JWT infrastructure, modular-monolith baseline

### Phase 1 - Identity & Access
- [x] Auth/session APIs
- [x] Profile, seller profile, address, and location APIs
- [x] Avatar APIs under identity using shared media services

### Phase 2 - Catalog & Appraisal Workflow
- [x] Category read API + seed data
- [x] Seller draft product lifecycle with media-backed images
- [x] Appraiser report submission with immutable appraisal report
- [x] Internal catalog list/detail rules for seller and appraiser only
- [x] Catalog is explicitly no longer the buyer/public marketplace read module

### Phase 3.1 - Auction Foundation
- [x] Introduce `AuctionSession` domain, status enum, repository, service, and controller package
- [x] Define create-session rules for seller-owned `APPRAISED` products only
- [x] Freeze business rule for a product already linked to an auction session:
- [x] multiple sessions over time are allowed
- [x] more than one open (`WAITING` / `ACTIVE`) session at once is not allowed
- [x] Define seller-side auction management before start:
- [x] create session
- [x] view own sessions
- [x] cancel session via status transition before start
- [x] Implement public buyer-facing auction list API
- [x] Implement public buyer-facing auction detail API
- [x] Define auction read model fields sourced from:
- [x] catalog product data
- [x] appraisal verified data
- [x] auction session state data
- [x] Finalize validation rules for:
- [x] `startingPrice`, `reservePrice`, `stepPrice`
- [x] `startTime`, `endTime`
- [x] ownership and product status checks

### Phase 3.2 - Finance Core For Auction
- [x] Introduce `Wallet` and `WalletTransaction` with optimistic locking
- [x] Implement internal money operations needed by auction:
- [x] deposit
- [x] freeze
- [x] unfreeze
- [x] deduct
- [x] Implement `GET /wallets/me`
- [x] Implement `GET /wallets/me/transactions`
- [x] Add a practical dev/test top-up path so FE and auction testing are not blocked
- [x] Freeze transaction/reference types needed by auction registration and settlement

### Phase 3.3 - Auction Runtime ✅ COMPLETE
- [x] `AuctionParticipant` entity + `DepositStatus` enum + `AuctionParticipantRepository`
- [x] `Bid` entity + `BidStatus` enum + `BidRepository`
- [x] `AuctionSessionRepository` — added scheduler queries with PESSIMISTIC_WRITE lock
- [x] Auction registration: `POST /auctions/{id}/register` — freeze deposit + insert participant
- [x] `AuctionRedisService` — Redis session hash + bidder set management
- [x] `BidLuaScript` — atomic bid validation + anti-sniper (30s/60s) via Lua
- [x] `BidService` + `BidServiceImpl` — Redis-first bid flow
- [x] `BidPersistenceService` — async best-effort bid audit log
- [x] `BidController` — `POST /api/v1/bids` with `CREATE_BID` permission
- [x] `AuctionBroadcastService` — SESSION_ACTIVATED, NEW_BID, SESSION_ENDED via STOMP
- [x] `AuctionSessionScheduler` — activate every 5s, close every 5s with idempotent settlement
- [x] `WebSocketConfig` + `AsyncConfig` + SecurityConfig WebSocket permit
- [x] `AuctionProperties` config class + yaml auction block
- [x] ErrorCode: AUCTION_NOT_ACTIVE, AUCTION_ALREADY_REGISTERED, AUCTION_SESSION_NOT_REGISTRABLE, AUCTION_BIDDER_NOT_REGISTERED, AUCTION_SELF_BIDDING_NOT_ALLOWED, BID_AMOUNT_TOO_LOW, BID_AUCTION_ENDED
- [x] `CONTEXT.md` + `AUCTION_RUNTIME_INVARIANTS.md` + `AUCTION_RUNTIME_SEQUENCE.md`
- [x] `AuctionServiceImpl` facade split into command/query/assembler/policy/runtime services
- [x] Redis overlay for `ACTIVE` read responses with DB fallback
- [x] Product/session pessimistic locks for create/cancel race protection
- [x] Grouped participant counts for public/seller auction lists
- [x] Auction response image selection reused through `ProductImageHelper`

### Phase 4 - Fulfillment & Dispute
- [ ] Order, shipment, dispute domain
- [ ] Escrow release / refund flows
- [ ] Auto-complete and dispute resolution
