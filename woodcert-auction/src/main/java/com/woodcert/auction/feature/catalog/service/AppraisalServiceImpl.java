package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.dto.request.AppraisalImageReq;
import com.woodcert.auction.feature.catalog.dto.request.CreateAppraisalReq;
import com.woodcert.auction.feature.catalog.dto.response.AppraisalSubmitRes;
import com.woodcert.auction.feature.catalog.entity.*;
import com.woodcert.auction.feature.catalog.repository.AppraisalImageRepository;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.dto.request.CreateMediaUploadIntentReq;
import com.woodcert.auction.feature.media.dto.response.MediaUploadIntentRes;
import com.woodcert.auction.feature.media.entity.MediaAsset;
import com.woodcert.auction.feature.media.entity.MediaResourceType;
import com.woodcert.auction.feature.media.entity.MediaStatus;
import com.woodcert.auction.feature.media.entity.MediaUsageType;
import com.woodcert.auction.feature.media.service.MediaAssetService;
import com.woodcert.auction.feature.media.support.MediaUploadContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.Year;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppraisalServiceImpl implements AppraisalService {

    private final ProductRepository productRepository;
    private final AppraisalReportRepository appraisalReportRepository;
    private final AppraisalImageRepository appraisalImageRepository;
    private final UserRepository userRepository;
    private final MediaAssetService mediaAssetService;
    private final CloudinaryProperties cloudinaryProperties;

    @Override
    @Transactional
    public MediaUploadIntentRes createAppraisalImageUploadIntent(String appraiserId, CreateMediaUploadIntentReq request) {
        ensureUserExists(appraiserId);
        MediaUploadContext context = buildAppraisalImageContext(appraiserId);
        return mediaAssetService.createUploadIntent(context, request);
    }

    @Override
    @Transactional
    public AppraisalSubmitRes submitAppraisal(String appraiserId, Long productId, CreateAppraisalReq request) {
        // Validate product exists and is PENDING_APPRAISAL
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (product.getStatus() != ProductStatus.PENDING_APPRAISAL) {
            throw new AppException(ErrorCode.PRODUCT_NOT_PENDING);
        }

        // Check no existing appraisal — AppraisalReport is immutable once submitted
        if (appraisalReportRepository.existsByProductId(productId)) {
            throw new AppException(ErrorCode.PRODUCT_ALREADY_APPRAISED);
        }

        // Business validation: reject requires appraiser notes
        if (Boolean.FALSE.equals(request.isAuthentic())) {
            if (request.appraiserNotes() == null || request.appraiserNotes().isBlank()) {
                throw new AppException(ErrorCode.REJECTION_NOTES_REQUIRED);
            }
        }

        // Validate proof images (if provided)
        validateAppraisalProofImages(request.proofImages(), appraiserId);

        // Step 1: Save report with temporary certificate code (UUID-based)
        // This avoids the race condition of count() + 1
        String tempCertCode = "PENDING-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Build digital signature from report data
        String digitalSignature = generateDigitalSignature(
                productId, appraiserId, request.verifiedMaterial(),
                request.estimatedValue(), request.isAuthentic(), tempCertCode
        );

        AppraisalReport report = new AppraisalReport();
        report.setProductId(productId);
        report.setAppraiserId(appraiserId);
        report.setCertificateCode(tempCertCode);
        report.setVerifiedMaterial(request.verifiedMaterial().trim());
        report.setOrigin(trimOrNull(request.origin()));
        report.setAgeEstimation(trimOrNull(request.ageEstimation()));
        report.setConditionGrade(request.conditionGrade());
        report.setEstimatedValue(request.estimatedValue());
        report.setAuthentic(request.isAuthentic());
        report.setAppraiserNotes(request.appraiserNotes());
        report.setSellerAccuracy(request.sellerAccuracy());
        report.setDigitalSignature(digitalSignature);
        report.setAppraisedAt(Instant.now());
        report = appraisalReportRepository.save(report);

        // Step 2: Update certificate code with ID-based format (race-condition safe)
        String certificateCode = String.format("CERT-%d-%05d", Year.now().getValue(), report.getId());
        report.setCertificateCode(certificateCode);
        report = appraisalReportRepository.save(report);

        // Save proof images
        if (request.proofImages() != null && !request.proofImages().isEmpty()) {
            List<AppraisalImage> appraisalImages = new ArrayList<>();
            for (AppraisalImageReq imgReq : request.proofImages()) {
                AppraisalImage image = new AppraisalImage();
                image.setAppraisalReportId(report.getId());
                image.setMediaId(imgReq.mediaId());
                image.setDescription(trimOrNull(imgReq.description()));
                appraisalImages.add(image);
            }
            appraisalImageRepository.saveAll(appraisalImages);
        }

        // Update product status
        ProductStatus newStatus;
        if (request.isAuthentic()) {
            newStatus = ProductStatus.APPRAISED;
        } else {
            newStatus = ProductStatus.REJECTED;
            product.setRejectedReason(request.appraiserNotes());
        }
        product.setStatus(newStatus);
        productRepository.save(product);

        log.info("Product {} appraised by {} — result: {}, certificate: {}",
                productId, appraiserId, newStatus, certificateCode);

        return new AppraisalSubmitRes(report.getId(), productId, certificateCode, newStatus);
    }

    // =========================================================================
    // Validation helpers
    // =========================================================================

    /**
     * Validate appraisal proof images:
     * - No duplicate mediaId references
     * - Each asset owned by the appraiser, ACTIVE, and of type APPRAISAL_IMAGE
     */
    private void validateAppraisalProofImages(List<AppraisalImageReq> proofImages, String appraiserId) {
        if (proofImages == null || proofImages.isEmpty()) {
            return;
        }

        // No duplicate mediaId
        Set<Long> mediaIds = new HashSet<>();
        for (AppraisalImageReq imgReq : proofImages) {
            if (!mediaIds.add(imgReq.mediaId())) {
                throw new AppException(ErrorCode.DUPLICATE_MEDIA_ID);
            }
        }

        // Validate each asset
        for (AppraisalImageReq imgReq : proofImages) {
            MediaAsset asset = mediaAssetService.getOwnedAssetOrThrow(imgReq.mediaId(), appraiserId);
            if (asset.getStatus() != MediaStatus.ACTIVE) {
                throw new AppException(ErrorCode.INVALID_REQUEST,
                        "Media asset " + imgReq.mediaId() + " is not confirmed yet");
            }
            if (asset.getUsageType() != MediaUsageType.APPRAISAL_IMAGE) {
                throw new AppException(ErrorCode.MEDIA_USAGE_TYPE_MISMATCH);
            }
        }
    }

    // =========================================================================
    // Private helpers
    // =========================================================================

    /**
     * Generate digital signature by SHA-256 hashing the key report data.
     */
    private String generateDigitalSignature(
            Long productId, String appraiserId, String verifiedMaterial,
            BigDecimal estimatedValue, boolean isAuthentic, String certificateCode) {
        try {
            String payload = String.join("|",
                    String.valueOf(productId),
                    appraiserId,
                    verifiedMaterial,
                    estimatedValue.toPlainString(),
                    String.valueOf(isAuthentic),
                    certificateCode,
                    Instant.now().toString()
            );
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(payload.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private MediaUploadContext buildAppraisalImageContext(String appraiserId) {
        String folder = cloudinaryProperties.getBaseFolder().trim() + "/users/" + appraiserId + "/appraisals";
        return new MediaUploadContext(
                appraiserId,
                MediaUsageType.APPRAISAL_IMAGE,
                MediaResourceType.IMAGE,
                folder,
                cloudinaryProperties.getUpload().getImageMaxBytes(),
                "image/"
        );
    }

    private void ensureUserExists(String userId) {
        if (!userRepository.existsById(userId)) {
            throw new AppException(ErrorCode.RESOURCE_NOT_FOUND, "User not found");
        }
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
