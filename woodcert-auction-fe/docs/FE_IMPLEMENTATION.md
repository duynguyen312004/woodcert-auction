# WoodCert Auction FE Implementation Roadmap

Last updated: 2026-06-02

This roadmap summarizes implementation order. `PROJECT-STATUS.md` is the current progress source of truth.

## Current Implementation

- Foundation, app shell, router, providers, Axios, auth store, Query client, and test stack are in place.
- Auth flow is implemented: login, register, verify email, pending verification, forgot/reset password, logout, and silent refresh.
- Public home and `/auctions` list are implemented against real backend APIs.
- Account profile/avatar flow is implemented.
- Wallet page, transaction history, VNPay deposit flow, and header wallet balance are implemented.
- Seller profile, seller dashboard, product list, product create/edit, and product image upload are implemented.
- Seller auction workflow is implemented for create/list/cancel/detail using existing backend contracts.
- Buyer/seller order lists, fulfillment actions, dispute open/current/cancel, and admin dispute resolution are implemented.
- Admin revenue, categories, appraisers, public certificate verification, address book, and seller product detail are implemented.
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

- Runtime env injection strategy beyond initial static Vite setup
- Advanced realtime/reconnect Playwright coverage
- Production route-level code splitting

## Constraints

- REST remains the source of truth.
- WebSocket may hot-patch cache but must reconcile through TanStack Query refetch.
- Access token remains memory-first.
- Feature routing stays feature-owned and composed in `app/router`.
- No root-level `services/`, `pages/`, or `context/` architecture primitives.
