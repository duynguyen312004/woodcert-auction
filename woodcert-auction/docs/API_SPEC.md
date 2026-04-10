# API Specification

> All endpoints return `ApiResponse<T>` wrapper.
> Update this file whenever endpoints change.

---

## Base URL

```text
Development: http://localhost:8080/api/v1
Production:  https://api.woodcert.com/api/v1
```

## Authentication

All endpoints require JWT in `Authorization: Bearer <accessToken>` header, except those marked as Public (🔓).

## 1. Auth & Session

### POST /auth/login 🔓

Login and receive tokens.

Request Body:

```json
{
  "email": "bidder@example.com",
  "password": "password123"
}
```

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "roles": ["ROLE_BIDDER"]
  },
  "message": "Login successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

Also sets cookie:

```http
Set-Cookie: refresh_token=eyJ...; HttpOnly; Secure; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800
```

Errors:

- 400: Missing email or password
- 401: Invalid credentials
- 403: Account is BANNED or UNVERIFIED

### POST /auth/register 🔓

Register a new basic user account (Default role: ROLE_BIDDER, Status: UNVERIFIED).

Request Body:

```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "Nguyen Van A",
  "phoneNumber": "0987654321"
}
```

Success Response (201):

```json
{
  "statusCode": 201,
  "data": {
    "id": "uuid-1234-5678",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "status": "UNVERIFIED",
    "createdAt": "2026-03-28T10:00:00"
  },
  "message": "User registered successfully. Please verify your email.",
  "timestamp": "2026-03-28T10:00:00"
}
```

Errors:

- 400: Validation failed (blank name, invalid email, weak password)
- 409: Email or phone number already exists

### POST /auth/refresh 🔓

Get a new access token using the refresh token.

Sources (backend checks in order):

- Cookie refresh_token (Web/SPA)
- Request body refreshToken (Mobile)

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "accessToken": "eyJ...(new)",
    "refreshToken": "eyJ...(new)"
  },
  "message": "Token refreshed",
  "timestamp": "2026-03-28T10:15:00"
}
```

(Also sets new refresh_token cookie)

Errors:

- 401: No refresh token provided, expired, or revoked

### POST /auth/logout 🔒

Invalidate refresh token and clear cookie.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Logged out successfully",
  "timestamp": "2026-03-28T11:00:00"
}
```

(Also clears cookie)

## 2. Users (Identity)

### GET /users/me 🔒

Get current logged-in user info (Profile + Roles).

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid-1234-5678",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "phoneNumber": "0987654321",
    "avatarUrl": "https://s3.../avatar.jpg",
    "status": "ACTIVE",
    "roles": ["ROLE_BIDDER", "ROLE_SELLER"],
    "hasSellerProfile": true
  },
  "message": "Fetch user profile successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### PUT /users/me 🔒

Update basic profile info (excluding email/password).
Behavior:
- Fields omitted from the request body keep their current values
- Optional fields can be cleared by sending blank string

Request Body:

```json
{
  "fullName": "Nguyen Van A Updated",
  "phoneNumber": "0911222333"
}
```

Notes:

- This endpoint is kept for backward compatibility.
- Fields omitted from the request body keep their current values.
- Optional fields can be cleared by sending blank string.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid-1234-5678",
    "email": "user@example.com",
    "fullName": "Nguyen Van A Updated",
    "phoneNumber": "0911222333",
    "avatarUrl": "https://s3.../new-avatar.jpg",
    "status": "ACTIVE",
    "roles": ["ROLE_BIDDER"],
    "hasSellerProfile": false
  },
  "message": "User profile updated successfully",
  "timestamp": "2026-03-30T10:00:00"
}
```

### PATCH /users/me 🔒

Patch current user profile with explicit semantics:

- field omitted: keep current value
- field provided with `null`: clear field if nullable
- field provided with value: update field

Request Body:

```json
{
  "fullName": "Nguyen Van A Partial",
  "phoneNumber": null
}
```

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid-1234-5678",
    "email": "user@example.com",
    "fullName": "Nguyen Van A Partial",
    "phoneNumber": "0911222333",
    "avatarUrl": null,
    "status": "ACTIVE",
    "roles": ["ROLE_BIDDER"],
    "hasSellerProfile": false
  },
  "message": "User profile patched successfully",
  "timestamp": "2026-04-06T10:00:00"
}
```

