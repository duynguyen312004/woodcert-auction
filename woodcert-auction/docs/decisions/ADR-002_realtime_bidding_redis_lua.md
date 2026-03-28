# ADR-002: Real-time Bidding Concurrency — Redis Lua Scripts

## Status
Accepted

## Context
The Woodcert Auction Platform requires a highly responsive and concurrent bidding system. During the final seconds of an auction, hundreds of users might place bids simultaneously. 
If we rely solely on a relational database (MySQL) to validate and register these bids, we will face severe lock contention, deadlocks, and unacceptable latency. We need a mechanism to guarantee atomicity and high throughput for the bidding logic.

## Options Considered

### Option A: Pessimistic Locking in MySQL
- Use `SELECT ... FOR UPDATE` to lock the auction row during bid validation.
- **Risk:** High latency. Transactions will queue up, leading to connection pool exhaustion and potential deadlocks.

### Option B: Optimistic Locking in MySQL (`@Version`)
- Allow concurrent reads, but throw `OptimisticLockException` on write conflicts.
- **Risk:** High failure rate for users. If 100 people bid, 1 succeeds and 99 get an error and have to retry, creating a terrible User Experience (UX).

### Option C: Redis as Source of Truth + Lua Scripts (CHOSEN)
- Store active auction state (`current_price`, `end_time`, `highest_bidder`) in Redis.
- Use a Redis Lua Script to execute the entire validation and update logic atomically.

## Decision
**Option C** — Redis Lua Scripts for atomic real-time bidding.

## Implementation Design

### 1. Redis Lua Script Logic
The script executes the following steps atomically in Redis (single-threaded execution guarantees no race conditions):
1. Read `current_price`, `step_price`, and `end_time` from the Redis Hash.
2. Check if current time > `end_time` (Auction ended).
3. Check if `new_bid >= current_price + step_price`.
4. If valid, update `current_price` and `highest_bidder`.
5. **Anti-Sniper Rule:** If `end_time - current_time <= 30` seconds, extend `end_time` by 60 seconds.
6. Return success (and new `end_time`) or specific error codes.

### 2. System Flow
1. Client sends POST `/api/v1/bids`.
2. Spring Boot calls `RedisTemplate.execute(luaScript, keys, args)`.
3. If Lua script returns SUCCESS:
   - Spring Boot asynchronously (`@Async`) saves the `Bid` record to MySQL for audit logging.
   - Spring Boot broadcasts the `NEW_BID` event via WebSocket to all subscribed clients.

## Consequences

### Positive
- **Extreme Performance:** Redis operations happen in memory. Lua scripts prevent network round-trips for check-and-set logic.
- **No Lost Updates:** Single-threaded execution in Redis completely eliminates race conditions.
- **Smooth UX:** WebSocket delivers the updated price instantly without querying MySQL.

### Negative
- **Complexity:** Requires maintaining Lua script code as strings inside the Java project.
- **Data Synchronization:** Redis and MySQL might temporarily be out of sync. If Redis crashes before the `@Async` DB save completes, a bid might be lost. 
  *Mitigation:* Enable Redis AOF (Append Only File) persistence and ensure graceful degradation.