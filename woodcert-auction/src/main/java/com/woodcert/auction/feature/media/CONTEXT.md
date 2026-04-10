# Media - Implementation Context
> Written: 2026-04-09 | Author: AI Assistant + Duy Nguyen

## Business Purpose
`feature/media` is the shared media layer for WoodCert Auction. It centralizes Cloudinary upload, media metadata persistence, delivery URL generation, ownership checks, and background cleanup so business modules do not store raw cloud URLs directly.

## Current Scope
- Avatar flow is implemented end-to-end.
- Other usages are prepared in the shared design but not integrated yet:
  - `PRODUCT_IMAGE`
  - `APPRAISAL_IMAGE`
  - `SHIPMENT_PACKING_VIDEO`
  - `DISPUTE_EVIDENCE`

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
   - create `media_assets` row with `PENDING`
   - generate `publicId`
   - return signed Cloudinary params including `assetFolder`
2. Client uploads directly to Cloudinary
3. `PUT /api/v1/users/me/avatar`
   - request contains `mediaId` and `assetId`
   - backend fetches asset metadata from Cloudinary
   - backend verifies `assetId`, `publicId`, type, and size
   - backend marks asset `ACTIVE` and sets `users.avatar_media_id`
4. `DELETE /api/v1/users/me/avatar`
   - detach current avatar
   - mark old asset `PENDING_DELETE`
5. `MediaCleanupJob`
   - deletes `PENDING_DELETE` assets from Cloudinary
   - marks them `DELETED`

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

Recommended next patterns:
- `woodcert/dev/products/{productId}/gallery`
- `woodcert/dev/appraisals/{reportId}/evidence`
- `woodcert/dev/shipments/{shipmentId}/packing`
- `woodcert/dev/disputes/{disputeId}/evidence`

## Main Classes
- `MediaAsset`: database metadata for one asset
- `MediaAssetService`: create intent, confirm, mark pending delete, cleanup
- `CloudinaryApiService`: fetch metadata and destroy asset on Cloudinary
- `AvatarMediaService`: avatar-specific orchestration
- `MediaCleanupJob`: scheduled cleanup runner
- `MediaUrlBuilder`: delivery URL builder from stored metadata

## Extension Rule For Next Phases
When adding a new media use case:
1. Add a domain relationship to `media_assets`
2. Define a `MediaUploadContext` for that use case
3. Reuse `MediaAssetService` for intent/confirm/delete
4. Add usage-specific validation if needed
5. Return derived URLs from backend response, not raw Cloudinary URLs from client input
