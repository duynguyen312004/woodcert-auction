# ADR-004: Modular Monolith Package Structure

## Status
Accepted

## Context
The platform has a complex business domain consisting of Identity Management, Catalog (Products & Appraisals), Escrow Finances, Real-time Auctions, and Order Fulfillment.
We need an architectural pattern to organize the Spring Boot codebase that prevents "Spaghetti Code" while keeping deployment simple for the initial MVP launch.

## Options Considered

### Option A: Traditional Layered Architecture (Package-by-Layer)
- Packages grouped by technical concern (`controllers/`, `services/`, `repositories/`, `entities/`).
- **Risk:** Low cohesion, high coupling. Changing the "Auction" feature requires jumping across 5 different top-level folders. Classes easily bleed into each other's boundaries.

### Option B: Microservices
- Split features into distinct deployable Spring Boot applications (e.g., `auth-service`, `auction-service`, `wallet-service`).
- **Risk:** Over-engineering for an MVP. Requires complex infrastructure (Service Discovery, API Gateway, Distributed Transactions).

### Option C: Modular Monolith / Package-by-Feature (CHOSEN)
- Single deployable application (Monolith), but code is strictly partitioned by business domains (Features).
- Each feature encapsulates its own APIs, Business Logic, and Data Access.

## Decision
**Option C** — Modular Monolith Architecture.

## Implementation Design

### 1. Folder Structure

```text
com.woodcert.auction/
├── core/                   # Global shared concerns (Security, Exceptions, BaseEntity)
└── feature/
    ├── identity/           # User, Role, SellerProfile
    ├── catalog/            # Product, AppraisalReport
    ├── finance/            # Wallet, Transactions
    ├── auction/            # AuctionSession, Bid
    └── fulfillment/        # Order, Shipment, Dispute
```

### 2. Strict Boundary Rules

- **Encapsulation:** DTOs specific to a feature MUST reside inside that feature's package, not in a global dto/ folder.
- **Access Modifiers:** Repositories and internal helper services should be package-private where possible to prevent other domains from bypassing the main Service interfaces.
- **Cross-Domain Communication:**
    - Direct calls: Allowed only via Service Interfaces (e.g., AuctionService calling WalletService.freezeFunds()).
    - Event-Driven: For decoupled actions, use Spring @EventListener (e.g., OrderService listens to AuctionEndedEvent).

## Consequences

### Positive

- High Cohesion: Everything related to "Wallets" is in one folder. Extremely easy for developers to navigate and understand.
- Refactor-Ready: If the Auction feature scales massively in the future, the feature/auction folder can be effortlessly extracted into a standalone Microservice because its boundaries are already defined.
- Simple Deployment: Still runs as a single java -jar application.

### Negative

- Discipline Required: Developers (and AI tools) must strictly adhere to the rules. If someone injects UserRepository directly into AuctionService instead of using UserService, the boundaries start to break down.