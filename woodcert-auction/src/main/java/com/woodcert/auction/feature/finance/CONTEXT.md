# Finance Feature Context

## Responsibility
`feature.finance` owns wallet balances, wallet transactions, idempotent wallet operations, VNPay deposits, and platform revenue ledger.

It does not own auction, order, fulfillment, or dispute state; those modules call finance services with stable operation keys and references.

## Wallet Contract
Every successful wallet mutation writes one `wallet_transactions` row. Internal wallet mutations are idempotent by `operationKey`.

Service methods:
- `depositFunds`
- `freezeFunds`
- `unfreezeFunds`
- `deductFrozenFunds`
- `withdrawFunds`

Money is normalized to scale 2 with `HALF_UP`.

## Reference Types
- Auction deposit freeze/refund/deduct uses `WalletReferenceType.AUCTION` and auction session IDs.
- Order payment, seller payout, sale commission references, and forfeited deposit split use `WalletReferenceType.ORDER` and canonical `orders.id`.
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
- Auction failed/loser settlement: unfreeze deposit.
- Auction winner settlement: deduct frozen deposit, then order applies it to final price.
- Buyer order payment: withdraw remaining amount.
- Fulfillment completion: seller receives `finalPrice - commission`; platform records commission.
- Payment deadline cancellation: seller receives 90% of deposit; platform records 10%.
