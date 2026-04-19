package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Public auction detail response.
 * reservePrice is intentionally hidden from buyers.
 */
public record AuctionDetailRes(
        Long id,
        AuctionSessionStatus status,
        BigDecimal startingPrice,
        BigDecimal currentPrice,
        BigDecimal stepPrice,
        BigDecimal depositAmount,
        Instant startTime,
        Instant endTime,
        AuctionProductSummaryRes product,
        SellerSummary seller
) {
    public record SellerSummary(
            String storeName,
            BigDecimal reputationScore
    ) {
    }

    public static AuctionDetailRes fromEntity(
            AuctionSession session,
            AuctionProductSummaryRes product,
            SellerSummary seller) {
        return new AuctionDetailRes(
                session.getId(),
                session.getStatus(),
                session.getStartingPrice(),
                session.getCurrentPrice(),
                session.getStepPrice(),
                session.getDepositAmount(),
                session.getStartTime(),
                session.getEndTime(),
                product,
                seller
        );
    }
}
