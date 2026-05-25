package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

/**
 * Appraisal report response DTO. Internal-only fields stay null/empty unless
 * the current viewer is the appraiser who submitted the report.
 */
public record AppraisalReportRes(
        String certificateCode,
        String verifiedMaterial,
        String origin,
        String ageEstimation,
        ConditionGrade conditionGrade,
        BigDecimal estimatedValue,
        boolean isAuthentic,
        String digitalSignature,
        Instant appraisedAt,
        String appraiserNotes,
        BigDecimal sellerAccuracy,
        List<AppraisalImageRes> proofImages
) {
    public static AppraisalReportRes fromEntity(AppraisalReport report) {
        return fromEntity(report, false, List.of());
    }

    public static AppraisalReportRes fromEntity(
            AppraisalReport report,
            boolean includeInternalFields,
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
                report.getDigitalSignature(),
                report.getAppraisedAt(),
                includeInternalFields ? report.getAppraiserNotes() : null,
                includeInternalFields ? report.getSellerAccuracy() : null,
                includeInternalFields && proofImages != null ? proofImages : List.of()
        );
    }
}
