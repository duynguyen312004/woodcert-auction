# Dispute Feature Context

## Responsibility
`feature.dispute` is the reserved boundary for future order/fulfillment dispute handling.

Current implementation is a skeleton only:
- `DisputeCase`
- `DisputeStatus`
- `DisputeCaseRepository`

## Future Direction
Disputes should reference `orderId` and optionally `fulfillmentId`.

When dispute workflow is implemented, it should transition the order to `DISPUTED`, hold or redirect payouts through finance, and resolve back into completion/refund outcomes.
