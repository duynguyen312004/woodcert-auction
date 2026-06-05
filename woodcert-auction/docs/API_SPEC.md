# API Specification

> All endpoints return `ApiResponse<T>` wrapper. Error responses created from `AppException` include nullable `errorCode` for machine-readable handling.
> Update this file whenever endpoints change.
>
> Current implementation note (2026-06-03): auth, identity, media, catalog/appraisal, finance, auction, orders, fulfillment, disputes, admin category/appraiser operations, public certificate lookup, Flyway-seeded reference data, CSRF refresh protection, and server-time sync are implemented backend contracts.

---

## Base URL

```text
Development: http://localhost:8080/api/v1
Production:  https://api.woodcert.com/api/v1
```

## Authentication

All endpoints require JWT in `Authorization: Bearer <accessToken>` header, except those marked as Public (🔓).

Cookie-based refresh/logout uses double-submit CSRF. Browser clients should call `GET /auth/csrf` first and send the returned cookie value as `X-XSRF-TOKEN` on refresh/logout requests that rely on the `refresh_token` cookie.

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
The backend sends a one-time verification link to the submitted email address. The account becomes `ACTIVE` only after that link is opened successfully.
The verification link expires after 15 minutes.
Phone number is required at registration time.

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

- 400: Validation failed (blank name, invalid email, weak password, missing phone number)
- 409: Email or phone number already exists

### GET /auth/verify-email 🔓

Verify the inbox owner by opening the one-time link sent after registration.

Query Parameters:

```text
token=eyJ...one-time-token...
```

Success Response (200):

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Email verified successfully",
  "timestamp": "2026-03-28T10:05:00"
}
```

Errors:

- 400: Missing, invalid, or expired token
- 409: Email already verified

### POST /auth/resend-verification 🔓

Resend the verification link if the account exists and is still `UNVERIFIED`.

Request Body:

```json
{
  "email": "user@example.com"
}
```

Success Response (200):

```json
{
  "statusCode": 200,
  "data": null,
  "message": "If the account exists and is unverified, a new verification email has been sent.",
  "timestamp": "2026-03-28T10:07:00"
}
```

Errors:

- 400: Validation failed
- 429: Please wait before requesting another verification email

### POST /auth/forgot-password 🔓

Request a password reset link. The backend always returns the same 200 response to avoid email enumeration. If the account exists and is eligible, a hashed one-time token is stored and the raw token is sent only through email.

Request Body:

```json
{
  "email": "user@example.com"
}
```

Success Response (200):

```json
{
  "statusCode": 200,
  "data": null,
  "message": "If the account exists, a password reset link has been sent to the registered email.",
  "timestamp": "2026-03-28T10:10:00"
}
```

Notes:

- Request cooldown is enforced per account, while the public response remains the same.
- Raw reset tokens and reset links must not be logged.

Errors:

- 400: Validation failed

### POST /auth/reset-password 🔓

Complete password reset using the one-time token from email. Successful reset marks the token as used, updates the BCrypt password hash, and revokes active refresh tokens for the account.

Request Body:

```json
{
  "token": "raw-token-from-email",
  "newPassword": "newPassword123"
}
```

Success Response (200):

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Password reset successfully. Please log in.",
  "timestamp": "2026-03-28T10:12:00"
}
```

Errors:

- 400: Missing token, weak password, invalid token, used token, or expired token. Error responses include `errorCode` when raised by `AppException`.

### GET /auth/csrf 🔓

