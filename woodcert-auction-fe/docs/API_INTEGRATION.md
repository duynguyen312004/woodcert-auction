# API Integration

Last updated: 2026-06-19

This document tracks frontend usage of backend APIs. Active FE integrations use the shared `apiClient`; no feature should create ad hoc HTTP clients.

## Implementation Status

### Authentication and Account

| Feature              | Endpoint                              | FE status                          |
| -------------------- | ------------------------------------- | ---------------------------------- |
| Register             | `POST /auth/register`                 | Implemented                        |
| Login                | `POST /auth/login`                    | Implemented                        |
| Refresh              | `POST /auth/refresh`                  | Implemented in Axios interceptor   |
| CSRF token           | `GET /auth/csrf`                      | Implemented for refresh/logout     |
| Logout               | `POST /auth/logout`                   | Implemented                        |
| Verify email         | `GET /auth/verify-email`              | Implemented                        |
| Resend verification  | `POST /auth/resend-verification`      | Implemented                        |
| Forgot password      | `POST /auth/forgot-password`          | Implemented                        |
| Reset password       | `POST /auth/reset-password`           | Implemented                        |
| Current profile      | `GET /users/me`                       | Implemented with capability status |
| Update profile       | `PUT /users/me`                       | Implemented                        |
| Update seller name   | `PATCH /users/me/seller-profile`      | Implemented on seller profile      |
| Avatar upload intent | `POST /users/me/avatar/upload-intent` | Implemented                        |
| Attach avatar        | `PUT /users/me/avatar`                | Implemented                        |

### Public Auction and Catalog

| Feature               | Endpoint                              | FE status                                       |
| --------------------- | ------------------------------------- | ----------------------------------------------- |
| Categories            | `GET /categories`                     | Implemented                                     |
| Auction list          | `GET /auctions`                       | Implemented on home and `/auctions`             |
| Auction materials     | `GET /auctions/materials`             | Implemented as public filter data               |
| Auction detail        | `GET /auctions/{id}`                  | Implemented on `/auctions/:id` and bidding room |
| Participation context | `GET /auctions/{id}/my-participation` | Implemented                                     |
| Bid history           | `GET /auctions/{id}/bids?size=20`     | Implemented                                     |

### Wallet and Buyer Runtime

| Feature               | Endpoint                                | FE status                              |
| --------------------- | --------------------------------------- | -------------------------------------- |
| Header wallet balance | `GET /wallets/me`                       | Implemented through `useWalletBalance` |
| Wallet page balance   | `GET /wallets/me`                       | Implemented                            |
| Transactions          | `GET /wallets/me/transactions`          | Implemented                            |
| VNPay deposit create  | `POST /wallets/me/deposit`              | Implemented                            |
| VNPay deposit history | `GET /wallets/me/deposits`              | Implemented                            |
| VNPay deposit status  | `GET /wallets/me/deposits/{txnRef}`     | Implemented                            |
| Auction registration  | `POST /auctions/{id}/register`          | Implemented                            |
| Auction withdrawal    | `POST /auctions/{id}/withdraw`          | Implemented for `WAITING` sessions     |
| Bid placement         | `POST /bids`                            | Implemented                            |
| Server time sync      | `GET /system/time`                      | Implemented                            |
| Buyer auction history | `GET /auctions/my-participations`       | Implemented on `/my-auctions`          |
| Buyer auction stats   | `GET /auctions/my-participations/stats` | Implemented                            |
| Buyer auction detail  | `GET /auctions/my-participations/{id}`  | Implemented                            |

Wallet funding for buyer runtime must use the VNPay Sandbox deposit flow above. Do not add local wallet funding shortcuts.

### Orders, Fulfillment, and Disputes

