# WoodCert Auction Backend Architecture

Last verified against source: 2026-06-19

## 1. Source of truth

This document describes the current implementation. When sources disagree, use:

1. Flyway migrations for schema and seed data.
2. Current Java source for business behavior and API ownership.
3. `application.yaml` for runtime defaults.
4. Automated test reports for verified behavior.
5. Architecture decision records and project-status documents as supporting context.

`database.sql` is a human-readable index only. It is not an executable schema source.

## 2. Architecture style

The backend is a Spring Boot modular monolith:

- one deployable Java application;
- one MySQL schema;
- one Redis instance for runtime state;
- feature-oriented packages with internal service, repository, DTO, and entity layers;
- synchronous module collaboration through services, query snapshots, and ports/adapters.

It is not a microservices system. The package boundaries reduce coupling inside one process but do
not create independently deployed services or distributed transactions.

## 3. Runtime components

| Component | Responsibility |
|---|---|
| React SPA | Browser user interface; calls REST and subscribes to auction topics |
| Nginx host proxy | HTTPS termination and routing for SPA, REST, health, and WebSocket traffic |
| Spring Boot 3.5 / Java 17 | REST API, security, business workflows, schedulers, and STOMP broker |
| MySQL 8 | Durable business data and terminal auction/order state |
| Redis 7 | Active-auction runtime state, registered bidder sets, and login brute-force counters |
| Cloudinary | Media object storage; the application stores verified metadata and ownership |
| VNPay Sandbox | Wallet top-up payment flow |
| SMTP server | Email verification and password-reset delivery |

The application uses Flyway for schema management and Hibernate with
`spring.jpa.hibernate.ddl-auto=validate`.

## 4. Feature modules

```text
com.woodcert.auction/
├── core/
│   ├── auth/
│   ├── config/
│   ├── controller/
│   ├── dto/
│   ├── entity/
│   ├── exception/
│   └── security/
└── feature/
    ├── identity/
    ├── media/
    ├── catalog/
    ├── finance/
    ├── auction/
    ├── order/
    ├── fulfillment/
    └── dispute/
```

| Module | Current ownership |
|---|---|
| `core` | Shared response types, exceptions, JWT validation, effective permissions, CORS, WebSocket, and server time |
| `identity` | Authentication, refresh sessions, profiles, seller registration, addresses, locations, roles, capability suspension, and admin audit logs |
| `media` | Cloudinary upload intents, confirmation, metadata, delivery URLs, ownership checks, and cleanup |
| `catalog` | Categories, seller products, product images, appraisal workflow, reports, certificates, and seller reputation |
| `finance` | Wallets, wallet transactions, idempotent operations, VNPay deposits, and platform revenue |
| `auction` | Sessions, participants, Redis runtime, bids, broadcasts, activation/closure, deposit settlement, and auction read models |
| `order` | Post-auction commercial transaction, remaining payment, deadlines, financial snapshots, payout, refund, and source callbacks |
| `fulfillment` | Shipment state, tracking, buyer receipt confirmation, and automatic completion |
| `dispute` | Evidence, immutable conversation timeline, admin review, and full buyer/seller resolution |

Some catalog/identity and dispute/fulfillment associations remain accepted package-level technical
debt. New code should use public services, snapshots, or ports rather than expanding direct
repository coupling.

## 5. Security model

### 5.1 Authentication

- The application issues its own HS512 access tokens.
- Spring Security OAuth2 Resource Server validates the tokens.
- Access-token lifetime is 15 minutes.
- Refresh-token lifetime is 7 days.
- Raw refresh, email-verification, and password-reset tokens are never persisted.
- Refresh tokens are stored as SHA-256 hashes and rotated after use.
- The browser receives refresh tokens only through an HttpOnly cookie.
- Refresh and logout use a double-submit CSRF token from `GET /api/v1/auth/csrf`.

### 5.2 Authorization

Flyway seeds four roles:

- `ROLE_BIDDER`
- `ROLE_SELLER`
- `ROLE_APPRAISER`
- `ROLE_ADMIN`

Controllers use semantic permissions such as `CREATE_BID`, `CREATE_PRODUCT`,
`APPROVE_PRODUCT`, and `RESOLVE_DISPUTE`.

The backend does not rely only on JWT permission claims. For each authenticated request it:

1. verifies that the user still exists and is `ACTIVE`;
2. loads current role permissions from MySQL;
3. removes permissions disabled by a banned `BUYER`, `SELLER`, or `APPRAISER` capability;
4. evaluates controller `@PreAuthorize` rules.

