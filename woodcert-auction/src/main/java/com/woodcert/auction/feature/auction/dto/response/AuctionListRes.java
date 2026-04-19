package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
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
        long totalParticipants
) {
    public record ProductSummary(
            Long id,
            String title,
            String primaryImage
    ) {
        public static ProductSummary fromEntity(Product product, String primaryImage) {
            return new ProductSummary(product.getId(), product.getTitle(), primaryImage);
        }
    }

    public static AuctionListRes fromEntity(
            AuctionSession session,
            ProductSummary product,
            long totalParticipants) {
        return new AuctionListRes(
                session.getId(),
                product,
                session.getStartingPrice(),
                session.getCurrentPrice(),
                session.getDepositAmount(),
                session.getStartTime(),
                session.getEndTime(),
                session.getStatus(),
                totalParticipants
        );
    }
}