Errors:

- 400: No field provided, invalid field type, invalid format

### POST /users/me/avatar/upload-intent 🔒

Create a signed Cloudinary upload intent for the current user's avatar.

Request Body:

```json
{
  "originalFileName": "avatar.jpg",
  "contentType": "image/jpeg",
  "fileSize": 248123
}
```

Success Response (201):

```json
{
  "statusCode": 201,
  "data": {
    "mediaId": 101,
    "uploadUrl": "https://api.cloudinary.com/v1_1/<cloud>/image/upload",
    "cloudName": "<cloud>",
    "apiKey": "<api-key>",
    "assetFolder": "woodcert/dev/users/uuid-1234-5678/avatar",
    "publicId": "woodcert/dev/users/uuid-1234-5678/avatar/101",
    "resourceType": "image",
    "timestamp": 1775700000,
    "signature": "signed-hash"
  },
  "message": "Avatar upload intent created successfully",
  "timestamp": "2026-04-09T10:00:00"
}
```

Direct Cloudinary upload after receiving the intent must send these form-data fields:
- `file`
- `api_key`
- `timestamp`
- `signature`
- `public_id`
- `asset_folder`

### PUT /users/me/avatar 🔒

Attach an uploaded Cloudinary asset as the current user's avatar.
The backend verifies the asset directly with Cloudinary using the immutable `assetId`, then checks that its `publicId` still matches the issued upload intent.

Request Body:

```json
{
  "mediaId": 101,
  "assetId": "3a1fbda4eb0aa195ce151c93899a827f"
}
```

Success Response (200): same shape as `GET /users/me`, with `avatarUrl` generated from Cloudinary.

### DELETE /users/me/avatar 🔒

Detach the current user's avatar. The old Cloudinary asset is marked for background deletion.

Success Response (200): same shape as `GET /users/me`, with `avatarUrl = null`.

## 3. Seller Profiles

### GET /users/me/seller-profile 🔒

Get current logged-in seller profile.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "userId": "uuid-1234-5678",
    "storeName": "Xưởng Gỗ Mỹ Nghệ ABC",
    "identityCardNumber": "001099012345",
    "taxCode": "0101234567",
    "reputationScore": 5.00
  },
  "message": "Fetch seller profile successful",
  "timestamp": "2026-03-30T10:00:00"
}
```

Errors:

- 404: Seller profile not found

### POST /users/me/seller-profile 🔒

Upgrade account to Seller. Requires basic info to be filled out.

Request Body:

```json
{
  "storeName": "Xưởng Gỗ Mỹ Nghệ ABC",
  "identityCardNumber": "001099012345",
  "taxCode": "0101234567"
}
```

Success Response (201):

```json
{
  "statusCode": 201,
  "data": {
    "userId": "uuid-1234-5678",
    "storeName": "Xưởng Gỗ Mỹ Nghệ ABC",
    "identityCardNumber": "001099012345",
    "taxCode": "0101234567",
    "reputationScore": 5.00
  },
  "message": "Seller profile created. Please re-login to update roles.",
  "timestamp": "2026-03-28T10:00:00"
}
```

Errors:

- 409: User already has a seller profile, or Identity Card exists
- 400: Phone number is required before creating seller profile

## 4. Addresses

### GET /addresses 🔒

List all shipping addresses for the current user.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "receiverName": "Nguyen Van A",
      "phoneNumber": "0987654321",
      "streetAddress": "Số 10, Ngõ 20",
      "provinceCode": "01",
      "districtCode": "001",
      "wardCode": "00001",
      "isDefault": true
    }
  ],
  "message": "Fetch addresses successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### POST /addresses 🔒

Add a new shipping address.

Request Body:

```json
{
  "receiverName": "Người nhận thay",
  "phoneNumber": "0911222333",
  "streetAddress": "Tòa nhà ABC",
  "provinceCode": "01",
  "districtCode": "001",
  "wardCode": "00001",
  "isDefault": false
}
```

(Note: If isDefault is true, backend will automatically set all other addresses of this user to false).

Success Response (201):

```json
{
  "statusCode": 201,
  "data": {
    "id": 12,
    "receiverName": "Nguoi nhan thay",
    "phoneNumber": "0911222333",
    "streetAddress": "Toa nha ABC",
    "provinceCode": "01",
    "districtCode": "001",
    "wardCode": "00001",
    "isDefault": false
  },
  "message": "Address created successfully",
  "timestamp": "2026-03-30T10:00:00"
}
```

Errors:

- 400: Invalid location hierarchy

## 5. Location Master Data

These endpoints are public so clients can populate address forms without bundling local static data.

### GET /locations/provinces 🔓

List all provinces sorted by name.

### GET /locations/districts?provinceCode=01 🔓

List all districts in a province.

Errors:

- 400: Missing `provinceCode`
- 404: Province not found

### GET /locations/wards?districtCode=001 🔓

List all wards in a district.

Errors:

- 400: Missing `districtCode`
- 404: District not found

Notes:

- Location codes are normalized by the backend, so clients may send `1` and still resolve to stored codes such as `01`, `001`, `00001`.

## 6. Categories

### GET /categories 🔓

List all categories (Typically used for menus/filters).

Success Response (200):

```json
{
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "name": "Tượng Gỗ Phong Thủy",
      "slug": "tuong-go-phong-thuy",
      "parentId": null,
      "description": "Các loại tượng gỗ Đạt Ma, Di Lặc..."
    },
    {
      "id": 2,
      "name": "Lục Bình",
      "slug": "luc-binh",
      "parentId": null,
      "description": "Lục bình gỗ nguyên khối"
    }
  ],
  "message": "Fetch categories successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

