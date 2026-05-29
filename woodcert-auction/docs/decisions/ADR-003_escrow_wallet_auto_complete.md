# ADR-003: Escrow Wallet and Automated Settlement Flow

## Status

Accepted. Partially implemented as of 2026-05-28.

Implemented today:

- Wallet balances and transaction audit logs.
- VNPay deposit requests, IPN confirmation, and deposit history.
- Idempotent wallet operations.
- Auction registration deposit freeze.
- Auction close refund/deduct settlement for frozen deposits.

Not implemented yet:

- Orders, shipments, disputes.
- Buyer remaining-payment flow after winning.
- Seller payout and platform fee deduction.
- 72-hour delivery protection and auto-complete job.

## Context

High-value wood-art auctions need escrow protection. A buyer should not pay directly to a seller before shipment, and a seller should not ship without payment confidence. The platform also needs a clear mechanism for deposit locking, final settlement, refunds, and future platform fees.

## Options Considered

### Option A: Direct Transfer

Buyer transfers money directly to seller.

Risk: the platform cannot reliably protect delivery, authenticity disputes, or payment completion.

### Option B: Manual Escrow By Admin

Admins manually verify payment, delivery, and seller payout.

Risk: operationally expensive and hard to scale.

### Option C: In-System Escrow Wallet + Scheduled Settlement

Users have wallets with `availableBalance` and `frozenBalance`. Auction participation freezes deposits. Future order fulfillment will hold remaining payment in system escrow and settle after delivery/dispute windows.

## Decision

Use Option C.

Current backend scope implements the wallet and auction-deposit foundation. The order-backed escrow lifecycle is the Phase 4 target and must not be documented as already implemented until `feature/fulfillment` exists.

## Target Lifecycle

- Deposit: user pays through VNPay and IPN credits the wallet.
- Auction join: backend moves `depositAmount` from available to frozen.
- Auction close: losers are refunded; winner deposit is deducted.
- Order payment: winner pays remaining amount into system escrow.
- Shipment and delivery: seller ships; delivery starts a protection window.
- Auto-complete: after 72 hours without dispute, backend releases seller proceeds and deducts platform fee.
- Dispute: buyer evidence freezes settlement for admin review.

## Consequences

Positive:

- Clear trust model for buyers and sellers.
- Wallet audit log supports financial traceability.
- Future fulfillment can build on existing wallet idempotency.

Negative:

- The platform holds financial liability once full escrow is implemented.
- Settlement repair/monitoring is required for background-job and process-crash scenarios.