Frontend guards improve navigation but are not the final security boundary.

## 6. Data ownership

### 6.1 MySQL

MySQL is authoritative for:

- user, role, permission, and capability state;
- catalog, appraisal, and certificate data;
- wallet balances and financial audit records;
- auction `WAITING`, terminal, and cancellation state;
- participants and persisted bid audit rows;
- orders, immutable product/address snapshots, and financial outcome fields;
- fulfillment and dispute records.

### 6.2 Redis

Redis is authoritative only while an auction is `ACTIVE`.

Each active session uses:

```text
auction:session:{id}:state
auction:session:{id}:bidders
```

The state hash stores the live current price, step price, reserve price, end time, highest bidder,
highest bid trace, and runtime status. The bidder set contains users with a `FROZEN` participant
deposit.

Redis also stores temporary login protection keys:

```text
auth:failed_attempts:{normalizedEmail}
auth:locked:{normalizedEmail}
```

Redis is not the only database of the system.

## 7. Main business flow

### 7.1 Account and seller onboarding

1. Registration creates an `UNVERIFIED` bidder account.
2. Email verification activates the account.
3. Login returns an access token and sets the refresh cookie.
4. A bidder with a phone number may create a seller profile.
5. Seller-profile creation adds `ROLE_SELLER`; a new login is required for updated JWT role claims.

### 7.2 Product and appraisal

1. Seller uploads and confirms product media through Cloudinary.
2. Seller creates a `DRAFT` product with exactly one primary image.
3. Submitting for appraisal charges the configured appraisal fee and records platform revenue.
4. Product moves to `PENDING_APPRAISAL`.
5. An appraiser claims it, moving it to `UNDER_APPRAISAL` for a limited claim period.
6. The appraiser submits one immutable report.
7. Authentic products become `APPRAISED`; rejected products become `REJECTED`.
8. Approved reports receive `CERT-{year}-{id}` and a SHA-256 integrity fingerprint.

The integrity hash is not a digital signature or blockchain proof.

### 7.3 Auction creation and registration

1. Seller creates a session only for an owned `APPRAISED` and `AVAILABLE` product.
2. Product and session conflict checks use database locks.
3. Session starts as `WAITING`; the product becomes `IN_AUCTION`.
4. Bidder registration moves the deposit from available balance to frozen balance.
5. Registration is allowed in `WAITING` and during a still-live `ACTIVE` Redis runtime.
6. Withdrawal is allowed only in `WAITING`; the deposit is released and the participant cannot
   register again for that session.

### 7.4 Active bidding

1. The scheduler loads due sessions and frozen bidder IDs into Redis.
2. Session status becomes `ACTIVE`.
3. `POST /api/v1/bids` performs preliminary ownership/status checks.
4. A Redis Lua script atomically verifies time, registration, current leader, and minimum price.
5. A valid bid updates Redis and may extend the end time.
6. If remaining time is at most 30 seconds, the end time is extended by 60 seconds.
7. The server broadcasts a `NEW_BID` STOMP event.
8. Bid audit persistence and MySQL snapshot synchronization are best-effort secondary writes.

The Redis result is the bid acceptance boundary. MySQL bid persistence must not be described as a
prerequisite for a successful live bid.

### 7.5 Auction closure and order creation

1. The close scheduler reads the Redis snapshot.
2. If Redis state is missing, it falls back to the MySQL session snapshot and persisted valid bids.
3. A session becomes:
   - `ENDED_SUCCESS` when a valid highest bid meets the reserve price;
   - `ENDED_FAILED` otherwise.
4. Loser deposits are released.
5. The winner deposit is captured from frozen balance.
6. An idempotent order is created only after winner-deposit settlement succeeds.
7. A repair scheduler retries terminal sessions with frozen deposits or a missing order.

Public default listing shows `WAITING` and `ACTIVE`. Explicit public status filters and public detail
also support `ENDED_SUCCESS` and `ENDED_FAILED`. `CANCELED` is not public.

## 8. Financial model

The current system does not implement an independent escrow ledger.

It uses:

- `wallets.available_balance`;
- `wallets.frozen_balance`;
- immutable `wallet_transactions`;
- idempotent `wallet_operations`;
- order-owned financial snapshots;
- `platform_revenue_transactions`.

Money flow:

1. VNPay top-up credits the buyer wallet.
2. Auction registration freezes a deposit.
3. Auction loss/cancellation releases the deposit.
4. Winning captures the deposit and applies it to the future order price.
5. The winner pays `finalPrice - depositAmount` from available wallet balance.
6. The seller is credited only when the order completes.
7. Platform commission is recorded separately.