## 7. Products (Seller & Public)

### GET /products 🔓

List products with filters & pagination.

Note: Public users only see status = APPRAISED. Sellers can pass `?isMine=true` to see all their own products.

Query Parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| size | int | 10 | Items per page |
| categoryId | int | null | Filter by category |
| status | string | APPRAISED | Filter by status |
| isMine | boolean | false | (Auth required) View my own products |

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 10, "pages": 5, "total": 50 },
    "result": [
      {
        "id": 1001,
        "title": "Tượng Đạt Ma Sư Tổ Gỗ Sưa Đỏ",
        "category": { "id": 1, "name": "Tượng Gỗ Phong Thủy" },
        "status": "APPRAISED",
        "primaryImage": "https://s3.../dat-ma-1.jpg",
        "createdAt": "2026-03-28T08:00:00"
      }
    ]
  },
  "message": "Fetch products successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### GET /products/{id} 🔓

Get detailed product info, including its Images and Appraisal Report (if it is APPRAISED).

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "id": 1001,
    "seller": {
      "id": "uuid-1234",
      "storeName": "Xưởng Gỗ ABC",
      "reputationScore": 4.9
    },
    "title": "Tượng Đạt Ma Sư Tổ",
    "description": "Mô tả chi tiết bằng HTML...",
    "material": "Gỗ Sưa (Seller khai báo)",
    "dimensions": "Cao 1m2 x Rộng 40cm",
    "weight": 45.5,
    "status": "APPRAISED",
    "images": [
      { "id": 1, "imageUrl": "https://s3.../dat-ma-1.jpg", "isPrimary": true, "sortOrder": 0 },
      { "id": 2, "imageUrl": "https://s3.../dat-ma-2.jpg", "isPrimary": false, "sortOrder": 1 }
    ],
    "appraisalReport": {
      "certificateCode": "CERT-2026-001",
      "verifiedMaterial": "Gỗ Sưa Đỏ Thật 100%",
      "estimatedValue": 50000000.00,
      "conditionGrade": "EXCELLENT",
      "isAuthentic": true,
      "digitalSignature": "abc123xyz..."
    }
  },
  "message": "Fetch product successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### POST /products 🔒

Create a new product. Initial status will be DRAFT.

Requires Role: ROLE_SELLER

Request Body:

(Note: Upload images via /files endpoint first, then pass the URLs here)

