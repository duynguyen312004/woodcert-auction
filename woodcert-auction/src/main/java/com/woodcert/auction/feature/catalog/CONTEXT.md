# Catalog - Bối Cảnh Triển Khai
> Viết ngày: 2026-04-12 | Cập nhật: 2026-05-14 | Tác giả: AI Assistant + Duy Nguyen

## Bối Cảnh Nghiệp Vụ
`catalog` là module quản lý sản phẩm và quy trình kiểm định của WoodCert Auction. Module này phụ trách vòng đời sản phẩm từ khi seller tạo bản nháp, gửi thẩm định, cho đến khi appraiser xác nhận hoặc từ chối. Sản phẩm chỉ có thể được đấu giá khi đã qua kiểm định thành công (status = APPRAISED).

## Luật Nghiệp Vụ Đã Chốt
1. **Catalog product list/detail là internal APIs** — actor chính là seller và appraiser, không còn public-facing.
2. **Buyer/public listing-detail sẽ thuộc auction module** — `catalog` không còn chịu trách nhiệm public product browsing.
3. **APPRAISED = đầu vào auction** — chỉ APPRAISED product mới được phép tham gia auction.
4. **Product không được sửa sau APPRAISED** — sau khi kiểm định thành công, product trở thành bất biến.
5. **REJECTED = kết thúc** — không có rule 3 ngày, không được sửa, không được resubmit. Seller phải tạo product mới.
6. **AppraisalReport là immutable** — sau khi submit, report không được update hay delete. Đây là quyết định nghiệp vụ có chủ đích.
7. **Reject bắt buộc có lý do** — nếu `isAuthentic = false` thì `appraiserNotes` là required.
8. **Seller accuracy là bắt buộc** — appraiser phải nhập `sellerAccuracy` theo thang 1-5, dùng số thập phân dạng `4.5`; sau khi submit, catalog tính AVG toàn bộ điểm này của seller và yêu cầu identity cập nhật `reputationScore`.

## Các Quyết Định Kỹ Thuật
- **Product images và Appraisal images dùng `media_id FK → media_assets(id)`** thay vì lưu `image_url` trực tiếp.
- **Upload flow giống avatar**: Tạo upload intent → Client upload lên Cloudinary → Confirm → Tạo product/appraisal với mediaId references.
- **Category không extend BaseEntity** (không có audit columns).
- **Product extend BaseEntity** (có `created_at`, `updated_at`).
- **AppraisalReport không extend BaseEntity** (chỉ có `appraised_at`, không có `updated_at`).
- **Slug tạo tự động** từ tên category bằng Unicode-safe normalization.
- **Certificate code: `CERT-{year}-{id}`** — sử dụng auto-increment ID của AppraisalReport sau khi save (2-step save).
- **Digital signature là SHA-256 hash** của payload gồm productId, appraiserId, verifiedMaterial, estimatedValue, isAuthentic, certificateCode chính thức, appraisedAt.
- **`@CurrentUserId`** được dùng cho các product read APIs nội bộ để buộc authenticated user context.
- **User-centric media storage**: ảnh lưu tại `{baseFolder}/users/{userId}/products` và `{baseFolder}/users/{userId}/appraisals`.
- **Auction read enrichment**: buyer/public auction list/detail vẫn do `auction` module sở hữu, nhưng có thể đọc catalog category, appraisal report, và product image data để dựng read model.
- **Buyer material truth**: auction/public responses nên ưu tiên `AppraisalReport.verifiedMaterial`; chỉ fallback về `Product.material` khi chưa có dữ liệu kiểm định.
- **Image URL contract**: `ProductImageHelper` tiếp tục là helper chuẩn cho primary image và all image URLs khi module khác cần hiển thị sản phẩm.

## API Endpoints

### Product APIs
| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| GET | `/api/v1/products` | Authenticated | Danh sách catalog products theo workflow access của seller/appraiser |
| GET | `/api/v1/products/{id}` | Authenticated* | Chi tiết catalog product nội bộ (owner/appraiser theo rule) |
| POST | `/api/v1/products` | CREATE_PRODUCT | Tạo DRAFT product |
| PUT | `/api/v1/products/{id}` | CREATE_PRODUCT | Update DRAFT product (full image replacement) |
| DELETE | `/api/v1/products/{id}` | CREATE_PRODUCT | Xóa DRAFT product |
| POST | `/api/v1/products/{id}/submit-appraisal` | SUBMIT_APPRAISAL_REQUEST | Submit kiểm định |

\* Access control cho GET product detail:
- owner → xem được mọi status
- appraiser → xem được `PENDING_APPRAISAL`, claim `UNDER_APPRAISAL` còn hiệu lực của chính họ, claim hết hạn, và `APPRAISED`/`REJECTED` nếu chính họ đã submit appraisal report
- các trường hợp khác → `PRODUCT_NOT_FOUND`

### Product Media APIs
| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/api/v1/products/images/upload-intent` | CREATE_PRODUCT | Tạo upload intent |
| PUT | `/api/v1/products/images/confirm` | CREATE_PRODUCT | Xác nhận upload |

### Appraisal APIs
| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/api/v1/products/{id}/appraisal-claim` | APPROVE_PRODUCT | Nhận claim sản phẩm trước khi kiểm định |
| DELETE | `/api/v1/products/{id}/appraisal-claim` | APPROVE_PRODUCT | Trả claim về hàng chờ |
| POST | `/api/v1/products/{id}/appraise` | APPROVE_PRODUCT | Submit báo cáo kiểm định |

Appraiser lấy work queue, active claims và reviewed qua `GET /api/v1/products`, không còn endpoint `GET /api/v1/appraisals/pending`.
Claim timeout được cấu hình bằng `catalog.appraisal.claim-timeout` (default `PT24H`).

