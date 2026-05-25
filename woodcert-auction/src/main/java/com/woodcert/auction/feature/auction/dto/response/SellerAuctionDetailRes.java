package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Seller-facing auction detail. Unlike public detail, this exposes reserve price
 * and terminal settlement information for the product owner.
 */
public record SellerAuctionDetailRes(
        Long id,
        AuctionSessionStatus status,
        BigDecimal startingPrice,
        BigDecimal reservePrice,
        BigDecimal stepPrice,
        BigDecimal depositAmount,
        BigDecimal currentPrice,
        BigDecimal finalPrice,
        Instant startTime,
        Instant endTime,
        long participantCount,
        String winnerMaskedAlias,
        SellerAuctionSettlementStatus settlementStatus,
        SettlementSummary settlement,
        AuctionProductSummaryRes product,
        Instant createdAt,
        Instant updatedAt
) {
    public enum SellerAuctionSettlementStatus {
        NOT_APPLICABLE,
        PENDING,
        SETTLED
    }

    public record SettlementSummary(
            long frozen,
            long refunded,
            long deducted,
            long confiscated
    ) {
    }
}
