# Auction Feature - CONTEXT.md

## Module Responsibility
This module manages the complete lifecycle of an auction session:
- Seller-side: create and cancel auction sessions for appraised products.
- Buyer-side: browse public auctions, register by freezing deposit, and place bids in real time.
- Runtime: Redis-first active-session state, Redis Lua bidding, and WebSocket broadcasts.
- Scheduler: automated activation of `WAITING` sessions and closure of `ACTIVE` sessions.
- Finance: integrates with `WalletService` for deposit freeze, refund, and deduct.

## Service Layout
`AuctionServiceImpl` is only a facade that preserves the public `AuctionService` interface for controllers.

Internal implementation is split by responsibility:
- `command.AuctionCommandService`: create, cancel, register.
- `query.AuctionQueryService`: public list/detail and seller list.
- `query.PublicAuctionSearchCriteria`: internal criteria record for public list filters.
- `assembler.AuctionResponseAssembler`: pure response DTO mapping and Redis snapshot overlay; it must not access repositories.
- `policy.AuctionPolicy`: auction rule constants and validation.
- `runtime.AuctionRuntimeSnapshotService`: read-only Redis runtime snapshot for `ACTIVE` sessions.

## Key Invariants
See `AUCTION_RUNTIME_INVARIANTS.md` for the authoritative runtime constraints.

## Source of Truth per Status

| Session Status | Source of Truth |
|----------------|-----------------|
| `WAITING` | MySQL only |
| `ACTIVE` | Redis for live `currentPrice` and `endTime`; MySQL is snapshot/fallback |
| `ENDED_SUCCESS`, `ENDED_FAILED`, `CANCELED` | MySQL only |

Read APIs overlay Redis values only when `status = ACTIVE`. If Redis state or individual fields are missing, the API falls back to the MySQL snapshot so the response remains available.

## Public Visibility
- Default public auction list statuses: `WAITING`, `ACTIVE`.
- Explicit public status filter accepts only: `WAITING`, `ACTIVE`, `ENDED_SUCCESS`.
- Public list supports `material`, `categoryName`, `priceMin`, and `priceMax` filters.
- Unknown `categoryName` returns an empty page.
- `priceMin > priceMax` returns `INVALID_REQUEST`.
- `priceMin`/`priceMax` filter persisted MySQL `current_price` snapshot before Redis overlay.
- `CANCELED` and `ENDED_FAILED` are not public-facing.
- Public detail hides `reservePrice`.

## Creation and Cancellation Safety
- `createAuctionSession` locks the product row using `ProductRepository.findByIdForUpdate`.
- The locked product is used to validate seller ownership and `ProductStatus.APPRAISED`.
- A product can have many sessions over time, but at most one open `WAITING` or `ACTIVE` session at once.
- `cancelAuctionSession` locks the auction session with product using `findByIdWithProductForUpdate`.
- Cancellation is only allowed while status is `WAITING`; it transitions to `CANCELED`.

## Auction Rule Constants
Rule constants are centralized in `AuctionPolicy`:
- Minimum step price: `100000`.
- Minimum deposit amount: `1000000`.
- Maximum deposit amount: `50%` of starting price.
- Minimum start lead time: `5 minutes`.
- Minimum duration: `1 hour`.
- Maximum duration: `30 days`.

## Dependency Contracts

### Finance (`WalletService`)
All wallet mutations use deterministic operation keys to be idempotent:
- Register freeze: `auction:register:freeze:{auctionId}:{userId}`
- Close refund: `auction:close:refund:{auctionId}:{userId}`
- Close deduct: `auction:close:deduct:{auctionId}:{winnerUserId}`

### Redis (`AuctionRedisService`)
Two keys per `ACTIVE` session:
- `auction:session:{id}:state` - hash: `currentPrice`, `stepPrice`, `reservePrice`, `endTimeEpochMs`, `highestBidderId`, `highestBidTraceId`, `status`
- `auction:session:{id}:bidders` - set of frozen participant user IDs

TTL = `(endTime - now) + stateRetentionAfterEnd`.

### Catalog (`ProductImageHelper`)
Auction responses must reuse `ProductImageHelper` for product image URLs:
- list views use batch primary image loading.
- detail view uses helper methods for primary image and all image URLs.

Catalog/category/appraisal enrichment belongs in `AuctionQueryService` or command/query orchestration, not in the assembler.

### Identity (`SellerSummaryQueryService`)
Auction read code must obtain seller display name and reputation through `SellerSummaryQueryService`.
Do not inject `UserRepository` or `SellerProfileRepository` directly into auction read services.

### WebSocket (`AuctionBroadcastService`)
- Endpoint: `/ws-auction` (SockJS)
- Topic: `/topic/auctions/{id}`
- Events: `SESSION_ACTIVATED`, `NEW_BID`, `SESSION_ENDED`

## Business Rules
- Seller of the product cannot register or bid in their own auction.
- Registration is allowed while session is `WAITING`.
- Registration is also allowed while session is `ACTIVE` only if Redis runtime state exists and `now < endTimeEpochMs`.
- Only participants with `depositStatus = FROZEN` are allowed to bid; Lua enforces Redis bidder-set membership atomically.
- `ENDED_SUCCESS` requires final price `>= reservePrice`.
- `ENDED_FAILED` applies when there is no valid bid or final price `< reservePrice`.

## Current Scope
Auction runtime is implemented for registration, deposit freeze, Redis-first bidding, scheduler activation/closure, runtime read overlay, and deposit settlement.

This scope does not create fulfillment orders, does not change `ProductStatus`, and does not use `DepositStatus.CONFISCATED`.
