# WoodCert Auction Database

Last verified against Flyway: 2026-06-19

## 1. Schema authority

The executable schema is defined only by:

```text
src/main/resources/db/migration/
├── V1__baseline_schema.sql
├── V2__seed_reference_data.sql
├── V3__seed_demo_users.sql
└── V4__add_dispute_conversation.sql
```

Runtime rules:

- Flyway migration is enabled.
- Hibernate uses `ddl-auto=validate`.
- Spring SQL initialization is disabled.
- `database.sql` is documentation only and must not be executed.

## 2. Migration contents

| Migration | Purpose |
|---|---|
| V1 | Complete baseline schema for identity, media, catalog, finance, auction, order, fulfillment, dispute, capability, and audit data |
| V2 | Roles, permissions, role-permission mappings, and the initial flat category taxonomy |
| V3 | Separate admin and appraiser operator accounts using Flyway password-hash placeholders |
| V4 | Immutable dispute messages and message-level evidence association |

## 3. Table inventory

### 3.1 Identity and access

| Table | Primary purpose | Important constraints |
|---|---|---|
| `users` | Central account record | UUID PK; unique email and phone; optional avatar media FK |
| `roles` | Role dictionary | Unique role name |
| `permissions` | Permission dictionary | Unique permission name |
| `user_roles` | User-role N:N mapping | Composite PK |
| `role_permissions` | Role-permission N:N mapping | Composite PK |
| `refresh_tokens` | Hashed browser refresh sessions | Unique token hash; user FK |
| `email_verification_tokens` | Hashed one-time verification tokens | Unique hash; user FK |
| `password_reset_tokens` | Hashed one-time reset tokens | Unique hash; user FK |
| `seller_profiles` | Seller identity and reputation | User PK/FK; unique identity-card number |
| `user_capability_statuses` | Per-user buyer/seller/appraiser suspension | Unique `(user_id, capability)` |
| `admin_audit_logs` | Immutable admin action trail | Actor FK; indexed action and target |

Account status:

```text
ACTIVE | BANNED | UNVERIFIED
```

Capability status:

```text
ACTIVE | BANNED
```

### 3.2 Location and address

| Table | Primary purpose |
|---|---|
| `provinces` | Province/city master data |
| `districts` | District master data linked to province |
| `wards` | Ward master data linked to district |
| `addresses` | User-owned recipient addresses |

Location keys are strings. `addresses` stores `province_code`, `district_code`, and `ward_code`,
not numeric location IDs.

Location data is seeded at application startup only when the tables are empty. The service prefers
the configured remote API and falls back to the bundled `seed/location-seed.json`.

### 3.3 Media

| Table | Primary purpose | Important constraints |
|---|---|---|
| `media_assets` | Cloudinary metadata, ownership, usage, and cleanup lifecycle | Unique `asset_id` and `public_id`; owner FK |

Media status:

```text
PENDING | ACTIVE | ORPHANED | PENDING_DELETE | DELETE_FAILED | DELETED
```

Media usage:

```text
USER_AVATAR | PRODUCT_IMAGE | APPRAISAL_IMAGE | SHIPMENT_PACKING_VIDEO | DISPUTE_EVIDENCE
```

`SHIPMENT_PACKING_VIDEO` is reserved but has no implemented fulfillment workflow.

### 3.4 Catalog and appraisal

| Table | Primary purpose | Important constraints |
|---|---|---|
| `categories` | Category taxonomy | Unique name and slug; optional parent self-FK |
| `products` | Seller-owned item and appraisal/sale state | Seller/category FKs; appraisal claim fields |
| `product_images` | Ordered product-media links | Product and media FKs |
| `appraisal_reports` | Immutable appraisal result | One report per product; unique certificate code |
| `appraisal_images` | Appraisal proof-media links | Report and media FKs |

Product appraisal status:

```text
DRAFT -> PENDING_APPRAISAL -> UNDER_APPRAISAL -> APPRAISED
                                                -> REJECTED
```

Product sale status:

```text
AVAILABLE | IN_AUCTION | PENDING_ORDER | SOLD | RETURNED
```

Category data currently uses a flat taxonomy, although the schema supports one optional parent.

### 3.5 Finance

| Table | Primary purpose | Important constraints |
|---|---|---|
| `wallets` | Available and frozen balance per user | Unique user FK; optimistic-lock version |
| `wallet_transactions` | Immutable successful balance-mutation audit | Wallet FK; reference indexes |
| `wallet_operations` | Idempotency and retry lifecycle | Unique operation key |
| `vnpay_deposits` | VNPay top-up request and confirmation | Unique transaction reference |
| `platform_revenue_transactions` | Appraisal fee, commission, and forfeited-deposit revenue | Unique operation key |

Wallet transaction types:

```text
WALLET_TOP_UP
APPRAISAL_FEE
AUCTION_DEPOSIT_FREEZE
AUCTION_DEPOSIT_RELEASE
AUCTION_DEPOSIT_CAPTURE
ORDER_PAYMENT
ORDER_REFUND
SELLER_PAYOUT
SELLER_FORFEIT_COMPENSATION
```