Issue a CSRF token for browser refresh/logout flows.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "token": "base64url-random-token"
  },
  "message": "CSRF token issued",
  "timestamp": "2026-06-03T10:00:00Z"
}
```

Also sets:

```http
Set-Cookie: XSRF-TOKEN=base64url-random-token; SameSite=Lax; Path=/api/v1/auth; Max-Age=604800
```

### POST /auth/refresh 🔓

Get a new access token using the refresh token.

Sources (backend checks in order):

- Request body refreshToken (mobile/non-browser explicit fallback)
- Cookie refresh_token (Web/SPA; requires matching `X-XSRF-TOKEN`)

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

(Also sets a new `refresh_token` cookie with `HttpOnly`, configured `Secure`, `SameSite=Lax`, `Path=/api/v1/auth`, and `Max-Age=604800` by default.)

Errors:

- 401: No refresh token provided, expired, or revoked
- 403: Missing or mismatched CSRF token when using cookie refresh

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

Cookie-based logout requires matching `X-XSRF-TOKEN`; body refresh-token logout does not.

## 1.1 System

### GET /system/time 🔓

Returns server time for browser clock-offset sync.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "serverTime": "2026-06-03T10:00:00Z",
    "epochMillis": 1780484400000
  },
  "message": "Fetch server time successful",
  "timestamp": "2026-06-03T10:00:00Z"
}
```

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
    "createdAt": "2026-03-28T10:00:00Z",
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
    "createdAt": "2026-03-28T10:00:00Z",
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
    "createdAt": "2026-03-28T10:00:00Z",
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
    "reputationScore": 5.0,
    "createdAt": "2026-03-30T10:00:00Z",
    "updatedAt": "2026-03-30T10:00:00Z"
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
    "reputationScore": 5.0,
    "createdAt": "2026-03-28T10:00:00Z",
    "updatedAt": "2026-03-28T10:00:00Z"
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
      "name": "Tượng & Điêu Khắc Gỗ",
      "slug": "tuong-dieu-khac-go",
      "parentId": null,
      "description": "Tượng gỗ, phù điêu độc bản và tác phẩm điêu khắc thủ công"
    },
    {
      "id": 2,
      "name": "Tranh & Phù Điêu Gỗ",
      "slug": "tranh-phu-dieu-go",
      "parentId": null,
      "description": "Tranh gỗ, phù điêu treo tường và tác phẩm trang trí không gian"
    }
  ],
  "message": "Fetch categories successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

## 7. Catalog Products & Appraisal Workflow

Catalog is now an internal workflow module for seller and appraiser. It is no longer the public-facing marketplace read API. Buyer/public listing-detail will later be served by the auction module.

### GET /products 🔒

List catalog products visible to the current authenticated user.

Access rules:
- Seller: sees their own products in all statuses
- Appraiser: sees all `PENDING_APPRAISAL`, expired `UNDER_APPRAISAL` claims, their own active `UNDER_APPRAISAL` claims, plus `APPRAISED` / `REJECTED` products that were appraised by that same appraiser
- Public: not allowed

Query Parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| size | int | 10 | Items per page |
| categoryId | int | null | Filter by category |
| status | string | null | Filter by visible status |

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 10, "pages": 2, "total": 11 },
    "result": [
      {
        "id": 1001,
        "title": "Tượng Đạt Ma Sư Tổ Gỗ Sưa Đỏ",
        "category": { "id": 1, "name": "Tượng & Điêu Khắc Gỗ" },
        "status": "PENDING_APPRAISAL",
        "primaryImage": "https://res.cloudinary.com/.../products/1001-main.jpg",
        "createdAt": "2026-04-18T08:00:00"
      }
    ]
  },
  "message": "Fetch products successful",
  "timestamp": "2026-04-18T10:00:00"
}
```

### GET /products/{id} 🔒

Get internal catalog product detail, including images and appraisal report.

Access rules:
- Owner: can view any status
- Appraiser: can view `PENDING_APPRAISAL`, visible `UNDER_APPRAISAL` claims, plus `APPRAISED` / `REJECTED` only if `appraisalReport.appraiserId == currentUserId`
- Other cases: `PRODUCT_NOT_FOUND`

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
    "description": "Mô tả chi tiết...",
    "material": "Gỗ Sưa",
    "dimensions": "120x40x35 cm",
    "weight": 45.5,
    "status": "APPRAISED",
    "category": {
      "id": 1,
      "name": "Tượng & Điêu Khắc Gỗ",
      "slug": "tuong-dieu-khac-go",
      "parentId": null,
      "description": "Các loại tượng gỗ Đạt Ma, Di Lặc..."
    },
    "images": [
      { "imageUrl": "https://res.cloudinary.com/.../products/1001-main.jpg", "isPrimary": true, "sortOrder": 0 },
      { "imageUrl": "https://res.cloudinary.com/.../products/1001-side.jpg", "isPrimary": false, "sortOrder": 1 }
    ],
    "appraisalReport": {
      "certificateCode": "CERT-2026-001",
      "verifiedMaterial": "Gỗ Sưa Đỏ",
      "origin": "Việt Nam",
      "ageEstimation": "Khoảng 40 năm",
      "conditionGrade": "EXCELLENT",
      "estimatedValue": 50000000.00,
      "isAuthentic": true,
      "appraiserNotes": "Bề mặt và vân gỗ đồng nhất.",
      "sellerAccuracy": 5.0,
      "digitalSignature": "abc123xyz...",
      "appraisedAt": "2026-04-18T11:00:00",
      "proofImages": [
        {
          "id": 701,
          "mediaId": 301,
          "description": "Chụp cận cảnh vân gỗ",
          "imageUrl": "https://res.cloudinary.com/.../appraisals/proof.jpg"
        }
      ]
    },
    "createdAt": "2026-04-18T08:00:00"
  },
  "message": "Fetch product successful",
  "timestamp": "2026-04-18T10:00:00"
}
```

