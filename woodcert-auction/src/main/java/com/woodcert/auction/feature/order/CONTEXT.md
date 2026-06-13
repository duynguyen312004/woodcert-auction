# Order Feature Context

## Responsibility
`feature.order` owns the post-sale commercial transaction after a source has produced a final buyer, seller, product, price, and applied deposit.

Auction is currently the only source, but order stays source-agnostic through `OrderSourceType`, `sourceId`, and `OrderSourceAdapter`.

## Boundary Rules
- `OrderService` must not inject auction repositories or auction entities.
- Source-specific logic is accessed only through `OrderSourceAdapter`.
- Fulfillment state is owned by `feature.fulfillment` and exposed to order response mapping through `OrderFulfillmentPort`.
- Dispute decisions are initiated by `feature.dispute`; order only applies the commercial outcome.
- Response mapping and seller dashboard calculations live outside `OrderServiceImpl` in focused collaborators.

## Lifecycle
- `PENDING_PAYMENT`: buyer still owes `remainingAmount`.
- `PAID`: buyer has paid the remaining amount; fulfillment can start.
- `FULFILLING`: seller has shipped and fulfillment owns tracking.
- `DISPUTED`: active dispute pauses normal completion.
- `COMPLETED`: buyer receive, auto-complete, or seller-wins dispute completed the order; seller payout and platform commission are recorded.
- `CANCELED`: payment deadline cancellation or buyer-wins dispute ended the order.

## Money Snapshot
Order stores the transaction amounts used for escrow, payout, cancellation, and refund:
- `finalPrice`
- `depositAmount`
- `remainingAmount`
- `platformCommissionRate`
- `platformCommissionAmount`
- `sellerPayoutAmount`
- `forfeitedDepositPlatformFeeAmount`
- `forfeitedDepositSellerAmount`
- `buyerRefundAmount`
- `refundedAt`

All order money uses VND scale 2 and `HALF_UP`.

## Escrow Outcomes
- Buyer pays the remaining balance into the internal wallet escrow.
- Normal completion pays seller `finalPrice - commission` and records platform commission.
- Payment deadline cancellation splits the deposit between seller and platform.
- Buyer-wins dispute refunds `depositAmount + remainingAmount` to the buyer, marks the order `CANCELED`, records `buyerRefundAmount/refundedAt`, and does not pay seller or record commission.
- Seller-wins dispute follows normal completion and records payout/commission.
