package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.config.CatalogProperties;
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
import com.woodcert.auction.feature.identity.service.SellerReputationService;
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
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
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
    @Mock private CatalogProperties catalogProperties;
    @Mock private SellerReputationService sellerReputationService;

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

    private Product createClaimedProduct(String appraiserId, Instant expiresAt) {
        Product p = createProductWithStatus(ProductStatus.UNDER_APPRAISAL);
        p.setAppraisalClaimedBy(appraiserId);
        p.setAppraisalClaimedAt(Instant.now().minusSeconds(60));
        p.setAppraisalClaimExpiresAt(expiresAt);
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
                notes, new BigDecimal("2.0"), proofImages
        );
    }

    private void setupSubmitMocks() {
        when(productRepository.findByIdForUpdate(PRODUCT_ID))
                .thenReturn(Optional.of(createClaimedProduct(APPRAISER_ID, Instant.now().plusSeconds(3600))));
        when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(false);
        when(appraisalReportRepository.save(any(AppraisalReport.class))).thenAnswer(inv -> {
            AppraisalReport report = inv.getArgument(0);
            if (report.getId() == null) report.setId(REPORT_ID);
            return report;
        });
        when(appraisalReportRepository.calculateAverageSellerAccuracyBySellerId("seller-uuid-001"))
                .thenReturn(Optional.of(new BigDecimal("4.50")));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static String expectedDigitalSignature(AppraisalReport report) {
        try {
            String payload = String.join("|",
                    String.valueOf(report.getProductId()),
                    report.getAppraiserId(),
                    report.getVerifiedMaterial(),
                    report.getEstimatedValue().toPlainString(),
                    String.valueOf(report.isAuthentic()),
                    report.getCertificateCode(),
                    report.getAppraisedAt().toString()
            );
            byte[] hashBytes = MessageDigest.getInstance("SHA-256")
                    .digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new AssertionError(e);
        }
    }

    // =========================================================================
    // submitAppraisal — approve
    // =========================================================================

    @Nested
    @DisplayName("appraisal claim")
    class AppraisalClaim {

        @Test
        @DisplayName("should claim pending product")
        void claim_pending_success() {
            Product product = createPendingProduct();
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(catalogProperties.getAppraisalClaimTimeout()).thenReturn(Duration.ofHours(24));
            when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

            appraisalService.claimProductForAppraisal(APPRAISER_ID, PRODUCT_ID);

            assertThat(product.getStatus()).isEqualTo(ProductStatus.UNDER_APPRAISAL);
            assertThat(product.getAppraisalClaimedBy()).isEqualTo(APPRAISER_ID);
            assertThat(product.getAppraisalClaimedAt()).isNotNull();
            assertThat(product.getAppraisalClaimExpiresAt()).isAfter(product.getAppraisalClaimedAt());
        }

        @Test
        @DisplayName("should reject claim when another active appraiser owns it")
        void claim_activeOtherAppraiser_throws() {
            Product product = createClaimedProduct("other-appraiser", Instant.now().plusSeconds(3600));
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> appraisalService.claimProductForAppraisal(APPRAISER_ID, PRODUCT_ID),
                    ErrorCode.APPRAISAL_CLAIM_CONFLICT);
        }

        @Test
        @DisplayName("should allow claiming expired claim")
        void claim_expired_success() {
            Product product = createClaimedProduct("other-appraiser", Instant.now().minusSeconds(1));
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(catalogProperties.getAppraisalClaimTimeout()).thenReturn(Duration.ofHours(24));
            when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

            appraisalService.claimProductForAppraisal(APPRAISER_ID, PRODUCT_ID);

            assertThat(product.getStatus()).isEqualTo(ProductStatus.UNDER_APPRAISAL);
            assertThat(product.getAppraisalClaimedBy()).isEqualTo(APPRAISER_ID);
        }

        @Test
        @DisplayName("should release own claim back to queue")
        void release_ownClaim_success() {
            Product product = createClaimedProduct(APPRAISER_ID, Instant.now().plusSeconds(3600));
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

            appraisalService.releaseAppraisalClaim(APPRAISER_ID, PRODUCT_ID);

            assertThat(product.getStatus()).isEqualTo(ProductStatus.PENDING_APPRAISAL);
            assertThat(product.getAppraisalClaimedBy()).isNull();
            assertThat(product.getAppraisalClaimExpiresAt()).isNull();
        }

        @Test
        @DisplayName("should reject release by non-owner")
        void release_nonOwner_throws() {
            Product product = createClaimedProduct("other-appraiser", Instant.now().plusSeconds(3600));
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> appraisalService.releaseAppraisalClaim(APPRAISER_ID, PRODUCT_ID),
                    ErrorCode.APPRAISAL_CLAIM_REQUIRED);
        }
    }

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

        @Test
        @DisplayName("should sign final certificate code and fixed appraisedAt")
        void submitAppraisal_signatureUsesFinalCertificateCodeAndAppraisedAt() {
            setupSubmitMocks();

            appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null));

            ArgumentCaptor<AppraisalReport> reportCaptor = ArgumentCaptor.forClass(AppraisalReport.class);
            verify(appraisalReportRepository, atLeast(2)).save(reportCaptor.capture());
            AppraisalReport finalReport = reportCaptor.getAllValues()
                    .get(reportCaptor.getAllValues().size() - 1);

            assertThat(finalReport.getCertificateCode()).matches("CERT-\\d{4}-00042");
            assertThat(finalReport.getDigitalSignature()).isEqualTo(expectedDigitalSignature(finalReport));
            assertThat(finalReport.getDigitalSignature()).doesNotStartWith("PENDING-");
        }

        @Test
        @DisplayName("should refresh seller reputation from average seller accuracy")
        void submitAppraisal_refreshesSellerReputation() {
            setupSubmitMocks();

            appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null));

            verify(sellerReputationService).updateReputationScore("seller-uuid-001", new BigDecimal("4.5"));
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
            Product product = createClaimedProduct(APPRAISER_ID, Instant.now().plusSeconds(3600));
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(false);

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID,
                            rejectRequest(null, null)),
                    ErrorCode.REJECTION_NOTES_REQUIRED);
        }

        @Test
        @DisplayName("should throw when isAuthentic=false and appraiserNotes is blank")
        void submitAppraisal_reject_blankNotes_throws() {
            Product product = createClaimedProduct(APPRAISER_ID, Instant.now().plusSeconds(3600));
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));
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
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null)),
                    ErrorCode.PRODUCT_NOT_PENDING);
        }

        @Test
        @DisplayName("should reject when product already has appraisal")
        void submitAppraisal_alreadyAppraised_throws() {
            when(productRepository.findByIdForUpdate(PRODUCT_ID))
                    .thenReturn(Optional.of(createClaimedProduct(APPRAISER_ID, Instant.now().plusSeconds(3600))));
            when(appraisalReportRepository.existsByProductId(PRODUCT_ID)).thenReturn(true);

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null)),
                    ErrorCode.PRODUCT_ALREADY_APPRAISED);
        }

        @Test
        @DisplayName("should reject duplicate mediaId in proof images")
        void submitAppraisal_duplicateMediaId_throws() {
            when(productRepository.findByIdForUpdate(PRODUCT_ID))
                    .thenReturn(Optional.of(createClaimedProduct(APPRAISER_ID, Instant.now().plusSeconds(3600))));
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
            when(productRepository.findByIdForUpdate(PRODUCT_ID))
                    .thenReturn(Optional.of(createClaimedProduct(APPRAISER_ID, Instant.now().plusSeconds(3600))));
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
            when(productRepository.findByIdForUpdate(PRODUCT_ID))
                    .thenReturn(Optional.of(createClaimedProduct(APPRAISER_ID, Instant.now().plusSeconds(3600))));
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
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.empty());

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null)),
                    ErrorCode.PRODUCT_NOT_FOUND);
        }

        @Test
        @DisplayName("should reject when appraiser does not own active claim")
        void submitAppraisal_nonClaimOwner_throws() {
            Product product = createClaimedProduct("other-appraiser", Instant.now().plusSeconds(3600));
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null)),
                    ErrorCode.APPRAISAL_CLAIM_REQUIRED);
        }

        @Test
        @DisplayName("should reject when own claim expired")
        void submitAppraisal_expiredClaim_throws() {
            Product product = createClaimedProduct(APPRAISER_ID, Instant.now().minusSeconds(1));
            when(productRepository.findByIdForUpdate(PRODUCT_ID)).thenReturn(Optional.of(product));

            assertAppException(
                    () -> appraisalService.submitAppraisal(APPRAISER_ID, PRODUCT_ID, approveRequest(null)),
                    ErrorCode.APPRAISAL_CLAIM_REQUIRED);
        }
    }
}
