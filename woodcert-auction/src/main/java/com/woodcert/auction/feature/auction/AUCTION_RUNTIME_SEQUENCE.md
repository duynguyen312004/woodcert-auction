# Auction Runtime Sequence Contracts

## Create Session
1. Lock product with `ProductRepository.findByIdForUpdate`.
2. Validate seller ownership, appraisal status, and no open `WAITING`/`ACTIVE` session.
3. Validate price/deposit/time rules through `AuctionPolicy`.
4. Insert `AuctionSession` as `WAITING`.

## Register
1. Lock session and product.
2. Validate session is `WAITING` or still-active `ACTIVE` in Redis.
3. Reject product seller self-registration.
4. Freeze deposit with key `auction:register:freeze:{auctionId}:{userId}`.
5. Insert `AuctionParticipant(FROZEN)`.
6. If session is `ACTIVE`, add user to Redis bidder set.

## Withdraw
1. Lock session and product.
2. Require session status `WAITING`.
3. Lock the current user's participant row and require deposit status `FROZEN`.
4. Unfreeze the full deposit with key `auction:withdraw:refund:{auctionId}:{userId}`.
5. Mark the participant `WITHDRAWN` and record `withdrawnAt`; never delete the row.

## Activate
1. Scheduler locks due `WAITING` sessions.
2. Build Redis state and bidder set from `FROZEN` participants.
3. Commit DB status `ACTIVE` only after Redis write succeeds.
4. Broadcast `SESSION_ACTIVATED`.

## Bid
1. Validate DB session is `ACTIVE` and bidder is not seller.
2. Execute Redis Lua script against state + bidder set.
3. Lua success drives API response and WebSocket broadcast.
4. Persist the bid audit row and DB snapshot as best-effort secondary writes.
5. A failure emits `accepted_bid_not_persisted` or `accepted_bid_snapshot_not_synced`; it does not reverse the Redis-accepted result.
6. Operational requirement: Redis AOF must be enabled for demo/deployment because Redis is authoritative while a session is active.

## Close And Settle
1. Scheduler locks due `ACTIVE` sessions.
2. Read Redis state, or fallback to DB snapshot and top valid bid. The fallback may be stale if both secondary DB writes failed.
3. Commit terminal session status:
   - `ENDED_SUCCESS` when final price meets reserve.
   - `ENDED_FAILED` otherwise.
4. Settle `FROZEN` participants:
   - failed auction: refund all.
   - successful auction: deduct winner deposit, refund losers.
5. If successful and no `FROZEN` participants remain, call `OrderService.createFromSource(AUCTION, auctionSessionId)`.
6. Remove Redis state and broadcast `SESSION_ENDED`.

## Boundary Rule
Auction close creates an order source handoff only. Payment remainder, shipping, payout, platform commission, forfeited deposit split, and dispute handling belong to `feature.order`, `feature.fulfillment`, `feature.finance`, and `feature.dispute`.
