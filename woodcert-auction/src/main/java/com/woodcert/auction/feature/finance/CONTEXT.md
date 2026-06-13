# Finance Feature Context

## Responsibility
`feature.finance` owns wallet balances, wallet transactions, idempotent wallet operations, VNPay deposits, and platform revenue ledger.

It does not own auction, order, fulfillment, or dispute state; those modules call finance services with stable operation keys and references.

## Wallet Contract
Every successful wallet mutation writes one `wallet_transactions` row. Internal wallet mutations are idempotent by `operationKey`.

Operation keys are created only through `FinanceOperationKeys`. The factory preserves
the persisted key grammar and validates IDs, actor/reference segments, separators,
and the shared 160-character storage limit.

Key grammar:
- `appraisal:submit:fee:{productId}:{sellerId}`
- `auction:register:freeze:{auctionId}:{userId}`
- `auction:close:{deduct|refund}:{auctionId}:{userId}`
- `auction:cancel:refund:{auctionId}:{userId}`
- `order:{action}:{effect?}:{orderId}:{actorId?}`
- `vnpay:{txnRef}`

Operation lifecycle:
- `PENDING`: reserved; concurrent duplicate requests are rejected.
- `SUCCESS`: terminal; retries become no-ops.
- `FAILED`: retryable only for insufficient balance or optimistic concurrency failures.
- stale `PENDING`: persisted as terminal `FAILED` for fail-closed reconciliation.

The same key may be used in `wallet_operations` and
`platform_revenue_transactions` when both rows represent the same business action.

Service methods:
- `topUpFromVnPay`
- `chargeAppraisalFee`
- `freezeAuctionDeposit`
- `releaseAuctionDeposit`
- `captureAuctionDeposit`
- `payOrder`
- `refundOrder`
- `creditSellerPayout`
- `creditSellerForfeitCompensation`

Money is normalized to scale 2 with `HALF_UP`.

## Reference Types
- Auction deposit freeze/refund/deduct uses `WalletReferenceType.AUCTION` and auction session IDs.
- Order payment, buyer refund, seller payout, sale commission references, and forfeited deposit split use `WalletReferenceType.ORDER` and canonical `orders.id`.
- Appraisal submission fee uses `WalletReferenceType.APPRAISAL` and product IDs.

## Platform Revenue
Revenue entries are stored in `platform_revenue_transactions`.

Current types:
- `APPRAISAL_FEE`: seller appraisal submission fee.
- `SALE_COMMISSION`: platform commission when an order completes.
- `FORFEITED_DEPOSIT_FEE`: platform share when a winner misses payment deadline.

Admin revenue endpoints expose transaction list and totals by type.

## Current Money Flows
- Auction registration: freeze buyer deposit.
- Auction failed/loser settlement: release frozen deposit.
- Auction winner settlement: capture frozen deposit, then order applies it to final price.
- Buyer order payment: charge the remaining amount.
- Fulfillment completion: seller receives `finalPrice - commission`; platform records commission.
- Payment deadline cancellation: seller receives 90% of deposit; platform records 10%.
- Buyer-wins dispute: buyer receives `depositAmount + remainingAmount` as `ORDER_REFUND`; `buyerRefundAmount` and `refundedAt` are recorded, while seller payout and commission are skipped.
