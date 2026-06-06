# Auction Runtime Invariants

1. `ACTIVE` live price/end time are Redis-owned; terminal states are MySQL-owned.
2. Public auction list defaults to `WAITING` and `ACTIVE`; `CANCELED` and `ENDED_FAILED` are not public list/detail states.
3. A product can have multiple historical sessions but only one open `WAITING` or `ACTIVE` session.
4. Seller cannot register or bid in their own product auction.
5. A participant can bid only while their deposit status is `FROZEN`.
6. A participant may withdraw only while the session is `WAITING` and their deposit is `FROZEN`.
7. Withdrawal changes the deposit to `WITHDRAWN`, preserves the participant row, and permanently blocks re-registration for that session.
8. Lua `OK` means runtime acceptance even if async MySQL bid persistence later fails.
9. Activation must not commit `ACTIVE` unless Redis state is written successfully.
10. Close must commit terminal session state before participant wallet settlement.
11. Settlement is idempotent through deterministic wallet operation keys.
12. Auction settlement changes participant deposits only from `FROZEN` to `REFUNDED` or `DEDUCTED`.
13. `CONFISCATED` is reserved for order non-payment and is applied by `AuctionOrderSourceAdapter`.
14. Auction must not store order, fulfillment, payout, or dispute state.
15. The only allowed auction/order coupling is `OrderSourceAdapter`: auction supplies source snapshot and handles source callbacks.
16. Auction read DTO mapping belongs in `AuctionResponseAssembler`; repository access stays in query services.
