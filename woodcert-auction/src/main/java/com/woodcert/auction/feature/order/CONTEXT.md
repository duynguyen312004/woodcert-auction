# Order Feature Context

## Responsibility
`feature.order` owns the post-sale commercial transaction after a source has produced a final buyer, seller, product, price, and applied deposit.

Auction is currently the only source, but order is source-agnostic through `OrderSourceType` and `sourceId`.

## Boundary Rules
- `OrderService` must not inject auction repositories or auction entities.
- Source-specific logic is accessed only through `OrderSourceAdapter`.
- Fulfillment state is not stored on `OrderEntity`; shipping belongs to `feature.fulfillment`.
- Dispute state is not implemented here; `OrderStatus.DISPUTED` is reserved for `feature.dispute`.

## Lifecycle
- `PENDING_PAYMENT`: buyer still owes `remainingAmount`.
- `PAID`: buyer has paid enough; fulfillment can start.
- `FULFILLING`: seller has shipped and fulfillment owns tracking.
- `COMPLETED`: fulfillment completed; seller payout and platform commission are recorded.
- `CANCELED`: buyer missed payment deadline; forfeited deposit split is recorded.
- `DISPUTED`: reserved for future dispute workflow.

## Money Snapshot
Order stores immutable transaction amounts:
- `finalPrice`
- `depositAmount`
- `remainingAmount`
- `platformCommissionRate`
- `platformCommissionAmount`
- `sellerPayoutAmount`
- `forfeitedDepositPlatformFeeAmount`
- `forfeitedDepositSellerAmount`

All order money uses VND scale 2 and `HALF_UP`.
