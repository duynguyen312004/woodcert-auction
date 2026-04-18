package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.dto.request.AppraisalImageReq;
import com.woodcert.auction.feature.catalog.dto.request.CreateAppraisalReq;
import com.woodcert.auction.feature.catalog.dto.response.AppraisalSubmitRes;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductStatus;
import com.woodcert.auction.feature.catalog.repository.AppraisalImageRepository;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppraisalServiceImplTest {

    @Mock private ProductRepository productRepository;
    @Mock private AppraisalReportRepository appraisalReportRepository;
    @Mock private AppraisalImageRepository appraisalImageRepository;
    @Mock private UserRepository userRepository;
    @Mock private MediaAssetService mediaAssetService;
    @Mock private CloudinaryProperties cloudinaryProperties;

    @InjectMocks
    private AppraisalServiceImpl appraisalService;

    private static final String APPRAISER_ID = "appraiser-uuid-001";
    private static final Long PRODUCT_ID = 1L;
    private static final Long REPORT_ID = 42L;

    // =========================================================================
    // Helpers
    // =========================================================================

    private static void assertAppException(Runnable action, ErrorCode expected) {
        assertThatThrownBy(action::run)
                .isInstanceOf(AppException.class)
                .satisfies(e -> {
                    AppException appEx = (AppException) e;
                    assertThat(appEx.getStatusCode()).isEqualTo(expected.getStatusCode());
                    assertThat(appEx.getMessage()).isEqualTo(expected.getMessage());
                });
    }

    private Product createPendingProduct() {
        Product p = new Product();
        p.setId(PRODUCT_ID);
        p.setSellerId("seller-uuid-001");
        p.setCategoryId(1);
        p.setTitle("Test Wood Art");
        p.setStatus(ProductStatus.PENDING_APPRAISAL);
        return p;
    }

    private Product createProductWithStatus(ProductStatus status) {
        Product p = createPendingProduct();
        p.setStatus(status);
        return p;
    }

    private MediaAsset createActiveAppraisalMediaAsset(Long id) {
        MediaAsset asset = new MediaAsset();
        asset.setId(id);
        asset.setOwnerUserId(APPRAISER_ID);
        asset.setStatus(MediaStatus.ACTIVE);
        asset.setUsageType(MediaUsageType.APPRAISAL_IMAGE);
        return asset;
    }

    private CreateAppraisalReq approveRequest(List<AppraisalImageReq> proofImages) {
        return new CreateAppraisalReq(
                true, "Dalbergia tonkinensis", "Vietnam", "50-80 years",
                ConditionGrade.EXCELLENT, new BigDecimal("15000000"),
                "Beautiful piece, genuine.", new BigDecimal("4.5"), proofImages
        );
    }

    private CreateAppraisalReq rejectRequest(String notes, List<AppraisalImageReq> proofImages) {
        return new CreateAppraisalReq(
                false, "Unknown wood", null, null,
                ConditionGrade.POOR, BigDecimal.ZERO,
                notes, null, proofImages
        );
    }

    private void setupSubmitMocks() {
        when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(createPendingProduct()));
        when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(false);
        when(appraisalReportRepository.save(any(AppraisalReport.class))).thenAnswer(inv -> {
            AppraisalReport report = inv.getArgument(0);
            if (report.getId() == null) report.setId(REPORT_ID);
            return report;
        });
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    // =========================================================================
    // submitAppraisal — approve
    // =========================================================================

    @Nested
    @DisplayName("submitAppraisal — approve")
    class SubmitApprove {

        @Test
        @DisplayName("should approve product and set status APPRAISED")
        void submitAppraisal_approve_success() {
            setupSubmitMocks();

            AppraisalSubmitRes result = appraisalService.submitAppraisal(
                    APPRAISER_ID, PRODUCT_ID, approveRequest(null));

            assertThat(result).isNotNull();
            assertThat(result.newProductStatus()).isEqualTo(ProductStatus.APPRAISED);
            assertThat(result.reportId()).isEqualTo(REPORT_ID);

            ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
            verify(productRepository).save(productCaptor.capture());
            assertThat(productCaptor.getValue().getStatus()).isEqualTo(ProductStatus.APPRAISED);
        }

        @Test
        @DisplayName("should generate certificate code using report ID (not count)")
        void submitAppraisal_certificateCode_usesReportId() {
            setupSubmitMocks();

            AppraisalSubmitRes result = appraisalService.submitAppraisal(
                    APPRAISER_ID, PRODUCT_ID, approveRequest(null));

            assertThat(result.certificateCode()).matches("CERT-\\d{4}-00042");
        }
    }

    // =========================================================================
    // submitAppraisal — reject
    // =========================================================================

    @Nested
    @DisplayName("submitAppraisal — reject")
    class SubmitReject {

        @Test
        @DisplayName("should reject product with notes and set status REJECTED")
        void submitAppraisal_reject_success() {
            setupSubmitMocks();

            AppraisalSubmitRes result = appraisalService.submitAppraisal(
                    APPRAISER_ID, PRODUCT_ID,
                    rejectRequest("Material is not genuine", null));

            assertThat(result.newProductStatus()).isEqualTo(ProductStatus.REJECTED);

            ArgumentCaptor<Product> productCaptor = ArgumentCaptor.forClass(Product.class);
            verify(productRepository).save(productCaptor.capture());
            Product savedProduct = productCaptor.getValue();
            assertThat(savedProduct.getStatus()).isEqualTo(ProductStatus.REJECTED);
            assertThat(savedProduct.getRejectedReason()).isEqualTo("Material is not genuine");
        }

        @Test
        @DisplayName("should throw when isAuthentic=false and no appraiserNotes")
        void submitAppraisal_reject_noNotes_throws() {
            Product product = createPendingProduct();
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(false);

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID,
                            rejectRequest(null, null)),
                    ErrorCode.REJECTION_NOTES_REQUIRED);
        }

        @Test
        @DisplayName("should throw when isAuthentic=false and appraiserNotes is blank")
        void submitAppraisal_reject_blankNotes_throws() {
            Product product = createPendingProduct();
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(false);

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID,
                            rejectRequest("   ", null)),
                    ErrorCode.REJECTION_NOTES_REQUIRED);
        }
    }

    // =========================================================================
    // submitAppraisal — validation errors
    // =========================================================================

    @Nested
    @DisplayName("submitAppraisal — validation")
    class SubmitValidation {

        @Test
        @DisplayName("should reject when product is not PENDING_APPRAISAL")
        void submitAppraisal_notPending_throws() {
            Product product = createProductWithStatus(ProductStatus.DRAFT);
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null)),
                    ErrorCode.PRODUCT_NOT_PENDING);
        }

        @Test
        @DisplayName("should reject when product already has appraisal")
        void submitAppraisal_alreadyAppraised_throws() {
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(createPendingProduct()));
            when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(true);

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null)),
                    ErrorCode.PRODUCT_ALREADY_APPRAISED);
        }

        @Test
        @DisplayName("should reject duplicate mediaId in proof images")
        void submitAppraisal_duplicateMediaId_throws() {
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(createPendingProduct()));
            when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(false);

            List<AppraisalImageReq> proofImages = List.of(
                    new AppraisalImageReq(200L, "Photo 1"),
                    new AppraisalImageReq(200L, "Photo 2")
            );

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID,
                            approveRequest(proofImages)),
                    ErrorCode.DUPLICATE_MEDIA_ID);
        }

        @Test
        @DisplayName("should reject when proof image has wrong usage type")
        void submitAppraisal_mediaWrongUsageType_throws() {
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(createPendingProduct()));
            when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(false);

            MediaAsset wrongTypeAsset = createActiveAppraisalMediaAsset(200L);
            wrongTypeAsset.setUsageType(MediaUsageType.PRODUCT_IMAGE);
            when(mediaAssetService.getOwnedAssetOrThrow(200L, APPRAISER_ID)).thenReturn(wrongTypeAsset);

            List<AppraisalImageReq> proofImages = List.of(
                    new AppraisalImageReq(200L, "Photo")
            );

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID,
                            approveRequest(proofImages)),
                    ErrorCode.MEDIA_USAGE_TYPE_MISMATCH);
        }

        @Test
        @DisplayName("should reject when proof image media is not ACTIVE")
        void submitAppraisal_mediaNotActive_throws() {
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(createPendingProduct()));
            when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(false);

            MediaAsset pendingAsset = createActiveAppraisalMediaAsset(200L);
            pendingAsset.setStatus(MediaStatus.PENDING);
            when(mediaAssetService.getOwnedAssetOrThrow(200L, APPRAISER_ID)).thenReturn(pendingAsset);

            List<AppraisalImageReq> proofImages = List.of(
                    new AppraisalImageReq(200L, "Photo")
            );

            assertThatThrownBy(() ->
                    appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID,
                            approveRequest(proofImages)))
                    .isInstanceOf(AppException.class)
                    .satisfies(e -> {
                        AppException appEx = (AppException) e;
                        assertThat(appEx.getStatusCode()).isEqualTo(400);
                    });
        }

        @Test
        @DisplayName("should reject when product not found")
        void submitAppraisal_productNotFound_throws() {
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.empty());

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null)),
                    ErrorCode.PRODUCT_NOT_FOUND);
        }
    }
}
