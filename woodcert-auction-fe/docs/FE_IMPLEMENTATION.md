# WoodCert Auction FE Implementation Roadmap

Last updated: 2026-05-28

This roadmap summarizes implementation order. `PROJECT-STATUS.md` is the current progress source of truth.

## Current Implementation

- Foundation, app shell, router, providers, Axios, auth store, Query client, and test stack are in place.
- Auth flow is implemented: login, register, verify email, pending verification, forgot/reset password, logout, and silent refresh.
- Public home and `/auctions` list are implemented against real backend APIs.
- Account profile/avatar flow is implemented.
- Wallet page, transaction history, VNPay deposit flow, and header wallet balance are implemented.
- Seller profile, seller dashboard, product list, product create/edit, and product image upload are implemented.
- Seller auction workflow is implemented for create/list/cancel/detail using existing backend contracts.
- Appraiser workflow is implemented end to end: queue, claim/release, detail, proof upload, approve/reject, reviewed tabs.

## Pending MVP Work

1. Hardening
   - server-time countdown offset
   - responsive polish
   - Playwright coverage for critical flows
2. Buyer participation history
   - buyer-owned list of joined/ended auctions
   - winner/loser status surfaced from participation contracts where available

## Deferred

- Admin operations
- Public certificate verification
- Orders, fulfillment, shipping, disputes
- Runtime env injection strategy beyond initial static Vite setup

## Constraints

- REST remains the source of truth.
- WebSocket may hot-patch cache but must reconcile through TanStack Query refetch.
- Access token remains memory-first.
- Feature routing stays feature-owned and composed in `app/router`.
- No root-level `services/`, `pages/`, or `context/` architecture primitives.
