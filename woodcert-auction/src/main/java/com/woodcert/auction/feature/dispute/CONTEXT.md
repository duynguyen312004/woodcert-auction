# Dispute Module

## Responsibility

`dispute` owns buyer-raised cases, evidence, admin review, audit information, and final resolution.

## Key Components

- Evidence upload intent and confirmation.
- Current dispute, history, cancel, admin queue, review, and resolution APIs.
- Bulk evidence loading for list/history responses.
- Ports to order and fulfillment for business outcomes.

## Boundary Rules

- Dispute does not mutate finance or fulfillment repositories directly.
- Order applies refund, payout, commission, and source completion effects.
- Fulfillment implements `DisputeFulfillmentPort`.
- Evidence media must be active, owned by the buyer, and typed as dispute evidence.

## Lifecycle And Contracts

- `OPEN` and `UNDER_REVIEW` are active states.
- Buyer may cancel before resolution.
- `BUYER_WINS` refunds the buyer and cancels fulfillment.
- `SELLER_WINS` completes payout and marks fulfillment auto-completed.

## Known Limitations

- Resolution supports full buyer or seller outcomes only; partial refunds are not implemented.
- Legacy entity associations to order/fulfillment remain as modular technical debt.