```json
{
  "categoryId": 1,
  "title": "Tượng Di Lặc Gỗ Hương",
  "description": "Chi tiết đục tay tinh xảo...",
  "material": "Gỗ Hương Đá",
  "dimensions": "60x40x30 cm",
  "weight": 15.0,
  "images": [
    { "imageUrl": "https://s3.../di-lac-1.jpg", "isPrimary": true, "sortOrder": 0 },
    { "imageUrl": "https://s3.../di-lac-2.jpg", "isPrimary": false, "sortOrder": 1 }
  ]
}
```

### POST /products/{id}/submit-appraisal 🔒

Seller submits a DRAFT product to the Appraisers. Changes status to PENDING_APPRAISAL.

Request Body: Empty.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Product submitted for appraisal successfully",
  "timestamp": "2026-03-28T10:00:00"
}
```

## 7. Appraisals (Appraiser Area)

### GET /appraisals/pending 🔒

List products waiting for appraisal.

Requires Role: ROLE_APPRAISER

Success Response (200): Returns paginated list of products where status = PENDING_APPRAISAL.

### POST /products/{id}/appraise 🔒

Appraiser submits the official Appraisal Report. This endpoint updates the product's status and generates the certificate.

Requires Role: ROLE_APPRAISER

Request Body:

```json
{
  "isAuthentic": true,
  "verifiedMaterial": "Gỗ Hương Đá",
  "origin": "Gia Lai, Việt Nam",
  "ageEstimation": "Gỗ già 50 năm",
  "conditionGrade": "EXCELLENT",
  "estimatedValue": 15000000.00,
  "appraiserNotes": "Tượng không nứt nẻ, PU bóng mờ đẹp.",
  "sellerAccuracy": 5,
  "proofImages": [
    { "imageUrl": "https://s3.../soi-loi-1.jpg", "description": "Chụp cận cảnh vân gỗ" }
  ]
}
```

Success Response (201):

```json
{
  "statusCode": 201,
  "data": {
    "reportId": 501,
    "productId": 1002,
    "certificateCode": "CERT-2026-002",
    "newProductStatus": "APPRAISED"
  },
  "message": "Appraisal report created successfully",
  "timestamp": "2026-03-28T11:00:00"
}
```

Note on Logic:

- If isAuthentic = false, the system will automatically set Product status to REJECTED and the appraiserNotes will act as the rejected_reason.

The digitalSignature is generated internally by the server by hashing the report data and is not passed by the client.

## 8. Wallets & Transactions (Finance)

### GET /wallets/me 🔒

Get the current user's wallet balance (Available and Frozen).

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "id": 501,
    "userId": "uuid-1234",
    "availableBalance": 15000000.00,
    "frozenBalance": 5000000.00
  },
  "message": "Fetch wallet successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### GET /wallets/me/transactions 🔒

List wallet transaction history.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 10, "pages": 1, "total": 2 },
    "result": [
      {
        "id": 1001,
        "amount": -5000000.00,
        "type": "FREEZE",
        "referenceId": 205,
        "referenceType": "AUCTION",
        "status": "SUCCESS",
        "createdAt": "2026-03-28T09:00:00"
      },
      {
        "id": 1000,
        "amount": 20000000.00,
        "type": "DEPOSIT",
        "referenceId": null,
        "referenceType": "SYSTEM",
        "status": "SUCCESS",
        "createdAt": "2026-03-27T15:00:00"
      }
    ]
  },
  "message": "Fetch transactions successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

## 9. Auction Sessions

### GET /auctions 🔓

List auction sessions (Public). Can filter by status (WAITING, ACTIVE, ENDED_SUCCESS).

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 10, "pages": 2, "total": 15 },
    "result": [
      {
        "id": 205,
        "product": {
          "id": 1001,
          "title": "Tượng Đạt Ma Sư Tổ Gỗ Sưa Đỏ",
          "primaryImage": "https://s3.../dat-ma-1.jpg"
        },
        "startingPrice": 30000000.00,
        "currentPrice": 35000000.00,
        "startTime": "2026-03-29T20:00:00",
        "endTime": "2026-03-29T21:00:00",
        "status": "WAITING"
      }
    ]
  },
  "message": "Fetch auctions successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### POST /auctions 🔒

Seller creates a new auction session for an APPRAISED product.

Requires Role: ROLE_SELLER

Request Body:

```json
{
  "productId": 1001,
  "startingPrice": 30000000.00,
  "reservePrice": 45000000.00,
  "stepPrice": 1000000.00,
  "depositAmount": 5000000.00,
  "startTime": "2026-03-29T20:00:00",
  "endTime": "2026-03-29T21:00:00"
}
```

### POST /auctions/{id}/register 🔒

Bidder registers for an auction. This automatically deducts depositAmount from availableBalance to frozenBalance.

Request Body: Empty.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Successfully registered for auction. 5,000,000 VND has been frozen.",
  "timestamp": "2026-03-28T10:30:00"
}
```

