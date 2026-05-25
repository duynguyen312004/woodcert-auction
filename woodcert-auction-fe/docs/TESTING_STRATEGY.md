# Testing Strategy

Last updated: 2026-05-25

## Official FE Test Stack

- Vitest
- React Testing Library
- MSW
- Playwright

## Testing Boundaries

### Vitest

Use for:

- utilities
- query helper logic
- auth/token logic
- time offset logic
- data mappers
- small state-store behavior

### React Testing Library

Use for:

- component rendering
- form validation behavior
- route-guard behavior
- auction room UI state transitions
- wallet and transaction views

### MSW

Use for:

- mocking REST responses
- mocking refresh behavior
- driving integration-style tests around Axios + Query hooks without real backend dependency

### Playwright

Use for:

- end-to-end critical flows
- browser behavior around routing, auth, websocket recovery, and upload workflows

## Minimum Coverage Areas

- Axios response unwrap and normalized error mapping
- `401 -> refresh -> retry` behavior
- concurrent request waiting during refresh
- refresh failure logout path
- auth/session effects and route-guard redirects
- profile/avatar upload state
- seller product image upload state
- appraiser queue/detail/proof uploader/appraisal payload behavior
- websocket cache patch on `NEW_BID`
- websocket reconnect and refetch recovery
- countdown logic using server-time offset
- seller auction creation form rules
- media uploader state machine

Current automated status: `pnpm test` passed on 2026-05-25 with 19 test files and 50 tests. WebSocket, countdown offset, wallet page, auction registration, bidding room, and seller auction form tests are still future coverage because those FE flows are not implemented yet.

## Critical E2E Scenarios

1. Login and session recovery
2. Seller product create, media upload, and appraisal submission
3. Appraiser review and appraisal submit
4. Wallet top-up and transaction history refresh
5. Auction registration with wallet balance change
6. Live bidding with websocket updates
7. Websocket disconnect and reconnect recovery
8. Seller auction create and cancel

## Test Quality Rules

- Prefer deterministic test data.
- Avoid coupling component tests to implementation details.
- Mock network boundaries, not internal functions, when testing feature integration.
- Do not rely on websocket as the only state source in tests; verify REST reconciliation too.
