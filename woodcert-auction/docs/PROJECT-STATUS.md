# Project Status

> Last updated: 2026-03-29 | By: AI Assistant | Session: #3
>
> AI: update this file at the end of every session when asked.
> Follow this exact format. Keep it concise — under 80 lines.

---

## Completed
- ✅ Project skeleton (Spring Boot 3.5.x, Maven, application.yml)
- ✅ Documentation setup (AI-INSTRUCTIONS, PROJECT-RULES, ARCHITECTURE, DATABASE, API_SPEC)
- ✅ ADR-001: Refresh token strategy decided (Cookie + Body)
- ✅ ADR-002: Real-time Bidding Concurrency (Redis Lua Scripts)
- ✅ ADR-003: Escrow Wallet & Auto-Complete Flow (CronJob)
- ✅ ADR-004: Modular Monolith Architecture
- ✅ AI workflow setup (docs/ai-workflows/)
- ✅ Cấu hình cơ bản (pom.xml, application.yml)
- ✅ Xây dựng thư mục core (ApiResponse, PaginationResponse, Custom Exceptions, BaseEntity)
- ✅ SecurityConfig + JwtService + JwtProperties (core/config + core/security)
- ✅ CustomUserDetailsService (core/security)
- ✅ Identity Entities: User, Role, Permission, RefreshToken, Address, SellerProfile, Province, District, Ward
- ✅ Identity Repositories: User, Role, Permission, RefreshToken, Address, SellerProfile
- ✅ Auth REST APIs: Login, Register, Refresh, Logout (Controller + Service + DTOs)

## In Progress
_None._

## Deferred Issues
_None._

## Warnings
_None._

## Next Tasks
1. **[P6]** User Profile APIs (GET/PUT /users/me)
2. **[P7]** Seller Profile APIs (POST /users/me/seller-profile)
3. **[P8]** Address APIs (GET/POST /addresses)
4. **[P9]** Bắt đầu Phase 2 — Catalog (Category, Product, AppraisalReport)

## Milestones

### Phase 0 — Foundation
- [x] Update `pom.xml` (JJWT, MapStruct, Lombok)
- [x] Database & Redis connection in `application.yml`
- [x] BaseEntity (createdAt, updatedAt)
- [x] ApiResponse & GlobalExceptionHandler
- [x] SecurityConfig (Initial setup) & JwtProperties

### Phase 1 — Auth & Identity
- [x] Entities: User, Role, Permission, Address, SellerProfile, RefreshToken
- [x] Repositories & DTOs
- [x] POST /auth/login, /auth/register, /auth/refresh, /auth/logout
- [x] CustomUserDetailsService & JwtService
- [ ] User Profile APIs
- [ ] Seller Profile APIs
- [ ] Address APIs

### Phase 2 — Catalog & Appraisal
- [ ] Entities: Category, Product, ProductImage, AppraisalReport
- [ ] Category CRUD APIs
- [ ] Seller: Create Draft Product, Submit for Appraisal
- [ ] Appraiser: Pending list, Submit Appraisal Report logic

### Phase 3 — Finance (Escrow Wallet)
- [ ] Entities: Wallet, WalletTransaction (with @Version)
- [ ] Wallet APIs (Get balance, Get history)
- [ ] Internal Service: Freeze, Unfreeze, Deposit, Deduct methods

### Phase 4 — Real-time Auction (The Core)
- [ ] Entities: AuctionSession, Bid, AuctionParticipant
- [ ] Seller: Create Auction Session
- [ ] Buyer: Register Auction (Freeze deposit)
- [ ] Redis Lua Script for atomic bidding
- [ ] POST /bids (Redis validation + Async MySQL sync)
- [ ] WebSocket integration (/topic/auctions/{id})

### Phase 5 — Fulfillment & Dispute
- [ ] Entities: Order, Shipment, Dispute
- [ ] Buyer: Pay remaining balance
- [ ] Seller: Update shipment status
- [ ] Scheduled Job: 72h Auto-complete (Release funds to Seller)
- [ ] Dispute flow (Admin resolve)