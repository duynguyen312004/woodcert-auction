# Media - Implementation Context
> Written: 2026-04-09 | Updated: 2026-04-18 | Author: AI Assistant + Duy Nguyen

## Business Purpose
`feature/media` is the shared media layer for WoodCert Auction. It centralizes Cloudinary upload, media metadata persistence, delivery URL generation, ownership checks, and background cleanup so business modules do not store raw cloud URLs directly.

## Current Scope
- Media is already integrated for:
  - `USER_AVATAR`
  - `PRODUCT_IMAGE`
  - `APPRAISAL_IMAGE`
- Media remains generic and reusable for later phases:
  - `SHIPMENT_PACKING_VIDEO`
  - `DISPUTE_EVIDENCE`
- Business modules own the public APIs:
  - `identity` owns avatar endpoints
  - `catalog` owns product-image and appraisal-image endpoints
  - `media` only provides shared upload/confirm/delete primitives

## Core Decisions
- Database stores `media_assets` metadata and business relationships, not raw upload URLs as source of truth.
- Cloudinary stores the actual file.
- Client uploads directly to Cloudinary after receiving a signed upload intent from the backend.
- Backend confirms the upload by querying Cloudinary directly.
- Confirmation is based on immutable `assetId`, then cross-checked against the issued `publicId`.
- Deletion is asynchronous:
  - detach asset from business entity first
  - mark `PENDING_DELETE`
  - scheduled cleanup destroys the asset in Cloudinary later

## Avatar Flow
1. `POST /api/v1/users/me/avatar/upload-intent`
   - identity module validates the current user
   - media creates `media_assets` row with `PENDING`
   - media generates `publicId`
   - media returns signed Cloudinary params including `assetFolder`
2. Client uploads directly to Cloudinary
3. `PUT /api/v1/users/me/avatar`
   - request contains `mediaId` and `assetId`
   - media fetches asset metadata from Cloudinary
   - media verifies `assetId`, `publicId`, type, and size
   - identity attaches the confirmed asset to `users.avatar_media_id`
4. `DELETE /api/v1/users/me/avatar`
   - identity detaches current avatar
   - identity marks old asset `PENDING_DELETE` through media service
5. `MediaCleanupJob` (3-Phase cleanup)
   - Phase 1: Marks stale `PENDING` assets as `PENDING_DELETE` (e.g. user requested intent but never uploaded).
   - Phase 2: Marks orphan `ACTIVE` assets as `PENDING_DELETE` (e.g. asset uploaded but not attached to avatar, product image, or appraisal image).
   - Phase 3: Executes actual Cloudinary deletion for `PENDING_DELETE` and `DELETE_FAILED` assets, marking them `DELETED` upon success.

## Catalog Media Flows
### Product Images
1. `POST /api/v1/products/images/upload-intent`
2. Client uploads directly to Cloudinary
3. `PUT /api/v1/products/images/confirm`
4. Seller references confirmed `mediaId` values when creating/updating a product

### Appraisal Proof Images
1. `POST /api/v1/appraisals/images/upload-intent`
2. Client uploads directly to Cloudinary
3. `PUT /api/v1/appraisals/images/confirm`
4. Appraiser references confirmed `mediaId` values when submitting an appraisal report

## Cloudinary Upload Contract
The direct upload request to Cloudinary must include:
- `file`
- `api_key`
- `timestamp`
- `signature`
- `public_id`
- `asset_folder`

`public_id` is used for delivery URL generation and business traceability.
`asset_folder` is used to keep Cloudinary Media Library organized by folder hierarchy.

## Folder Strategy
Current avatar folder pattern:
- `woodcert/dev/users/{userId}/avatar`

Product Image folder pattern:
- `woodcert/dev/users/{userId}/products`

Appraisal Image folder pattern:
- `woodcert/dev/users/{userId}/appraisals`

Recommended next patterns:
- `woodcert/dev/shipments/{shipmentId}/packing`
- `woodcert/dev/disputes/{disputeId}/evidence`

## Main Classes
- `MediaAsset`: database metadata for one asset
- `MediaAssetService`: create intent, confirm, mark pending delete, cleanup
- `CloudinaryApiService`: fetch metadata and destroy asset on Cloudinary
- `MediaCleanupJob`: scheduled cleanup runner
- `MediaUrlBuilder`: delivery URL builder from stored metadata

## Module Boundary
- `media` should not own avatar/product/appraisal business rules.
- Owning modules are responsible for:
  - validating actor and business state
  - attaching/detaching `media_assets` to domain entities
  - deciding when an asset becomes orphaned from business perspective
- `media` is responsible for:
  - upload intent creation
  - Cloudinary confirmation by immutable asset metadata
  - async cleanup lifecycle

## Extension Rule For Next Phases
When adding a new media use case:
1. Add a domain relationship to `media_assets`
2. Define a `MediaUploadContext` for that use case
3. Reuse `MediaAssetService` for intent/confirm/delete
4. Add usage-specific validation if needed
5. Return derived URLs from backend response, not raw Cloudinary URLs from client input
