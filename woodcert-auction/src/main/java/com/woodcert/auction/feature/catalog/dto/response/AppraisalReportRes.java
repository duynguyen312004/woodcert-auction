package com.woodcert.auction.feature.catalog.dto.response;

import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Appraisal report response DTO for public/buyer view.
 * Does NOT expose appraiserNotes or sellerAccuracy — those are internal data.
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
        Instant appraisedAt
) {
    public static AppraisalReportRes fromEntity(AppraisalReport report) {
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
                report.getAppraisedAt()
        );
    }
}
