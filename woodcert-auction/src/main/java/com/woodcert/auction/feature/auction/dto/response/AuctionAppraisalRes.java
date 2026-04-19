package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;

import java.math.BigDecimal;

/**
 * Public appraisal snapshot embedded in auction detail.
 */
public record AuctionAppraisalRes(
        String certificateCode,
        String verifiedMaterial,
        String origin,
        String ageEstimation,
        ConditionGrade conditionGrade,
        BigDecimal estimatedValue,
        boolean isAuthentic
) {
    public static AuctionAppraisalRes fromEntity(AppraisalReport report) {
        if (report == null) {
            return null;
        }
        return new AuctionAppraisalRes(
                report.getCertificateCode(),
                report.getVerifiedMaterial(),
                report.getOrigin(),
                report.getAgeEstimation(),
                report.getConditionGrade(),
                report.getEstimatedValue(),
                report.isAuthentic()
        );
    }
}