| Feature                | Endpoint                                        | FE status                        |
| ---------------------- | ----------------------------------------------- | -------------------------------- |
| Buyer order list       | `GET /orders/my-purchases?status=&page=&size=`  | Implemented on `/orders`         |
| Seller order list      | `GET /orders/my-sales?status=&page=&size=`      | Implemented on `/seller/orders`  |
| Buyer order counts     | `GET /orders/my-purchases/status-counts`        | Implemented                      |
| Seller order counts    | `GET /orders/my-sales/status-counts`            | Implemented                      |
| Order detail           | `GET /orders/{id}`                              | Implemented through hooks        |
| Pay order remainder    | `POST /orders/{id}/pay { addressId }`           | Implemented with address picker  |
| Seller sales summary   | `GET /orders/my-sales/summary?range=`           | Implemented on `/seller/revenue` |
| Seller ship order      | `PATCH /orders/{orderId}/fulfillment/ship`      | Implemented                      |
| Buyer receive order    | `PATCH /orders/{orderId}/fulfillment/receive`   | Implemented                      |
| Dispute upload intent  | `POST /disputes/evidence/upload-intent`         | Implemented                      |
| Dispute upload confirm | `PUT /disputes/evidence/confirm`                | Implemented                      |
| Open dispute           | `POST /orders/{orderId}/disputes`               | Implemented                      |
| Current dispute        | `GET /orders/{orderId}/disputes/current`        | Implemented                      |
| Dispute history        | `GET /orders/{orderId}/disputes`                | Implemented API/hook             |
| Dispute detail         | `GET /orders/{orderId}/disputes/{id}`           | Implemented for buyer and seller |
| Participant message    | `POST /orders/{orderId}/disputes/{id}/messages` | Implemented                      |
| Cancel dispute         | `PATCH /orders/{orderId}/disputes/{id}/cancel`  | Implemented                      |
| Admin dispute queue    | `GET /admin/disputes`                           | Implemented                      |
| Admin dispute detail   | `GET /admin/disputes/{id}`                      | Implemented                      |
| Admin dispute message  | `POST /admin/disputes/{id}/messages`            | Implemented                      |
| Admin mark review      | `PATCH /admin/disputes/{id}/review`             | Implemented                      |
| Admin resolve dispute  | `PATCH /admin/disputes/{id}/resolve`            | Implemented                      |

### Seller Workflow

| Feature                     | Endpoint                               | FE status                              |
| --------------------------- | -------------------------------------- | -------------------------------------- |
| Seller profile read         | `GET /users/me/seller-profile`         | Implemented                            |
| Seller profile create       | `POST /users/me/seller-profile`        | Implemented                            |
| Product list                | `GET /products`                        | Implemented                            |
| Product statistics          | `GET /products/stats`                  | Implemented for exact seller KPIs      |
| Product detail for edit     | `GET /products/{id}`                   | Implemented where needed for edit flow |
| Create product              | `POST /products`                       | Implemented                            |
| Update product              | `PUT /products/{id}`                   | Implemented                            |
| Delete product              | `DELETE /products/{id}`                | Implemented                            |
| Submit appraisal            | `POST /products/{id}/submit-appraisal` | Implemented                            |
| Product image upload intent | `POST /products/images/upload-intent`  | Implemented                            |
| Product image confirm       | `PUT /products/images/confirm`         | Implemented                            |
| Seller auction list         | `GET /auctions/me`                     | Implemented                            |
| Seller auction statistics   | `GET /auctions/me/stats`               | Implemented                            |
| Seller auction detail       | `GET /auctions/me/{id}`                | Implemented with STOMP reconciliation  |
| Seller auction create       | `POST /auctions`                       | Implemented                            |
| Seller auction cancel       | `PATCH /auctions/{id}/cancel`          | Implemented                            |

Seller operational lists, counts, dashboard, and action-center data reconcile every 10 seconds.
Seller auction detail also subscribes to `/topic/auctions/{id}` through the same shared STOMP
infrastructure as the buyer bidding room.

Seller capability suspension is treated as read-only access, not as an account
logout. `GET /users/me` supplies `capabilityStatuses` so the seller portal can show
the exact reason and update time. Existing products, auctions, and sales remain
visible; create/edit/submit/cancel actions are disabled. Shipping an already-paid
order remains available. A top-level account ban still uses the normal hard-lock
session behavior.

### Admin and Public Verification

| Feature                 | Endpoint                              | FE status                           |
| ----------------------- | ------------------------------------- | ----------------------------------- |
| Revenue transactions    | `GET /admin/revenue`                  | Implemented                         |
| Revenue statistics      | `GET /admin/revenue/stats`            | Implemented                         |
| Revenue CSV export      | `GET /admin/revenue/export`           | Implemented                         |
| Admin categories        | `/admin/categories` CRUD              | Implemented                         |
| Admin appraisers        | `POST/PATCH /admin/appraisers/**`     | Create and capability ban/unban     |
| Admin users             | `GET/PATCH /admin/users/**`           | List, account ban, capability ban   |
| Admin audit logs        | `GET /admin/audit-logs`               | Implemented                         |
| Public certificate page | `GET /certificates/{certificateCode}` | Implemented on `/certificates`      |
| Address book            | `GET/POST /addresses`                 | Implemented on `/account/addresses` |

