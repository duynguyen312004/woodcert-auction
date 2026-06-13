# Project Rules — Woodcert Auction Platform

Coding conventions, architecture guidelines, and strict rules for AI & developers.
This file is the single source of truth.
ALL AI tools (Claude, Cursor, Copilot, Gemini) MUST follow this file.

## 0. Tech Stack

| Layer | Technology |
|-------|------------|
| Language | Java 17 |
| Framework | Spring Boot 3.5.x |
| Security | Spring Security 6 + OAuth2 Resource Server |
| JWT | Custom JwtService (Nimbus JOSE) |
| Database | MySQL + Spring Data JPA |
| Migration | Flyway |
| Cache & Lock | Redis (Lettuce) |
| Real-time | WebSocket (STOMP) |
| Build | Maven |
| Validation | Jakarta Bean Validation |

## 0.1 Bootstrap Data

- Bootstrap data must be versioned in Flyway migrations under `src/main/resources/db/migration`
- `src/main/resources/data.sql` is not used by the production/base profile
- Runtime schema management uses Flyway plus `spring.jpa.hibernate.ddl-auto=validate`
- Large read-only master data may use dedicated startup seed services when the source is external and the data should only be fetched once on empty tables
- Runtime business flows must still read local database state after seeding; do not call external master-data APIs per request

## 1. Package Structure (Modular Monolith)

Current implemented commerce packages include `order`, `fulfillment`, and `dispute`. Treat older diagrams that collapse these into a planned fulfillment module as historical context only.

```text
com.woodcert.auction/
│
├── core/                      # Global shared components ONLY
│   ├── config/                # SecurityConfig, RedisConfig, WebSocketConfig
│   ├── exception/             # GlobalExceptionHandler, AppException
│   ├── dto/                   # ApiResponse, PaginationResponse
│   ├── entity/                # BaseEntity
│   └── util/                  # JwtUtils, SecurityUtils
│
└── feature/                   # Business Domains (STRICT separation)
    ├── identity/              # User, Role, Address
    ├── catalog/               # Product, Category, Appraisal
    ├── finance/               # Wallet, Transactions
    ├── auction/               # AuctionSession, Bid
    ├── order/                 # Order payment and payout snapshots
    ├── fulfillment/           # Shipment and auto-complete
    └── dispute/               # Buyer evidence and admin resolution
```

### Package Rules

- Each feature is self-contained
- Do not introduce new circular dependencies between features
- Prefer public services, query snapshots, or ports for synchronous cross-feature communication
- Use events when asynchronous communication is appropriate
- Existing identity/catalog and dispute/fulfillment coupling is accepted technical debt; do not expand it
- core/ chỉ chứa reusable components (KHÔNG business logic)

## 2. Naming Convention

| Type | Pattern | Example |
|------|---------|---------|
| Entity | Noun | User, Wallet |
| Controller | [Feature]Controller | AuctionController |
| WS Controller | [Feature]WsController | BidWsController |
| Service | [Feature]Service | AuctionService |
| Impl | [Feature]ServiceImpl | AuctionServiceImpl |
| Repository | [Feature]Repository | BidRepository |
| Request DTO | [Action]Req | CreateBidReq |
| Response DTO | [Feature]Res | AuctionDetailRes |

### Redis Key Convention

domain:entity:id:attribute

Examples:

- auction:session:1001:state
- auction:session:1001:bidders
- auction:register:freeze:1001:user-id

## 3. Service Layer Rules

- Controller calls only public feature service interfaces.
- Public controller-facing services keep the interface + implementation shape, for example `AuctionService` + `AuctionServiceImpl`.
- Internal feature services may be split by responsibility, for example auction `command`, `query`, `assembler`, `policy`, `runtime`.
- Write commands use `@Transactional`; read queries use `@Transactional(readOnly = true)`.

Service:

- handle business logic
- convert Entity ↔ DTO

❌ Service MUST NOT use:

- HttpServletRequest
- ResponseEntity
- HttpStatus

## 4. Controller Rules

Controller chỉ làm 3 việc:

Receive → Call Service → Return Response

### Mandatory Rules

- ALWAYS use @Valid
- ALWAYS return ResponseEntity<ApiResponse<T>>
- NO business logic
- Constructor Injection ONLY
- ❌ NO @Autowired field injection

### ApiResponse Standard

