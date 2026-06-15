# Dispute Module

## Responsibility

`dispute` owns buyer-raised cases, immutable participant/admin messages, evidence, admin review,
audit information, and final resolution.

## Key Components

- Evidence upload intent and confirmation.
- Current dispute, compact history, full timeline detail, message, cancel, admin queue, review, and
  resolution APIs.
- Opening evidence stays separate from message evidence through nullable
  `dispute_evidence.message_id`.
- Bulk opening-evidence loading for list/history responses.
- Ports to order and fulfillment for business outcomes.

## Boundary Rules

- Dispute does not mutate finance or fulfillment repositories directly.
- Order applies refund, payout, commission, and source completion effects.
- Fulfillment implements `DisputeFulfillmentPort`.
- Evidence media must be active, owned by the sender, and typed as dispute evidence.
- Buyer and seller access is derived from order membership. Admin detail/message access requires
  `RESOLVE_DISPUTE`.
- Message author roles are derived by the backend and responses do not expose real names.

## Lifecycle And Contracts

- `OPEN` and `UNDER_REVIEW` are active states.
- Buyer, seller, and authorized admin may post text, up to 10 images, or both while active.
- Messages are immutable; closed cases are read-only.
- Buyer may cancel before resolution.
- `BUYER_WINS` refunds the buyer and cancels fulfillment.
- `SELLER_WINS` completes payout and marks fulfillment auto-completed.

## Known Limitations

- Resolution supports full buyer or seller outcomes only; partial refunds are not implemented.
- Legacy entity associations to order/fulfillment remain as modular technical debt.