Internal appraisal fields (`appraiserNotes`, `sellerAccuracy`, `proofImages`) are populated only for the appraiser who submitted the report. Seller-facing product detail keeps `sellerAccuracy` hidden.

### POST /products 🔒

Create a new product. Initial status is `DRAFT`.

Request Body:

```json
{
  "categoryId": 1,
  "title": "Tượng Di Lặc Gỗ Hương",
  "description": "Chi tiết đục tay tinh xảo...",
  "material": "Gỗ Hương Đá",
  "dimensions": "60x40x30 cm",
  "weight": 15.0,
  "images": [
    { "mediaId": 201, "isPrimary": true, "sortOrder": 0 },
    { "mediaId": 202, "isPrimary": false, "sortOrder": 1 }
  ]
}
```

Notes:
- Images reference confirmed `mediaId` values, not raw URLs
- Client must upload and confirm product images first through `/products/images/*`

### PUT /products/{id} 🔒

Update an existing `DRAFT` product.

Request Body:

```json
{
  "categoryId": 1,
  "title": "Tượng Di Lặc Gỗ Hương Updated",
  "description": "Chi tiết đục tay tinh xảo...",
  "material": "Gỗ Hương Đá",
  "dimensions": "60x40x30 cm",
  "weight": 15.0,
  "images": [
    { "mediaId": 201, "isPrimary": true, "sortOrder": 0 },
    { "mediaId": 202, "isPrimary": false, "sortOrder": 1 }
  ]
}
```

Notes:
- Only `DRAFT` products can be updated
- Image replacement is full-replacement
- Removed images are marked `PENDING_DELETE`

### DELETE /products/{id} 🔒

Delete an existing `DRAFT` product.

Notes:
- Only `DRAFT` products can be deleted
- All attached product images are marked `PENDING_DELETE`

### POST /products/{id}/submit-appraisal 🔒

Seller submits a `DRAFT` product for appraisal. Status changes to `PENDING_APPRAISAL`.

Request Body: empty.

### POST /products/images/upload-intent 🔒

Create a signed Cloudinary upload intent for a product image.

### PUT /products/images/confirm 🔒

Confirm a product image upload after direct Cloudinary upload.

Request Body:

```json
{
  "mediaId": 201,
  "assetId": "3a1fbda4eb0aa195ce151c93899a827f"
}
```

### POST /products/{id}/appraisal-claim 🔒

Appraiser claims a visible pending or expired-claim product before submitting an appraisal report. Product status becomes `UNDER_APPRAISAL`, and the claim expires after `catalog.appraisal.claim-timeout` (default `PT24H`).

Request Body: empty.

### DELETE /products/{id}/appraisal-claim 🔒

Appraiser releases their own active appraisal claim. Product status returns to `PENDING_APPRAISAL`.

Request Body: empty.

### POST /products/{id}/appraise 🔒

