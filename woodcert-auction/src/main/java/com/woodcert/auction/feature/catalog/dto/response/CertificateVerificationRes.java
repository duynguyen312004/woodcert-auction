package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;
import com.woodcert.auction.feature.catalog.entity.Product;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record CertificateVerificationRes(
        String certificateCode,
        Long productId,
        String productTitle,
        String description,
        List<String> imageUrls,
        List<String> appraisalImageUrls,
        CategoryRes category,
        String material,
        String verifiedMaterial,
        String origin,
        String ageEstimation,
        ConditionGrade conditionGrade,
        BigDecimal estimatedValue,
        boolean authentic,
        String integrityHash,
        Instant appraisedAt,
        String dimensions,
        BigDecimal weight,
        String sellerName,
        String appraiserName) {
    public static CertificateVerificationRes fromEntity(AppraisalReport report) {
        Product product = report.getProduct();
        
        List<String> urls = List.of();
        if (product != null && product.getImages() != null) {
            urls = product.getImages().stream()
                    .map(img -> img.getMediaAsset() != null ? img.getMediaAsset().getSecureUrl() : null)
                    .filter(java.util.Objects::nonNull)
                    .toList();
        }

        List<String> appraisalUrls = List.of();
        if (report.getImages() != null) {
            appraisalUrls = report.getImages().stream()
                    .map(img -> img.getMediaAsset() != null ? img.getMediaAsset().getSecureUrl() : null)
                    .filter(java.util.Objects::nonNull)
                    .toList();
        }

        String sellerName = null;
        if (product != null && product.getSeller() != null) {
            sellerName = product.getSeller().getSellerProfile() != null 
                    ? product.getSeller().getSellerProfile().getStoreName() 
                    : product.getSeller().getFullName();
        }

        String appraiserName = report.getAppraiser() != null ? report.getAppraiser().getFullName() : null;

        return new CertificateVerificationRes(
                report.getCertificateCode(),
                product != null ? product.getId() : null,
                product != null ? product.getTitle() : null,
                product != null ? product.getDescription() : null,
                urls,
                appraisalUrls,
                product != null && product.getCategory() != null ? CategoryRes.fromEntity(product.getCategory()) : null,
                product != null ? product.getMaterial() : null,
                report.getVerifiedMaterial(),
                report.getOrigin(),
                report.getAgeEstimation(),
                report.getConditionGrade(),
                report.getEstimatedValue(),
                report.isAuthentic(),
                report.getIntegrityHash(),
                report.getAppraisedAt(),
                product != null ? product.getDimensions() : null,
                product != null ? product.getWeight() : null,
                sellerName,
                appraiserName);
    }
}
