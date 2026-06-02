# Fulfillment Feature Context

## Responsibility
`feature.fulfillment` owns shipment, tracking, buyer receive confirmation, and auto-completion.

Fulfillment references orders by `orderId`; it does not know auction internals.

## Lifecycle
- `PENDING_SHIPMENT`: order is paid and seller can ship.
- `SHIPPED`: seller provided tracking and auto-complete deadline is active.
- `DELIVERED`: buyer confirmed receipt.
- `AUTO_COMPLETED`: scheduler completed after deadline.
- `CANCELED`: reserved for future cancellation/dispute flows.

## Order Interaction
Fulfillment creates pending shipment records through the `OrderFulfillmentPort` implemented for the order module.

Seller ship calls `OrderService.markFulfilling`.

Buyer receive or scheduler auto-complete calls `OrderService.completeFromFulfillment`, which handles seller payout, platform commission, and source completion callback.
