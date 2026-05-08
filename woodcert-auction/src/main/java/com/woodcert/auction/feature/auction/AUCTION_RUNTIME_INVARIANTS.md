# Auction Runtime Invariants

These are always-true constraints that must be preserved by every change to the auction runtime.

## 1. Status Source Of Truth
`WAITING`, `ENDED_SUCCESS`, `ENDED_FAILED`, and `CANCELED` are MySQL-owned states.

For `ACTIVE` sessions, Redis owns live `currentPrice` and `endTime`. MySQL keeps a snapshot for fallback, audit, and terminal closure.

Public and seller read APIs must overlay Redis values for `ACTIVE` sessions and fall back to MySQL when Redis state or fields are missing.

## 2. Public Visibility
Default public list status is exactly `[WAITING, ACTIVE]`.

Public explicit filters may include only `WAITING`, `ACTIVE`, and `ENDED_SUCCESS`.

`CANCELED` and `ENDED_FAILED` must not be exposed through public auction detail/list APIs.

## 3. Product Open-Session Guard
A product can have multiple auction sessions over time, but only one open `WAITING` or `ACTIVE` session at once.

Create flow must lock the product row with `ProductRepository.findByIdForUpdate` before checking ownership, appraisal status, and open-session conflict.

## 4. Cancel Guard
Cancellation is a status transition, not a delete.

Cancel flow must lock the session with product using `AuctionSessionRepository.findByIdWithProductForUpdate`.

Only `WAITING` sessions can be canceled.

## 5. Seller Block
The seller of a product cannot register or place a bid in the auction session for their own product.

Enforced in `AuctionCommandService.registerForAuction` and `BidServiceImpl.placeBid`.

## 6. One Participant Row Per Session And User
A single `(auctionSessionId, userId)` combination must appear at most once in `auction_participants`.

Enforced by the table unique constraint plus `existsByAuctionSessionIdAndUserId` before insert. `DataIntegrityViolationException` from concurrent insert is mapped back to `AUCTION_ALREADY_REGISTERED`.

## 7. Late Registration Is Allowed While Active
Registration is allowed for `WAITING` sessions.

Registration is also allowed for `ACTIVE` sessions only while Redis runtime state exists and `now < endTimeEpochMs`.

An `ACTIVE` late join must freeze deposit and insert `AuctionParticipant(FROZEN)` before adding the user ID to the Redis bidder set.

## 8. Only FROZEN Participants Can Bid
The Redis bidder set contains only user IDs of participants with `depositStatus = FROZEN`.

The Lua script checks bidder-set membership atomically before accepting a bid.

A participant whose deposit is already `REFUNDED` or `DEDUCTED` must not be able to bid.

## 9. Lua Success Means Runtime Acceptance
When the Lua script returns `OK`, the bid is accepted at the runtime level regardless of MySQL persistence state.

The API response and WebSocket broadcast are driven by Lua success, not by bid-row save success.

## 10. Bid Persistence Is Secondary
`BidPersistenceService` saves bid rows asynchronously after Lua success.

Failures in async persistence are logged and swallowed; they do not change the API outcome.

Duplicate `bidTraceId` inserts are no-ops.

## 11. ACTIVE Must Not Be Committed Without Redis State
During activation, Redis state must be built successfully before DB status is set to `ACTIVE`.

If Redis write fails, the session remains `WAITING` and the scheduler retries.

## 12. Terminal Outcome Is Determined By Reserve Price
- `ENDED_SUCCESS`: final price from Redis, or DB fallback, is `>= reservePrice`.
- `ENDED_FAILED`: no valid bid, or final price `< reservePrice`.

## 13. Close-Session Order
1. Read Redis state, or fallback to DB snapshot when Redis is missing.
2. Commit terminal DB state: `ENDED_SUCCESS` or `ENDED_FAILED`, winner snapshot, current price.
3. Only after DB commit: settle wallet state for all `FROZEN` participants.
4. Delete Redis state and broadcast session ended.

## 14. Idempotent Settlement
- Skip participants no longer in `FROZEN` state.
- Use deterministic wallet operation keys:
  - `auction:close:refund:{auctionId}:{userId}`
  - `auction:close:deduct:{auctionId}:{winnerUserId}`
- `WalletService` idempotency guards handle duplicate operation keys.

## 15. winnerBidId May Be Null In Fallback Mode
When Redis state is missing at close time and async bid save has not completed, `winnerBidId` may be null.

This is accepted in the current runtime scope. The session is still closed correctly.

Manual repair can look up the bid row by `highestBidTraceId` after the fact.

## 16. CONFISCATED Is Not Used In Current Runtime Scope
`DepositStatus.CONFISCATED` is reserved for fulfillment when a winner fails to pay.

Current auction runtime only transitions deposits from `FROZEN` to `REFUNDED` or `DEDUCTED`.

## 17. Participant Counts Must Be Grouped
List APIs must use grouped participant-count queries for multiple sessions.

Do not reintroduce per-session `countByAuctionSessionId` loops in public or seller auction lists.

## 18. Product Images Must Go Through Helper
Auction responses must not hand-roll product image selection.

Use `ProductImageHelper` for primary image and image-list resolution.

## 19. WebSocket Is Read-Only For Clients
Subscribing to `/topic/auctions/{id}` does not require JWT authentication.

Only REST mutation endpoints such as `POST /register` and `POST /bids` require JWT and permissions.
