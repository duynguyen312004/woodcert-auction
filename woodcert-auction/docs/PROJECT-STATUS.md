# Project Status

> Last updated: 2026-06-06 | By: Codex | Session: seller-portal-v1
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
- [x] Buyer realtime API support: authenticated participation context, public bid history with optional `mine`, enriched `NEW_BID` payload, and Lua `extendedByMs`
- [x] Order module: source-adapter boundary, order creation from auction settlement, buyer/seller order list/detail APIs, remainder payment, overdue payment cancellation, and forfeited deposit split
- [x] Fulfillment module: pending shipment creation, seller shipping confirmation, buyer received confirmation, shipped auto-complete, seller payout, and platform commission recording
- [x] Dispute module: buyer evidence upload, open/cancel/current APIs, admin queue/detail/review/resolve APIs, seller-wins payout path, buyer-wins refund path, and scheduler skip for disputed orders
- [x] Back-office APIs: admin category CRUD, admin appraiser create/demote, and public certificate verification lookup
- [x] Admin user management: `GET /admin/users` (role/status/keyword filter, paginated) and `PATCH /admin/users/{id}/ban|unban` guarded by `BAN_USER`, with self-ban and admin-ban protection; legacy `GET /admin/appraisers` removed in favor of `GET /admin/users?role=ROLE_APPRAISER`
- [x] Seller capability suspension is read-only: historical seller data stays accessible, new listing/auction actions are blocked, paid-order fulfillment remains available, and `/users/me` exposes the reason and update time
- [x] Product sale status supports `RETURNED` for buyer-wins disputes without automatic relist
- [x] Platform revenue APIs for admin revenue stats and transaction history
- [x] Order/Fulfillment/Dispute unit coverage added for service and scheduler paths
- [x] Expose buyer outcome contract (winner, outcomeCode, outcomeMessage) và highestBidderMaskedAlias trong chi tiết đấu giá và participation context
- [x] Backend unit/integration test suite passes with `mvn test`
- [x] Flyway migrations added: baseline schema with optimistic-lock columns and reference seed data
- [x] Production/base config hardened: Flyway enabled, Hibernate `ddl-auto=validate`, SQL init disabled, SQL logging off
- [x] RBAC admin permissions clarified: `ADMIN_ACCESS`, `MANAGE_CATEGORIES`, `MANAGE_APPRAISERS`, `VIEW_PLATFORM_REVENUE`, `BAN_USER`
- [x] Cookie refresh/logout protected by double-submit CSRF and `GET /auth/csrf`
- [x] Order list APIs support backend `status` filter and buyer/seller status counts
- [x] `GET /system/time` added for client/server clock sync
- [x] Dispute history endpoint added for buyer/seller order participants
- [x] Seller Portal v1 backend: buyer-owned shipping address confirmation, immutable product/address order snapshots, seller product statistics, editable store name, and realized sales summary
- [x] Seller Portal v1 realtime contract: shared auction STOMP topic with 10-second REST reconciliation for operational views

## In Progress

- Seller Portal v1 frontend verification and end-to-end browser acceptance.

## Deferred Issues

- Buyer participation history page and stored winner/loser notifications
- Broader controller/RBAC integration coverage beyond the targeted cleanup tests
- Repair job for rare close-time partial settlement after terminal auction DB commit

## Warnings

- Previous baseline: `mvn test` passed on 2026-06-02 with 282 tests, 0 failures.
- Current cleanup verification must be rerun after the Flyway/config/API updates.
- Dispute v1 has no partial refund; admin resolution is `SELLER_WINS` or `BUYER_WINS`.
- Wallet balance for demo must come from VNPay Sandbox. Do not add local wallet funding shortcuts.
- Local VNPay demo may use `vnpay.confirm-on-return-enabled=true` when IPN cannot reach localhost; this still goes through VNPay Return and is not a wallet shortcut.

## Next Tasks

1. Keep FE integration aligned with order/dispute/admin/certificate contracts.
2. Keep demo wallet funding strictly on VNPay Sandbox; do not add local wallet funding shortcuts.
3. Exercise terminal auction repair paths under Docker-backed integration runs.
4. Add controller/RBAC integration tests with a dedicated test DB + Redis environment.
5. Keep Flyway migrations as the production migration strategy; do not reintroduce `data.sql` bootstrap.

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

### Phase 3.4 - Buyer Realtime API Support

- [x] Participation context endpoint: `GET /api/v1/auctions/{id}/my-participation`
- [x] Bid history endpoint: `GET /api/v1/auctions/{id}/bids?size=20`
- [x] `BidBroadcastPayload.NEW_BID` extended with bid identity, amount, server time, and nullable anti-sniper extension seconds
- [x] Lua return contract extended with `extendedByMs`
- [x] Tests for participation context, bid history, Lua extension output, and broadcast compatibility

### Phase 4 - Fulfillment, Orders, and Dispute

- [x] Order domain and source-adapter boundary
- [x] Buyer/seller order APIs
- [x] Escrow remainder payment, overdue cancellation, and forfeited deposit split
- [x] Fulfillment shipment, buyer receive, and shipped auto-complete
- [x] Seller payout and platform commission/revenue recording
- [x] Dispute service/controller/resolution workflow
- [x] Admin category CRUD, appraiser provisioning, user ban/unban management, and certificate lookup
- [x] Flyway baseline/seed/config hardening, server-time sync endpoint, order status counts, and dispute history
