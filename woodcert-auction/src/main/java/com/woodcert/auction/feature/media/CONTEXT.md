# Media Module

## Responsibility

`media` provides shared Cloudinary upload intents, metadata persistence, confirmation, delivery URL generation, ownership checks, and asynchronous cleanup.

## Key Components

- `MediaAssetService` for intent, confirmation, and cleanup state changes.
- `CloudinaryApiService` for provider metadata and deletion.
- `MediaCleanupJob` for stale, orphaned, and pending-delete assets.
- `MediaUrlBuilder` for derived delivery URLs.

## Boundary Rules

- Business modules own avatar, product, appraisal, and dispute endpoints.
- Media stores provider metadata, not client-supplied delivery URLs.
- Confirmation cross-checks immutable Cloudinary asset ID and public ID.
- Owning modules decide when assets attach, detach, or become orphaned.

## Lifecycle And Contracts

- Supported usage types include avatar, product image, appraisal image, and dispute evidence.
- Clients upload directly after receiving signed parameters.
- Confirmed assets become active; detached assets are deleted asynchronously.
- Current folders are scoped below the configured base folder by user and use case.

## Known Limitations

- Shipment packing video is reserved but not implemented.
- Cloudinary credentials and production base folder must be supplied by deployment configuration.