### Appraisal Media APIs
| Method | Path | Auth | Mô tả |
|--------|------|------|--------|
| POST | `/api/v1/appraisals/images/upload-intent` | APPROVE_PRODUCT | Tạo upload intent |
| PUT | `/api/v1/appraisals/images/confirm` | APPROVE_PRODUCT | Xác nhận upload |

## Validation Rules

### Product Images
- Tối thiểu 1, tối đa 10 ảnh
- Đúng 1 ảnh `isPrimary = true`
- Không duplicate mediaId
- Không duplicate sortOrder
- Media asset phải: ACTIVE, thuộc đúng owner, có usageType = PRODUCT_IMAGE

### Appraisal Proof Images
- Không duplicate mediaId
- Media asset phải: ACTIVE, thuộc đúng appraiser, có usageType = APPRAISAL_IMAGE
- Appraiser đã submit report được xem lại `appraiserNotes`, `sellerAccuracy` và `proofImages`; seller không thấy `sellerAccuracy`.

### Appraisal Rejection
- `isAuthentic = false` → `appraiserNotes` bắt buộc (không null, không blank)

### Seller Reputation
- `sellerAccuracy` bắt buộc khi submit appraisal.
- `seller_profiles.reputation_score` được tính lại bằng trung bình toàn bộ `sellerAccuracy` của seller, bao gồm cả sản phẩm `APPRAISED` và `REJECTED`.
- Điểm uy tín được làm tròn 1 chữ số thập phân trước khi ghi profile.

## Controller Structure
```
feature/catalog/controller/
├── CategoryController.java         # GET /categories
├── ProductController.java          # Product CRUD + lifecycle
├── AppraisalController.java        # Appraisal operations
├── ProductMediaController.java     # Product image upload
└── AppraisalMediaController.java   # Appraisal image upload
```

## Các Phương Án Đã Loại Bỏ
- **`count() + 1` cho certificate code**: Race condition khi concurrent submit. Đã thay bằng 2-step save dùng auto-increment ID.
- **Lưu `image_url VARCHAR(500)` trực tiếp trong bảng ảnh**: Đã loại bỏ, toàn bộ flow ảnh đã chuyển sang `media_id`.
- **Upload ảnh qua backend (multipart)**: Giữ direct Cloudinary upload.
- **`mediaId` trong confirm path**: Bỏ path variable vì logic chỉ dùng request body.

## Giới Hạn Hiện Tại
- Category hierarchy chỉ hỗ trợ 1 cấp. API trả flat list.
- Chưa có admin CRUD cho categories.
- Chưa có handoff chính thức từ `APPRAISED product` sang `auction session`; boundary mới chỉ được chốt ở mức nghiệp vụ.

## Unit Test Coverage
- `ProductServiceImplTest`: cover create/update/delete/submit/list/detail access control và validation chính.
- `ProductImageHelperTest`: cover primary-image fallback và batch thumbnail loading.
- `AppraisalServiceImplTest`: cover approve/reject, duplicate mediaId, wrong usageType, immutable report flow.

## Nhật Ký
### 2026-05-14 | Auction Read Boundary Support
- Giữ catalog là module nguồn cho product/category/appraisal/image data, nhưng mapping buyer/public auction response nằm ở `feature/auction`.
- `AuctionQueryService` chịu trách nhiệm orchestration enrichment; `AuctionResponseAssembler` không được truy cập catalog repositories.
- Public auction filters theo `material`, `categoryName`, và price range dùng dữ liệu snapshot trong DB trước khi Redis overlay active price/end time.

### 2026-04-18 | Catalog Internal Read APIs
- Đổi `GET /api/v1/products` thành internal workflow list API cho seller/appraiser, bỏ public mode và bỏ `isMine`.
- Appraiser xem được tất cả `PENDING_APPRAISAL`, và chỉ xem `APPRAISED`/`REJECTED` nếu chính họ là người đã submit appraisal report.
- Đổi `GET /api/v1/products/{id}` thành internal catalog detail: owner xem mọi status; appraiser xem `PENDING_APPRAISAL` hoặc product đã được chính họ appraise.
- Ghi rõ buyer/public listing-detail sẽ đi qua auction module thay vì catalog.
- Tối ưu batch thumbnail loading để list endpoint fallback đúng sang ảnh đầu tiên khi thiếu primary flag.

### 2026-04-17 | Catalog Hardening Refactor
- Vá access control cho `getProductDetail()` theo mốc nghiệp vụ tại thời điểm đó; rule này đã được thay thế bởi internal workflow access mới ở mục 2026-04-18.
- Sửa certificate code race condition: 2-step save dùng report ID thay vì `count() + 1`.
- Thêm validation: duplicate mediaId, duplicate sortOrder, usageType mismatch, reject requires notes.
- Tách media endpoints ra `ProductMediaController` và `AppraisalMediaController`.  
- Sửa confirm path: bỏ `{mediaId}` path variable, chỉ dùng request body.
- Extract `replaceProductImages()` helper từ `updateProduct()`.
- Thêm immutability Javadoc cho `AppraisalReport` entity.
- Viết 38 unit tests (27 product + 11 appraisal).

### 2026-04-13 | Product Update/Delete + User-centric Folders
- Implement PUT/DELETE product endpoints.
- Migrate storage sang user-centric folders.
- Nâng cấp MediaCleanupJob thêm orphan ACTIVE scan.

### 2026-04-12 | Phase 2 Initial Implementation
- Tạo toàn bộ entities, repositories, DTOs, services, controllers.
- Tích hợp media module cho product images và appraisal images.
- Seed 11 categories gỗ mỹ nghệ.
