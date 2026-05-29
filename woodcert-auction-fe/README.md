# WoodCert Auction FE

React SPA for WoodCert Auction, integrated with the Spring Boot backend in `../woodcert-auction`.

## Current State

- Implemented: app shell, route composition, auth/session recovery, public home, auction list, account/profile/avatar, seller profile/product flows, seller auction flows, appraiser workflow, wallet page, wallet transaction history, and VNPay deposit flow.
- Pending: auction detail, auction registration, realtime bidding room, buyer bid history, and address book.
- Deferred: admin operations, orders, fulfillment, shipping, disputes.
- Tests: `pnpm test` passed on 2026-05-28 with 24 files and 69 tests.

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