```java
public record ApiResponse<T>(
        int statusCode,
        T data,
        String message,
        LocalDateTime timestamp
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(200, data, "Success", LocalDateTime.now());
    }
}
```

## 5. DTO Rules

- Use record for ALL DTOs
- Split DTOs into `dto/request` and `dto/response` packages when a feature has both directions

Request DTO:

- MUST have validation annotations
- MUST validate format, length, and required business constraints as close to the boundary as possible

Response DTO:

- MUST have fromEntity() method

❌ NEVER return Entity directly

❌ NEVER expose sensitive fields:

- password
- internal signatures
- secret keys

## 6. Entity & JPA Rules

### Mandatory

- ALL entities extend BaseEntity
- Use @Table(name = "...")
- Use BigDecimal for money
- Use EnumType.STRING
- ❌ NEVER use ORDINAL enum

### Concurrency

MUST use @Version for:

- Wallet
- AuctionSession
- Order

### Lombok Rules

✅ Use: @Getter, @Setter

❌ DO NOT use:

- @Data
- @EqualsAndHashCode

## 7. Security & JWT

### Architecture

- Token generated manually via JwtService
- Token validated automatically via OAuth2 Resource Server

### Rules

- Access Token: 15 minutes
- Refresh Token: 7 days (HttpOnly Cookie)

### Authorization

Use:

```java
@PreAuthorize("hasAuthority('CREATE_BID')")
```

Admin permissions must be semantic. Use `ADMIN_ACCESS`, `MANAGE_CATEGORIES`, `MANAGE_APPRAISERS`, and `VIEW_PLATFORM_REVENUE` for admin surfaces. Do not use `BAN_USER` as a generic admin-access permission.

Cookie refresh flow must use double-submit CSRF:

- `GET /api/v1/auth/csrf` issues the non-HttpOnly `XSRF-TOKEN` cookie.
- `POST /api/v1/auth/refresh` and `POST /api/v1/auth/logout` read refresh tokens only from the HttpOnly cookie and require matching `X-XSRF-TOKEN`.
- Refresh tokens must not be returned in JSON or accepted from request bodies.

JWT Payload MUST include:

- userId
- email
- roles
- permissions

## 8. Redis + WebSocket + Concurrency (CRITICAL)

Redis = Source of Truth (ACTIVE auction)

- current_price stored in Redis
- end_time stored in Redis

### Bidding Logic

ALL operations MUST be atomic via Redis Lua Script:

- validate price
- update price
- update highest bidder
- apply anti-sniper

### Strict Rules

❌ DO NOT:

- validate bid using MySQL
- use @Transactional for bid logic

### WebSocket

- Only push AFTER Redis success

Payload MUST be minimal:

- price
- bidderId
- timeRemaining

### Async

- Save bid log with best-effort `REQUIRES_NEW` persistence after broadcast
- Sync Redis → MySQL through in-process best-effort persistence
- Auction read APIs overlay Redis `currentPrice` and `endTime` for `ACTIVE` sessions and fall back to DB snapshots when Redis state or fields are missing

## 9. Exception Handling

- All exceptions extend AppException
- Use @RestControllerAdvice

### Rules

NEVER expose:

- stacktrace
- SQL query

Validation error → return field map

## 10. Logging

Use SLF4J / Lombok @Slf4j

### Rules

❌ NEVER log:

- password
- JWT
- sensitive data

### Correct Logging

```java
log.info("User {} placed bid {}", userId, amount);
```

## 11. Wallet & Money Rules (CRITICAL)

- All money = BigDecimal
- Every balance change → INSERT into wallet_transactions
- NO direct update without transaction log

### Flow

| Action | Balance |
|--------|---------|
| Deposit | available + |
| Join Auction | available - → frozen + |
| Lose | frozen → available |
| Win | frozen → deducted |
| Complete | seller receives money |

## 12. Auction Rules (Business Logic)

### Public Visibility

- Default public auction statuses: `WAITING`, `ACTIVE`
- Explicit public status filter may include only `WAITING`, `ACTIVE`, `ENDED_SUCCESS`
- `CANCELED` and `ENDED_FAILED` are not public-facing

### Create / Cancel

- Product must be seller-owned and `APPRAISED`
- A product may have many sessions over time, but at most one open `WAITING` or `ACTIVE` session
- Create must lock product with `findByIdForUpdate` before conflict check
- Cancel must lock session with product and is allowed only for `WAITING`
- Cancel transition is `WAITING -> CANCELED`; never hard delete

