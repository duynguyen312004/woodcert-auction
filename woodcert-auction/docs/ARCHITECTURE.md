# Architecture

> System design overview for Woodcert Auction Platform. Update only during architecture review sessions.

---

## High-Level Architecture

```text
                             ┌─────────────────┐
                             │   Client (SPA)  │
                             └────────┬─────────┘
                                      │ HTTPS / WSS
                                      ▼
                             ┌─────────────────┐
                             │   Spring Boot   │
                             │   Application   │
                             └────────┬─────────┘
                                      │
          ┌───────────────────────┬───┴───────────────────┬───────────────────────┐
          ▼                       ▼                       ▼                       ▼
 ┌────────────────┐      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
 │  Controllers   │      │ Security Layer │      │ Exception      │      │ WebSocket      │
 │  (REST API)    │      │ (JWT + RBAC)   │      │ Handler        │      │ Controller     │
 └───────┬────────┘      └────────────────┘      └────────────────┘      └────────┬───────┘
         │                                                                        │
         ▼                                                                        ▼
 ┌────────────────────────────────────────────────────────────────────────────────────┐
 │                                   Service Layer                                    │
 │                                (Interface + Impl)                                  │
 │                  (Business Logic, Transaction Management, Lock)                    │
 └───────┬────────────────────────────────────────────────────────────────────┬───────┘
         │                                                                    │
         ▼                                                                    ▼
 ┌────────────────┐                                                  ┌────────────────┐
 │  Repository    │                                                  │  Redis Cache   │
 │  (Spring Data) │                                                  │  & Lock        │
 └───────┬────────┘                                                  └────────────────┘
         │
         ▼
 ┌────────────────┐
 │    MySQL       │
 └────────────────┘
```

---

## Request Flow

### Standard CRUD Request

```
Client
→ [HTTP Request]
→ SecurityFilterChain (JWT validation using Spring Security OAuth2 Resource Server with custom-issued tokens)
→ Controller (receive request, validate with @Valid)
→ Service (business logic, entity ↔ DTO conversion)
→ Repository (JPA query)
→ Database
→ Repository (return Entity)
→ Service (convert Entity → Response DTO)
→ Controller (wrap in ApiResponse)
→ [HTTP Response]
→ Client
```

### Authentication Flow

```
1. Login:
Client → POST /api/v1/auth/login (email + password)
→ AuthController → AuthService
→ AuthenticationManager.authenticate()
→ CustomUserDetailsService.loadUserByUsername() → query DB
→ Password verified (BCrypt)
→ JwtService creates access token (15min) + refresh token (7d)
→ Return tokens to client (Refresh token in HttpOnly Cookie)
2. Authenticated Request:
Client → [Authorization: Bearer <access_token>]
→ SecurityFilterChain → OAuth2 Resource Server
→ JwtDecoder verifies token using Secret Key
→ JwtAuthenticationConverter extracts 'permissions' to SecurityContext
→ Controller (@PreAuthorize) → Service → Repository → Response
3. Token Refresh:
Client → POST /api/v1/auth/refresh (refresh token)
→ Validate refresh token → Issue new access token
→ Return new tokens
```

---

### JWT Strategy

The system does not implement a full OAuth2 Authorization Server.

Instead:
- Tokens are generated internally using a custom JwtService.
- Spring Security OAuth2 Resource Server is used solely for validating JWTs.
- This approach leverages Spring's built-in security filters while keeping the authentication flow simple and secure.

---

### Real-time Bidding Flow (High Concurrency)

```text
Client → POST /api/v1/bids (Session ID, Amount)
→ SecurityFilterChain (Validate Token)
→ BidService
→ Redis (Execute Lua Script for Atomic check & update current_price)

→ Redis acts as the source of truth for all ACTIVE auction sessions

→ If valid:
→ If (end_time - now) <= 30 seconds:
→ Extend auction end_time by 60 seconds (Anti-Sniper Rule)
→ Update Redis TTL
  → Push message via WebSocketBroker to all clients in Room
  → @Async trigger to save Bid record to MySQL
→ Return 200 OK
```

### Escrow & Auto-Complete Flow (Background Job)

```text
Spring @Scheduled (Runs every 1 hour)
→ OrderService.processCompletedOrders()
→ @Transactional triggers
→ Query MySQL for Orders where status='DELIVERED'
AND (NOW() - delivered_at) >= 72 hours
AND no dispute exists

→ Transfer funds from platform escrow to seller wallet
→ Deduct platform fee before settlement
→ Update Order status to 'COMPLETED'
```

## Feature Package Structure

The application follows a Package-by-Feature architecture. Each business domain is highly encapsulated.

```text
feature/
├── identity/                # Auth, User, Role, Permission, Address, SellerProfile
├── catalog/                 # Category, Product, AppraisalReport (Certificates)
├── finance/                 # Wallet, WalletTransaction (Escrow System)
├── auction/                 # AuctionSession, Bid, AuctionParticipant
└── fulfillment/             # Order, Shipment, Dispute (Tòa án Sàn)
```

### Feature Dependency Rules

- identity is the core foundation. Other features can reference User IDs.

- catalog depends on identity (Seller/Appraiser references).

- finance depends on identity (Wallet belongs to User).

- auction depends on:
  - catalog (Product to bid)
  - finance (Freeze deposit)

- fulfillment depends on:
  - auction (Winning bid → Order)
  - finance (Release funds)

> STRICT RULE: No circular dependencies allowed.  
> Use Application Events (@EventListener) for cross-domain communication.

### Cross-Cutting Concerns

### Security

- JWT validation handled by Spring Security OAuth2 Resource Server.
- Tokens are issued internally via JwtService.

- Access token: 15 minutes  
- Refresh token: 7 days (stored in HttpOnly Cookie)

- Authorization:

```java
@PreAuthorize("hasAuthority('APPROVE_PRODUCT')")
```


---

### Exception Handling

- GlobalExceptionHandler (@RestControllerAdvice)
- All responses wrapped in ApiResponse<T>

---

### Concurrency & Data Integrity

- Optimistic Locking:
  - Applied via @Version (Wallet, AuctionSession)

- Transactions:
  - @Transactional on all critical state-changing operations
  - Especially in finance and fulfillment flows

---

### Audit Fields

- All entities extend BaseEntity:
  - createdAt
  - updatedAt

- Managed by Hibernate:
  - @CreationTimestamp
  - @UpdateTimestamp

---

### DTO Strategy

- Entity classes are NEVER exposed to Controller layer

- DTOs are feature-specific and located in each feature module

- DTOs may aggregate data from multiple entities  
  (e.g., Product + AppraisalReport) to present a unified view

---

## Scalability & Future Improvements

- The system is designed as a Modular Monolith

- Can be split into microservices:
  - auction-service
  - wallet-service
  - order-service

- Redis can be scaled using Redis Cluster

- Message Queue (Kafka / RabbitMQ) can replace @Async

- CDN can be used for serving product images

