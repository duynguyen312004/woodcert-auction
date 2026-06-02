# Frontend Order Module

Shared order API, types, mapping helpers, and reusable order UI live here.

Buyer and seller screens should consume `OrderSummary`/`OrderDetail` from this module instead of defining buyer- or seller-specific order shapes.

Use `OrderSummaryCard` and `OrderFeeBreakdown` for post-auction order state, payment remainder, fulfillment metadata, and seller fee/forfeited-deposit breakdowns.
