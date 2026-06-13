# Fulfillment Module

## Responsibility

`fulfillment` owns shipment records, tracking, buyer receipt confirmation, and automatic completion.

## Key Components

- Pending shipment creation after order payment.
- Seller shipping confirmation and tracking details.
- Buyer receipt confirmation and overdue scheduler completion.
- Order and dispute port adapters.

## Boundary Rules

- Fulfillment references orders by ID and does not know auction internals.
- Commercial payout/refund effects stay in order.
- Order reads fulfillment through single and bulk snapshot methods.
- Dispute outcomes are applied through `DisputeFulfillmentPort`.

## Lifecycle And Contracts

- `PENDING_SHIPMENT` -> `SHIPPED` -> `DELIVERED` or `AUTO_COMPLETED`.
- Buyer-wins resolution moves fulfillment to `CANCELED`.
- Third-party delivery requires carrier and tracking code.
- Self delivery does not require tracking information.

## Known Limitations

- Shipment packing media is not implemented.
- The order/dispute adapters create accepted package-level coupling that is tracked as modular technical debt.
