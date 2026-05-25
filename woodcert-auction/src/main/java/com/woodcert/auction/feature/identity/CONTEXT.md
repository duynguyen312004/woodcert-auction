# Identity - Implementation Context

> Updated: 2026-05-25 | Session: docs-current-state-sync

## Module Responsibility

`identity` owns authentication, JWT session lifecycle, RBAC, current-user profile, seller profile, addresses, Vietnamese location master data, avatar ownership, and seller reputation display data.

## Completed Scope

- Auth APIs: login, register, verify email, resend verification, forgot password, reset password, refresh, logout.
- Refresh-token rotation, refresh-token cleanup, cookie/body refresh support, and password-reset revocation.
- Current-user profile APIs: `GET/PUT/PATCH /api/v1/users/me`.
- Avatar APIs under identity with shared media upload/confirm/delete services.
- Seller profile APIs: `GET/POST /api/v1/users/me/seller-profile`.
- Address APIs and public location lookup APIs.
- `SellerSummaryQueryService` for auction read-model enrichment.
- Seller reputation recalculation from catalog appraisal `sellerAccuracy`.

## Locked Rules

- Controllers should use `@CurrentUserId` instead of reading `Jwt` directly.
- Raw refresh, verification, and reset tokens must not be logged or persisted.
- Refresh tokens are stored as hashes and rotated.
- Users need a valid phone number before creating a seller profile.
- A user can have at most one seller profile.
- Creating a seller profile requires re-login before the access token contains the new seller role.
- Avatar business ownership stays in identity; `feature/media` only provides generic media services.
- Addresses store province/district/ward codes and validate hierarchy in the service layer.

## Current Limits

- No admin user-management/provisioning UI/API is implemented yet.
- No brute-force protection exists for login.
- `.\mvnw.cmd -Dtest=!WoodcertAuctionApplicationTests test` passed on 2026-05-25; `clean test` still requires MySQL for the Spring context test.

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
