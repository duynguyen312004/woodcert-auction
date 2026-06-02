# Auction Feature Context

## Responsibility
`feature.auction` owns auction sessions, bids, participants, Redis runtime state, scheduler activation/closure, and deposit settlement.

It does not own post-sale order, shipping, payout, or dispute lifecycle. A successful auction becomes an order through the order-source adapter boundary.

## Internal Layout
- `command.AuctionCommandService`: create, cancel, register.
- `query.AuctionQueryService`: public and seller auction reads.
- `query.BuyerAuctionQueryService`: buyer participation dashboard reads.
- `assembler.AuctionResponseAssembler`: DTO mapping only; no repositories.
- `runtime.AuctionRuntimeSnapshotService`: Redis runtime snapshot overlay.
- `policy.AuctionPolicy`: auction validation rules.
- `order.AuctionOrderSourceAdapter`: adapter from auction source data into `feature.order`.

## Order Boundary
After an `ENDED_SUCCESS` session has no remaining `FROZEN` participants, `AuctionSettlementService` calls:

```java
orderService.createFromSource(OrderSourceType.AUCTION, auctionSessionId)
```

`OrderService` must not query auction repositories directly. Auction-specific behavior is isolated in `AuctionOrderSourceAdapter`:
- source snapshot: buyer, seller, product, final price, applied deposit.
- order created callback: product sale status -> `PENDING_ORDER`.
- non-payment canceled callback: winner participant -> `CONFISCATED`, product -> `AVAILABLE`.
- order completed callback: product -> `SOLD`.

## Runtime Rules
- `WAITING`, `ENDED_SUCCESS`, `ENDED_FAILED`, and `CANCELED` are MySQL-owned states.
- `ACTIVE` live price/end time are Redis-owned with MySQL fallback snapshots.
- Public default statuses are `WAITING` and `ACTIVE`.
- Public explicit status filters may include only `WAITING`, `ACTIVE`, `ENDED_SUCCESS`.
- Seller of the product cannot register or bid.
- Only participants with `DepositStatus.FROZEN` can bid.
- Auction close settlement only moves deposits to `REFUNDED` or `DEDUCTED`; `CONFISCATED` is applied later by order non-payment callback.

## Finance Contract
Auction wallet operation keys are deterministic and idempotent:
- Register freeze: `auction:register:freeze:{auctionId}:{userId}`
- Close refund: `auction:close:refund:{auctionId}:{userId}`
- Close deduct: `auction:close:deduct:{auctionId}:{winnerUserId}`
