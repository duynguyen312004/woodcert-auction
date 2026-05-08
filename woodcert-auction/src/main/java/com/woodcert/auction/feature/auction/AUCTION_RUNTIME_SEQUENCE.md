# Auction Runtime Sequence Contracts

Exact step order for each operation. Deviations from these sequences can violate runtime invariants.

---

## 1. Create Session Flow (POST /api/v1/auctions)

```text
1. Lock product row with ProductRepository.findByIdForUpdate(productId)
2. Check seller owns the locked product -> else AUCTION_PRODUCT_NOT_OWNED
3. Check product.status == APPRAISED -> else AUCTION_PRODUCT_NOT_APPRAISED
4. Check no existing WAITING/ACTIVE session for product -> else AUCTION_SESSION_CONFLICT
5. Validate AuctionPolicy create rules:
   - reservePrice >= startingPrice
   - stepPrice >= 100000
   - depositAmount >= 1000000
   - depositAmount <= 50% startingPrice
   - startTime >= now + 5 minutes
   - duration between 1 hour and 30 days
6. Insert AuctionSession with status = WAITING and currentPrice = startingPrice
7. Return AuctionDetailRes assembled through AuctionResponseAssembler
```

**Concurrency rule**: product-level pessimistic locking is the current simple guard against duplicate open sessions.

---

## 2. Public/Seller Read Flow (GET /api/v1/auctions, GET /api/v1/auctions/{id}, GET /api/v1/auctions/me)

```text
1. Query MySQL sessions for the requested page/detail
2. Public list default statuses = [WAITING, ACTIVE]
3. Public explicit statuses may include only WAITING, ACTIVE, ENDED_SUCCESS
4. Batch-load products for list views
5. Batch-load participant counts through GROUP BY for list views
6. For each ACTIVE session:
   a. Read Redis currentPrice
   b. Read Redis endTimeEpochMs
   c. If value is missing or invalid, leave it null
7. AuctionResponseAssembler builds DTO:
   - Redis currentPrice overrides DB currentPrice only when present
   - Redis endTime overrides DB endTime only when present
   - otherwise DB snapshot is used
8. Product images are resolved through ProductImageHelper
```

**Read-source rule**: Redis is the source of truth for live `ACTIVE` values, but DB remains the fallback snapshot for API availability.

---

## 3. Cancel Session Flow (PATCH /api/v1/auctions/{id}/cancel)

```text
1. Lock session + product with AuctionSessionRepository.findByIdWithProductForUpdate(auctionId)
2. Check seller owns the product -> else AUCTION_SESSION_NOT_OWNED
3. Check session.status == WAITING -> else AUCTION_SESSION_NOT_CANCELABLE
4. Set session.status = CANCELED
5. Commit transaction
```

**Concurrency rule**: cancellation locks the session row so two concurrent cancel/start operations cannot make independent decisions from stale state.

---

## 4. Registration Flow (POST /api/v1/auctions/{id}/register)

```text
1. Load session + product with row lock
2. Check session.status in [WAITING, ACTIVE] -> else AUCTION_SESSION_NOT_REGISTRABLE
3. If ACTIVE: read Redis endTimeEpochMs and require now < endTimeEpochMs -> else AUCTION_NOT_ACTIVE
4. Check userId != product.sellerId -> else AUCTION_SELF_BIDDING_NOT_ALLOWED
5. Check participant does not exist for (auctionId, userId) -> else AUCTION_ALREADY_REGISTERED
6. walletService.freezeFunds(userId, "auction:register:freeze:{auctionId}:{userId}", depositAmount, ...)
7. Insert AuctionParticipant(FROZEN)
8. If ACTIVE:
   a. add userId to Redis bidder set
   b. if Redis no longer has active state, throw AUCTION_NOT_ACTIVE
9. Return 200 OK
```

**Late-join rule**: for `ACTIVE` sessions, the deposit must be frozen and `AuctionParticipant(FROZEN)` must be inserted before the user is added to the Redis bidder set.

