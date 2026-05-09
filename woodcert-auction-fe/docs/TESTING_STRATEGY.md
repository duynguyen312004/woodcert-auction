# Testing Strategy

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
- websocket cache patch on `NEW_BID`
- websocket reconnect and refetch recovery
- countdown logic using server-time offset
- seller auction creation form rules
- media uploader state machine

## Critical E2E Scenarios

1. Login and session recovery
2. Wallet top-up and transaction history refresh
3. Auction registration with wallet balance change
4. Live bidding with websocket updates
5. Websocket disconnect and reconnect recovery
6. Seller product create, media upload, and appraisal submission
7. Appraiser review and appraisal submit
8. Seller auction create and cancel

## Test Quality Rules

- Prefer deterministic test data.
- Avoid coupling component tests to implementation details.
- Mock network boundaries, not internal functions, when testing feature integration.
- Do not rely on websocket as the only state source in tests; verify REST reconciliation too.
