# Finance - Implementation Context
> Written: 2026-04-19 | Author: AI Assistant

## Business Context
`finance` is the minimum internal wallet module that unblocks auction runtime. The current scope is wallet balances, wallet transaction audit logs, read APIs for the current user, and a dev/test top-up path while real payment-provider integration is still out of scope.

## Locked Rules
1. Each user has exactly one wallet, but the implementation uses lazy creation for backward-compatible rollout.
2. Every successful balance mutation must append exactly one row to `wallet_transactions`.
3. Internal wallet mutations (`deposit`, `freeze`, `unfreeze`, `deductFrozen`) are idempotent by explicit `operationKey`.
4. Amounts are normalized once to scale `2` with a fixed rounding rule before validation, idempotency comparison, and persistence.
5. `freeze` moves funds from `available_balance` to `frozen_balance`.
6. `unfreeze` moves funds from `frozen_balance` back to `available_balance`.
7. `deductFrozen` subtracts directly from `frozen_balance` and writes a `PAYMENT` transaction.
8. `WalletTransaction.amount` is the signed delta on available balance:
   - `DEPOSIT` positive
   - `FREEZE` negative
   - `UNFREEZE` positive
   - `PAYMENT` negative
9. Dev/test top-up writes a `DEPOSIT` transaction with `referenceType = SYSTEM` and is gated by `finance.wallet.top-up-enabled`.
10. `wallet_operations` tracks idempotent business commands with lifecycle `PENDING -> SUCCESS/FAILED`.
11. `FAILED` wallet operations are terminal; retries must use a new `operationKey`.
12. `PENDING` operations older than `finance.wallet.operation.pending-timeout` fail closed and are marked `FAILED`.
13. `WalletTransactionStatus.PENDING/FAILED` remain reserved for future external payment-provider flows; internal wallet mutations still log wallet transactions only as `SUCCESS`.

## Public API
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/wallets/me` | Authenticated | Fetch current wallet balance |
| GET | `/api/v1/wallets/me/transactions` | Authenticated | Fetch wallet transaction history |
| POST | `/api/v1/wallets/me/top-up` | Authenticated + feature flag | Add dev/test money to the current wallet |

## Internal Service Contract
- `depositFunds(userId, operationKey, amount, referenceId, referenceType)`
- `freezeFunds(userId, operationKey, amount, referenceId, referenceType)`
- `unfreezeFunds(userId, operationKey, amount, referenceId, referenceType)`
- `deductFrozenFunds(userId, operationKey, amount, referenceId, referenceType)`

These methods are the direct contract for the next auction-runtime phases.
