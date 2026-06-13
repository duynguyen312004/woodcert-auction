# Dispute Feature Context

## Responsibility
`feature.dispute` owns buyer-raised post-sale dispute cases, evidence upload confirmation, admin review, and final resolution.

Disputes reference `orderId` and optionally `fulfillmentId`. They do not mutate fulfillment repositories directly.

## Boundary Rules
- Dispute calls `OrderService` to mark an order disputed and to apply the final commercial outcome.
- Dispute calls `DisputeFulfillmentPort` to mark fulfillment according to the outcome.
- Fulfillment implements the port; dispute must not inject `FulfillmentRepository`.
- Finance effects are applied through order resolution, not directly from dispute.

## Lifecycle
- Buyer opens a dispute with reason and at least one confirmed evidence asset.
- Active dispute moves the order to `DISPUTED`.
- Buyer can cancel their active dispute before admin resolution.
- Admin can move a case to review and then resolve it.

## Resolution Outcomes
- `BUYER_WINS`: order is canceled, buyer receives `depositAmount + remainingAmount` as a wallet refund, fulfillment is marked `CANCELED`, seller payout and commission are skipped.
- `SELLER_WINS`: order follows normal completion, seller payout and platform commission are recorded, fulfillment is marked `AUTO_COMPLETED`.

The dispute module stores resolution note, outcome, admin id, and timestamps for audit.
