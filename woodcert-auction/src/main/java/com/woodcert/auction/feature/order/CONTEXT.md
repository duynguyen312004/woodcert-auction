# Order Module

## Responsibility

`order` owns the post-sale commercial transaction after a source supplies buyer, seller, product, price, and applied deposit.

## Key Components

- Source-agnostic order creation through `OrderSourceAdapter`.
- Buyer/seller lists, detail, status counts, payment, and seller revenue summary.
- Payment deadline cancellation and deposit forfeiture split.
- Commercial outcomes for fulfillment completion and dispute resolution.

## Boundary Rules

- Order does not inject auction repositories or entities.
- Fulfillment state is read through `OrderFulfillmentPort`.
- Dispute initiates decisions; order applies refunds, payouts, commission, and source callbacks.
- List response assembly bulk-loads fulfillment snapshots for the page.

## Lifecycle And Contracts

- `PENDING_PAYMENT` -> `PAID` -> `FULFILLING` -> `COMPLETED`.
- Active disputes move the order to `DISPUTED`.
- Deadline cancellation and buyer-wins disputes end at `CANCELED`.
- Buyer confirmation is final and immediately completes payout by current product policy.

## Known Limitations

- There is no post-confirmation dispute window.
- Auction is currently the only implemented order source.
