# Project Status

> Last updated: 2026-06-19 | By: Codex | Session: documentation-sync
>
> AI: update this file at the end of every backend session when asked.
> Follow this exact format. Keep it concise but decision-useful.

---

## Completed

- [x] Core app skeleton, shared DTO/exception layer, JWT infrastructure, RBAC, and modular-monolith baseline
- [x] Auth/session APIs with access token, cookie-only HttpOnly refresh token, rotation, CSRF-protected refresh/logout, cleanup job, and `@CurrentUserId`
- [x] Email verification and forgot/reset password with hashed one-time tokens, cooldown, safe mail logging, and refresh-token revocation after reset
- [x] Current-user profile GET/PUT/PATCH, avatar upload/confirm/delete, seller profile APIs, full address-book CRUD/default behavior, and location master-data APIs
- [x] Shared media module: `media_assets` source of truth, signed Cloudinary upload intents, confirm-by-`assetId`, generated delivery URLs, and async cleanup
- [x] Catalog foundation: category seed/read APIs, seller draft product create/update/delete, media-backed product images, submit-for-appraisal flow
- [x] Appraiser workflow: claim/release, expired-claim visibility, immutable appraisal report, approve/reject, proof images, SHA-256 integrity hash, certificate code, and seller reputation recalculation
- [x] Catalog read boundary hardened: `GET /api/v1/products` and `GET /api/v1/products/{id}` are internal seller/appraiser workflow APIs, not public marketplace APIs
- [x] Finance core: wallet, business-semantic transaction types, operation idempotency, lazy wallet creation, balance normalization, concurrency errors, and full-stack VNPay Sandbox integration
- [x] Auction foundation: `AuctionSession`, seller create/list/cancel, public list/detail, product/session locks, public filters, hidden reserve price, and seller summary enrichment
- [x] Auction runtime: participant registration, Redis-first bidding, Lua validation, anti-sniper extension, scheduler activation/close, STOMP broadcasts, async bid audit, and deposit settlement
- [x] Auction service refactor: facade plus command/query/assembler/policy/runtime services; grouped participant counts; `ProductImageHelper` reuse; Redis overlay for active read models
- [x] Buyer realtime API support: authenticated participation context, public bid history with optional `mine`, enriched `NEW_BID` payload, and Lua `extendedByMs`
- [x] Order module: source-adapter boundary, order creation from auction settlement, buyer/seller order list/detail APIs, remainder payment, overdue payment cancellation, and forfeited deposit split
- [x] Fulfillment module: pending shipment creation, seller shipping confirmation, buyer received confirmation, shipped auto-complete, seller payout, and platform commission recording
- [x] Dispute module: buyer evidence upload, open/cancel/current APIs, admin queue/detail/review/resolve APIs, seller-wins payout path, buyer-wins refund path, and scheduler skip for disputed orders
- [x] Back-office APIs: admin category CRUD, appraiser-only account creation, appraiser capability ban/unban, and public certificate verification lookup
- [x] Admin user management: `GET /admin/users` (role/status/keyword filter, paginated) and `PATCH /admin/users/{id}/ban|unban` guarded by `BAN_USER`, with self-ban and admin-ban protection; legacy `GET /admin/appraisers` removed in favor of `GET /admin/users?role=ROLE_APPRAISER`
- [x] Seller capability suspension is read-only: historical seller data stays accessible, new listing/auction actions are blocked, paid-order fulfillment remains available, and `/users/me` exposes the reason and update time
- [x] Product sale status supports `RETURNED` for buyer-wins disputes without automatic relist
- [x] Platform revenue APIs for admin revenue stats and transaction history
- [x] Order/Fulfillment/Dispute unit coverage added for service and scheduler paths
- [x] Expose buyer outcome contract (winner, outcomeCode, outcomeMessage) và highestBidderMaskedAlias trong chi tiết đấu giá và participation context
- [x] Full backend suite passes, including Docker-backed Flyway/MySQL and Redis/Lua integration coverage
- [x] Flyway reset baseline consolidated to V1 schema, V2 reference data, and V3 separate admin/appraiser demo accounts
- [x] Production/base config hardened: Flyway enabled, Hibernate `ddl-auto=validate`, SQL init disabled, SQL logging off
- [x] RBAC admin permissions clarified: `ADMIN_ACCESS`, `MANAGE_CATEGORIES`, `MANAGE_APPRAISERS`, `VIEW_PLATFORM_REVENUE`, `BAN_USER`
- [x] Cookie refresh/logout protected by double-submit CSRF and `GET /auth/csrf`
- [x] Order list APIs support backend `status` filter and buyer/seller status counts
- [x] `GET /system/time` added for client/server clock sync
- [x] Dispute history endpoint added for buyer/seller order participants
- [x] Seller Portal v1 backend: buyer-owned shipping address confirmation, immutable product/address order snapshots, seller product statistics, editable store name, and realized sales summary
- [x] Seller Portal v1 realtime contract: shared auction STOMP topic with 10-second REST reconciliation for operational views
- [x] Order and dispute list mapping bulk-loads fulfillment/evidence data to avoid per-row N+1 queries
- [x] VPS deploy artifacts: production Compose, backend/frontend images, health endpoint, Nginx proxy template, and deploy runbook
- [x] Dispute conversation timeline with immutable participant/admin messages and message evidence
- [x] Auction repair scheduler for terminal sessions with frozen deposits and successful sessions missing orders
- [x] Backend architecture, database, API, and ADR documentation synchronized with Flyway V1-V4 and current runtime behavior

