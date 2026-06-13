# Auction Module

## Responsibility

`auction` owns sessions, participants, bids, Redis runtime state, activation/closure scheduling, deposit settlement, and buyer/seller auction read models.

## Key Components

- Command, query, assembler, policy, runtime snapshot, scheduler, and settlement services.
- Redis Lua validation for bidding and anti-sniper extension.
- STOMP/SockJS broadcasts for live auction updates.
- `AuctionOrderSourceAdapter` bridges successful auctions into source-agnostic orders.

## Boundary Rules

- Auction does not own post-sale payment, shipping, payout, or dispute state.
- Order does not query auction repositories; source behavior stays in the adapter.
- Public responses never expose reserve price.
- Only registered participants with frozen deposits may bid.

## Lifecycle And Contracts

- MySQL owns terminal and waiting states; Redis owns active price and end-time state.
- Scheduler activates due sessions and closes sessions using Redis with DB fallback.
- Settlement refunds losers and captures the winner deposit before creating an order.
- Wallet operation keys are deterministic and idempotent.

## Known Limitations

- Accepted bid persistence and DB snapshot synchronization are best-effort after Redis acceptance by product design.
- A repair path exists for settlement, but rare close-time partial failures still require operational review.
