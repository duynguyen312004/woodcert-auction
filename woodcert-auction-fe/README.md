# WoodCert Auction FE Docs

This folder contains the frontend app and architecture docs for the FE that integrates with the verified backend in `woodcert-auction`.

## Current State

- Backend auction runtime has already been verified with unit and integration tests.
- Frontend foundation scaffold is in place with Vite, React, TypeScript, Tailwind, shadcn/ui, React Router, TanStack Query, Zustand, Axios, Vitest, and Playwright.
- `docs/` remains the source of truth for FE architecture, rules, integration behavior, and implementation order.

## Document Index

- [ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [PROJECT-RULES.md](docs/PROJECT-RULES.md)
- [PROJECT-STATUS.md](docs/PROJECT-STATUS.md)
- [SETUP.md](docs/SETUP.md)
- [API_INTEGRATION.md](docs/API_INTEGRATION.md)
- [UI_GUIDELINES.md](docs/UI_GUIDELINES.md)
- [TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md)
- [FE_IMPLEMENTATION.md](docs/FE_IMPLEMENTATION.md)
- [ADR-001 FE Stack](docs/decisions/ADR-001_fe_stack.md)

## Scope

The initial FE scope covers:

- public auction browsing
- buyer wallet, registration, and bidding
- seller product and auction workflows
- appraiser appraisal workflow

Deferred for later phases:

- `features/admin`
- fulfillment, orders, shipping, disputes
- real payment provider integration
