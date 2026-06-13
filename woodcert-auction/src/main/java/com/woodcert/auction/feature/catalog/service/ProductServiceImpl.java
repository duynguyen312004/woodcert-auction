package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.dto.request.CreateProductReq;
import com.woodcert.auction.feature.catalog.dto.request.ProductImageReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateProductReq;
import com.woodcert.auction.feature.catalog.dto.response.*;
import com.woodcert.auction.feature.catalog.entity.AppraisalImage;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Category;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductImage;
import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.AppraisalImageRepository;
import com.woodcert.auction.feature.catalog.repository.CategoryRepository;
import com.woodcert.auction.feature.catalog.repository.ProductImageRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.finance.config.FinanceProperties;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.PlatformRevenueService;
import com.woodcert.auction.feature.finance.service.WalletService;
import com.woodcert.auction.feature.finance.support.FinanceOperationKey;
import com.woodcert.auction.feature.finance.support.FinanceOperationKeys;
import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.repository.MediaAssetRepository;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import com.woodcert.auction.feature.media.support.MediaUploadContext;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private static final List<ProductStatus> APPRAISER_REVIEWED_STATUSES = List.of(
            ProductStatus.APPRAISED,
            ProductStatus.REJECTED
    );

    private final ProductRepository productRepository;
    private final AppraisalImageRepository appraisalImageRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final MediaAssetService mediaAssetService;
    private final MediaAssetRepository mediaAssetRepository;
    private final ProductImageHelper productImageHelper;
    private final CloudinaryProperties cloudinaryProperties;
    private final MediaUrlBuilder mediaUrlBuilder;
    private final WalletService walletService;
    private final PlatformRevenueService platformRevenueService;
    private final FinanceProperties financeProperties;

    @Override
    @Transactional
    public MediaUploadIntentRes createProductImageUploadIntent(String sellerId, CreateMediaUploadIntentReq request) {
        // Bước 1: Kiểm tra seller tồn tại trước khi cấp quyền upload ảnh sản phẩm.
        ensureUserExists(sellerId);

        // Bước 2: Tạo ngữ cảnh upload để media service giới hạn folder, dung lượng và loại file.
        MediaUploadContext context = buildProductImageContext(sellerId);
        return mediaAssetService.createUploadIntent(context, request);
    }

    @Override
    @Transactional
    public void confirmProductImageUpload(String sellerId, ConfirmMediaUploadReq request) {
        // Catalog owns the product-image use case; media only verifies the generic uploaded asset.
        mediaAssetService.confirmOwnedUpload(sellerId, request);
    }

    @Override
    @Transactional
    public ProductDetailRes createProduct(String sellerId, CreateProductReq request) {
        // Bước 1: Kiểm tra category, bộ ảnh và media asset trước khi tạo bản ghi sản phẩm.
        validateCategoryExists(request.categoryId());
        validateProductImages(request.images());
        validateMediaAssetsForProduct(request.images(), sellerId);

        // Bước 2: Chuẩn hóa dữ liệu nhập và lưu sản phẩm ở trạng thái nháp.
        Product product = new Product();
        product.setSellerId(sellerId);
        product.setCategoryId(request.categoryId());
        product.setTitle(request.title().trim());
        product.setDescription(request.description());
        product.setMaterial(trimOrNull(request.material()));
        product.setDimensions(trimOrNull(request.dimensions()));
        product.setWeight(request.weight());
        product.setStatus(ProductStatus.DRAFT);
        product.setSaleStatus(ProductSaleStatus.AVAILABLE);
        product = productRepository.save(product);

        // Bước 3: Gắn các media đã upload vào bảng ảnh sản phẩm theo đúng thứ tự hiển thị.
        saveProductImages(product.getId(), request.images());

        log.info("Product {} created by seller {} with {} images",
                product.getId(), sellerId, request.images().size());

        // Bước 4: Đọc lại chi tiết để trả về kèm seller, category, ảnh và appraisal report nếu có.
        return buildProductDetailRes(product, null, false);
    }

    @Override
    @Transactional
    public ProductDetailRes updateProduct(String sellerId, Long productId, UpdateProductReq request) {
        // Bước 1: Chỉ cho phép seller sửa sản phẩm của mình khi sản phẩm còn ở trạng thái nháp.
        Product product = getOwnedDraftProduct(sellerId, productId);

        // Bước 2: Kiểm tra dữ liệu thay thế giống luồng tạo mới để tránh ảnh/media không hợp lệ.
        validateCategoryExists(request.categoryId());
        validateProductImages(request.images());
        validateMediaAssetsForProduct(request.images(), sellerId);

        // Bước 3: Thay bộ ảnh, đồng thời đánh dấu media bị gỡ để job dọn Cloudinary xử lý sau.
        replaceProductImages(productId, request.images());

        // Bước 4: Cập nhật các trường mô tả sau khi đã chắc chắn dữ liệu liên quan hợp lệ.
        product.setCategoryId(request.categoryId());
        product.setTitle(request.title().trim());
        product.setDescription(request.description());
        product.setMaterial(trimOrNull(request.material()));
        product.setDimensions(trimOrNull(request.dimensions()));
        product.setWeight(request.weight());
        productRepository.save(product);

        log.info("Product {} updated by seller {} with {} images",
                productId, sellerId, request.images().size());

        // Bước 5: Trả về snapshot chi tiết mới nhất cho màn hình seller.
        return buildProductDetailRes(product, null, false);
    }

    @Override
    @Transactional
    public void deleteProduct(String sellerId, Long productId) {
        // Bước 1: Chỉ xóa sản phẩm nháp thuộc đúng seller hiện tại.
        Product product = getOwnedDraftProduct(sellerId, productId);

        // Bước 2: Lấy toàn bộ ảnh đang gắn với sản phẩm để đánh dấu media cần dọn khỏi Cloudinary.
        List<ProductImage> images = productImageRepository
                .findByProductIdOrderBySortOrderAsc(productId);

        for (ProductImage image : images) {
            mediaAssetRepository.findById(image.getMediaId())
                    .ifPresent(mediaAssetService::markPendingDelete);
        }

        // Bước 3: Xóa cứng sản phẩm; cascade sẽ xóa các dòng product_images liên quan.
        productRepository.delete(product);

        log.info("Product {} deleted by seller {}, {} media assets queued for cleanup",
                productId, sellerId, images.size());
    }

    @Override
    @Transactional
    public void submitForAppraisal(String sellerId, Long productId) {
        // Bước 1: Đảm bảo seller chỉ gửi thẩm định sản phẩm nháp của chính mình.
        Product product = getOwnedDraftProduct(sellerId, productId);

        // Bước 2: Chuyển trạng thái sang hàng chờ thẩm định và ghi thời điểm nộp.
        FinanceOperationKey operationKey = FinanceOperationKeys.appraisalSubmissionFee(productId, sellerId);
        walletService.chargeAppraisalFee(
                sellerId,
                operationKey,
                financeProperties.getAppraisalFee(),
                productId
        );
        platformRevenueService.recordRevenue(
                PlatformRevenueType.APPRAISAL_FEE,
                financeProperties.getAppraisalFee(),
                sellerId,
                WalletReferenceType.APPRAISAL,
                productId,
                operationKey
        );

        product.setStatus(ProductStatus.PENDING_APPRAISAL);
        product.setSubmittedAt(Instant.now());
        productRepository.save(product);

        log.info("Product {} submitted for appraisal by seller {}", productId, sellerId);
    }

    @Override
    public PaginationResponse<ProductListRes> getCatalogProducts(
            String userId,
            boolean isAppraiser,
            int page,
            int size,
            Integer categoryId,
            String status,
            String saleStatus) {

        // Bước 1: Chọn thứ tự đọc dữ liệu theo vai trò: appraiser xử lý hàng chờ cũ trước,
        // seller xem sản phẩm mới tạo trước.
        Sort sort = isAppraiser
                ? Sort.by(Sort.Direction.ASC, "submittedAt")
                : Sort.by(Sort.Direction.DESC, "createdAt");

        // Bước 2: Chuẩn hóa phân trang để API không đọc quá 50 bản ghi mỗi lần.
        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 50),
                sort
        );

        // Bước 3: Chuyển filter dạng chuỗi từ request sang enum nội bộ.
        ProductStatus productStatus = null;
        if (status != null && !status.isBlank()) {
            productStatus = parseStatus(status);
        }

        ProductSaleStatus productSaleStatus = null;
        if (saleStatus != null && !saleStatus.isBlank()) {
            productSaleStatus = parseSaleStatus(saleStatus);
        }

        // Bước 4: Chọn query theo vai trò để áp đúng quyền nhìn thấy dữ liệu.
        Page<Product> productPage;
        if (isAppraiser) {
            productPage = productRepository.findCatalogProductsForAppraiser(
                    userId,
                    productStatus,
                    productSaleStatus,
                    categoryId,
                    ProductStatus.PENDING_APPRAISAL,
                    ProductStatus.UNDER_APPRAISAL,
                    APPRAISER_REVIEWED_STATUSES,
                    Instant.now(),
                    pageable
            );
        } else {
            productPage = productRepository.findCatalogProductsForSeller(
                    userId,
                    productStatus,
                    productSaleStatus,
                    categoryId,
                    pageable
            );
        }

        // Bước 5: Batch-load ảnh đại diện để tránh N+1 query khi map danh sách sản phẩm.
        Map<Long, String> primaryImageUrls = productImageHelper
                .batchLoadPrimaryImageUrls(productPage.getContent());

        // Bước 6: Ghép dữ liệu sản phẩm với URL ảnh đại diện rồi đóng gói pagination.
        Page<ProductListRes> resultPage = productPage.map(product -> {
            String primaryImageUrl = primaryImageUrls.get(product.getId());
            return ProductListRes.fromEntity(product, primaryImageUrl);
        });

        return PaginationResponse.of(resultPage);
    }

    @Override
    @Transactional(readOnly = true)
    public SellerProductStatsRes getSellerProductStats(String sellerId) {
        Map<ProductStatus, Long> byStatus = new EnumMap<>(ProductStatus.class);
        for (ProductStatus status : ProductStatus.values()) {
            byStatus.put(status, 0L);
        }
        productRepository.countBySellerIdGroupedByStatus(sellerId)
                .forEach(row -> byStatus.put((ProductStatus) row[0], (Long) row[1]));

        Map<ProductSaleStatus, Long> bySaleStatus = new EnumMap<>(ProductSaleStatus.class);
        for (ProductSaleStatus status : ProductSaleStatus.values()) {
            bySaleStatus.put(status, 0L);
        }
        productRepository.countBySellerIdGroupedBySaleStatus(sellerId)
                .forEach(row -> bySaleStatus.put((ProductSaleStatus) row[0], (Long) row[1]));

        long total = byStatus.values().stream().mapToLong(Long::longValue).sum();
        return new SellerProductStatsRes(total, byStatus, bySaleStatus);
    }

    /**
     * Lấy chi tiết sản phẩm nội bộ và áp quyền truy cập theo seller/appraiser.
     */
    @Override
    public ProductDetailRes getProductDetail(Long productId, String userId, boolean isAppraiser) {
        // Bước 1: Đọc sản phẩm kèm category và appraisal report để đủ dữ liệu kiểm tra quyền.
        Product product = productRepository.findByIdWithCategoryAndAppraisalReport(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        // Bước 2: Chặn truy cập nếu user không phải chủ sản phẩm hoặc appraiser hợp lệ.
        enforceProductDetailAccess(product, userId, isAppraiser);

        // Bước 3: Ghép dữ liệu chi tiết để trả về cho màn hình catalog nội bộ.
        return buildProductDetailRes(product, userId, isAppraiser);
    }

    // =========================================================================
    // Helper thay ảnh sản phẩm, tách riêng để dễ đọc và dễ test
    // =========================================================================

    /**
     * Chiến lược thay toàn bộ ảnh sản phẩm:
     * 1. So sánh mediaId cũ và mới để tìm ảnh đã bị gỡ.
     * 2. Đánh dấu media của ảnh bị gỡ sang PENDING_DELETE để dọn Cloudinary.
     * 3. Xóa toàn bộ dòng ảnh hiện tại.
     * 4. Ghi lại bộ ảnh mới theo request.
     *
     * Cách này bảo đảm ảnh được giữ lại không bị đánh dấu xóa nhầm.
     */
    private void replaceProductImages(Long productId, List<ProductImageReq> newImages) {
        List<ProductImage> existingImages = productImageRepository
                .findByProductIdOrderBySortOrderAsc(productId);

        // Bước 1: Gom mediaId mới thành set để tra cứu nhanh ảnh nào còn được giữ.
        Set<Long> newMediaIds = newImages.stream()
                .map(ProductImageReq::mediaId)
                .collect(Collectors.toSet());

        // Bước 2: Chỉ đánh dấu xóa những media không còn xuất hiện trong request mới.
        for (ProductImage oldImage : existingImages) {
            if (!newMediaIds.contains(oldImage.getMediaId())) {
                mediaAssetRepository.findById(oldImage.getMediaId())
                        .ifPresent(mediaAssetService::markPendingDelete);
            }
        }

        // Bước 3: Xóa bảng liên kết ảnh cũ và ghi lại toàn bộ bộ ảnh mới.
        productImageRepository.deleteByProductId(productId);
        productImageRepository.flush();
        saveProductImages(productId, newImages);
    }

    // =========================================================================
    // Helper kiểm tra dữ liệu
    // =========================================================================

    /**
     * Kiểm tra các ràng buộc của danh sách ảnh sản phẩm:
     * - Có đúng một ảnh đại diện.
     * - Không trùng mediaId.
     * - Không trùng sortOrder.
     */
    private void validateProductImages(List<ProductImageReq> images) {
        // Bước 1: Đếm ảnh đại diện để bảo đảm UI luôn có một ảnh chính duy nhất.
        long primaryCount = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.isPrimary()))
                .count();
        if (primaryCount != 1) {
            throw new AppException(ErrorCode.INVALID_PRIMARY_IMAGE);
        }

        // Bước 2: Chặn cùng một media asset bị gắn nhiều lần vào một sản phẩm.
        Set<Long> mediaIds = new HashSet<>();
        for (ProductImageReq img : images) {
            if (!mediaIds.add(img.mediaId())) {
                throw new AppException(ErrorCode.DUPLICATE_MEDIA_ID);
            }
        }

        // Bước 3: Chặn trùng thứ tự hiển thị để danh sách ảnh render ổn định.
        Set<Integer> sortOrders = new HashSet<>();
        for (ProductImageReq img : images) {
            if (!sortOrders.add(img.sortOrder())) {
                throw new AppException(ErrorCode.DUPLICATE_SORT_ORDER);
            }
        }
    }

    /**
     * Kiểm tra từng media asset được tham chiếu:
     * - Thuộc seller hiện tại.
     * - Đã upload thành công và ở trạng thái ACTIVE.
     * - Đúng usage type PRODUCT_IMAGE.
     */
    private void validateMediaAssetsForProduct(List<ProductImageReq> images, String sellerId) {
        for (ProductImageReq imgReq : images) {
            MediaAsset asset = mediaAssetService.getOwnedAssetOrThrow(imgReq.mediaId(), sellerId);
            if (asset.getStatus() != MediaStatus.ACTIVE) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Media asset " + imgReq.mediaId()
                                + " is not confirmed yet. Please complete the upload first.");
            }
            if (asset.getUsageType() != MediaUsageType.PRODUCT_IMAGE) {
                throw new AppException(ErrorCode.MEDIA_USAGE_TYPE_MISMATCH);
            }
        }
    }

    private void validateCategoryExists(Integer categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new AppException(ErrorCode.CATEGORY_NOT_FOUND);
        }
    }

    // =========================================================================
    // Kiểm soát quyền truy cập
    // =========================================================================

    /**
     * Áp quy tắc nhìn thấy chi tiết sản phẩm nội bộ:
     * - Chủ sản phẩm được xem mọi trạng thái.
     * - Appraiser được xem sản phẩm đang chờ thẩm định và sản phẩm họ đã review.
     * - Các trường hợp còn lại trả PRODUCT_NOT_FOUND để tránh lộ dữ liệu.
     */
    private void enforceProductDetailAccess(Product product, String userId, boolean isAppraiser) {
        boolean isOwner = product.getSellerId().equals(userId);
        if (isOwner) {
            return;
        }

        if (isAppraiser) {
            if (product.getStatus() == ProductStatus.PENDING_APPRAISAL) {
                return;
            }
            if (isActivelyClaimedByAnotherAppraiser(product, userId)) {
                throw new AppException(ErrorCode.APPRAISAL_CLAIM_CONFLICT);
            }
            if (isClaimVisibleToAppraiser(product, userId)) {
                return;
            }
            if (isReviewedByAppraiser(product, userId)) {
                return;
            }
        }
        throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private ProductDetailRes buildProductDetailRes(Product product, String viewerUserId, boolean isAppraiser) {
        // Bước 1: Đọc thông tin seller và seller profile để tạo khối seller summary.
        User seller = userRepository.findById(product.getSellerId())
                .orElse(null);
        SellerProfile sellerProfile = seller != null
                ? sellerProfileRepository.findById(seller.getId()).orElse(null)
                : null;
        SellerSummaryRes sellerSummary = seller != null
                ? SellerSummaryRes.fromEntities(seller, sellerProfile)
                : null;

        // Bước 2: Đọc toàn bộ ảnh sản phẩm và dựng URL ảnh từ thông tin media.
        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId());
        List<ProductImageRes> imageResponses = images.stream()
                .map(img -> {
                    String imageUrl = productImageHelper.buildImageUrl(img);
                    return ProductImageRes.fromEntity(img, imageUrl);
                })
                .toList();

        // Bước 3: Nếu đã có báo cáo thẩm định thì map kèm vào response chi tiết.
        AppraisalReportRes appraisalReportRes = buildAppraisalReportRes(product, viewerUserId, isAppraiser);

        // Bước 4: Resolve category riêng để không mutate quan hệ read-only trên managed entity.
        Category category = product.getCategory();
        if (category == null && product.getCategoryId() != null) {
            category = categoryRepository.findById(product.getCategoryId()).orElse(null);
        }

        // Bước 5: Gom product, seller, ảnh và appraisal report thành DTO trả về.
        return ProductDetailRes.fromEntity(
                product,
                sellerSummary,
                imageResponses,
                appraisalReportRes,
                category
        );
    }

    private AppraisalReportRes buildAppraisalReportRes(Product product, String viewerUserId, boolean isAppraiser) {
        AppraisalReport appraisalReport = product.getAppraisalReport();
        if (appraisalReport == null) {
            return null;
        }

        boolean isOwner = viewerUserId != null && viewerUserId.equals(product.getSellerId());
        boolean isReviewingAppraiser = isAppraiser
                && viewerUserId != null
                && viewerUserId.equals(appraisalReport.getAppraiserId());
        boolean includeReviewDetails = isOwner || isReviewingAppraiser;

        List<AppraisalImageRes> proofImages = includeReviewDetails
                ? buildAppraisalProofImages(appraisalReport.getId())
                : List.of();

        return AppraisalReportRes.fromEntity(
                appraisalReport,
                includeReviewDetails,
                isReviewingAppraiser,
                proofImages
        );
    }

    private List<AppraisalImageRes> buildAppraisalProofImages(Long appraisalReportId) {
        if (appraisalReportId == null) {
            return List.of();
        }

        return appraisalImageRepository.findByAppraisalReportIdOrderByIdAsc(appraisalReportId).stream()
                .map(image -> AppraisalImageRes.fromEntity(image, buildAppraisalImageUrl(image)))
                .toList();
    }

    private String buildAppraisalImageUrl(AppraisalImage image) {
        if (image.getMediaAsset() != null) {
            return mediaUrlBuilder.buildAppraisalImageUrl(image.getMediaAsset());
        }
        return mediaAssetRepository.findById(image.getMediaId())
                .map(mediaUrlBuilder::buildAppraisalImageUrl)
                .orElse(null);
    }

    private boolean isReviewedByAppraiser(Product product, String appraiserId) {
        if (product.getStatus() != ProductStatus.APPRAISED
                && product.getStatus() != ProductStatus.REJECTED) {
            return false;
        }

        AppraisalReport appraisalReport = product.getAppraisalReport();
        return appraisalReport != null && appraiserId.equals(appraisalReport.getAppraiserId());
    }

    private boolean isClaimVisibleToAppraiser(Product product, String appraiserId) {
        if (product.getStatus() != ProductStatus.UNDER_APPRAISAL) {
            return false;
        }
        Instant expiresAt = product.getAppraisalClaimExpiresAt();
        if (expiresAt == null || !expiresAt.isAfter(Instant.now())) {
            return true;
        }
        return appraiserId != null && appraiserId.equals(product.getAppraisalClaimedBy());
    }

    private boolean isActivelyClaimedByAnotherAppraiser(Product product, String appraiserId) {
        if (product.getStatus() != ProductStatus.UNDER_APPRAISAL) {
            return false;
        }
        Instant expiresAt = product.getAppraisalClaimExpiresAt();
        return expiresAt != null
                && expiresAt.isAfter(Instant.now())
                && product.getAppraisalClaimedBy() != null
                && !product.getAppraisalClaimedBy().equals(appraiserId);
    }

    private MediaUploadContext buildProductImageContext(String sellerId) {
        String folder = cloudinaryProperties.getBaseFolder().trim() + "/users/" + sellerId + "/products";
        return new MediaUploadContext(
                sellerId,
                MediaUsageType.PRODUCT_IMAGE,
                MediaResourceType.IMAGE,
                folder,
                cloudinaryProperties.getUpload().getImageMaxBytes(),
                "image/"
        );
    }

    /**
     * Kiểm tra quyền sở hữu và trạng thái DRAFT trong cùng một bước.
     * Dùng cho các luồng update, delete và submit.
     */
    private Product getOwnedDraftProduct(String sellerId, Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (!product.getSellerId().equals(sellerId)) {
            throw new AppException(ErrorCode.PRODUCT_NOT_OWNED);
        }

        if (product.getStatus() != ProductStatus.DRAFT) {
            throw new AppException(ErrorCode.PRODUCT_NOT_DRAFT);
        }

        return product;
    }

    private void saveProductImages(Long productId, List<ProductImageReq> imageReqs) {
        List<ProductImage> images = new ArrayList<>();
        for (ProductImageReq imgReq : imageReqs) {
            ProductImage image = new ProductImage();
            image.setProductId(productId);
            image.setMediaId(imgReq.mediaId());
            image.setPrimary(Boolean.TRUE.equals(imgReq.isPrimary()));
            image.setSortOrder(imgReq.sortOrder());
            images.add(image);
        }
        productImageRepository.saveAll(images);
    }

    private void ensureUserExists(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
        }
    }

    private ProductStatus parseStatus(String status) {
        try {
            return ProductStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid product status: " + status);
        }
    }

    private ProductSaleStatus parseSaleStatus(String saleStatus) {
        try {
            return ProductSaleStatus.valueOf(saleStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new AppException(ErrorCode.INVALID_REQUEST, "Invalid product sale status: " + saleStatus);
        }
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