Appraiser submits the official appraisal report. Product becomes `APPRAISED` or `REJECTED`.

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
  "sellerAccuracy": 4.5,
  "proofImages": [
    { "mediaId": 301, "description": "Chụp cận cảnh vân gỗ" }
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
  "timestamp": "2026-04-18T11:00:00"
}
```

Notes:
- `AppraisalReport` is immutable once submitted
- If `isAuthentic = false`, product status becomes `REJECTED`
- `appraiserNotes` is required when rejecting
- `sellerAccuracy` is required, uses dot decimal notation such as `4.5`, and is included in the seller reputation average
- Seller `reputationScore` is recalculated from all appraisal `sellerAccuracy` values and rounded to 1 decimal place
- `digitalSignature` is generated internally by the backend
- `digitalSignature` hashes the final `certificateCode` and fixed `appraisedAt`
- Appraisers can fetch their queue, active claims, and reviewed workflow through `GET /products`

### POST /appraisals/images/upload-intent 🔒

Create a signed Cloudinary upload intent for an appraisal proof image.

### PUT /appraisals/images/confirm 🔒

Confirm an appraisal proof image upload after direct Cloudinary upload.

Request Body:

```json
{
  "mediaId": 301,
  "assetId": "9b2fbda4eb0aa195ce151c93899a1234"
}
```

## 8. Wallets & Transactions (Finance)

### GET /wallets/me 🔒

Get the current user's wallet balance (Available and Frozen).
If the wallet does not exist yet, the backend lazily creates a zero-balance wallet on first access.

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
If the wallet does not exist yet, the backend lazily creates it and returns an empty result.
`amount` is a signed delta against the wallet's available balance:
- `DEPOSIT` positive
- `FREEZE` negative
- `UNFREEZE` positive
- `PAYMENT` negative

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
        "referenceId": 801,
        "referenceType": "VNPAY_DEPOSIT",
        "status": "SUCCESS",
        "createdAt": "2026-03-27T15:00:00"
      }
    ]
  },
  "message": "Fetch transactions successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### POST /wallets/me/deposit 🔒

Create a VNPay deposit request and return the payment URL.

Request Body:

```json
{
  "amount": 5000000.00
}
```

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "txnRef": "DEP20260528104530123456"
  },
  "message": "Payment URL created",
  "timestamp": "2026-04-19T10:00:00"
}
```

### GET /wallets/me/deposits 🔒

List VNPay deposit requests for the current user.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 10, "pages": 1, "total": 1 },
    "result": [
      {
        "id": 801,
        "txnRef": "DEP20260528104530123456",
        "amount": 5000000.00,
        "status": "SUCCESS",
        "vnpBankCode": "NCB",
        "createdAt": "2026-05-28T10:45:30Z",
        "paidAt": "2026-05-28T10:46:12Z"
      }
    ]
  },
  "message": "Fetch deposits successful",
  "timestamp": "2026-05-28T10:47:00"
}
```

### GET /wallets/me/deposits/{txnRef} 🔒

Get one VNPay deposit status for the current user.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "id": 801,
    "txnRef": "DEP20260528104530123456",
    "amount": 5000000.00,
    "status": "SUCCESS",
    "vnpBankCode": "NCB",
    "createdAt": "2026-05-28T10:45:30Z",
    "paidAt": "2026-05-28T10:46:12Z"
  },
  "message": "Fetch deposit status successful",
  "timestamp": "2026-05-28T10:47:00"
}
```

### GET /wallets/vnpay/return 🔓

VNPay browser redirect callback. The backend verifies checksum and redirects to `vnpay.fe-return-url` with `txnRef` and current deposit status. Balance mutation is handled by IPN in production. For local development only, `vnpay.confirm-on-return-enabled=true` allows this callback to confirm the deposit when `vnpay.return-url` is localhost and IPN is unavailable.

### GET /wallets/vnpay/ipn 🔓

VNPay server-to-server callback. The backend verifies checksum, merchant code, amount, and transaction status, then updates the deposit and wallet in one transaction.

Success Response (200):

```json
{
  "RspCode": "00",
  "Message": "Confirm Success"
}
```

