# Project Status

> Last updated: 2026-04-18 | By: AI Assistant | Session: catalog-media-hardening
>
> AI: update this file at the end of every session when asked.
> Follow this exact format. Keep it concise.

---

## Completed
- [x] Project skeleton, core shared layer, base docs, and architecture decisions
- [x] Security foundation: JWT auth, RBAC, refresh token rotation, `@CurrentUserId`
- [x] Identity phase: auth, current-user profile GET/PUT/PATCH, seller profile, addresses, location APIs
- [x] Avatar orchestration moved under `identity`; avatar now reuses generic media upload/confirm flow
- [x] Shared media foundation: `media_assets`, signed Cloudinary upload intent, confirm-by-`assetId`, async cleanup
- [x] Media cleanup hardening: stale `PENDING`, orphan `ACTIVE`, and Cloudinary delete retry flow
- [x] Catalog phase: categories, products, product images, appraisal reports, appraisal images
- [x] Category read API + seed data for 11 wood-art categories
- [x] Seller catalog workflow: create/update/delete `DRAFT`, submit for appraisal, media-based product images
- [x] Appraiser workflow: submit immutable appraisal report, certificate code generation, proof-image media flow
- [x] Catalog read APIs hardened as internal workflow APIs for seller/appraiser only
- [x] `GET /api/v1/products` now serves seller/appraiser scope only
- [x] `GET /api/v1/products/{id}` now enforces owner/appraiser-only access
- [x] Buyer/public product browse responsibility is explicitly deferred to the future auction module
- [x] Unit-test coverage expanded around catalog access control, image cleanup, image fallback, and avatar refactor

## In Progress
- Documentation and context consolidation for catalog, media, identity, and project status
- Phase-3 auction boundary review: what can start now vs. what still depends on finance/deposit contracts

## Deferred Issues
- Full controller/integration test coverage
- Category admin CRUD
- Finance wallet implementation
- Auction module implementation
- Fulfillment/dispute implementation

## Warnings
- `mvnw.cmd` is broken in the current environment
- Running Maven verification inside sandbox may require elevated execution

## Next Tasks
1. Define Phase 3 auction scope around `APPRAISED` products: public browse/detail, seller create session, auction state model
2. Freeze the finance contract needed by auction registration, deposit freeze, and settlement
3. Scaffold auction module after the product-to-auction boundary is fully locked

## Milestones

### Phase 0 - Foundation
- [x] Core app skeleton, exception handling, JWT infrastructure, modular-monolith baseline

### Phase 1 - Identity & Access
- [x] Auth/session APIs
- [x] Profile, seller profile, address, and location APIs
- [x] Avatar APIs under identity using shared media services

### Phase 2 - Catalog & Appraisal Workflow
- [x] Category read API + seed data
- [x] Seller draft product lifecycle with media-backed images
- [x] Appraiser report submission with immutable appraisal report
- [x] Internal catalog list/detail rules for seller and appraiser only

### Phase 3 - Auction Foundation
- [ ] Auction session domain and APIs for `APPRAISED` products
- [ ] Public buyer-facing browse/detail read model
- [ ] Seller create-auction-session flow
- [ ] Auction status lifecycle and validation rules

### Phase 4 - Finance & Realtime Bidding
- [ ] Wallet and wallet transaction domain
- [ ] Deposit freeze/unfreeze/deduct services
- [ ] Auction registration tied to finance
- [ ] Redis Lua bidding flow + WebSocket broadcast

### Phase 5 - Fulfillment & Dispute
- [ ] Order, shipment, dispute domain
- [ ] Escrow release / refund flows
- [ ] Auto-complete and dispute resolution
