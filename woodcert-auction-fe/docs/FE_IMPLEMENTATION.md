# WoodCert Auction FE Implementation Roadmap

Last updated: 2026-05-25

This roadmap summarizes implementation order. `PROJECT-STATUS.md` is the current progress source of truth.

## Current Implementation

- Foundation, app shell, router, providers, Axios, auth store, Query client, and test stack are in place.
- Auth flow is implemented: login, register, verify email, pending verification, forgot/reset password, logout, and silent refresh.
- Public home and `/auctions` list are implemented against real backend APIs.
- Account profile/avatar flow is implemented.
- Header wallet balance uses real `GET /wallets/me`.
- Seller profile, seller dashboard, product list, product create/edit, and product image upload are implemented.
- Seller auction workflow is implemented for create/list/cancel/detail using existing backend contracts.
- Appraiser workflow is implemented end to end: queue, claim/release, detail, proof upload, approve/reject, reviewed tabs.

## Pending MVP Work

1. Auction detail page
   - route `/auctions/:id`
   - `GET /auctions/{id}`
   - registration/bidding entry states
2. Buyer wallet page
   - balance
   - transaction history
   - dev top-up
3. Auction registration and bidding room
   - `POST /auctions/{id}/register`
   - `POST /bids`
   - STOMP subscription scoped to bidding/detail lifecycle
   - REST reconciliation after websocket updates
4. Hardening
   - server-time countdown offset
   - responsive polish
   - Playwright coverage for critical flows

## Deferred

- Admin operations
- Public certificate verification
- Orders, fulfillment, shipping, disputes
- Real payment-provider integration
- Runtime env injection strategy beyond initial static Vite setup

## Constraints

- REST remains the source of truth.
- WebSocket may hot-patch cache but must reconcile through TanStack Query refetch.
- Access token remains memory-first.
- Feature routing stays feature-owned and composed in `app/router`.
- No root-level `services/`, `pages/`, or `context/` architecture primitives.
