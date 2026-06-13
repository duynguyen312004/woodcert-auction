# Finance Module

## Responsibility

`finance` owns wallets, wallet transactions, idempotent operations, VNPay deposits, and platform revenue.

## Key Components

- Wallet balance mutations and transaction history.
- VNPay deposit creation, return/IPN handling, query, and history.
- Operation-key lifecycle and stale pending reconciliation.
- Platform revenue ledger and admin reporting.

## Boundary Rules

- Finance does not own auction, order, fulfillment, or dispute state.
- Other modules call finance through semantic service methods and stable operation keys.
- Every successful balance mutation creates a wallet transaction.
- Money is normalized to scale 2 with `HALF_UP`.

## Lifecycle And Contracts

- Operations move through `PENDING`, `SUCCESS`, or retryable/terminal `FAILED`.
- Auction deposits can be frozen, released, or captured.
- Order completion credits seller payout and records commission.
- Buyer-wins disputes refund the captured deposit and remainder payment.

## Known Limitations

- Deployment acceptance currently targets VNPay Sandbox.
- Local return confirmation is for localhost testing only; deployed environments use VNPay IPN.
