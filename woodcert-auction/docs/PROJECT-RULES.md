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
| Cache & Lock | Redis (Lettuce) |
| Real-time | WebSocket (STOMP) |
| Build | Maven |
| Validation | Jakarta Bean Validation |

## 0.1 Bootstrap Data

- Small bootstrap data may stay in `src/main/resources/data.sql`
- Large read-only master data may use dedicated startup seed services when the source is external and the data should only be fetched once on empty tables
- Runtime business flows must still read local database state after seeding; do not call external master-data APIs per request

## 1. Package Structure (Modular Monolith)

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
    └── fulfillment/           # Order, Shipment, Dispute
```

### Package Rules

- Each feature is self-contained
- NO circular dependency between features
- Cross-feature communication → use Event (@EventListener)
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

- auction:session:1001:current_price
- auction:session:1001:end_time
- auction:session:1001:lock

## 3. Service Layer Rules

- Controller → ONLY call Interface
- @Service → ONLY on Implementation
- @Transactional → ONLY on methods writing to DB

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

- Save bid log using @Async
- Sync Redis → MySQL asynchronously

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

### Bid Validity

new_bid >= current_price + step_price

### Anti-Sniper

```text
if (remaining_time <= 30s)
    extend +60s
```

### Concurrency

- Redis handles real-time
- MySQL only stores final state

## 13. Order & Escrow Rules

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

## 14. AI Strict Rules (MOST IMPORTANT)

AI MUST:

- Follow exact package structure
- Use correct naming convention
- Generate DTO (NOT Entity)
- Add validation annotations
- Use @Version where required
- Use BigDecimal for money
- Respect Redis-first architecture for bidding

AI MUST NOT:

- Put business logic in Controller
- Return Entity
- Use field injection
- Skip transaction logs
- Use MySQL for real-time bidding logic

## 15. Commit Checklist

Before finishing:

- No Entity returned from Controller
- All DTOs use record
- @Valid used
- Wallet/Auction has @Version
- Money uses BigDecimal
- Redis used for bidding logic
- No business logic in Controller

## 16. Auth Injection

- Controllers SHOULD use `@CurrentUserId String userId` when they need the authenticated user id
- Do not inject `Jwt` directly into controllers just to read `sub`
- The extraction logic belongs in MVC argument resolver infrastructure under `core/auth`

## Final Note

This is a high-concurrency financial system.

Code MUST prioritize:

- Data consistency
- Concurrency safety
- Clear separation of concerns
