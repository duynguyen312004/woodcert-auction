# WoodCert Auction FE

React SPA for WoodCert Auction, integrated with the Spring Boot backend in `../woodcert-auction`.

## Current State

- Implemented: app shell, route composition, auth/session recovery, public home, auction list, account/profile/avatar, seller profile/product flows, appraiser workflow, and wallet balance in the header.
- Pending: auction detail, auction registration, realtime bidding room, full wallet page, wallet transactions, buyer bid history, address book, seller auction create/list/cancel.
- Deferred: admin operations, orders, fulfillment, shipping, disputes, real payment provider integration.
- Tests: `pnpm test` passed on 2026-05-25 with 19 files and 50 tests.

## Document Index

- [Architecture](docs/ARCHITECTURE.md)
- [Project rules](docs/PROJECT-RULES.md)
- [Project status](docs/PROJECT-STATUS.md)
- [Setup](docs/SETUP.md)
- [API integration](docs/API_INTEGRATION.md)
- [UI guidelines](docs/UI_GUIDELINES.md)
- [Testing strategy](docs/TESTING_STRATEGY.md)
- [Implementation roadmap](docs/FE_IMPLEMENTATION.md)
- [ADR-001 FE Stack](docs/decisions/ADR-001_fe_stack.md)

## Commands

```bash
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm test:e2e
```

The FE expects the backend API at `VITE_API_BASE_URL` and the auction WebSocket endpoint at `VITE_WS_BASE_URL`.
