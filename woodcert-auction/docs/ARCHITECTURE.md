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
→ Return access token in JSON and refresh token only in HttpOnly cookie
2. Authenticated Request:
Client → [Authorization: Bearer <access_token>]
→ SecurityFilterChain → OAuth2 Resource Server
→ JwtDecoder verifies token using Secret Key
→ JwtAuthenticationConverter extracts 'permissions' to SecurityContext
→ Controller (@PreAuthorize) → Service → Repository → Response
3. Token Refresh:
Client → GET /api/v1/auth/csrf
Client → POST /api/v1/auth/refresh (empty body + matching X-XSRF-TOKEN)
→ Read and rotate refresh token from HttpOnly cookie
→ Return new access token and set the rotated refresh cookie
```

---

### Password Reset Flow

```text
Forgot password:
Client -> POST /api/v1/auth/forgot-password
-> AuthController
-> AuthService facade
-> PasswordResetService
-> Find eligible ACTIVE account by normalized email
-> Enforce per-account cooldown
-> Generate raw one-time token and store only SHA-256 hash
-> IdentityEmailService sends reset link when SMTP is configured
-> Return generic 200 response for all non-validation cases

Reset password:
Client -> POST /api/v1/auth/reset-password
-> Hash submitted raw token
-> Validate token exists, unused, and not expired
-> Update BCrypt password hash
-> Mark reset token used
-> Revoke active refresh tokens for the account
-> Return success
```

Refresh tokens are returned only in cookies built with `ResponseCookie`, including `HttpOnly`, configured `Secure`, configured `SameSite`, `Path`, and `Max-Age`.

Raw password-reset tokens, reset links, and email-verification links must not be written to application logs, including local fallback paths when SMTP is not configured.

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
  → Best-effort REQUIRES_NEW persistence saves Bid record to MySQL
→ Return 200 OK
```

### Auction Read Flow (Criteria + Redis Overlay)

```text
Client -> GET /api/v1/auctions or /api/v1/auctions/{id}
-> AuctionController
-> AuctionServiceImpl facade
-> AuctionQueryService
-> PublicAuctionSearchCriteria captures list filters
-> MySQL query for sessions/products with optional material/category/price filters
-> Catalog enrichment loads category, appraisal, and product image read data in bulk
-> Identity enrichment loads seller summaries through SellerSummaryQueryService
-> GROUP BY participant count for list views
-> For ACTIVE sessions only: read Redis currentPrice/endTime
-> AuctionResponseAssembler maps DTOs and overlays Redis fields when present
-> If Redis state/field is missing: fall back to MySQL snapshot
-> Return public/seller DTO
```

Default public list statuses are `WAITING` and `ACTIVE`. Explicit public status filter accepts only `WAITING`, `ACTIVE`, and `ENDED_SUCCESS`. Unknown `categoryName` returns an empty page, while `priceMin > priceMax` returns `INVALID_REQUEST`. Price filters use the persisted DB snapshot before Redis overlay.

### Auction Command Flow (Create/Cancel/Register)

```text
Create session:
Controller -> AuctionServiceImpl -> AuctionCommandService
-> lock Product with PESSIMISTIC_WRITE
-> validate owner/appraised/rules/conflict
-> insert WAITING AuctionSession

Cancel session:
Controller -> AuctionServiceImpl -> AuctionCommandService
-> lock AuctionSession with Product
-> allow only WAITING
-> set CANCELED

Register:
Controller -> AuctionServiceImpl -> AuctionCommandService
-> allow WAITING or Redis-valid ACTIVE
-> freeze deposit
-> insert AuctionParticipant(FROZEN)
-> if ACTIVE, add bidder to Redis bidder set
```

### Order, Fulfillment, Dispute, and Auto-Complete Flow (Background Job)

Current status: implemented for the DATN/MVP commerce flow. The backend keeps the current finance model with wallet operations and order payout snapshots; a separate escrow ledger is intentionally not added in this iteration.

Seller Portal v1 remains a composition layer in the SPA. It does not introduce a seller aggregate
or cross-module repository access:

- identity owns seller profile and buyer shipping-address validation
- catalog owns products and product statistics
- auction owns session lifecycle and STOMP events
- order owns product/address/financial snapshots and seller revenue summaries
- fulfillment owns shipping transitions
- finance owns wallet mutations

The order module reads buyer addresses through `ShippingAddressQueryService` and auction product
data through the existing source adapter boundary. Seller auction details use STOMP for immediate
events and REST polling as reconciliation; operational lists poll every 10 seconds.

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
├── catalog/                 # Internal inventory + appraisal workflow
├── finance/                 # Wallet, wallet operations, VNPay, platform revenue
├── auction/                 # Buyer-facing browse/detail + AuctionSession, Bid, Participant
├── order/                   # Post-auction order payment and payout snapshots
├── fulfillment/             # Shipment and auto-complete
└── dispute/                 # Buyer evidence and admin resolution
```

### Feature Dependency Rules

- identity is the core foundation. Other features can reference User IDs.

- catalog depends on identity (Seller/Appraiser references).

- finance depends on identity (Wallet belongs to User).

- auction depends on:
  - catalog (APPRAISED product as auction input)
  - catalog repositories/helpers for product, category, appraisal, and product-image read enrichment
  - identity `SellerSummaryQueryService` for seller display/reputation read enrichment
  - finance (Freeze deposit)
  - Redis for ACTIVE runtime state

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
  - Applied via @Version (Wallet, AuctionSession, Order)

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

- Message Queue (Kafka / RabbitMQ) can replace best-effort in-process bid persistence

- CDN can be used for serving product images

---

## Media Module

- `feature/media` is the shared integration layer for Cloudinary upload, media metadata, delivery URL generation, ownership confirmation, and cleanup.
- Domain tables should keep foreign keys to `media_assets` instead of persisting raw cloud URLs.
- Business modules own attach/detach orchestration. `identity` owns avatar APIs and calls generic media services instead of letting `media` touch identity repositories.
- `catalog` owns product-image and appraisal-image APIs and also reuses the generic media services.
- Backend issues signed upload intents, client uploads directly to Cloudinary, backend confirms uploaded ownership, and the owning business module attaches the asset to its entity.
- Media deletion is asynchronous: detach first, mark asset `PENDING_DELETE`, then scheduled cleanup calls Cloudinary destroy.
- Direct Cloudinary upload should send both:
  - `public_id` for stable asset identity and delivery URLs
  - `asset_folder` for Cloudinary Media Library organization
- Current avatar folder pattern is `woodcert/dev/users/{userId}/avatar`.
- Product folder pattern is `woodcert/dev/users/{userId}/products`.
- Appraisal folder pattern is `woodcert/dev/users/{userId}/appraisals`.
- The same pattern should be extended later for shipment and dispute media so the module can stay generic.

### Avatar Flow

```text
Client -> POST /api/v1/users/me/avatar/upload-intent
-> identity module validates current user
-> media service creates media_assets row (PENDING) + signs Cloudinary upload params including assetFolder/publicId

Client -> upload file directly to Cloudinary

Client -> PUT /api/v1/users/me/avatar
-> identity module calls media service to verify assetId + publicId ownership
-> identity module sets users.avatar_media_id
-> old avatar marked PENDING_DELETE

GET /api/v1/users/me
-> avatarUrl is generated from public_id + asset_version
```

