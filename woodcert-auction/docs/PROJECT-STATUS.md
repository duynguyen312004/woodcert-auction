# Project Status

> Last updated: 2026-03-28 | By: Developer | Session: #1
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

## In Progress
_Phase 0 — Foundation & Configuration._ 

## Deferred Issues
_None._

## Warnings
_None._

## Next Tasks
1. **[P1]** Update `pom.xml` with dependencies (MapStruct, JJWT, Redis, etc.)
2. **[P2]** Setup `application.yml` (MySQL, Redis connections)
3. **[P3]** Code `core/entity/BaseEntity.java` and global exceptions.
4. **[P4]** Phase 1 — Identity (User, Role, Auth flow)

## Milestones

### Phase 0 — Foundation
- [ ] Update `pom.xml` (JJWT, MapStruct, Lombok)
- [ ] Database & Redis connection in `application.yml`
- [ ] BaseEntity (createdAt, updatedAt)
- [ ] ApiResponse & GlobalExceptionHandler
- [ ] SecurityConfig (Initial setup) & JwtConfig

### Phase 1 — Auth & Identity
- [ ] Entities: User, Role, Permission, Address, SellerProfile, RefreshToken
- [ ] Repositories & DTOs
- [ ] POST /auth/login, /auth/register, /auth/refresh
- [ ] CustomUserDetailsService & JwtService
- [ ] User Profile APIs

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