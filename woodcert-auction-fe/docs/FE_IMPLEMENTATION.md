# WoodCert Auction FE Implementation Roadmap

Last updated: 2026-06-19

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
- Buyer participation history and outcome detail are implemented.
- Server-time offset, lazy route chunks, custom portal-aware 404 pages, and production Docker/Nginx
  deployment are implemented.
- Disputes include participant/admin immutable conversation timelines.

## Remaining acceptance work

1. Run the clean-database browser checklist with real SMTP, Cloudinary, and VNPay Sandbox
   credentials.
2. Complete responsive acceptance for public, buyer, seller, appraiser, and admin portals.
3. Extend Playwright coverage for backend-connected realtime/concurrency and upload workflows.

## Deferred

- Runtime env injection strategy beyond initial static Vite setup
- Advanced realtime/reconnect Playwright coverage
- Stored winner/loser notifications
- Sound, vibration, and richer realtime effects

## Constraints

- REST remains the source of truth.
- WebSocket may hot-patch cache but must reconcile through TanStack Query refetch.
- Access token remains memory-first.
- Feature routing stays feature-owned and composed in `app/router`.
- No root-level `services/`, `pages/`, or `context/` architecture primitives.
