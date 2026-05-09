# API Integration

## Backend Response Contract

All REST responses are wrapped as:

```ts
type ApiResponse<T> = {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
};
```

Paginated responses use:

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

Backend pagination is 1-based.

## Axios Standard

Use one shared Axios instance.

Required behavior:

- prepend `VITE_API_BASE_URL`
- attach access token when available
- use `withCredentials: true` for authenticated/private flows
- normalize errors
- unwrap `ApiResponse<T>` before feature usage

## 401 Refresh and Retry Flow

The standard flow is:

1. request receives `401`
2. Axios response interceptor checks retry eligibility
3. one shared refresh operation is triggered
4. concurrent failed requests wait for the refresh result
5. on success, pending requests replay once
6. on failure, auth state is cleared and logout/redirect behavior runs

Rules:

- only one refresh operation may run at a time
- replayed requests must not enter infinite retry loops
- bid mutations must not be automatically retried after ambiguous network failure

## Credentials and Security

Frontend assumptions:

- backend supports `HttpOnly` refresh cookie
- FE uses `withCredentials: true`
- backend CORS explicitly allows the FE origin
- wildcard origin is not acceptable for credentialed requests

CSRF note:

- because cookie-authenticated flows are involved, backend must implement a documented CSRF mitigation strategy for sensitive endpoints
- acceptable baseline: safe `SameSite` policy
- preferred stronger approach: CSRF token strategy for refresh and authenticated mutations

## Key Backend Endpoints for FE MVP

Public:

- `GET /auctions`
- `GET /auctions/{id}`
- `GET /categories`
- `GET /locations/provinces`
- `GET /locations/districts`
- `GET /locations/wards`

Auth and account:

- `POST /auth/login`
- `POST /auth/register`
- `GET /auth/verify-email`
- `POST /auth/resend-verification`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me`
- `PUT /users/me`
- `PATCH /users/me`

Wallet and bidding:

- `GET /wallets/me`
- `GET /wallets/me/transactions`
- `POST /wallets/me/top-up`
- `POST /auctions/{id}/register`
- `POST /bids`

Seller and appraiser:

- `POST /users/me/seller-profile`
- `GET /users/me/seller-profile`
- `GET /products`
- `GET /products/{id}`
- `POST /products`
- `PUT /products/{id}`
- `DELETE /products/{id}`
- `POST /products/{id}/submit-appraisal`
- `POST /products/{id}/appraise`
- `POST /auctions`
- `GET /auctions/me`
- `PATCH /auctions/{id}/cancel`

## Media Upload Sequence

All upload flows follow the same pattern:

1. request upload intent from backend
2. upload directly to Cloudinary
3. confirm upload with backend using `mediaId` and `assetId`
4. submit the final business form with confirmed `mediaId`

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

## WebSocket Handling Rules

- websocket lifecycle is feature-scoped to the auction detail or bidding room
- websocket may hot-patch cache for UX
- websocket must still trigger background refetch to confirm state
- REST remains the final source of truth

For `NEW_BID`, FE may patch:

- `currentPrice`
- `endTime`
- related auction detail cache
- related auction list cache

If server-confirmed state differs, TanStack Query replaces the temporary patch.

## WebSocket Reconnect Rules

- STOMP client must auto-reconnect with controlled backoff
- after reconnect succeeds, FE must immediately refetch affected queries
- if websocket remains unavailable, FE must continue showing REST-based state without inventing realtime state

## Clock Synchronization Rules

Auction countdown must be server-time based.

Preferred offset formula:

```text
offset = (serverTime + RTT/2) - localReceiveTime
```

Preferred data source:

- backend `Date` headers on normal API traffic

If backend `Date` headers are reliable, FE should continuously refine the time offset without needing a dedicated sync endpoint.

Countdown rule:

```text
serverNow = clientNow + offset
remaining = endTime - serverNow
```

Anti-sniper rule:

- when REST or websocket provides a newer `endTime`, FE must replace the countdown anchor immediately

## Query Key Convention

Examples:

- `["auctions", "list", params]`
- `["auctions", "detail", auctionId]`
- `["wallet", "me"]`
- `["wallet", "transactions", params]`
- `["catalog", "products", params]`
- `["catalog", "product", productId]`