Notes:
- Internal wallet mutations currently log only `status = SUCCESS`
- Wallet core normalizes mutation amounts to scale `2` before validation, idempotency checks, and persistence
- Internal idempotency uses `operationKey`; a failed wallet operation is terminal and must be retried with a new key
- Stale pending wallet operations fail closed after `finance.wallet.operation.pending-timeout` (default `PT5M`)

## 9. Auction Sessions

### GET /auctions 🔓

List public auction sessions. Default statuses are `WAITING` and `ACTIVE`.

Query Parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 1 | Page number |
| size | int | 10 | Items per page |
| status | string | WAITING,ACTIVE | Accepts `WAITING`, `ACTIVE`, `ENDED_SUCCESS`, or a comma-separated combination |
| material | string | null | Case-insensitive material filter against the persisted product/appraisal data |
| categoryName | string | null | Exact category-name filter; unknown category returns an empty page |
| priceMin | decimal | null | Minimum persisted `current_price` snapshot |
| priceMax | decimal | null | Maximum persisted `current_price` snapshot |

For `ACTIVE` sessions, `currentPrice` and `endTime` are overlaid from Redis runtime state when available; MySQL snapshot values are used as fallback when Redis fields are missing. `priceMin` and `priceMax` filter the persisted DB snapshot before Redis overlay, so live Redis price can differ from the filter boundary.

Errors:

- 400: Invalid `status`, or `priceMin > priceMax` (`errorCode = INVALID_REQUEST`)

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
          "primaryImage": "https://res.cloudinary.com/.../products/1001-main.jpg",
          "material": "Gỗ Sưa Đỏ",
          "categoryName": "Tượng & Điêu Khắc Gỗ",
          "conditionGrade": "EXCELLENT",
          "certificateCode": "CERT-2026-001",
          "isAuthentic": true,
          "sellerAccuracy": 5.0
        },
        "startingPrice": 30000000.00,
        "currentPrice": 35000000.00,
        "depositAmount": 5000000.00,
        "startTime": "2026-03-29T20:00:00",
        "endTime": "2026-03-29T21:00:00",
        "status": "WAITING",
        "totalParticipants": 0,
        "seller": {
          "name": "Xưởng Gỗ ABC",
          "reputationScore": 4.9
        }
      }
    ]
  },
  "message": "Fetch auctions successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### GET /auctions/{id} 🔓

Get public auction detail. `reservePrice` is intentionally hidden from the response.
Public detail is available only for `WAITING`, `ACTIVE`, and `ENDED_SUCCESS` sessions. `CANCELED` and `ENDED_FAILED` return not found.
For `ACTIVE` sessions, `currentPrice` and `endTime` are read from Redis when available, with DB snapshot fallback.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "id": 205,
    "status": "WAITING",
    "startingPrice": 30000000.00,
    "currentPrice": 30000000.00,
    "stepPrice": 1000000.00,
    "depositAmount": 5000000.00,
    "startTime": "2026-03-29T20:00:00",
    "endTime": "2026-03-29T21:00:00",
    "product": {
      "id": 1001,
      "title": "Tượng Đạt Ma Sư Tổ Gỗ Sưa Đỏ",
      "description": "Mô tả chi tiết...",
      "material": "Gỗ Sưa Đỏ",
      "dimensions": "120x40x35 cm",
      "weight": 45.5,
      "primaryImage": "https://res.cloudinary.com/.../products/1001-main.jpg",
      "images": [
        "https://res.cloudinary.com/.../products/1001-main.jpg",
        "https://res.cloudinary.com/.../products/1001-side.jpg"
      ],
      "appraisal": {
        "certificateCode": "CERT-2026-001",
        "verifiedMaterial": "Gỗ Sưa Đỏ",
        "origin": "Việt Nam",
        "ageEstimation": "Khoảng 40 năm",
        "conditionGrade": "EXCELLENT",
        "estimatedValue": 50000000.00,
        "isAuthentic": true
      }
    },
    "seller": {
      "storeName": "Xưởng Gỗ ABC",
      "reputationScore": 4.9
    }
  },
  "message": "Fetch auction successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### POST /auctions 🔒

Seller creates a new auction session for an `APPRAISED` product.

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

