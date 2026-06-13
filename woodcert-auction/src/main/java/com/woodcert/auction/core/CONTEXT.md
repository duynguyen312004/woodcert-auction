# Core Module

## Responsibility

`core` contains shared infrastructure: API response wrappers, exception handling, security, JWT configuration, audit base entities, and cross-cutting configuration.

## Key Components

- `ApiResponse<T>` and `PaginationResponse<T>` define REST response contracts.
- `GlobalExceptionHandler` maps `AppException` and validation failures.
- `SecurityConfig`, `JwtService`, and current-user argument resolution provide authentication infrastructure.
- Shared configuration properties own CORS, cookies, token expiry, and email-link settings.

## Boundary Rules

- Core must not contain feature business rules.
- Controllers return DTOs wrapped in `ApiResponse<T>`; entities are not exposed.
- Feature code may depend on core, but core must not depend on feature packages.
- Machine-readable client branching uses `errorCode` when present.

## Lifecycle And Contracts

- Access tokens are signed with HS512.
- Refresh tokens, verification tokens, and password-reset tokens are persisted only as hashes.
- Refresh cookies are HttpOnly and configured through `RefreshCookieProperties`.
- Sensitive raw tokens and links must not be logged.

## Known Limitations

- Browser cookie transport is the supported authentication client model; native/mobile token transport is not implemented.
