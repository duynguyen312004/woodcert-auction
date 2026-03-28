# ADR-003: Escrow Wallet & Automated Settlement Flow

## Status
Accepted

## Context
In a C2C (Consumer-to-Consumer) auction platform for high-value wooden artifacts, trust is the biggest barrier. 
If a buyer transfers money directly to a seller, the seller might not ship the product. Conversely, if the seller ships first, the buyer might not pay. We need a financial mechanism to protect both parties and manage the platform's revenue (platform fees).

## Options Considered

### Option A: Direct Transfer (No Escrow)
- Buyer transfers money directly to Seller's bank account. Platform charges a fee upfront.
- **Risk:** High scam rate. The platform cannot guarantee product delivery or quality.

### Option B: Manual Escrow by Admin
- Buyers pay to the platform's bank account. Admins manually verify delivery and manually transfer money to sellers.
- **Risk:** Not scalable. Requires huge operational overhead as the transaction volume grows.

### Option C: In-System Escrow Wallet + Automated CronJobs (CHOSEN)
- Users have internal Wallets (`available_balance`, `frozen_balance`).
- Funds are held in the platform's escrow during the transaction.
- Settlement is fully automated based on time thresholds and dispute status.

## Decision
**Option C** — System Escrow Wallet with Automated Settlement.

## Implementation Design

### 1. The Escrow Lifecycle
- **Deposit:** User tops up their wallet (`available_balance` increases).
- **Auction Join:** Platform moves `deposit_amount` from `available_balance` to `frozen_balance`.
- **Order Payment:** Winner pays the remaining balance. The total amount is held in the System Escrow (represented by the `PREPARING` or `SHIPPING` order status).
- **Delivery:** Carrier updates status to `DELIVERED`, setting the `delivered_at` timestamp.

### 2. Auto-Complete Background Job
A Spring `@Scheduled` task runs every hour:
```java
@Scheduled(cron = "0 0 * * * *")
@Transactional
public void processCompletedOrders() {
    // 1. Find orders where status = DELIVERED 
    //    AND delivered_at <= NOW() - 72 hours
    //    AND NO active dispute exists.
    // 2. For each order:
    //    a. Deduct platform_fee.
    //    b. Add (total_amount - platform_fee) to Seller's available_balance.
    //    c. Update Order status to COMPLETED.
}
```
### 3. Concurrency Protection
All updates to wallets and orders during the settlement process MUST use @Version (Optimistic Locking) to ensure no duplicate payouts occur if the CronJob accidentally triggers twice concurrently.

Consequences
Positive
High Trust: Both buyers and sellers are protected.

Scalability: The system resolves 95% of successful orders automatically without Admin intervention.

Clear Revenue Tracking: Platform fees are deducted automatically at the exact moment of settlement.

Negative
Operational Liability: The platform is legally holding user funds. Security of the Wallet tables is paramount.

CronJob Failures: If the background job fails or the server goes down, sellers will experience delayed payouts. Monitoring is required.


---