Errors:

- 400: Insufficient available balance.

### POST /bids 🔒 (Real-time Entry Point)

Place a bid on an ACTIVE auction.

Note: This endpoint executes a Redis Lua Script for atomic validation. If successful, it broadcasts the new price via WebSocket and saves to MySQL asynchronously.

Request Body:

```json
{
  "auctionSessionId": 205,
  "bidAmount": 36000000.00
}
```

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "bidId": 5001,
    "currentPrice": 36000000.00,
    "highestBidderId": "uuid-buyer",
    "endTime": "2026-03-29T21:01:00"
  },
  "message": "Bid placed successfully",
  "timestamp": "2026-03-29T20:59:45"
}
```

(Note: endTime may change if Anti-Sniper rule extends the auction by 60s)

Errors:

- 400: Invalid price (lower than current + step), or Auction not ACTIVE.

## 10. Orders & Fulfillment (Escrow Flow)

### GET /orders 🔒

List orders. Buyers see their purchases; Sellers see items they need to ship.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 10, "pages": 1, "total": 1 },
    "result": [
      {
        "id": 801,
        "auctionSessionId": 205,
        "productTitle": "Tượng Đạt Ma Sư Tổ",
        "totalAmount": 41000000.00,
        "status": "PENDING_PAYMENT",
        "paymentDeadline": "2026-03-31T21:00:00"
      }
    ]
  },
  "message": "Fetch orders successful",
  "timestamp": "2026-03-29T21:05:00"
}
```

### POST /orders/{id}/pay 🔒

Buyer pays the remaining balance. Money is transferred from Buyer's wallet to System Escrow, and Order status changes to PREPARING.

Request Body:

```json
{
  "shippingAddressId": 1
}
```

### POST /orders/{id}/shipments 🔒

Seller updates shipping details. Order status changes to SHIPPING.

Requires Role: ROLE_SELLER

Request Body:

```json
{
  "carrierName": "Viettel Post",
  "trackingCode": "VT123456789",
  "packingVideoUrl": "https://s3.../packing-video.mp4"
}
```

### POST /orders/{id}/deliver 🔒

Webhook or Admin/Seller marks the order as delivered. Sets delivered_at to trigger the 72-hour Escrow countdown. Order status changes to DELIVERED.

## 11. Disputes (Tòa Án Sàn)

### POST /orders/{id}/disputes 🔒

Buyer opens a dispute within 72 hours of delivery. Order status changes to DISPUTED (Freezes funds permanently until Admin resolves).

Request Body:

```json
{
  "reason": "DAMAGED_IN_TRANSIT",
  "description": "Tượng bị nứt phần đế gỗ.",
  "proofImages": [
    "https://s3.../nut-de-1.jpg",
    "https://s3.../nut-de-2.jpg"
  ]
}
```

## 12. WebSocket Channels (Real-time)

Client should subscribe to STOMP WebSocket channels for real-time updates:

- Connect URL: ws://localhost:8080/ws-auction
- Subscribe Topic: /topic/auctions/{auctionSessionId}

Message Payload Example (Sent by Server when a valid bid is placed):

```json
{
  "type": "NEW_BID",
  "auctionSessionId": 205,
  "currentPrice": 36000000.00,
  "highestBidderId": "uuid-buyer",
  "highestBidderName": "Nguyễn Văn A",
  "endTime": "2026-03-29T21:01:00"
}
```
