# ADR-003: Wallet-Based Commercial Settlement

## Status

Accepted and implemented. Updated 2026-06-19.

## Context

WoodCert Auction needs to protect auction deposits, collect the winner's remaining payment, defer
seller payout until completion, process overdue payment, and resolve disputes without applying the
same financial mutation twice.

The current system has no independent escrow ledger or separate escrow account table. Calling the
implementation a complete escrow ledger would overstate the data model.

## Options considered

### Option A: Direct buyer-to-seller transfer

The buyer pays the seller outside the platform.

Rejected because the platform cannot reliably enforce auction deposits, payment deadlines,
commission, refunds, or dispute outcomes.

### Option B: Manual admin settlement

Admins manually confirm every payment and payout.

Rejected because it is operationally expensive and difficult to make idempotent.

### Option C: Wallet balances, idempotent operations, and order snapshots

The platform manages available/frozen wallet balances, records every successful mutation, reserves a
deterministic operation key, and stores commercial outcomes on the order.

Chosen.

## Decision

Implement commercial settlement using:

- `wallets.available_balance`;
- `wallets.frozen_balance`;
- `wallet_transactions`;
- `wallet_operations`;
- `platform_revenue_transactions`;
- order financial snapshot fields.

This design provides the required MVP safeguards but is not described as a standalone escrow ledger.

## Implemented lifecycle

1. VNPay Sandbox confirmation credits available wallet balance.
2. Auction registration moves the deposit from available to frozen balance.
3. Withdrawal, cancellation, or auction loss releases the frozen deposit.
4. A winning deposit is captured and becomes the applied order deposit.
5. The auction settlement creates one order using unique `(source_type, source_id)`.
6. The winner has 72 hours by default to pay `finalPrice - depositAmount`.
7. Payment snapshots the selected shipping address and creates pending fulfillment.
8. The seller confirms shipment.
9. Buyer receipt confirmation or the 168-hour fulfillment deadline completes the order.
10. Completion credits seller payout and records platform commission.
11. An active dispute prevents scheduler auto-completion.
12. `BUYER_WINS` refunds deposit plus remaining payment.
13. `SELLER_WINS` completes payout.

## Financial rules

Commission:

- `finalPrice <= 50,000,000`: 5%;
- `50,000,000 < finalPrice <= 200,000,000`: 4%;
- `finalPrice > 200,000,000`: 3%.

Overdue winner payment:

- order becomes `CANCELED`;
- participant deposit becomes `CONFISCATED`;
- product returns to `AVAILABLE`;
- platform receives 10% of the deposit by default;
- seller receives 90% by default.

## Reliability rules

- Every balance mutation uses a deterministic operation key.
- Reusing a completed operation is a no-op.
- Stale pending operations are reconciled according to the configured timeout.
- Wallet updates use optimistic locking.
- Auction settlement and missing-order repair are retried by the scheduler.

## Consequences

Positive:

- Financial mutations are auditable and idempotent.
- Deposit, payment, payout, commission, and refund paths are explicit.
- Commercial history remains stable through order snapshots.

Limitations:

- There is no double-entry ledger.
- The platform wallet model still creates financial and operational responsibility.
- Partial refunds are not implemented.
- Real-money deployment requires a reviewed VNPay/IPN and accounting process beyond the thesis
  Sandbox acceptance target.
