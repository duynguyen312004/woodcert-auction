package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.dto.request.CreateProductReq;
import com.woodcert.auction.feature.catalog.dto.request.ProductImageReq;
import com.woodcert.auction.feature.catalog.dto.request.UpdateProductReq;
import com.woodcert.auction.feature.catalog.dto.response.ProductDetailRes;
import com.woodcert.auction.feature.catalog.dto.response.SellerProductStatsRes;
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
import com.woodcert.auction.feature.finance.support.FinanceOperationKeys;
import com.woodcert.auction.feature.identity.entity.User;
import com.woodcert.auction.feature.identity.repository.SellerProfileRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.repository.MediaAssetRepository;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import com.woodcert.auction.feature.media.util.MediaUrlBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceImplTest {

    @Mock private ProductRepository productRepository;
    @Mock private AppraisalImageRepository appraisalImageRepository;
    @Mock private ProductImageRepository productImageRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private SellerProfileRepository sellerProfileRepository;
    @Mock private MediaAssetService mediaAssetService;
    @Mock private MediaAssetRepository mediaAssetRepository;
    @Mock private ProductImageHelper productImageHelper;
    @Mock private CloudinaryProperties cloudinaryProperties;
    @Mock private MediaUrlBuilder mediaUrlBuilder;
    @Mock private WalletService walletService;
    @Mock private PlatformRevenueService platformRevenueService;
    @Mock private FinanceProperties financeProperties;

    @InjectMocks
    private ProductServiceImpl productService;

    private static final String SELLER_ID = "seller-uuid-001";
    private static final String OTHER_SELLER_ID = "seller-uuid-999";
    private static final Long PRODUCT_ID = 1L;

    // =========================================================================
    // Helpers
    // =========================================================================

    private Product createDraftProduct() {
        Product p = new Product();
        p.setId(PRODUCT_ID);
        p.setSellerId(SELLER_ID);
        p.setCategoryId(1);
        p.setTitle("Test Wood Art");
        p.setStatus(ProductStatus.DRAFT);
        return p;
    }

    private Product createProductWithStatus(ProductStatus status) {
        Product p = createDraftProduct();
        p.setStatus(status);
        return p;
    }

    private AppraisalReport createAppraisalReport(String appraiserId) {
        AppraisalReport report = new AppraisalReport();
        report.setId(42L);
        report.setProductId(PRODUCT_ID);
        report.setAppraiserId(appraiserId);
        report.setCertificateCode("CERT-2026-00042");
        report.setVerifiedMaterial("Dalbergia tonkinensis");
        report.setEstimatedValue(new BigDecimal("15000000"));
        report.setAuthentic(true);
        report.setAppraiserNotes("Verified grain and finish.");
        report.setSellerAccuracy(new BigDecimal("4.5"));
        report.setIntegrityHash("abc123");
        report.setAppraisedAt(java.time.Instant.now());
        return report;
    }

    private MediaAsset createActiveProductMediaAsset(Long id) {
        MediaAsset asset = new MediaAsset();
        asset.setId(id);
        asset.setOwnerUserId(SELLER_ID);
        asset.setStatus(MediaStatus.ACTIVE);
        asset.setUsageType(MediaUsageType.PRODUCT_IMAGE);
        asset.setPublicId("woodcert/dev/users/" + SELLER_ID + "/products/" + id);
        return asset;
    }

    private ProductImageReq imageReq(Long mediaId, boolean isPrimary, int sortOrder) {
        return new ProductImageReq(mediaId, isPrimary, sortOrder);
    }

    private CreateProductReq createProductReq(List<ProductImageReq> images) {
        return new CreateProductReq(1, "Test Product", "Desc", "Wood", "10x10", BigDecimal.ONE, images);
    }

    private UpdateProductReq updateProductReq(List<ProductImageReq> images) {
        return new UpdateProductReq(1, "Updated Product", "Desc", "Wood", "10x10", BigDecimal.ONE, images);
    }

    /**
     * Assert that an AppException is thrown with the expected ErrorCode's statusCode and message.
     */
    private static void assertAppException(Runnable action, ErrorCode expected) {
        assertThatThrownBy(action::run)
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException appEx = (AppException) e;
                    assertThat(appEx.getStatusCode()).isEqualTo(expected.getStatusCode());
                    assertThat(appEx.getMessage()).isEqualTo(expected.getMessage());
                });
    }

    private void setupCreateProductMocks() {
        when(categoryRepository.existsById(1)).thenReturn(true);
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> {
            Product p = inv.getArgument(0);
            if (p.getId() == null) p.setId(PRODUCT_ID);
            return p;
        });
        when(userRepository.findById(SELLER_ID)).thenReturn(Optional.of(new User()));
        when(productImageRepository.findByProductIdOrderBySortOrderAsc(PRODUCT_ID))
                .thenReturn(Collections.emptyList());
    }

    // =========================================================================
    // createProduct
    // =========================================================================

    @Nested
    @DisplayName("createProduct")
    class CreateProduct {

        @Test
        @DisplayName("should create DRAFT product with valid input")
        void createProduct_success() {
            setupCreateProductMocks();
            MediaAsset asset = createActiveProductMediaAsset(100L);
            when(mediaAssetService.getOwnedAssetOrThrow(100L, SELLER_ID)).thenReturn(asset);
            Category category = new Category();
            category.setId(1);
            category.setName("Gỗ mỹ nghệ");
            when(categoryRepository.findById(1)).thenReturn(Optional.of(category));

            List<ProductImageReq> images = List.of(imageReq(100L, true, 0));
            ProductDetailRes result = productService.createProduct(SELLER_ID, createProductReq(images));

            assertThat(result).isNotNull();
            assertThat(result.category()).isNotNull();
            assertThat(result.category().name()).isEqualTo("Gỗ mỹ nghệ");
            verify(productRepository).save(argThat(product -> product.getCategory() == null));
            verify(productRepository).save(any(Product.class));
            verify(productImageRepository).saveAll(anyList());
        }

        @Test
        @DisplayName("should reject duplicate mediaId")
        void createProduct_duplicateMediaId_throws() {
            when(categoryRepository.existsById(1)).thenReturn(true);

            List<ProductImageReq> images = List.of(
                    imageReq(100L, true, 0),
                    imageReq(100L, false, 1)
            );

            assertAppException(
                    () -> productService.createProduct(SELLER_ID, createProductReq(images)),
                    ErrorCode.DUPLICATE_MEDIA_ID);
        }

        @Test
        @DisplayName("should reject duplicate sortOrder")
        void createProduct_duplicateSortOrder_throws() {
            when(categoryRepository.existsById(1)).thenReturn(true);

            List<ProductImageReq> images = List.of(
                    imageReq(100L, true, 0),
                    imageReq(101L, false, 0)
            );

            assertAppException(
                    () -> productService.createProduct(SELLER_ID, createProductReq(images)),
                    ErrorCode.DUPLICATE_SORT_ORDER);
        }

        @Test
        @DisplayName("should reject when no primary image")
        void createProduct_noPrimary_throws() {
            when(categoryRepository.existsById(1)).thenReturn(true);

            List<ProductImageReq> images = List.of(imageReq(100L, false, 0));

            assertAppException(
                    () -> productService.createProduct(SELLER_ID, createProductReq(images)),
                    ErrorCode.INVALID_PRIMARY_IMAGE);
        }

        @Test
        @DisplayName("should reject when two primary images")
        void createProduct_twoPrimary_throws() {
            when(categoryRepository.existsById(1)).thenReturn(true);

            List<ProductImageReq> images = List.of(
                    imageReq(100L, true, 0),
                    imageReq(101L, true, 1)
            );

            assertAppException(
                    () -> productService.createProduct(SELLER_ID, createProductReq(images)),
                    ErrorCode.INVALID_PRIMARY_IMAGE);
        }

        @Test
        @DisplayName("should reject when media asset is not ACTIVE")
        void createProduct_mediaNotActive_throws() {
            when(categoryRepository.existsById(1)).thenReturn(true);
            MediaAsset pendingAsset = createActiveProductMediaAsset(100L);
            pendingAsset.setStatus(MediaStatus.PENDING);
            when(mediaAssetService.getOwnedAssetOrThrow(100L, SELLER_ID)).thenReturn(pendingAsset);

            List<ProductImageReq> images = List.of(imageReq(100L, true, 0));

            assertThatThrownBy(() -> productService.createProduct(SELLER_ID, createProductReq(images)))
                    .isInstanceOf(AppException.class)
                    .satisfies(e -> {
                        AppException appEx = (AppException) e;
                        assertThat(appEx.getStatusCode()).isEqualTo(400);
                    });
        }

        @Test
        @DisplayName("should reject when media usage type mismatches")
        void createProduct_mediaWrongUsageType_throws() {
            when(categoryRepository.existsById(1)).thenReturn(true);
            MediaAsset avatarAsset = createActiveProductMediaAsset(100L);
            avatarAsset.setUsageType(MediaUsageType.USER_AVATAR);
            when(mediaAssetService.getOwnedAssetOrThrow(100L, SELLER_ID)).thenReturn(avatarAsset);

            List<ProductImageReq> images = List.of(imageReq(100L, true, 0));

            assertAppException(
                    () -> productService.createProduct(SELLER_ID, createProductReq(images)),
                    ErrorCode.MEDIA_USAGE_TYPE_MISMATCH);
        }

        @Test
        @DisplayName("should reject when category not found")
        void createProduct_categoryNotFound_throws() {
            when(categoryRepository.existsById(1)).thenReturn(false);

            List<ProductImageReq> images = List.of(imageReq(100L, true, 0));

            assertAppException(
                    () -> productService.createProduct(SELLER_ID, createProductReq(images)),
                    ErrorCode.CATEGORY_NOT_FOUND);
        }
    }

    // =========================================================================
    // updateProduct
    // =========================================================================

    @Nested
    @DisplayName("updateProduct")
    class UpdateProduct {

        @Test
        @DisplayName("should update DRAFT product — removed images marked PENDING_DELETE")
        void updateProduct_removedImages_markedForCleanup() {
            Product product = createDraftProduct();
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(categoryRepository.existsById(1)).thenReturn(true);

            ProductImage oldImg1 = new ProductImage();
            oldImg1.setMediaId(100L);
            ProductImage oldImg2 = new ProductImage();
            oldImg2.setMediaId(101L);
            when(productImageRepository.findByProductIdOrderBySortOrderAsc(PRODUCT_ID))
                    .thenReturn(List.of(oldImg1, oldImg2))
                    .thenReturn(Collections.emptyList());

            MediaAsset asset100 = createActiveProductMediaAsset(100L);
            MediaAsset asset102 = createActiveProductMediaAsset(102L);
            MediaAsset asset101 = createActiveProductMediaAsset(101L);
            when(mediaAssetService.getOwnedAssetOrThrow(100L, SELLER_ID)).thenReturn(asset100);
            when(mediaAssetService.getOwnedAssetOrThrow(102L, SELLER_ID)).thenReturn(asset102);
            when(mediaAssetRepository.findById(101L)).thenReturn(Optional.of(asset101));

            when(productRepository.save(any(Product.class))).thenReturn(product);
            when(userRepository.findById(SELLER_ID)).thenReturn(Optional.of(new User()));

            List<ProductImageReq> newImages = List.of(
                    imageReq(100L, true, 0),
                    imageReq(102L, false, 1)
            );
            productService.updateProduct(SELLER_ID, PRODUCT_ID, updateProductReq(newImages));

            verify(mediaAssetService).markPendingDelete(asset101);
            verify(mediaAssetService, never()).markPendingDelete(asset100);
        }

        @Test
        @DisplayName("should reject update when product is not DRAFT")
        void updateProduct_notDraft_throws() {
            Product product = createProductWithStatus(ProductStatus.APPRAISED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            List<ProductImageReq> images = List.of(imageReq(100L, true, 0));

            assertAppException(
                    () -> productService.updateProduct(SELLER_ID, PRODUCT_ID, updateProductReq(images)),
                    ErrorCode.PRODUCT_NOT_DRAFT);
        }

        @Test
        @DisplayName("should reject update when product not owned by seller")
        void updateProduct_notOwned_throws() {
            Product product = createDraftProduct();
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            List<ProductImageReq> images = List.of(imageReq(100L, true, 0));

            assertAppException(
                    () -> productService.updateProduct(OTHER_SELLER_ID, PRODUCT_ID, updateProductReq(images)),
                    ErrorCode.PRODUCT_NOT_OWNED);
        }

        @Test
        @DisplayName("should reject REJECTED product update")
        void updateProduct_rejected_throws() {
            Product product = createProductWithStatus(ProductStatus.REJECTED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            List<ProductImageReq> images = List.of(imageReq(100L, true, 0));

            assertAppException(
                    () -> productService.updateProduct(SELLER_ID, PRODUCT_ID, updateProductReq(images)),
                    ErrorCode.PRODUCT_NOT_DRAFT);
        }

        @Test
        @DisplayName("should reject duplicate mediaId in update")
        void updateProduct_duplicateMediaId_throws() {
            Product product = createDraftProduct();
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(categoryRepository.existsById(1)).thenReturn(true);

            List<ProductImageReq> images = List.of(
                    imageReq(100L, true, 0),
                    imageReq(100L, false, 1)
            );

            assertAppException(
                    () -> productService.updateProduct(SELLER_ID, PRODUCT_ID, updateProductReq(images)),
                    ErrorCode.DUPLICATE_MEDIA_ID);
        }

        @Test
        @DisplayName("should allow changing primary image during update")
        void updateProduct_changePrimary_success() {
            Product product = createDraftProduct();
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(categoryRepository.existsById(1)).thenReturn(true);
            when(productImageRepository.findByProductIdOrderBySortOrderAsc(PRODUCT_ID))
                    .thenReturn(Collections.emptyList());
            when(productRepository.save(any(Product.class))).thenReturn(product);
            when(userRepository.findById(SELLER_ID)).thenReturn(Optional.of(new User()));

            MediaAsset asset100 = createActiveProductMediaAsset(100L);
            MediaAsset asset101 = createActiveProductMediaAsset(101L);
            when(mediaAssetService.getOwnedAssetOrThrow(100L, SELLER_ID)).thenReturn(asset100);
            when(mediaAssetService.getOwnedAssetOrThrow(101L, SELLER_ID)).thenReturn(asset101);

            List<ProductImageReq> newImages = List.of(
                    imageReq(100L, false, 1),
                    imageReq(101L, true, 0)
            );

            ProductDetailRes result = productService.updateProduct(
                    SELLER_ID, PRODUCT_ID, updateProductReq(newImages));
            assertThat(result).isNotNull();
        }
    }

    // =========================================================================
    // deleteProduct
    // =========================================================================

    @Nested
    @DisplayName("deleteProduct")
    class DeleteProduct {

        @Test
        @DisplayName("should delete DRAFT and mark all images for cleanup")
        void deleteProduct_success() {
            Product product = createDraftProduct();
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            ProductImage img = new ProductImage();
            img.setMediaId(100L);
            when(productImageRepository.findByProductIdOrderBySortOrderAsc(PRODUCT_ID))
                    .thenReturn(List.of(img));

            MediaAsset asset = createActiveProductMediaAsset(100L);
            when(mediaAssetRepository.findById(100L)).thenReturn(Optional.of(asset));

            productService.deleteProduct(SELLER_ID, PRODUCT_ID);

            verify(mediaAssetService).markPendingDelete(asset);
            verify(productRepository).delete(product);
        }

        @Test
        @DisplayName("should reject delete when product is not DRAFT")
        void deleteProduct_notDraft_throws() {
            Product product = createProductWithStatus(ProductStatus.PENDING_APPRAISAL);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.deleteProduct(SELLER_ID, PRODUCT_ID),
                    ErrorCode.PRODUCT_NOT_DRAFT);
        }
    }

    // =========================================================================
    // submitForAppraisal
    // =========================================================================

    @Nested
    @DisplayName("submitForAppraisal")
    class SubmitForAppraisal {

        @Test
        @DisplayName("should change DRAFT to PENDING_APPRAISAL")
        void submitForAppraisal_success() {
            Product product = createDraftProduct();
            BigDecimal appraisalFee = new BigDecimal("1000000.00");
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(productRepository.save(any(Product.class))).thenReturn(product);
            when(financeProperties.getAppraisalFee()).thenReturn(appraisalFee);

            productService.submitForAppraisal(SELLER_ID, PRODUCT_ID);

            assertThat(product.getStatus()).isEqualTo(ProductStatus.PENDING_APPRAISAL);
            assertThat(product.getSubmittedAt()).isNotNull();
            verify(walletService).chargeAppraisalFee(
                    eq(SELLER_ID),
                    eq(FinanceOperationKeys.appraisalSubmissionFee(PRODUCT_ID, SELLER_ID)),
                    eq(appraisalFee),
                    eq(PRODUCT_ID));
            verify(platformRevenueService).recordRevenue(
                    eq(PlatformRevenueType.APPRAISAL_FEE),
                    eq(appraisalFee),
                    eq(SELLER_ID),
                    eq(WalletReferenceType.APPRAISAL),
                    eq(PRODUCT_ID),
                    eq(FinanceOperationKeys.appraisalSubmissionFee(PRODUCT_ID, SELLER_ID)));
        }

        @Test
        @DisplayName("should reject REJECTED product submission")
        void submitForAppraisal_rejected_throws() {
            Product product = createProductWithStatus(ProductStatus.REJECTED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.submitForAppraisal(SELLER_ID, PRODUCT_ID),
                    ErrorCode.PRODUCT_NOT_DRAFT);
        }

        @Test
        @DisplayName("should reject APPRAISED product submission")
        void submitForAppraisal_appraised_throws() {
            Product product = createProductWithStatus(ProductStatus.APPRAISED);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.submitForAppraisal(SELLER_ID, PRODUCT_ID),
                    ErrorCode.PRODUCT_NOT_DRAFT);
        }
    }

    // =========================================================================
    // getProductDetail — access control
    // =========================================================================

    @Nested
    @DisplayName("getSellerProductStats")
    class GetSellerProductStats {

        @Test
        @DisplayName("should return all statuses including zero counts")
        void getSellerProductStats_allStatuses() {
            when(productRepository.countBySellerIdGroupedByStatus(SELLER_ID)).thenReturn(List.of(
                    new Object[]{ProductStatus.DRAFT, 2L},
                    new Object[]{ProductStatus.APPRAISED, 8L}
            ));
            when(productRepository.countBySellerIdGroupedBySaleStatus(SELLER_ID)).thenReturn(List.of(
                    new Object[]{ProductSaleStatus.AVAILABLE, 4L},
                    new Object[]{ProductSaleStatus.SOLD, 6L}
            ));
            when(productRepository.countBySellerIdAndStatusAndSaleStatus(
                    SELLER_ID,
                    ProductStatus.APPRAISED,
                    ProductSaleStatus.AVAILABLE))
                    .thenReturn(2L);

            SellerProductStatsRes result = productService.getSellerProductStats(SELLER_ID);

            assertThat(result.total()).isEqualTo(10);
            assertThat(result.byStatus()).containsEntry(ProductStatus.DRAFT, 2L)
                    .containsEntry(ProductStatus.PENDING_APPRAISAL, 0L)
                    .containsEntry(ProductStatus.APPRAISED, 8L);
            assertThat(result.bySaleStatus()).containsEntry(ProductSaleStatus.AVAILABLE, 4L)
                    .containsEntry(ProductSaleStatus.IN_AUCTION, 0L)
                    .containsEntry(ProductSaleStatus.SOLD, 6L);
            assertThat(result.auctionReadyCount()).isEqualTo(2L);
        }

        @Test
        @DisplayName("should return zeroed maps when seller has no products")
        void getSellerProductStats_empty() {
            when(productRepository.countBySellerIdGroupedByStatus(SELLER_ID))
                    .thenReturn(Collections.emptyList());
            when(productRepository.countBySellerIdGroupedBySaleStatus(SELLER_ID))
                    .thenReturn(Collections.emptyList());

            SellerProductStatsRes result = productService.getSellerProductStats(SELLER_ID);

            assertThat(result.total()).isZero();
            assertThat(result.byStatus().values()).containsOnly(0L);
            assertThat(result.bySaleStatus().values()).containsOnly(0L);
            assertThat(result.auctionReadyCount()).isZero();
        }
    }

    @Nested
    @DisplayName("getCatalogProducts")
    class GetCatalogProducts {

        @Test
        @DisplayName("should list seller-owned products when requester is not appraiser")
        void getCatalogProducts_sellerScope() {
            Product product = createDraftProduct();
            when(productRepository.findCatalogProductsForSeller(eq(SELLER_ID), isNull(), isNull(), isNull(), any()))
                    .thenReturn(new PageImpl<>(List.of(product), PageRequest.of(0, 10), 1));
            when(productImageHelper.batchLoadPrimaryImageUrls(anyList()))
                    .thenReturn(Map.of());

            var result = productService.getCatalogProducts(SELLER_ID, false, 1, 10, null, null, null);

            assertThat(result.result()).hasSize(1);
            verify(productRepository).findCatalogProductsForSeller(eq(SELLER_ID), isNull(), isNull(), isNull(), any());
            verify(productRepository, never()).findCatalogProductsForAppraiser(
                    anyString(), any(), any(), any(), any(), any(), anyList(), any(), any());
        }

        @Test
        @DisplayName("should filter seller-owned products by status and category")
        void getCatalogProducts_sellerStatusAndCategoryFilter() {
            when(productRepository.findCatalogProductsForSeller(
                    eq(SELLER_ID), eq(ProductStatus.PENDING_APPRAISAL), isNull(), eq(2), any()))
                    .thenReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0));

            var result = productService.getCatalogProducts(SELLER_ID, false, 1, 10, 2, "pending_appraisal", null);

            assertThat(result.result()).isEmpty();
            verify(productRepository).findCatalogProductsForSeller(
                    eq(SELLER_ID), eq(ProductStatus.PENDING_APPRAISAL), isNull(), eq(2), any());
        }

        @Test
        @DisplayName("should list appraiser-visible products by workflow rule")
        void getCatalogProducts_appraiserScope() {
            Product product = createProductWithStatus(ProductStatus.PENDING_APPRAISAL);
            when(productRepository.findCatalogProductsForAppraiser(
                    eq("appraiser-id"),
                    isNull(),
                    isNull(),
                    isNull(),
                    eq(ProductStatus.PENDING_APPRAISAL),
                    eq(ProductStatus.UNDER_APPRAISAL),
                    anyList(),
                    any(),
                    any()))
                    .thenReturn(new PageImpl<>(List.of(product), PageRequest.of(0, 10), 1));
            when(productImageHelper.batchLoadPrimaryImageUrls(anyList()))
                    .thenReturn(Map.of());

            var result = productService.getCatalogProducts("appraiser-id", true, 1, 10, null, null, null);

            assertThat(result.result()).hasSize(1);
            verify(productRepository).findCatalogProductsForAppraiser(
                    eq("appraiser-id"),
                    isNull(),
                    isNull(),
                    isNull(),
                    eq(ProductStatus.PENDING_APPRAISAL),
                    eq(ProductStatus.UNDER_APPRAISAL),
                    anyList(),
                    any(),
                    any());
        }

        @Test
        @DisplayName("should pass APPRAISED status filter through appraiser workflow query")
        void getCatalogProducts_appraiserStatusFilter() {
            when(productRepository.findCatalogProductsForAppraiser(
                    eq("appraiser-id"),
                    eq(ProductStatus.APPRAISED),
                    isNull(),
                    isNull(),
                    eq(ProductStatus.PENDING_APPRAISAL),
                    eq(ProductStatus.UNDER_APPRAISAL),
                    anyList(),
                    any(),
                    any()))
                    .thenReturn(new PageImpl<>(Collections.emptyList(), PageRequest.of(0, 10), 0));

            var result = productService.getCatalogProducts("appraiser-id", true, 1, 10, null, "appraised", null);

            assertThat(result.result()).isEmpty();
            verify(productRepository).findCatalogProductsForAppraiser(
                    eq("appraiser-id"),
                    eq(ProductStatus.APPRAISED),
                    isNull(),
                    isNull(),
                    eq(ProductStatus.PENDING_APPRAISAL),
                    eq(ProductStatus.UNDER_APPRAISAL),
                    anyList(),
                    any(),
                    any());
        }
    }

    // =========================================================================
    // getProductDetail access control
    // =========================================================================

    @Nested
    @DisplayName("getProductDetail access control")
    class GetProductDetail {

        @BeforeEach
        void setupDetailMocks() {
            // Lenient because denied-access tests throw before reaching buildProductDetailRes()
            lenient().when(userRepository.findById(SELLER_ID)).thenReturn(Optional.of(new User()));
            lenient().when(productImageRepository.findByProductIdOrderBySortOrderAsc(PRODUCT_ID))
                    .thenReturn(Collections.emptyList());
        }

        @Test
        @DisplayName("APPRAISED product — owner can view")
        void getDetail_appraised_ownerAllowed() {
            Product product = createProductWithStatus(ProductStatus.APPRAISED);
            product.setCategory(new Category());
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            ProductDetailRes result = productService.getProductDetail(PRODUCT_ID, SELLER_ID, false);
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("APPRAISED product — unauthenticated access denied")
        void getDetail_appraised_unauthenticatedDenied() {
            Product product = createProductWithStatus(ProductStatus.APPRAISED);
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.getProductDetail(PRODUCT_ID, null, false),
                    ErrorCode.PRODUCT_NOT_FOUND);
        }

        @Test
        @DisplayName("APPRAISED product - reviewing appraiser can view")
        void getDetail_appraised_reviewingAppraiserAllowed() {
            Product product = createProductWithStatus(ProductStatus.APPRAISED);
            product.setCategory(new Category());
            product.setAppraisalReport(createAppraisalReport("appraiser-id"));
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            ProductDetailRes result = productService.getProductDetail(PRODUCT_ID, "appraiser-id", true);
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("APPRAISED product - reviewing appraiser sees internal report fields")
        void getDetail_appraised_reviewingAppraiserSeesInternalFields() {
            Product product = createProductWithStatus(ProductStatus.APPRAISED);
            product.setCategory(new Category());
            product.setAppraisalReport(createAppraisalReport("appraiser-id"));

            MediaAsset proofAsset = createActiveProductMediaAsset(200L);
            AppraisalImage proofImage = new AppraisalImage();
            proofImage.setId(7L);
            proofImage.setAppraisalReportId(42L);
            proofImage.setMediaId(200L);
            proofImage.setDescription("End-grain close-up");
            proofImage.setMediaAsset(proofAsset);

            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(appraisalImageRepository.findByAppraisalReportIdOrderByIdAsc(42L)).thenReturn(List.of(proofImage));
            when(mediaUrlBuilder.buildAppraisalImageUrl(proofAsset)).thenReturn("https://cdn.example/proof.jpg");

            ProductDetailRes result = productService.getProductDetail(PRODUCT_ID, "appraiser-id", true);

            assertThat(result.appraisalReport()).isNotNull();
            assertThat(result.appraisalReport().appraiserNotes()).isEqualTo("Verified grain and finish.");
            assertThat(result.appraisalReport().sellerAccuracy()).isEqualByComparingTo("4.5");
            assertThat(result.appraisalReport().proofImages()).hasSize(1);
            assertThat(result.appraisalReport().proofImages().get(0).imageUrl())
                    .isEqualTo("https://cdn.example/proof.jpg");
        }

        @Test
        @DisplayName("APPRAISED product - owner sees review details but not seller accuracy")
        void getDetail_appraised_ownerSeesReviewDetailsWithoutSellerAccuracy() {
            Product product = createProductWithStatus(ProductStatus.APPRAISED);
            product.setCategory(new Category());
            product.setAppraisalReport(createAppraisalReport("appraiser-id"));

            MediaAsset proofAsset = createActiveProductMediaAsset(200L);
            AppraisalImage proofImage = new AppraisalImage();
            proofImage.setId(7L);
            proofImage.setAppraisalReportId(42L);
            proofImage.setMediaId(200L);
            proofImage.setDescription("End-grain close-up");
            proofImage.setMediaAsset(proofAsset);

            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(appraisalImageRepository.findByAppraisalReportIdOrderByIdAsc(42L)).thenReturn(List.of(proofImage));
            when(mediaUrlBuilder.buildAppraisalImageUrl(proofAsset)).thenReturn("https://cdn.example/proof.jpg");

            ProductDetailRes result = productService.getProductDetail(PRODUCT_ID, SELLER_ID, false);

            assertThat(result.appraisalReport()).isNotNull();
            assertThat(result.appraisalReport().appraiserNotes()).isEqualTo("Verified grain and finish.");
            assertThat(result.appraisalReport().sellerAccuracy()).isNull();
            assertThat(result.appraisalReport().proofImages()).hasSize(1);
            assertThat(result.appraisalReport().proofImages().get(0).imageUrl())
                    .isEqualTo("https://cdn.example/proof.jpg");
        }

        @Test
        @DisplayName("APPRAISED product - other appraiser denied")
        void getDetail_appraised_otherAppraiserDenied() {
            Product product = createProductWithStatus(ProductStatus.APPRAISED);
            product.setAppraisalReport(createAppraisalReport("reviewer-1"));
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.getProductDetail(PRODUCT_ID, "appraiser-id", true),
                    ErrorCode.PRODUCT_NOT_FOUND);
        }

        @Test
        @DisplayName("DRAFT product — owner can view")
        void getDetail_draft_ownerAllowed() {
            Product product = createDraftProduct();
            product.setCategory(new Category());
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            ProductDetailRes result = productService.getProductDetail(PRODUCT_ID, SELLER_ID, false);
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("DRAFT product — non-owner denied")
        void getDetail_draft_nonOwnerDenied() {
            Product product = createDraftProduct();
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.getProductDetail(PRODUCT_ID, OTHER_SELLER_ID, false),
                    ErrorCode.PRODUCT_NOT_FOUND);
        }

        @Test
        @DisplayName("PENDING_APPRAISAL — appraiser can view")
        void getDetail_pending_appraiserAllowed() {
            Product product = createProductWithStatus(ProductStatus.PENDING_APPRAISAL);
            product.setCategory(new Category());
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            ProductDetailRes result = productService.getProductDetail(PRODUCT_ID, "appraiser-id", true);
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("PENDING_APPRAISAL — random user denied")
        void getDetail_pending_randomUserDenied() {
            Product product = createProductWithStatus(ProductStatus.PENDING_APPRAISAL);
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.getProductDetail(PRODUCT_ID, OTHER_SELLER_ID, false),
                    ErrorCode.PRODUCT_NOT_FOUND);
        }

        @Test
        @DisplayName("UNDER_APPRAISAL - other appraiser gets claim conflict")
        void getDetail_underAppraisal_otherAppraiserGetsClaimConflict() {
            Product product = createProductWithStatus(ProductStatus.UNDER_APPRAISAL);
            product.setAppraisalClaimedBy("reviewer-1");
            product.setAppraisalClaimExpiresAt(Instant.now().plusSeconds(3600));
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.getProductDetail(PRODUCT_ID, "appraiser-id", true),
                    ErrorCode.APPRAISAL_CLAIM_CONFLICT);
        }

        @Test
        @DisplayName("REJECTED product — owner can view")
        void getDetail_rejected_ownerAllowed() {
            Product product = createProductWithStatus(ProductStatus.REJECTED);
            product.setCategory(new Category());
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            ProductDetailRes result = productService.getProductDetail(PRODUCT_ID, SELLER_ID, false);
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("REJECTED product - reviewing appraiser can view")
        void getDetail_rejected_reviewingAppraiserAllowed() {
            Product product = createProductWithStatus(ProductStatus.REJECTED);
            product.setCategory(new Category());
            product.setAppraisalReport(createAppraisalReport("appraiser-id"));
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            ProductDetailRes result = productService.getProductDetail(PRODUCT_ID, "appraiser-id", true);
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("REJECTED product - other appraiser denied")
        void getDetail_rejected_otherAppraiserDenied() {
            Product product = createProductWithStatus(ProductStatus.REJECTED);
            product.setAppraisalReport(createAppraisalReport("reviewer-1"));
            when(productRepository.findByIdWithCategoryAndAppraisalReport(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> productService.getProductDetail(PRODUCT_ID, "appraiser-id", true),
                    ErrorCode.PRODUCT_NOT_FOUND);
        }
    }
}