Rules:
- Product must be owned by the seller and already `APPRAISED`
- A product may have multiple auction sessions over time, but never more than one open `WAITING` / `ACTIVE` session
- Creation locks the product row before ownership/appraisal/conflict checks to prevent duplicate open sessions under concurrent requests
- `reservePrice >= startingPrice`
- `stepPrice >= 100000`
- `depositAmount >= 1000000` and `depositAmount <= 50% startingPrice`
- `startTime >= now + 5 minutes`
- `endTime - startTime` must be between 1 hour and 30 days

### GET /auctions/me 🔒

Seller list of owned auction sessions.
For `ACTIVE` sessions, `currentPrice` and `endTime` are overlaid from Redis runtime state when available.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 10, "pages": 1, "total": 1 },
    "result": [
      {
        "id": 205,
        "productTitle": "Tượng Đạt Ma Sư Tổ Gỗ Sưa Đỏ",
        "productId": 1001,
        "status": "WAITING",
        "startingPrice": 30000000.00,
        "depositAmount": 5000000.00,
        "startTime": "2026-03-29T20:00:00",
        "endTime": "2026-03-29T21:00:00",
        "currentPrice": 30000000.00,
        "participantCount": 0,
        "createdAt": "2026-03-28T10:00:00"
      }
    ]
  },
  "message": "Fetch seller auctions successful",
  "timestamp": "2026-03-28T10:00:00"
}
```

### GET /auctions/me/{id} 🔒

Seller detail for one owned auction session. This endpoint exposes seller-only fields such as `reservePrice`, winner alias, and deposit settlement summary. Buyers must use `GET /auctions/{id}`.

For `ACTIVE` sessions, `currentPrice` and `endTime` are overlaid from Redis runtime state when available.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "id": 205,
    "status": "ENDED_SUCCESS",
    "startingPrice": 30000000.00,
    "reservePrice": 45000000.00,
    "stepPrice": 1000000.00,
    "depositAmount": 5000000.00,
    "currentPrice": 50000000.00,
    "finalPrice": 50000000.00,
    "startTime": "2026-03-29T20:00:00",
    "endTime": "2026-03-29T21:00:00",
    "participantCount": 3,
    "winnerMaskedAlias": "3fa8****",
    "settlementStatus": "SETTLED",
    "settlement": { "frozen": 0, "refunded": 2, "deducted": 1, "confiscated": 0 },
    "product": { "id": 1001, "title": "Tượng Đạt Ma Sư Tổ Gỗ Sưa Đỏ" },
    "createdAt": "2026-03-28T10:00:00",
    "updatedAt": "2026-03-29T21:00:05"
  },
  "message": "Fetch seller auction detail successful",
  "timestamp": "2026-03-29T21:00:05"
}
```

Errors:

- 403: current seller does not own the auction session
- 404: auction session not found

### PATCH /auctions/{id}/cancel 🔒

