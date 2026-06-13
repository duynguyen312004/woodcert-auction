# Catalog - Implementation Context

> Updated: 2026-05-25 | Session: docs-current-state-sync

## Module Responsibility

`catalog` owns seller product inventory and the appraisal workflow. It is an internal workflow module for sellers and appraisers, not the public marketplace read API. Public buyer browse/detail uses `feature/auction`.

## Completed Scope

- Category read API and seed data.
- Seller product lifecycle: create/update/delete `DRAFT`, attach media-backed images, submit for appraisal.
- Product image upload intent and confirm flow.
- Appraiser queue visibility, claim/release, expired-claim handling, approve/reject report submission.
- Appraisal proof image upload intent and confirm flow.
- Immutable appraisal report with certificate code, SHA-256 integrity hash, seller accuracy, proof images, and seller reputation update.
- Internal product list/detail access rules for seller/appraiser.
- `ProductImageHelper` for auction read-model image selection.

## Locked Rules

- Product list/detail APIs are authenticated and visible only by workflow role.
- Seller can see their own products in all statuses.
- Appraiser can see pending products, expired claims, their own active claims, and reports they submitted.
- Exactly one primary product image is required when product images are submitted.
- Product image replacement is full replacement; detached assets are marked for async cleanup.
- Appraisal reports are immutable once submitted.
- Rejecting a product requires `appraiserNotes`.
- `sellerAccuracy` is required and contributes to seller reputation, rounded to one decimal place.
- Catalog may provide data to auction query orchestration, but auction response mapping belongs in `feature/auction`.

## Current Limits

- Category hierarchy is currently one level and returned as a flat list.
- Category admin CRUD is deferred.
- Seller-facing internal product detail page is not complete in FE even though backend detail API exists.

## Unit Test Coverage

- `ProductServiceImplTest`: product lifecycle, list/detail access, image validation.
- `ProductImageHelperTest`: primary-image fallback and batch thumbnail loading.
- `AppraisalServiceImplTest`: claim/release, approve/reject, immutable report, proof-image rules.
- `CreateAppraisalReqValidationTest`: appraisal request boundary validation.

## Refactor Log

### 2026-05-25 | Docs Current-State Sync

- Clarified that the handoff from `APPRAISED` product to auction session is implemented in `feature/auction`.
- Confirmed FE appraiser workflow is implemented, while seller product detail and seller auction flows remain incomplete.

### 2026-05-14 | Auction Read Boundary Support

- Catalog remains the source for product/category/appraisal/image data.
- `AuctionQueryService` owns buyer/public auction response enrichment.
- `AuctionResponseAssembler` remains a pure mapper and must not access repositories.

### 2026-04-18 | Catalog Internal Read APIs

- Converted `GET /api/v1/products` into an internal seller/appraiser workflow list.
- Converted `GET /api/v1/products/{id}` into internal product detail with owner/appraiser access rules.
- Moved buyer/public browse responsibility to auction.

### 2026-04-17 | Catalog Hardening Refactor

- Fixed certificate-code race condition with a two-step save using report ID.
- Added duplicate media/sort validation, usage-type validation, and reject-notes validation.
- Split product and appraisal media controllers.
