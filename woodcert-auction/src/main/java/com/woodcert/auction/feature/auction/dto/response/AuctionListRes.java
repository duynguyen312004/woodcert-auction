package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.catalog.entity.AppraisalReport;
import com.woodcert.auction.feature.catalog.entity.ConditionGrade;
import com.woodcert.auction.feature.catalog.entity.Product;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Public auction listing response.
 */
public record AuctionListRes(
        Long id,
        ProductSummary product,
        BigDecimal startingPrice,
        BigDecimal currentPrice,
        BigDecimal depositAmount,
        Instant startTime,
        Instant endTime,
        AuctionSessionStatus status,
        long totalParticipants,
        SellerSummary seller
) {
    public record ProductSummary(
            Long id,
            String title,
            String primaryImage,
            String material,
            String categoryName,
            ConditionGrade conditionGrade,
            String certificateCode,
            boolean isAuthentic,
            BigDecimal sellerAccuracy
    ) {
        public static ProductSummary fromEntity(
                Product product,
                String primaryImage,
                String categoryName,
                AppraisalReport appraisalReport) {
            String material = appraisalReport != null && appraisalReport.getVerifiedMaterial() != null
                    ? appraisalReport.getVerifiedMaterial()
                    : product.getMaterial();

            return new ProductSummary(
                    product.getId(),
                    product.getTitle(),
                    primaryImage,
                    material,
                    categoryName,
                    appraisalReport != null ? appraisalReport.getConditionGrade() : null,
                    appraisalReport != null ? appraisalReport.getCertificateCode() : null,
                    appraisalReport != null && appraisalReport.isAuthentic(),
                    appraisalReport != null ? appraisalReport.getSellerAccuracy() : null);
        }
    }

    public record SellerSummary(
            String name,
            BigDecimal reputationScore
    ) {
    }

    public static AuctionListRes fromEntity(
            AuctionSession session,
            ProductSummary product,
            long totalParticipants,
            SellerSummary seller) {
        return new AuctionListRes(
                session.getId(),
                product,
                session.getStartingPrice(),
                session.getCurrentPrice(),
                session.getDepositAmount(),
                session.getStartTime(),
                session.getEndTime(),
                session.getStatus(),
                totalParticipants,
                seller
        );
    }
}