## In Progress

- Manual browser acceptance with real SMTP, Cloudinary, and VNPay Sandbox credentials.
- Responsive browser acceptance for public, buyer, seller, appraiser, and admin portals.

## Deferred Issues

- Stored winner/loser notifications beyond the existing buyer participation history UI
- Broader controller/RBAC integration coverage beyond the targeted cleanup tests
- Operational alerting/runbook for failures that remain after automated settlement/order repair

## Warnings

- Final backend verification on 2026-06-19: `mvn test` passed 394 tests across 62 report files, including Docker-backed production wiring, Flyway/MySQL, and Redis/Lua integration tests.
- Final frontend verification on 2026-06-19: typecheck, lint, 190 unit tests, 7 Playwright tests, and production build passed.
- Frontend custom 404 preserves public, seller, appraiser, and admin layouts. The 2026-06-19 production build has no JavaScript chunk over 500 KB; the main entry is 411.61 KB (128.11 KB gzip).
- Dispute v1 has no partial refund; admin resolution is `SELLER_WINS` or `BUYER_WINS`.
- Wallet balance for demo must come from VNPay Sandbox. Do not add local wallet funding shortcuts.
- The thesis deployment uses VNPay Sandbox with `vnpay.confirm-on-return-enabled=true` because merchant IPN registration is unavailable. The signed Return callback still validates merchant code, amount and transaction status and is not a wallet shortcut. Real-money deployment must use IPN.

## Next Tasks

1. Run the documented browser E2E checklist from a clean V1-V4 database.
2. Keep demo wallet funding strictly on VNPay Sandbox; do not add local wallet funding shortcuts.
3. Keep Flyway as the schema strategy; do not reintroduce `data.sql` bootstrap.

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
- [x] Appraiser report submission with immutable report, proof images, SHA-256 integrity hash, and seller accuracy
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
- [x] Business-semantic wallet operations for top-up, appraisal fee, auction deposit, order payment/refund, and seller credits
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
- [x] Wallet-funded remaining payment, overdue cancellation, and forfeited deposit split
- [x] Fulfillment shipment, buyer receive, and shipped auto-complete
- [x] Seller payout and platform commission/revenue recording
- [x] Dispute service/controller/resolution workflow
- [x] Admin category CRUD, appraiser provisioning, user ban/unban management, and certificate lookup
- [x] Flyway baseline/seed/config hardening, server-time sync endpoint, order status counts, and dispute history
