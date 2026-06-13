# ADR-001: Refresh Token Strategy - HttpOnly Cookie for Web SPA

## Status

Accepted, implemented, updated on 2026-06-11

## Context

The current product is a browser SPA. Refresh tokens must not be exposed to JavaScript-readable storage or API response bodies.

## Decision

Use a cookie-only refresh-token contract:

- Login and refresh set `refresh_token` as an `HttpOnly` cookie.
- Refresh and logout read the token only from that cookie.
- Login and refresh response bodies never contain a refresh token.
- Cookie refresh/logout require double-submit CSRF.
- Refresh tokens are rotated and persisted so logout, reset-password revocation, expiration, and cleanup are enforceable.

Current token lifetime:

| Token | Expiration | Storage |
|-------|------------|---------|
| Access token | 15 minutes | SPA memory |
| Refresh token | 7 days | SPA HttpOnly cookie |

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
- Rotation and persistence support logout, account recovery, and cleanup.

Negative:

- A future native client needs a separate reviewed token transport contract instead of reusing this browser endpoint.
- Cookie behavior differs between local HTTP and production HTTPS, so `Secure` must stay environment-aware.

## Files Affected

- `core/config/SecurityConfig.java`
- `core/config/RefreshCookieProperties.java`
- `feature/identity/controller/AuthController.java`
- `feature/identity/service/AuthServiceImpl.java`
- `feature/identity/service/IdentityTokenService.java`
- `feature/identity/service/cleanup/RefreshTokenCleanupJob.java`
- `src/main/resources/application*.yml`