### Appraiser Workflow

| Feature              | Endpoint                                 | FE status   |
| -------------------- | ---------------------------------------- | ----------- |
| Pending queue        | `GET /products?status=PENDING_APPRAISAL` | Implemented |
| Active claims        | `GET /products?status=UNDER_APPRAISAL`   | Implemented |
| Reviewed appraised   | `GET /products?status=APPRAISED`         | Implemented |
| Reviewed rejected    | `GET /products?status=REJECTED`          | Implemented |
| Product detail       | `GET /products/{id}`                     | Implemented |
| Claim product        | `POST /products/{id}/appraisal-claim`    | Implemented |
| Release claim        | `DELETE /products/{id}/appraisal-claim`  | Implemented |
| Submit appraisal     | `POST /products/{id}/appraise`           | Implemented |
| Proof upload intent  | `POST /appraisals/images/upload-intent`  | Implemented |
| Proof upload confirm | `PUT /appraisals/images/confirm`         | Implemented |

## Backend Response Contract

All REST responses are wrapped as:

```ts
type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  errorCode?: string;
  timestamp: string;
};
```

Feature APIs should expose unwrapped business data. Backend pagination is 1-based:

```ts
type PaginationResponse<T> = {
  meta: {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
  };
  result: T[];
};
```

## Axios Standard

- Use the single shared Axios instance.
- Prepend `VITE_API_BASE_URL`.
- Attach access token when available.
- Use `withCredentials: true` for authenticated/private flows.
- Normalize backend errors into the shared FE error shape.
- Unwrap `ApiResponse<T>` before feature usage.

## 401 Refresh and Retry Flow

1. Request receives `401`.
2. Axios checks retry eligibility.
3. One shared refresh operation runs.
4. Concurrent failed requests wait for that refresh result.
5. On success, pending requests replay once.
6. On failure, auth state is cleared and logout/redirect behavior runs.

Refresh/logout cookie flows first call `GET /auth/csrf` and send the returned token as `X-XSRF-TOKEN`.

Bid mutations must not be blindly retried after ambiguous network failure.

## Media Upload Sequence

1. Request upload intent from backend.
2. Upload directly to Cloudinary.
3. Confirm upload with backend using `mediaId` and `assetId`.
4. Submit the business form using confirmed `mediaId`.

Current upload intent endpoints:

- `POST /users/me/avatar/upload-intent`
- `POST /products/images/upload-intent`
- `POST /appraisals/images/upload-intent`
- `POST /disputes/evidence/upload-intent`

Current confirmation endpoints:

- `PUT /users/me/avatar`
- `PUT /products/images/confirm`
- `PUT /appraisals/images/confirm`
- `PUT /disputes/evidence/confirm`

## WebSocket Contract

Connect:

```text
/ws-auction
```

Subscribe:

```text
/topic/auctions/{auctionSessionId}
```

Expected event types:

- `SESSION_ACTIVATED`
- `NEW_BID`
- `SESSION_ENDED`

Backend contract for `NEW_BID`:

```ts
type BidBroadcastPayload = {
  type: "SESSION_ACTIVATED" | "NEW_BID" | "SESSION_ENDED";
  auctionSessionId: number;
  status: string;
  currentPrice: string | number;
  highestBidderMaskedAlias?: string;
  endTime: string;
  bidTraceId?: string;
  bidAmount?: string | number;
  bidTime?: string;
  extendedBySeconds?: number;
};
```

`extendedBySeconds` should be absent/null for normal bids and present only when anti-sniper actually extends the session. FE websocket integration is implemented in the Bidding Room feature and reconciled through REST refetch.

## Query Key Convention

- `["auctions", "list", params]`
- `["auctions", "detail", auctionId]`
- `["auctions", "participation", auctionId]`
- `["auctions", "bids", auctionId, params]`
- `["wallet", "me"]`
- `["wallet", "transactions", params]`
- `["wallet", "deposits", params]`
- `["wallet", "deposit", txnRef]`
- `["orders", "buyer", params]`
- `["orders", "seller", params]`
- `["orders", "buyer", "status-counts"]`
- `["orders", "seller", "status-counts"]`
- `["orders", "detail", orderId]`
- `["disputes", "current", orderId]`
- `["disputes", "history", orderId]`
- `["disputes", "detail", orderId, disputeId]`
- `["admin", "disputes", params]`
- `["admin", "disputes", disputeId]`
- `["catalog", "products", params]`
- `["catalog", "product", productId]`