Seller cancels an auction session before it starts. This is a status transition (`WAITING -> CANCELED`), not a hard delete.
Cancellation locks the session with its product and is allowed only while status is `WAITING`.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": null,
  "message": "Auction session canceled successfully",
  "timestamp": "2026-03-28T10:15:00"
}
```

### POST /auctions/{id}/register 🔒

Bidder registers for an auction. This freezes `depositAmount` from `availableBalance` into `frozenBalance`.
Registration is allowed while the session is `WAITING`, or while it is `ACTIVE` and Redis runtime state still exists with `now < endTimeEpochMs`.
For `ACTIVE` late joins, the user is inserted into the Redis bidder set after the deposit is frozen and the participant row is persisted.

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

- 400: insufficient available balance, already registered, session not registrable, or active Redis state no longer valid.
- 403: seller cannot register for their own auction.

### POST /bids 🔒 (Real-time Entry Point)

Place a bid on an ACTIVE auction.

Note: This endpoint executes a Redis Lua Script for atomic validation. If successful, it broadcasts the new price via WebSocket and saves to MySQL asynchronously.

Request Body:

```json
{
  "sourceId": 205,
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

## 10. Orders & Fulfillment

Post-auction order flow is implemented as a canonical order pipeline. Auction settlement creates an order with `sourceType = AUCTION` and `sourceId = auctionSessionId`.

### GET /orders/my-purchases 🔒

List orders where the current user is buyer.

Query Parameters:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | null | Optional `OrderStatus` filter |
| page | int | 1 | Page number |
| size | int | 10 | Page size |

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "meta": { "page": 1, "pageSize": 10, "pages": 1, "total": 1 },
    "result": [
      {
        "id": 801,
        "sourceId": 205,
        "sourceType": "AUCTION",
        "finalPrice": 41000000.00,
        "depositAmount": 4100000.00,
        "remainingAmount": 36900000.00,
        "status": "PENDING_PAYMENT",
        "paymentDeadline": "2026-03-31T21:00:00"
      }
    ]
  },
  "message": "Fetch orders successful",
  "timestamp": "2026-03-29T21:05:00"
}
```

### GET /orders/my-sales 🔒

List orders where the current user is seller.

Supports the same `status`, `page`, and `size` query parameters as buyer purchases.

### GET /orders/my-purchases/status-counts 🔒

Returns buyer order counts grouped by every `OrderStatus`, including zero-count statuses.

Success Response (200):

```json
{
  "statusCode": 200,
  "data": {
    "total": 3,
    "byStatus": {
      "PENDING_PAYMENT": 1,
      "PAID": 1,
      "FULFILLING": 0,
      "COMPLETED": 0,
      "CANCELED": 0,
      "DISPUTED": 1
    }
  },
  "message": "Fetch buyer order status counts successful",
  "timestamp": "2026-06-03T10:00:00Z"
}
```

### GET /orders/my-sales/status-counts 🔒

Returns seller order counts grouped by every `OrderStatus`, including zero-count statuses.

### GET /orders/{id} 🔒

Fetch one order if the current user is the buyer or seller.

### POST /orders/{id}/pay 🔒

Buyer pays exactly `remainingAmount` from wallet. No buyer premium is applied in this phase. Order status changes to `PAID` and fulfillment becomes `PENDING_SHIPMENT`.

### PATCH /orders/{orderId}/fulfillment/ship 🔒

Seller updates shipping details. Fulfillment status changes to `SHIPPED` and order status changes to `FULFILLING`.

Requires Role: ROLE_SELLER

Request Body:

```json
{
  "trackingCode": "VT123456789"
}
```

### PATCH /orders/{orderId}/fulfillment/receive 🔒

Buyer confirms receipt. Fulfillment status changes to `DELIVERED`, order status changes to `COMPLETED`, seller receives `finalPrice - commission`, and platform records `SALE_COMMISSION`.

Scheduler behavior:

- `PENDING_PAYMENT` past deadline: order `CANCELED`, auction participant deposit `CONFISCATED`, product returns `AVAILABLE`, platform keeps 10% of deposit, seller receives 90%.
- `SHIPPED` past auto-complete deadline: fulfillment `AUTO_COMPLETED`, order `COMPLETED`, seller payout released.
- `DISPUTED` orders are skipped by fulfillment auto-complete until the dispute is canceled/rejected/resolved.

## 11. Disputes

Dispute v1 supports buyer-opened evidence cases only. Resolution is full outcome only: `SELLER_WINS` or `BUYER_WINS`; partial refund is not supported.

Open rules:

- Current user must be the buyer.
- Order status must be `FULFILLING`.
- Fulfillment status must be `SHIPPED`.
- Order must not already have an active `OPEN` or `UNDER_REVIEW` dispute.

### POST /disputes/evidence/upload-intent 🔒

Creates a signed Cloudinary upload intent for dispute evidence image media.

### PUT /disputes/evidence/confirm 🔒

Confirms a dispute evidence upload by `mediaId` and Cloudinary `assetId`.

### POST /orders/{orderId}/disputes 🔒

Buyer opens a dispute and locks the order as `DISPUTED`.

Request Body:

```json
{
  "reason": "Product does not match appraisal",
  "description": "The delivered item has visible damage not shown in the listing.",
  "evidenceMediaIds": [101, 102]
}
```

### GET /orders/{orderId}/disputes/current 🔒

Returns the current active dispute for the order, or `null`.

### GET /orders/{orderId}/disputes 🔒

Returns full dispute history for an order. Only the buyer or seller of the order may read it.

### PATCH /orders/{orderId}/disputes/{disputeId}/cancel 🔒

Buyer cancels an active dispute. Order returns to `FULFILLING` so auto-complete can continue.

### GET /admin/disputes 🔒

Admin lists disputes. Optional query: `status`, `page`, `size`.

### GET /admin/disputes/{id} 🔒

Admin fetches one dispute detail including evidence.

### PATCH /admin/disputes/{id}/review 🔒

Admin marks `OPEN` dispute as `UNDER_REVIEW`.

### PATCH /admin/disputes/{id}/resolve 🔒

Request Body:

```json
{
  "outcome": "BUYER_WINS",
  "resolutionNote": "Refund buyer because evidence confirms wrong item."
}
```

Outcomes:

- `SELLER_WINS`: order `COMPLETED`, fulfillment `AUTO_COMPLETED`, seller payout released, platform commission recorded.
- `BUYER_WINS`: buyer refunded `order.finalPrice` through wallet reference type `ORDER`, order `CANCELED`, fulfillment `CANCELED`, product sale status `RETURNED`.

## 12. Admin Operations and Public Verification

Admin portal access uses `ROLE_ADMIN` or `ADMIN_ACCESS`. Specific backend endpoints use semantic permissions such as `MANAGE_CATEGORIES`, `MANAGE_APPRAISERS`, `VIEW_PLATFORM_REVENUE`, `RESOLVE_DISPUTE`, and `BAN_USER`. `BAN_USER` guards the user management endpoints (`/admin/users`) including account ban/unban.

### /admin/categories 🔒

Admin CRUD endpoints:

- `GET /admin/categories`
- `POST /admin/categories`
- `PUT /admin/categories/{id}`
- `DELETE /admin/categories/{id}`

Rules: name/slug must be unique, parent must exist, and a category with children or products cannot be deleted.

Public category read remains `GET /categories`.

### /admin/users 🔒

Permission: `BAN_USER`. User management endpoints:

- `GET /admin/users?role=&status=&query=&page=1&size=20` — filter by role (`ROLE_BIDDER`, `ROLE_SELLER`, `ROLE_APPRAISER`, `ROLE_ADMIN`), status (`ACTIVE`, `BANNED`, `UNVERIFIED`), and email/name keyword. Returns `PaginationResponse<AdminUserRes>`.
- `PATCH /admin/users/{userId}/ban` — `ACTIVE` → `BANNED`. Blocked when banning yourself (`CANNOT_BAN_SELF`) or an admin account (`CANNOT_BAN_ADMIN`); only `ACTIVE` users can be banned.
- `PATCH /admin/users/{userId}/unban` — `BANNED` → `ACTIVE`. Only `BANNED` users can be unbanned.

This is the single source for listing users; appraiser and other admin pages list via `GET /admin/users` with a `role` filter.

### /admin/appraisers 🔒

Permission: `MANAGE_APPRAISERS`. Admin appraiser provisioning endpoints:

- `POST /admin/appraisers` — create a new appraiser account (email, password, fullName, phoneNumber).
- `PATCH /admin/appraisers/{userId}/demote` — revoke the `ROLE_APPRAISER` role.

Rules: demote is blocked while the user has an unexpired open appraisal claim. Listing appraisers uses `GET /admin/users?role=ROLE_APPRAISER` (the previous `GET /admin/appraisers` was removed).

### GET /certificates/{certificateCode} 🔓

Public certificate lookup. Response intentionally excludes internal appraiser notes and proof media.

## 13. WebSocket Channels (Real-time)

Client should subscribe to STOMP WebSocket channels for real-time updates:

- Connect URL: ws://localhost:8080/ws-auction
- Subscribe Topic: /topic/auctions/{sourceId}

Message Payload Example (Sent by Server when a valid bid is placed):

```json
{
  "type": "NEW_BID",
  "sourceId": 205,
  "currentPrice": 36000000.00,
  "highestBidderId": "uuid-buyer",
  "highestBidderName": "Nguyễn Văn A",
  "endTime": "2026-03-29T21:01:00"
}
```
