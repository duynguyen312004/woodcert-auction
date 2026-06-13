package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Appraisal report response DTO. Owners can see review notes and proof images
 * for their product; seller accuracy remains visible only to the appraiser who
 * submitted the report.
 */
public record AppraisalReportRes(
        String certificateCode,
        String verifiedMaterial,
        String origin,
        String ageEstimation,
        ConditionGrade conditionGrade,
        BigDecimal estimatedValue,
        boolean isAuthentic,
        String integrityHash,
        Instant appraisedAt,
        String appraiserNotes,
        BigDecimal sellerAccuracy,
        List<AppraisalImageRes> proofImages
) {
    public static AppraisalReportRes fromEntity(AppraisalReport report) {
        return fromEntity(report, false, false, List.of());
    }

    public static AppraisalReportRes fromEntity(
            AppraisalReport report,
            boolean includeReviewDetails,
            boolean includeSellerAccuracy,
            List<AppraisalImageRes> proofImages) {
        if (report == null) {
            return null;
        }
        return new AppraisalReportRes(
                report.getCertificateCode(),
                report.getVerifiedMaterial(),
                report.getOrigin(),
                report.getAgeEstimation(),
                report.getConditionGrade(),
                report.getEstimatedValue(),
                report.isAuthentic(),
                report.getIntegrityHash(),
                report.getAppraisedAt(),
                includeReviewDetails ? report.getAppraiserNotes() : null,
                includeSellerAccuracy ? report.getSellerAccuracy() : null,
                includeReviewDetails && proofImages != null ? proofImages : List.of()
        );
    }
}
