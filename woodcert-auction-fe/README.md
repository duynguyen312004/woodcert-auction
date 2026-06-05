# WoodCert Auction FE

React SPA for WoodCert Auction, integrated with the Spring Boot backend in `../woodcert-auction`.

## Current State

- Implemented: app shell, route composition, auth/session recovery with CSRF refresh, public home, auction list/detail, bidding room, buyer auction history, buyer/seller orders, fulfillment/dispute flows, admin revenue/disputes/categories/appraisers, certificate lookup, address book, seller product/auction flows, appraiser workflow, wallet/VNPay, lazy route chunks, server-clock sync, and shared fallback product image.
- Removed: seller appraisal route/menu (`/seller/appraisals`).
- Static: blog content remains mock/static, not CMS/API-backed.
- Verification commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm test:e2e`.

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
