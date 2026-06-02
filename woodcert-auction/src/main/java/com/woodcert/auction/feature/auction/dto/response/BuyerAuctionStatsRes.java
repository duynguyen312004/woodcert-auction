package com.woodcert.auction.feature.auction.dto.response;

public record BuyerAuctionStatsRes(
        long total,
        long active,
        long won,
        long lost,
        long pendingSettlement
) {
}
