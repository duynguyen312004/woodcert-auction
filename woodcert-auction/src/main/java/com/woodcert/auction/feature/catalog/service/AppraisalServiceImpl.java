package com.woodcert.auction.feature.catalog.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.catalog.config.CatalogProperties;
import com.woodcert.auction.feature.catalog.dto.request.AppraisalImageReq;
import com.woodcert.auction.feature.catalog.dto.request.CreateAppraisalReq;
import com.woodcert.auction.feature.catalog.dto.response.AppraisalSubmitRes;
import com.woodcert.auction.feature.catalog.entity.*;
import com.woodcert.auction.feature.catalog.repository.AppraisalImageRepository;
import com.woodcert.auction.feature.catalog.repository.AppraisalReportRepository;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.identity.repository.UserRepository;
import com.woodcert.auction.feature.identity.service.SellerReputationService;
import com.woodcert.auction.feature.media.config.CloudinaryProperties;
import com.woodcert.auction.feature.media.dto.request.ConfirmMediaUploadReq;
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
import java.math.RoundingMode;
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
    private final CatalogProperties catalogProperties;
    private final SellerReputationService sellerReputationService;

    @Override
    @Transactional
    public MediaUploadIntentRes createAppraisalImageUploadIntent(String appraiserId, CreateMediaUploadIntentReq request) {
        // Bước 1: Kiểm tra appraiser tồn tại trước khi cấp intent upload ảnh chứng minh.
        ensureUserExists(appraiserId);

        // Bước 2: Tạo ngữ cảnh upload riêng cho ảnh thẩm định để media service kiểm soát usage type.
        MediaUploadContext context = buildAppraisalImageContext(appraiserId);
        return mediaAssetService.createUploadIntent(context, request);
    }

    @Override
    @Transactional
    public void confirmAppraisalImageUpload(String appraiserId, ConfirmMediaUploadReq request) {
        // Catalog owns the appraisal-image use case; media only verifies the generic uploaded asset.
        mediaAssetService.confirmOwnedUpload(appraiserId, request);
    }

    @Override
    @Transactional
    public void claimProductForAppraisal(String appraiserId, Long productId) {
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        Instant now = Instant.now();
        if (product.getStatus() == ProductStatus.UNDER_APPRAISAL && isActiveClaim(product, now)) {
            if (!appraiserId.equals(product.getAppraisalClaimedBy())) {
                throw new AppException(ErrorCode.APPRAISAL_CLAIM_CONFLICT);
            }
            return;
        }

        if (product.getStatus() != ProductStatus.PENDING_APPRAISAL
                && product.getStatus() != ProductStatus.UNDER_APPRAISAL) {
            throw new AppException(ErrorCode.PRODUCT_NOT_PENDING);
        }

        product.setStatus(ProductStatus.UNDER_APPRAISAL);
        product.setAppraisalClaimedBy(appraiserId);
        product.setAppraisalClaimedAt(now);
        product.setAppraisalClaimExpiresAt(now.plus(catalogProperties.getAppraisalClaimTimeout()));
        productRepository.save(product);

        log.info("Product {} claimed for appraisal by {}", productId, appraiserId);
    }

    @Override
    @Transactional
    public void releaseAppraisalClaim(String appraiserId, Long productId) {
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (product.getStatus() != ProductStatus.UNDER_APPRAISAL
                || !appraiserId.equals(product.getAppraisalClaimedBy())) {
            throw new AppException(ErrorCode.APPRAISAL_CLAIM_REQUIRED);
        }

        clearAppraisalClaim(product);
        product.setStatus(ProductStatus.PENDING_APPRAISAL);
        productRepository.save(product);

        log.info("Product {} appraisal claim released by {}", productId, appraiserId);
    }

    @Override
    @Transactional
    public AppraisalSubmitRes submitAppraisal(String appraiserId, Long productId, CreateAppraisalReq request) {
        // Bước 1: Đọc sản phẩm bằng lock và chỉ cho appraiser đang giữ claim nộp report.
        Product product = productRepository.findByIdForUpdate(productId)
                .orElseThrow(() -> new AppException(ErrorCode.PRODUCT_NOT_FOUND));

        if (product.getStatus() != ProductStatus.UNDER_APPRAISAL) {
            throw new AppException(ErrorCode.PRODUCT_NOT_PENDING);
        }
        if (!appraiserId.equals(product.getAppraisalClaimedBy())
                || !isActiveClaim(product, Instant.now())) {
            throw new AppException(ErrorCode.APPRAISAL_CLAIM_REQUIRED);
        }

        // Bước 2: Chặn tạo báo cáo lần hai vì appraisal report được xem là immutable sau khi nộp.
        if (appraisalReportRepository.existsByProductId(productId)) {
            throw new AppException(ErrorCode.PRODUCT_ALREADY_APPRAISED);
        }

        // Bước 3: Nếu từ chối tính xác thực thì bắt buộc có ghi chú giải thích cho seller.
        if (Boolean.FALSE.equals(request.isAuthentic())) {
            if (request.appraiserNotes() == null || request.appraiserNotes().isBlank()) {
                throw new AppException(ErrorCode.REJECTION_NOTES_REQUIRED);
            }
        }

        // Bước 4: Kiểm tra ảnh chứng minh nếu appraiser gửi kèm.
        validateAppraisalProofImages(request.proofImages(), appraiserId);

        // Bước 5: Lưu report với mã chứng nhận tạm dựa trên UUID để tránh race condition kiểu count() + 1.
        String tempCertCode = "PENDING-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        // Bước 6: Tạo chữ ký số từ dữ liệu cốt lõi của báo cáo để truy vết tính toàn vẹn.
        Instant appraisedAt = Instant.now();

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
        report.setDigitalSignature("PENDING-" + UUID.randomUUID());
        report.setAppraisedAt(appraisedAt);
        report = appraisalReportRepository.save(report);

        // Bước 7: Sau khi có report id, cập nhật mã chứng nhận chính thức theo năm và id.
        String certificateCode = String.format("CERT-%d-%05d", Year.now().getValue(), report.getId());
        report.setCertificateCode(certificateCode);
        report.setDigitalSignature(generateDigitalSignature(
                productId,
                appraiserId,
                request.verifiedMaterial(),
                request.estimatedValue(),
                request.isAuthentic(),
                certificateCode,
                appraisedAt
        ));
        report = appraisalReportRepository.save(report);

        // Bước 8: Lưu các ảnh chứng minh vào bảng appraisal_images nếu có.
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

        // Bước 9: Cập nhật trạng thái sản phẩm dựa trên kết quả thẩm định.
        ProductStatus newStatus;
        if (request.isAuthentic()) {
            newStatus = ProductStatus.APPRAISED;
        } else {
            newStatus = ProductStatus.REJECTED;
            product.setRejectedReason(request.appraiserNotes());
        }
        product.setStatus(newStatus);
        clearAppraisalClaim(product);
        productRepository.save(product);
        refreshSellerReputation(product.getSellerId());

        log.info("Product {} appraised by {} — result: {}, certificate: {}",
                productId, appraiserId, newStatus, certificateCode);

        return new AppraisalSubmitRes(report.getId(), productId, certificateCode, newStatus);
    }

    // =========================================================================
    // Helper kiểm tra dữ liệu
    // =========================================================================

    /**
     * Kiểm tra ảnh chứng minh của báo cáo thẩm định:
     * - Không trùng mediaId.
     * - Từng asset thuộc appraiser, đã ACTIVE và đúng type APPRAISAL_IMAGE.
     */
    private void validateAppraisalProofImages(List<AppraisalImageReq> proofImages, String appraiserId) {
        if (proofImages == null || proofImages.isEmpty()) {
            return;
        }

        // Bước 1: Chặn một media asset bị dùng nhiều lần trong cùng báo cáo.
        Set<Long> mediaIds = new HashSet<>();
        for (AppraisalImageReq imgReq : proofImages) {
            if (!mediaIds.add(imgReq.mediaId())) {
                throw new AppException(ErrorCode.DUPLICATE_MEDIA_ID);
            }
        }

        // Bước 2: Kiểm tra quyền sở hữu, trạng thái upload và usage type của từng asset.
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
     * Tạo chữ ký số bằng cách hash SHA-256 các dữ liệu chính của báo cáo.
     */
    private String generateDigitalSignature(
            Long productId, String appraiserId, String verifiedMaterial,
            BigDecimal estimatedValue, boolean isAuthentic, String certificateCode, Instant appraisedAt) {
        try {
            // Bước 1: Ghép payload theo thứ tự cố định để cùng dữ liệu sẽ cho cùng cấu trúc hash.
            String payload = String.join("|",
                    String.valueOf(productId),
                    appraiserId,
                    verifiedMaterial,
                    estimatedValue.toPlainString(),
                    String.valueOf(isAuthentic),
                    certificateCode,
                    appraisedAt.toString()
            );

            // Bước 2: Hash payload và trả về chuỗi hex để lưu cùng appraisal report.
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

    private boolean isActiveClaim(Product product, Instant now) {
        Instant expiresAt = product.getAppraisalClaimExpiresAt();
        return product.getAppraisalClaimedBy() != null
                && expiresAt != null
                && expiresAt.isAfter(now);
    }

    private void clearAppraisalClaim(Product product) {
        product.setAppraisalClaimedBy(null);
        product.setAppraisalClaimedAt(null);
        product.setAppraisalClaimExpiresAt(null);
    }

    /**
     * Tính lại điểm uy tín seller từ toàn bộ điểm trung thực đã được appraisal.
     */
    private void refreshSellerReputation(String sellerId) {
        appraisalReportRepository.calculateAverageSellerAccuracyBySellerId(sellerId)
                .map(score -> score.setScale(1, RoundingMode.HALF_UP))
                .ifPresent(score -> sellerReputationService.updateReputationScore(sellerId, score));
    }

    private String trimOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