---

## 5. Activation Flow (Scheduler every 5s)

```text
1. Query WAITING sessions where startTime <= now with row lock
2. For each session:
   a. Load FROZEN participants from DB and build bidder userId set
   b. Write Redis state hash (currentPrice, stepPrice, reservePrice, endTimeEpochMs, ...)
   c. Write Redis bidder set with frozen bidder userIds
   d. Set TTL = (endTime - now) + stateRetentionAfterEnd
   e. Only after Redis write succeeds: set DB status = ACTIVE, save
   f. Broadcast SESSION_ACTIVATED
```

**Critical**: step (e) must not run if Redis write fails. The session stays `WAITING` and the scheduler retries later.

---

## 6. Bid Flow (POST /api/v1/bids)

```text
1. Load session + product from DB
2. Check session.status == ACTIVE -> else AUCTION_NOT_ACTIVE
3. Check bidderId != product.sellerId -> else AUCTION_SELF_BIDDING_NOT_ALLOWED
4. Generate bidTraceId = UUID.randomUUID()
5. Execute Lua script against Redis keys:
   KEYS = [stateKey, biddersKey]
   ARGV = [bidderId, bidAmount, nowMs, sniperThresholdMs, sniperExtensionMs, bidTraceId]
6. Switch on Lua result code:
   OK             -> step 7
   ENDED          -> async persist REJECTED_TIME bid -> throw BID_AUCTION_ENDED
   LOW            -> async persist INVALID_PRICE bid -> throw BID_AMOUNT_TOO_LOW
   NOT_REGISTERED -> throw AUCTION_BIDDER_NOT_REGISTERED; no bid row saved
   SELF_BID       -> throw AUCTION_SELF_BIDDING_NOT_ALLOWED; no bid row saved
7. If Lua OK: update Redis TTL when anti-sniper extended endTime
8. If Lua OK: broadcast NEW_BID immediately
9. If Lua OK: async save Bid(VALID) row
10. If Lua OK: async sync DB snapshot (currentPrice, highestBidderId, endTime)
11. Return BidResultRes
```

**Critical**: API response and WebSocket broadcast are driven by Lua success, not by MySQL bid persistence.

---

## 7. Close Flow (Scheduler every 5s)

```text
1. Query ACTIVE sessions where endTime <= now with row lock
2. For each session:
   a. Read full Redis state hash
   b. If Redis is missing: fallback to DB snapshot + findTopValidBid and log warning
   c. Determine highestBidderId, finalPrice, winnerBidId (may be null in fallback)
   d. Determine outcome:
      hasValidBid = highestBidderId != null && finalPrice != null
      meetsReserve = hasValidBid && finalPrice >= reservePrice
      outcome = meetsReserve ? ENDED_SUCCESS : ENDED_FAILED
   e. Commit terminal DB state:
      session.status = outcome
      session.endTime = now
      if ENDED_SUCCESS: set currentPrice, highestBidderId, winnerBidId
      save session
   f. Settle all participants still FROZEN:
      ENDED_FAILED: unfreezeFunds for each -> set REFUNDED
      ENDED_SUCCESS:
        winner: deductFrozenFunds -> set DEDUCTED
        losers: unfreezeFunds -> set REFUNDED
   g. Delete Redis session state and bidder set
   h. Broadcast SESSION_ENDED
```

**Critical**: terminal DB state is committed before wallet settlement. If the process dies after DB commit, the session is no longer re-closed; remaining `FROZEN` deposits need a repair path.

---

## 8. Anti-Sniper Rule (inside Lua script)

```text
remainingMs = endTimeEpochMs - nowMs
if remainingMs <= antiSniperThresholdMs (30s):
    endTimeEpochMs += antiSniperExtensionMs (60s)
    update hash field endTimeEpochMs

After Lua returns: update Redis TTL to match new endTime.
```
