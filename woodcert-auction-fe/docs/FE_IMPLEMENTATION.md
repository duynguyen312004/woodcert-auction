# WoodCert Auction FE Implementation Roadmap

Last updated: 2026-05-08

This document is the implementation roadmap for the frontend. It is intentionally shorter than the architecture and rules docs. Treat the files below as the operational source of truth:

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [PROJECT-RULES.md](PROJECT-RULES.md)
- [API_INTEGRATION.md](API_INTEGRATION.md)
- [TESTING_STRATEGY.md](TESTING_STRATEGY.md)

## Implementation Goal

Build a Vite-based React SPA for the verified backend MVP with these user groups:

- guest: browse auctions
- buyer: login, top up dev wallet, register, bid in realtime
- seller: manage products and create auctions
- appraiser: review and appraise products

## Locked Stack

- React + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- React Router
- TanStack Query
- Zustand for small auth/UI state
- Axios with interceptors
- SockJS + STOMP for auction realtime
- pnpm
- Docker multi-stage build + nginx runtime

## Delivery Phases

1. Foundation
   - scaffold the app
   - install stack dependencies
   - create app shell, router, providers, Axios client, auth store, query client
2. Public auction experience
   - categories
   - auction list
   - auction detail
3. Buyer runtime
   - auth flow
   - wallet and transactions
   - auction registration
   - live bidding room
4. Seller workflow
   - seller profile
   - product CRUD
   - product media upload
   - auction create/list/cancel
5. Appraiser workflow
   - pending products
   - appraisal detail
   - appraisal proof upload
   - submit appraisal
6. Hardening
   - error copy
   - responsive polish
   - automated tests
   - production deploy readiness

## Implementation Constraints

- REST stays the source of truth.
- WebSocket may hot-patch cache for UX, but every important realtime change must still reconcile through TanStack Query refetch.
- Access token is memory-first.
- Refresh uses `withCredentials: true` and backend cookie support.
- Feature routing must be feature-owned and composed in `app/router`.
- No code should be scaffolded outside the hybrid feature-first structure defined in [ARCHITECTURE.md](ARCHITECTURE.md).
