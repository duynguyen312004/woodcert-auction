# Project Status

> Last updated: 2026-04-09 | By: AI Assistant | Session: #8
>
> AI: update this file at the end of every session when asked.
> Follow this exact format. Keep it concise - under 80 lines.

---

## Completed
- [x] Project skeleton (Spring Boot 3.5.x, Maven, application.yml)
- [x] Documentation setup (CLAUDE, PROJECT-RULES, ARCHITECTURE, DATABASE, API_SPEC)
- [x] ADR-001: Refresh token strategy decided (Cookie + Body)
- [x] ADR-002: Real-time bidding concurrency (Redis Lua Scripts)
- [x] ADR-003: Escrow wallet & auto-complete flow (CronJob)
- [x] ADR-004: Modular monolith architecture
- [x] Core package setup (ApiResponse, PaginationResponse, exceptions, BaseEntity)
- [x] SecurityConfig + JwtService + JwtProperties + CustomUserDetailsService
- [x] Identity entities: User, Role, Permission, RefreshToken, Address, SellerProfile, Province, District, Ward
- [x] Identity repositories for auth, seller profile, address, and location master data
- [x] Auth REST APIs: Login, Register, Refresh, Logout
- [x] User Profile APIs: GET/PUT/PATCH `/api/v1/users/me`
- [x] Seller Profile APIs: GET/POST `/api/v1/users/me/seller-profile`
- [x] Address APIs: GET/POST `/api/v1/addresses`
- [x] Optional location APIs: GET `/api/v1/locations/provinces`, `/districts`, `/wards`
- [x] Startup `seed-if-empty` workflow for Vietnam location master data
- [x] Bundled local fallback seed and normalization for phone numbers, location codes, and partial user-profile updates
- [x] Scheduled cleanup job for revoked and expired refresh tokens
- [x] Authentication controller cleanup: `@CurrentUserId` + MVC argument resolver
- [x] Identity DTOs reorganized into `dto/request` and `dto/response` with stricter request validation
- [x] Unit tests added for user profile, seller profile, address, location, and token-cleanup services
- [x] Cloudinary-ready media foundation: `media_assets`, signed upload intent flow, direct Cloudinary upload contract, avatar attach/remove APIs, and background media cleanup

## In Progress
- Manual end-to-end verification is available through Postman; automated Maven verification is still limited by local sandbox/tooling issues.

## Deferred Issues
- Full controller/integration test coverage is not finished yet.
- Media expansion for product/appraisal/shipment/dispute is not started yet, but the shared foundation is in place.

## Warnings
- `mvnw.cmd` is broken in the current environment.
- `mvn` verification is blocked in the sandbox because Maven tries to use an inaccessible local repository path.

## Next Tasks
1. **[P9]** Extend `feature/media` into product gallery, appraisal evidence, shipment packing video, and dispute evidence flows
2. **[P10]** Add controller/integration tests with a test profile and Cloudinary API stubs
3. **[P11]** Standardize media policies per usage type: max size, allowed content types, transformations, and retention rules

## Milestones

### Phase 0 - Foundation
- [x] Update `pom.xml`
- [x] Database & Redis connection in `application.yml`
- [x] BaseEntity (createdAt, updatedAt)
- [x] ApiResponse & GlobalExceptionHandler
- [x] SecurityConfig & JwtProperties

### Phase 1 - Auth & Identity
- [x] Entities: User, Role, Permission, Address, SellerProfile, RefreshToken
- [x] Repositories & DTOs
- [x] POST `/auth/login`, `/auth/register`, `/auth/refresh`, `/auth/logout`
- [x] CustomUserDetailsService & JwtService
- [x] User Profile APIs
- [x] Seller Profile APIs
- [x] Address APIs
- [x] Optional location master-data APIs

### Phase 2 - Catalog & Appraisal
- [ ] Entities: Category, Product, ProductImage, AppraisalReport
- [ ] Category CRUD APIs
- [ ] Seller: Create Draft Product, Submit for Appraisal
- [ ] Appraiser: Pending list, Submit Appraisal Report logic

### Phase 3 - Finance (Escrow Wallet)
- [ ] Entities: Wallet, WalletTransaction (with @Version)
- [ ] Wallet APIs (Get balance, Get history)
- [ ] Internal Service: Freeze, Unfreeze, Deposit, Deduct methods

### Phase 4 - Real-time Auction (The Core)
- [ ] Entities: AuctionSession, Bid, AuctionParticipant
- [ ] Seller: Create Auction Session
- [ ] Buyer: Register Auction (Freeze deposit)
- [ ] Redis Lua Script for atomic bidding
- [ ] POST `/bids` (Redis validation + async MySQL sync)
- [ ] WebSocket integration (`/topic/auctions/{id}`)

### Phase 5 - Fulfillment & Dispute
- [ ] Entities: Order, Shipment, Dispute
- [ ] Buyer: Pay remaining balance
- [ ] Seller: Update shipment status
- [ ] Scheduled Job: 72h auto-complete (release funds to seller)
- [ ] Dispute flow (admin resolve)