The finance schema is not an independent escrow ledger. Financial protection is implemented through
wallet balances, transaction records, idempotent operations, and order snapshots.

### 3.6 Auction

| Table | Primary purpose | Important constraints |
|---|---|---|
| `auction_sessions` | Session configuration, DB snapshot, and terminal outcome | Product FK; optimistic-lock version |
| `auction_participants` | Registration and deposit state | Unique `(auction_session_id, user_id)` |
| `bids` | Accepted/rejected bid audit rows | Unique `bid_trace_id` |

Auction status:

```text
WAITING | ACTIVE | ENDED_SUCCESS | ENDED_FAILED | CANCELED
```

Deposit status:

```text
FROZEN | WITHDRAWN | REFUNDED | DEDUCTED | CONFISCATED
```

Bid status:

```text
VALID | INVALID_PRICE | REJECTED_TIME
```

During `ACTIVE`, live price, leader, and end time are stored in Redis. MySQL stores the durable
session and terminal result.

### 3.7 Order

| Table | Primary purpose | Important constraints |
|---|---|---|
| `orders` | Post-sale commercial transaction and immutable snapshots | Unique `(source_type, source_id)`; buyer/seller/product FKs; optimistic-lock version |

Current order source:

```text
AUCTION
```

Order status:

```text
PENDING_PAYMENT | PAID | FULFILLING | COMPLETED | CANCELED | DISPUTED
```

The order stores:

- product title and primary-image URL snapshot;
- full recipient/address snapshot;
- final price, captured deposit, and remaining amount;
- payment deadline and completion/cancellation timestamps;
- commission rate/amount and seller payout;
- forfeited-deposit split;
- buyer refund audit.

These fields preserve historical commerce data even if product or address records later change.

### 3.8 Fulfillment

| Table | Primary purpose | Important constraints |
|---|---|---|
| `order_fulfillments` | Shipment and receipt lifecycle | One fulfillment per order; buyer/seller FKs |

Fulfillment status:

```text
PENDING_SHIPMENT | SHIPPED | DELIVERED | AUTO_COMPLETED | CANCELED
```

Delivery method:

```text
THIRD_PARTY | SELF_DELIVERY
```

`auto_complete_deadline` is set when the seller confirms shipping. The current default is 168 hours
after shipment.

### 3.9 Dispute

| Table | Primary purpose | Important constraints |
|---|---|---|
| `dispute_cases` | Case state, reason, admin outcome, and audit fields | Order FK; optional fulfillment/admin FKs |
| `dispute_messages` | Immutable buyer/seller/admin conversation | Case and author FKs |
| `dispute_evidence` | Opening or message-level image evidence | Case/media/uploader FKs; nullable message FK |

Dispute status:

```text
OPEN | UNDER_REVIEW | RESOLVED | REJECTED | CANCELED
```

Resolution outcome:

```text
SELLER_WINS | BUYER_WINS
```

Opening evidence has `message_id = NULL`. Message attachments reference a `dispute_messages` row.
Partial-refund data is not modeled.

## 4. Core relationships

```text
users
├── user_roles ── roles ── role_permissions ── permissions
├── refresh_tokens / verification tokens / reset tokens
├── seller_profiles
├── addresses
├── wallets ── wallet_transactions / wallet_operations
├── products ── product_images
│            └── appraisal_reports ── appraisal_images
└── auction_participants / bids

products
└── auction_sessions
    └── orders (source_type=AUCTION, source_id=auction_sessions.id)
        ├── order_fulfillments
        └── dispute_cases
            ├── dispute_messages
            └── dispute_evidence
```

`orders.source_id` is a logical source reference. The unique source constraint is enforced, but
there is no database foreign key from `orders.source_id` to `auction_sessions.id`.

## 5. Runtime state outside MySQL

Redis keys for each active auction:

```text
auction:session:{id}:state
auction:session:{id}:bidders
```

State fields:

```text
currentPrice
stepPrice
reservePrice
endTimeEpochMs
highestBidderId
highestBidTraceId
status
```

Authentication protection keys:

```text
auth:failed_attempts:{normalizedEmail}
auth:locked:{normalizedEmail}
```

Redis data must not be represented in an ERD as durable MySQL tables.

## 6. Seed data

V2 seeds:

- four roles;
- thirteen semantic permissions;
- role-permission mappings;
- ten initial categories.

V3 seeds one admin and one appraiser operator account. Password hashes are deployment-provided
Flyway placeholders and must not be committed as real credentials.

## 7. Verification

Schema verification is covered by:

- `FlywayMigrationIntegrationTest`;
- `ProductionRuntimeConfigurationIntegrationTest`;
- Hibernate mapping validation during application context startup.

Verified on 2026-06-19: the backend suite produced 394 passing tests across 62 Surefire reports,
with no failures, errors, or skipped tests.
