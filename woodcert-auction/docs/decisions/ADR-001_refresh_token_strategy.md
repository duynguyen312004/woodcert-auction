# ADR-001: Refresh Token Strategy — Cookie (SPA) + Body (Mobile)

## Status

Accepted, implemented, updated on 2026-05-25

## Context

The system serves browser SPA clients and may later serve native mobile clients. Browser clients should not store refresh tokens in JavaScript-readable storage, while mobile clients still need a body-based token option.

## Decision

Use dual-source refresh tokens:

- SPA: backend sets `refresh_token` as an `HttpOnly` cookie.
- Mobile/fallback: backend also accepts `refreshToken` in the request body.
- Backend checks cookie first, then body.
- Refresh tokens are rotated and persisted so logout, reset-password revocation, expiration, and cleanup are enforceable.

Current token lifetime:

| Token | Expiration | Storage |
|-------|------------|---------|
| Access token | 15 minutes | SPA memory / mobile secure storage |
| Refresh token | 7 days | SPA HttpOnly cookie / mobile secure storage |

## Implementation Notes

- Login and refresh emit cookies using `ResponseCookie`.
- Cookie attributes are configurable: `HttpOnly`, `Secure`, `SameSite`, `Path`, and `Max-Age`.
- Local profile may disable `Secure` so localhost HTTP testing works.
- Cookie `Path` is scoped to auth endpoints by default.
- Password reset success revokes active refresh tokens for that account.
- Refresh-token cleanup removes expired or revoked tokens.
- Raw refresh tokens, reset links, and verification links must not be logged.

## Consequences

Positive:

- SPA refresh token is not accessible to JavaScript.
- Mobile clients can still use body-based refresh.
- Rotation and persistence support logout, account recovery, and cleanup.

Negative:

- Backend and FE tests must cover cookie and body paths.
- Cookie behavior differs between local HTTP and production HTTPS, so `Secure` must stay environment-aware.

## Files Affected

- `core/config/SecurityConfig.java`
- `core/config/RefreshCookieProperties.java`
- `feature/identity/controller/AuthController.java`
- `feature/identity/service/AuthServiceImpl.java`
- `feature/identity/service/IdentityTokenService.java`
- `feature/identity/service/cleanup/RefreshTokenCleanupJob.java`
- `src/main/resources/application*.yml`