### Bid Validity

new_bid >= current_price + step_price

### Registration

- Registration is allowed in `WAITING`
- Late join is allowed in `ACTIVE` only while Redis runtime state exists and `now < endTimeEpochMs`
- Seller cannot register or bid in their own product auction
- Only `FROZEN` participants can bid

### Anti-Sniper

```text
if (remaining_time <= 30s)
    extend +60s
```

### Concurrency

- Redis handles real-time
- MySQL only stores final state
- Public/seller auction lists must load participant counts with one grouped query, not N per-session count queries
- Auction response image selection must go through `ProductImageHelper`

## 13. Order & Escrow Rules

Current status: implemented for DATN/MVP order, fulfillment, and dispute flows. There is no separate production-grade escrow ledger in this iteration; invariants are enforced through wallet operations, order payout snapshots, and tests.

Additional current rules:

- Buyer/seller order list APIs must support optional `status` filter and status-count endpoints.
- Order uses `@Version` optimistic locking.
- Dispute history is readable by buyer/seller through `GET /orders/{orderId}/disputes`.
- Active duplicate disputes are prevented by order lock plus service invariant tests.

### Payment Flow

- Winner pays remaining
- Money goes to SYSTEM (NOT seller)
- After completion → release to seller

### Auto Complete

- Use @Scheduled
- NEVER use while(true)

### SQL Logic

```sql
UPDATE orders
SET status = 'COMPLETED'
WHERE status = 'DELIVERED'
AND delivered_at <= NOW() - 72h
AND NOT EXISTS (dispute)
```

## 14. Quy tắc chú thích

- File mới nên có comment ngắn ở đầu file/class để nói file đó dùng làm gì và được gọi trong luồng nào.
- Controller, service, repository, DTO, policy, scheduler, runtime helper và test quan trọng nên có comment mô tả vai trò chính.
- Method hoặc query khó hiểu nên có comment ngắn giải thích vì sao cần làm vậy, nhất là lock, transaction, Redis runtime, grouped query, status mapping.
- Hằng số khó hiểu phải có comment nói rõ ý nghĩa hoặc ngưỡng giá trị.
- Comment viết bằng tiếng Việt tự nhiên, đơn giản, không viết dài và không nhắc lại code quá hiển nhiên.
- Khi AI tạo file mới hoặc thêm use case mới, mặc định phải thêm comment theo các rule trên.

## 15. AI Strict Rules (MOST IMPORTANT)

AI MUST:

- Follow exact package structure
- Use correct naming convention
- Generate DTO (NOT Entity)
- Add validation annotations
- Use @Version where required
- Use BigDecimal for money
- Respect Redis-first architecture for bidding
- Thêm comment tiếng Việt ngắn gọn cho file, method và hằng số quan trọng mới

AI MUST NOT:

- Put business logic in Controller
- Return Entity
- Use field injection
- Skip transaction logs
- Use MySQL for real-time bidding logic

## 16. Commit Checklist

Before finishing:

- No Entity returned from Controller
- All DTOs use record
- @Valid used
- Wallet/Auction has @Version
- Money uses BigDecimal
- Redis used for bidding logic
- No business logic in Controller
- New important files/classes/constants have clear Vietnamese comments

## 17. Auth Injection

- Controllers SHOULD use `@CurrentUserId String userId` when they need the authenticated user id
- Do not inject `Jwt` directly into controllers just to read `sub`
- The extraction logic belongs in MVC argument resolver infrastructure under `core/auth`

## 18. Media & Uploads

- Always persist `media_assets` as the source of truth, avoiding raw Cloudinary URLs in database domain tables.
- Media deletion is asynchronous: background jobs cleanup Cloudinary resources instead of relying on frontend deletes.
- The `MediaCleanupJob` is implemented as a 3-Phase cleanup: 
  - Phase 1: Mark stale `PENDING` -> `PENDING_DELETE`
  - Phase 2: Mark orphan `ACTIVE` -> `PENDING_DELETE`
  - Phase 3: Execute Cloudinary deletion for `PENDING_DELETE` + `DELETE_FAILED`
- Store images in user-scoped folders to stay organized, such as `{baseFolder}/users/{userId}/products` and `{baseFolder}/users/{userId}/appraisals`.

## Final Note

This is a high-concurrency financial system.

Code MUST prioritize:

- Data consistency
- Concurrency safety
- Clear separation of concerns
