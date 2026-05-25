# Core - CONTEXT.md

> Updated: 2026-05-25 | Session: docs-current-state-sync

## Module Responsibility
`core` contains cross-cutting infrastructure shared by feature modules: response wrappers, exception handling, security helpers, JWT configuration, audit base entity, and shared configuration properties.

## Response and Error Contract
- REST controllers return `ApiResponse<T>`.
- `ApiResponse.error(...)` supports nullable `errorCode`.
- `GlobalExceptionHandler` includes `errorCode` when an `AppException` was created from `ErrorCode`.
- Clients should treat `statusCode` and `message` as human-facing compatibility fields, and use `errorCode` for machine-readable branching when present.

## Cookie Contract
- Refresh-token cookies are emitted through Spring `ResponseCookie`.
- `RefreshCookieProperties` controls `secure`, `path`, `maxAge`, and `sameSite`.
- Default cookie behavior is `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/api/v1/auth`, and `Max-Age=604800`.
- Controllers should use `HttpHeaders.SET_COOKIE`; do not hand-build cookie header strings.

## Security and Token Notes
- Raw refresh tokens, email-verification tokens, and password-reset tokens must not be persisted.
- Feature services should store SHA-256 token hashes and keep raw tokens limited to outbound responses/emails.
- Sensitive links such as verification links and reset links must not be logged.

## Refactor Log

### 2026-05-25 | Docs Current-State Sync
- Core contracts remain current: `ApiResponse.errorCode`, `@CurrentUserId`, refresh-cookie properties, and safe token logging rules are still the backend baseline.
- Backend tests passed with `.\mvnw.cmd -Dtest=!WoodcertAuctionApplicationTests test`: 225 tests.

### 2026-05-14 | Error Code and Cookie Hardening
- Added/kept nullable `ApiResponse.errorCode` for `AppException` handling.
- Added refresh-cookie configuration for explicit SameSite behavior.
- Password-reset configuration includes request cooldown and token TTL.