Commission rates:

- up to 50,000,000 VND: 5%;
- above 50,000,000 and up to 200,000,000 VND: 4%;
- above 200,000,000 VND: 3%.

If the winner misses the 72-hour payment deadline, the order is canceled. By default, 10% of the
captured deposit is platform revenue and 90% is credited to the seller.

## 9. Order, fulfillment, and dispute

### 9.1 Order lifecycle

```text
PENDING_PAYMENT -> PAID -> FULFILLING -> COMPLETED
       |                         |
       v                         v
   CANCELED                  DISPUTED
                                 |
                    COMPLETED or CANCELED
```

- Auction is the only implemented order source.
- Buyer selects an owned address when paying.
- Product and shipping-address values are copied into immutable order snapshots.
- Payment creates a `PENDING_SHIPMENT` fulfillment.

### 9.2 Fulfillment lifecycle

```text
PENDING_SHIPMENT -> SHIPPED -> DELIVERED
                           -> AUTO_COMPLETED
                           -> CANCELED
```

- Third-party delivery requires carrier name and tracking code.
- Self-delivery does not require carrier information.
- Buyer receipt confirmation immediately completes the order.
- A shipped fulfillment automatically completes after 168 hours by default.
- Orders in `DISPUTED` state are excluded from automatic completion.

There is no post-confirmation dispute window after buyer receipt confirmation.

### 9.3 Dispute lifecycle

- Only the buyer can open a dispute.
- The order must be `FULFILLING` and fulfillment must be `SHIPPED`.
- Opening evidence is mandatory.
- Buyer, seller, and authorized admin can add immutable text/image messages while active.
- The buyer may cancel an active dispute.
- Admin resolution supports only:
  - `SELLER_WINS`: complete payout and mark fulfillment automatically completed;
  - `BUYER_WINS`: refund deposit plus remaining payment, cancel fulfillment, and mark the product
    `RETURNED`.

Partial refunds are not implemented.

## 10. Media flow

All business media follows the same sequence:

1. business module requests a signed upload intent;
2. browser uploads directly to Cloudinary;
3. business module confirms the upload by `mediaId` and immutable Cloudinary `assetId`;
4. confirmed media is attached by ID;
5. detached, stale, or orphaned media is deleted asynchronously.

Supported usage types are avatar, product image, appraisal image, and dispute evidence. Shipment
packing video is reserved in the enum but not implemented in the business workflow.

## 11. Background jobs

| Job | Default schedule | Responsibility |
|---|---|---|
| Auction activation | every 5 seconds | Load due sessions into Redis |
| Auction closure | every 5 seconds | Finalize due active sessions |
| Auction repair | every 30 seconds | Repair deposit settlement and missing orders |
| Order payment deadline | every minute | Cancel overdue unpaid orders |
| Fulfillment completion | every 5 minutes | Complete overdue shipped orders without disputes |
| Refresh-token cleanup | every 6 hours | Remove expired/revoked refresh tokens |
| Media cleanup | every 6 hours | Mark and delete stale/orphaned assets |

## 12. Realtime contract

Clients connect to:

```text
/ws-auction
```

and subscribe to:

```text
/topic/auctions/{auctionSessionId}
```

Event types:

- `SESSION_ACTIVATED`
- `NEW_BID`
- `SESSION_ENDED`

WebSocket subscription is public and read-only. Registration and bidding remain protected REST
operations. Broadcasts expose a masked bidder alias, not a full user ID.

## 13. Deployment

Production Compose runs:

- MySQL 8;
- Redis 7.4 with AOF and password;
- backend container;
- frontend Nginx container.

Host Nginx routes:

- `/api/` to backend;
- `/ws-auction` to backend with WebSocket upgrade;
- the exact readiness endpoint to backend;
- all other paths to the frontend container.

The release workflow builds immutable backend/frontend images tagged by full commit SHA and deploys
them through the guarded production script. Application secrets remain in the VPS `.env.prod`.

## 14. Verified limitations

- Accepted bid audit persistence is best-effort after Redis acceptance.
- Rare close-time partial failures rely on the repair scheduler and operational review.
- VNPay deployment target is Sandbox.
- Disputes do not support partial refunds.
- Shipment packing media is not implemented.
- Stored winner/loser notifications are not implemented.
- Blog content belongs to the frontend and is static/mock, not an API-backed CMS feature.
