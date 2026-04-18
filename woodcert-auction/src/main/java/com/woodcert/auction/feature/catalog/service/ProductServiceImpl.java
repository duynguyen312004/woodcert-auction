package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.dto.request.CreateProductReq;
import com.woodcert.auction.feature.catalog.dto.request.ProductImageReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateProductReq;
import com.woodcert.auction.feature.catalog.dto.response.*;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductImage;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.CategoryRepository;
import com.woodcert.auction.feature.catalog.repository.ProductImageRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.entity.SellerProfile;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.repository.MediaAssetRepository;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import com.woodcert.auction.feature.media.support.MediaUploadContext;
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
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final SellerProfileRepository sellerProfileRepository;
    private final MediaAssetService mediaAssetService;
    private final MediaAssetRepository mediaAssetRepository;
    private final ProductImageHelper productImageHelper;
    private final CloudinaryProperties cloudinaryProperties;

    @Override
    @Transactional
    public MediaUploadIntentRes createProductImageUploadIntent(String sellerId, CreateMediaUploadIntentReq request) {
        ensureUserExists(sellerId);
        MediaUploadContext context = buildProductImageContext(sellerId);
        return mediaAssetService.createUploadIntent(context, request);
    }

    @Override
    @Transactional
    public ProductDetailRes createProduct(String sellerId, CreateProductReq request) {
        validateCategoryExists(request.categoryId());
        validateProductImages(request.images());
        validateMediaAssetsForProduct(request.images(), sellerId);

        Product product = new Product();
        product.setSellerId(sellerId);
        product.setCategoryId(request.categoryId());
        product.setTitle(request.title().trim());
        product.setDescription(request.description());
        product.setMaterial(trimOrNull(request.material()));
        product.setDimensions(trimOrNull(request.dimensions()));
        product.setWeight(request.weight());
        product.setStatus(ProductStatus.DRAFT);
        product = productRepository.save(product);

        saveProductImages(product.getId(), request.images());

        log.info("Product {} created by seller {} with {} images",
                product.getId(), sellerId, request.images().size());

        return buildProductDetailRes(product);
    }

    @Override
    @Transactional
    public ProductDetailRes updateProduct(String sellerId, Long productId, UpdateProductReq request) {
        Product product = getOwnedDraftProduct(sellerId, productId);

        validateCategoryExists(request.categoryId());
        validateProductImages(request.images());
        validateMediaAssetsForProduct(request.images(), sellerId);

        // Replace images: diff-based cleanup + full replacement
        replaceProductImages(productId, request.images());

        // Update product fields
        product.setCategoryId(request.categoryId());
        product.setTitle(request.title().trim());
        product.setDescription(request.description());
        product.setMaterial(trimOrNull(request.material()));
        product.setDimensions(trimOrNull(request.dimensions()));
        product.setWeight(request.weight());
        productRepository.save(product);

        log.info("Product {} updated by seller {} with {} images",
                productId, sellerId, request.images().size());

        return buildProductDetailRes(product);
    }

    @Override
    @Transactional
    public void deleteProduct(String sellerId, Long productId) {
        Product product = getOwnedDraftProduct(sellerId, productId);

        // Mark all product images' media assets for Cloudinary cleanup
        List<ProductImage> images = productImageRepository
                .findByProductIdOrderBySortOrderAsc(productId);

        for (ProductImage image : images) {
            mediaAssetRepository.findById(image.getMediaId())
                    .ifPresent(mediaAssetService::markPendingDelete);
        }

        // Hard delete product (cascade removes product_images rows)
        productRepository.delete(product);

        log.info("Product {} deleted by seller {}, {} media assets queued for cleanup",
                productId, sellerId, images.size());
    }

    @Override
    @Transactional
    public void submitForAppraisal(String sellerId, Long productId) {
        Product product = getOwnedDraftProduct(sellerId, productId);

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
            String status) {

        // Appraiser sees work queue (submittedAt ASC), seller sees newest first
        Sort sort = isAppraiser
                ? Sort.by(Sort.Direction.ASC, "submittedAt")
                : Sort.by(Sort.Direction.DESC, "createdAt");

        Pageable pageable = PageRequest.of(
                Math.max(0, page - 1),
                Math.min(Math.max(size, 1), 50),
                sort
        );

        ProductStatus productStatus = null;
        if (status != null && !status.isBlank()) {
            productStatus = parseStatus(status);
        }

        Page<Product> productPage;
        if (isAppraiser) {
            productPage = productRepository.findCatalogProductsForAppraiser(
                    userId,
                    productStatus,
                    categoryId,
                    ProductStatus.PENDING_APPRAISAL,
                    APPRAISER_REVIEWED_STATUSES,
                    pageable
            );
        } else {
            productPage = productRepository.findCatalogProductsForSeller(
                    userId,
                    productStatus,
                    categoryId,
                    pageable
            );
        }

        // Batch-load primary images in 1 query instead of N queries
        Map<Long, String> primaryImageUrls = productImageHelper
                .batchLoadPrimaryImageUrls(productPage.getContent());

        Page<ProductListRes> resultPage = productPage.map(product -> {
            String primaryImageUrl = primaryImageUrls.get(product.getId());
            return ProductListRes.fromEntity(product, primaryImageUrl);
        });

        return PaginationResponse.of(resultPage);
    }

    /**
     * Get internal catalog product detail with restricted access.
     */
    @Override
    public ProductDetailRes getProductDetail(Long productId, String userId, boolean isAppraiser) {
        Product product = productRepository.findByIdWithCategoryAndAppraisalReport(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        enforceProductDetailAccess(product, userId, isAppraiser);

        return buildProductDetailRes(product);
    }

    // =========================================================================
    // Image replacement helper — extracted for clarity and testability
    // =========================================================================

    /**
     * Full-replacement strategy for product images:
     * 1. Compare old vs new mediaIds to find removed images
     * 2. Mark removed images' media assets for Cloudinary cleanup (PENDING_DELETE)
     * 3. Delete all existing image rows
     * 4. Insert the new image set
     *
     * This ensures kept images are NOT marked for deletion, only genuinely removed ones.
     */
    private void replaceProductImages(Long productId, List<ProductImageReq> newImages) {
        List<ProductImage> existingImages = productImageRepository
                .findByProductIdOrderBySortOrderAsc(productId);

        Set<Long> newMediaIds = newImages.stream()
                .map(ProductImageReq::mediaId)
                .collect(Collectors.toSet());

        // Mark removed images for cleanup — kept images are NOT touched
        for (ProductImage oldImage : existingImages) {
            if (!newMediaIds.contains(oldImage.getMediaId())) {
                mediaAssetRepository.findById(oldImage.getMediaId())
                        .ifPresent(mediaAssetService::markPendingDelete);
            }
        }

        // Replace all image rows
        productImageRepository.deleteByProductId(productId);
        productImageRepository.flush();
        saveProductImages(productId, newImages);
    }

    // =========================================================================
    // Validation helpers
    // =========================================================================

    /**
     * Validate product image list invariants:
     * - Exactly one primary image
     * - No duplicate mediaId references
     * - No duplicate sortOrder values
     */
    private void validateProductImages(List<ProductImageReq> images) {
        // Exactly 1 primary
        long primaryCount = images.stream()
                .filter(img -> Boolean.TRUE.equals(img.isPrimary()))
                .count();
        if (primaryCount != 1) {
            throw new AppException(ErrorCode.INVALID_PRIMARY_IMAGE);
        }

        // No duplicate mediaId
        Set<Long> mediaIds = new HashSet<>();
        for (ProductImageReq img : images) {
            if (!mediaIds.add(img.mediaId())) {
                throw new AppException(ErrorCode.DUPLICATE_MEDIA_ID);
            }
        }

        // No duplicate sortOrder
        Set<Integer> sortOrders = new HashSet<>();
        for (ProductImageReq img : images) {
            if (!sortOrders.add(img.sortOrder())) {
                throw new AppException(ErrorCode.DUPLICATE_SORT_ORDER);
            }
        }
    }

    /**
     * Validate each referenced media asset:
     * - Owned by the given seller
     * - Status is ACTIVE (upload confirmed)
     * - Usage type is PRODUCT_IMAGE
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
    // Access control
    // =========================================================================

    /**
     * Enforce visibility rules for internal catalog detail:
     * - owner → any status
     * - appraiser can view PENDING_APPRAISAL, plus APPRAISED/REJECTED they reviewed
     * - everyone else → PRODUCT_NOT_FOUND
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
            if (isReviewedByAppraiser(product, userId)) {
                return;
            }
        }
        throw new AppException(ErrorCode.PRODUCT_NOT_FOUND);
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    private ProductDetailRes buildProductDetailRes(Product product) {
        User seller = userRepository.findById(product.getSellerId())
                .orElse(null);
        SellerProfile sellerProfile = seller != null
                ? sellerProfileRepository.findById(seller.getId()).orElse(null)
                : null;
        SellerSummaryRes sellerSummary = seller != null
                ? SellerSummaryRes.fromEntities(seller, sellerProfile)
                : null;

        List<ProductImage> images = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId());
        List<ProductImageRes> imageResponses = images.stream()
                .map(img -> {
                    String imageUrl = productImageHelper.buildImageUrl(img);
                    return ProductImageRes.fromEntity(img, imageUrl);
                })
                .toList();

        AppraisalReportRes appraisalReportRes = null;
        if (product.getAppraisalReport() != null) {
            appraisalReportRes = AppraisalReportRes.fromEntity(product.getAppraisalReport());
        }

        if (product.getCategory() == null && product.getCategoryId() != null) {
            categoryRepository.findById(product.getCategoryId())
                    .ifPresent(product::setCategory);
        }

        return ProductDetailRes.fromEntity(product, sellerSummary, imageResponses, appraisalReportRes);
    }

    private boolean isReviewedByAppraiser(Product product, String appraiserId) {
        if (product.getStatus() != ProductStatus.APPRAISED
                && product.getStatus() != ProductStatus.REJECTED) {
            return false;
        }

        AppraisalReport appraisalReport = product.getAppraisalReport();
        return appraisalReport != null && appraiserId.equals(appraisalReport.getAppraiserId());
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
     * Validate ownership + DRAFT status in one shot. Used by update, delete, submit.
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

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
