# Identity - Implementation Context

> Updated: 2026-06-11 | Session: final-project-hardening

## Module Responsibility

`identity` owns authentication, JWT session lifecycle, RBAC, current-user profile, seller profile, addresses, Vietnamese location master data, avatar ownership, and seller reputation display data.

## Completed Scope

- Auth APIs: login, register, verify email, resend verification, forgot password, reset password, refresh, logout.
- Cookie-only HttpOnly refresh-token rotation, CSRF-protected refresh/logout, cleanup, and password-reset revocation.
- Current-user profile APIs: `GET/PUT/PATCH /api/v1/users/me`.
- Avatar APIs under identity with shared media upload/confirm/delete services.
- Seller profile APIs: `GET/POST /api/v1/users/me/seller-profile`.
- Full address-book CRUD/default APIs and public location lookup APIs.
- `SellerSummaryQueryService` for auction read-model enrichment.
- Seller reputation recalculation from catalog appraisal `sellerAccuracy`.

## Locked Rules

- Controllers should use `@CurrentUserId` instead of reading `Jwt` directly.
- Raw refresh, verification, and reset tokens must not be logged or persisted.
- Refresh tokens are stored as hashes and rotated.
- Users need a valid phone number before creating a seller profile.
- A user can have at most one seller profile.
- Only a bidder can create a seller profile; appraiser and admin accounts cannot become sellers.
- Admin appraiser provisioning creates a new appraiser-only account and rejects existing emails.
- Creating a seller profile requires re-login before the access token contains the new seller role.
- Avatar business ownership stays in identity; `feature/media` only provides generic media services.
- Addresses store province/district/ward codes and validate hierarchy in the service layer.
- The first address is automatically default; deleting the default promotes the oldest remaining address.
- Order shipping snapshots are immutable and do not change when an address-book entry is edited or deleted.

## Current Limits

- Native/mobile refresh-token transport is outside the current browser-only scope.
- Full integration verification requires Docker-backed MySQL and Redis.

## Refactor Log

### 2026-05-25 | Docs Current-State Sync

- Confirmed identity scope is current and consumed by FE auth/session recovery, profile/avatar, seller profile, and role guards.
- Clarified that admin user management is deferred.

### 2026-05-14 | Password Reset and Safe Mail Logging

- `AuthServiceImpl` remains the auth/session facade.
- Password-reset logic is split into `PasswordResetService`.
- `IdentityTokenService` owns raw-token generation and SHA-256 hashing for refresh, verification, and password-reset tokens.
- `IdentityEmailService` composes verification/reset emails and does not log raw tokens or links.
- Reset success updates the BCrypt password hash, marks the token used, and revokes active refresh tokens.

### 2026-04-18 | Avatar Ownership Belongs To Identity

- Moved avatar APIs under `feature/identity`.
- Added `UserAvatarService`.
- Kept media as a shared upload/confirm/delete layer.

### 2026-04-06 | Profile Update Hardening

- Added explicit partial-update semantics through `PATCH /users/me`.
- Normalized Vietnamese phone numbers before persistence.
- Rejected empty or invalid profile update payloads.
