package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Seller-facing list item for owned auction sessions.
 */
public record SellerAuctionListRes(
        Long id,
        String productTitle,
        Long productId,
        AuctionSessionStatus status,
        BigDecimal startingPrice,
        BigDecimal depositAmount,
        Instant startTime,
        Instant endTime,
        BigDecimal currentPrice,
        long participantCount,
        String imageUrl,
        Instant createdAt
) {
    public static SellerAuctionListRes fromEntity(
            AuctionSession session,
            String productTitle,
            long participantCount,
            String imageUrl) {
        return new SellerAuctionListRes(
                session.getId(),
                productTitle,
                session.getProductId(),
                session.getStatus(),
                session.getStartingPrice(),
                session.getDepositAmount(),
                session.getStartTime(),
                session.getEndTime(),
                session.getCurrentPrice(),
                participantCount,
                imageUrl,
                session.getCreatedAt()
        );
    }
}
