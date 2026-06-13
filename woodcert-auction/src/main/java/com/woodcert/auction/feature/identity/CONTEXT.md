# Identity Module

## Responsibility

`identity` owns authentication, session lifecycle, RBAC, profiles, addresses, location data, operator accounts, account/capability suspension, and identity-owned media relationships.

## Key Components

- Login, registration, verification, refresh, logout, forgot-password, and reset-password services.
- Current-user profile, avatar, seller profile, and address-book APIs.
- Admin user search, ban/unban, appraiser provisioning, capability controls, and audit logs.
- Query services that expose identity snapshots to order and auction read models.

## Boundary Rules

- Controllers use `@CurrentUserId` for authenticated user identity.
- Raw security tokens are never logged or persisted.
- Avatar ownership stays in identity; generic upload mechanics stay in media.
- Cross-feature consumers use query services or snapshots where available instead of identity repositories.

## Lifecycle And Contracts

- Refresh tokens are hashed, rotated, and revoked on logout or password reset.
- Seller profile creation adds the seller role and requires a new login for updated JWT claims.
- The first address becomes default; deleting it promotes the oldest remaining address.
- Order shipping addresses are copied into immutable order snapshots.

## Known Limitations

- Docker-backed MySQL and Redis are required for full integration verification.
- Some legacy catalog/identity orchestration still crosses repository boundaries and is tracked as modular technical debt.
