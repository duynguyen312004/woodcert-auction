# API Integration

Last updated: 2026-05-25

This document tracks frontend usage of backend APIs. Active FE integrations use the shared `apiClient`; no feature should create ad hoc HTTP clients.

## Implementation Status

### Authentication and Account

| Feature              | Endpoint                              | FE status                        |
| -------------------- | ------------------------------------- | -------------------------------- |
| Register             | `POST /auth/register`                 | Implemented                      |
| Login                | `POST /auth/login`                    | Implemented                      |
| Refresh              | `POST /auth/refresh`                  | Implemented in Axios interceptor |
| Logout               | `POST /auth/logout`                   | Implemented                      |
| Verify email         | `GET /auth/verify-email`              | Implemented                      |
| Resend verification  | `POST /auth/resend-verification`      | Implemented                      |
| Forgot password      | `POST /auth/forgot-password`          | Implemented                      |
| Reset password       | `POST /auth/reset-password`           | Implemented                      |
| Current profile      | `GET /users/me`                       | Implemented                      |
| Update profile       | `PUT /users/me`                       | Implemented                      |
| Avatar upload intent | `POST /users/me/avatar/upload-intent` | Implemented                      |
| Attach avatar        | `PUT /users/me/avatar`                | Implemented                      |

### Public Auction and Catalog

| Feature        | Endpoint             | FE status                           |
| -------------- | -------------------- | ----------------------------------- |
| Categories     | `GET /categories`    | Implemented                         |
| Auction list   | `GET /auctions`      | Implemented on home and `/auctions` |
| Auction detail | `GET /auctions/{id}` | Pending                             |

### Wallet and Buyer Runtime

| Feature               | Endpoint                            | FE status                              |
| --------------------- | ----------------------------------- | -------------------------------------- |
| Header wallet balance | `GET /wallets/me`                   | Implemented through `useWalletBalance` |
| Wallet page balance   | `GET /wallets/me`                   | Implemented                            |
| Transactions          | `GET /wallets/me/transactions`      | Implemented                            |
| VNPay deposit create  | `POST /wallets/me/deposit`          | Implemented                            |
| VNPay deposit history | `GET /wallets/me/deposits`          | Implemented                            |
| VNPay deposit status  | `GET /wallets/me/deposits/{txnRef}` | Implemented                            |
| Auction registration  | `POST /auctions/{id}/register`      | Pending                                |
| Bid placement         | `POST /bids`                        | Pending                                |

### Seller Workflow

| Feature                     | Endpoint                               | FE status                              |
| --------------------------- | -------------------------------------- | -------------------------------------- |
| Seller profile read         | `GET /users/me/seller-profile`         | Implemented                            |
| Seller profile create       | `POST /users/me/seller-profile`        | Implemented                            |
| Product list                | `GET /products`                        | Implemented                            |
| Product detail for edit     | `GET /products/{id}`                   | Implemented where needed for edit flow |
| Create product              | `POST /products`                       | Implemented                            |
| Update product              | `PUT /products/{id}`                   | Implemented                            |
| Delete product              | `DELETE /products/{id}`                | Implemented                            |
| Submit appraisal            | `POST /products/{id}/submit-appraisal` | Implemented                            |
| Product image upload intent | `POST /products/images/upload-intent`  | Implemented                            |
| Product image confirm       | `PUT /products/images/confirm`         | Implemented                            |
| Seller auction list         | `GET /auctions/me`                     | Implemented                            |
| Seller auction create       | `POST /auctions`                       | Implemented                            |
| Seller auction cancel       | `PATCH /auctions/{id}/cancel`          | Implemented                            |

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

Current confirmation endpoints:

- `PUT /users/me/avatar`
- `PUT /products/images/confirm`
- `PUT /appraisals/images/confirm`

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

FE websocket integration is pending. When implemented, the lifecycle must be feature-scoped to auction detail or bidding room and reconciled through REST refetch.

## Query Key Convention

- `["auctions", "list", params]`
- `["auctions", "detail", auctionId]`
- `["wallet", "me"]`
- `["wallet", "transactions", params]`
- `["wallet", "deposits", params]`
- `["wallet", "deposit", txnRef]`
- `["catalog", "products", params]`
- `["catalog", "product", productId]`
