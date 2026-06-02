package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.order.dto.response.OrderSummaryRes;

import java.math.BigDecimal;
import java.time.Instant;

public record BuyerAuctionDetailRes(
        Long auctionId,
        AuctionProductSummaryRes product,
        String status,
        BigDecimal startingPrice,
        BigDecimal currentPrice,
        BigDecimal depositAmount,
        String depositStatus,
        String outcomeCode,
        String outcomeMessage,
        boolean winner,
        Instant startTime,
        Instant endTime,
        Instant registeredAt,
        String highestBidderMaskedAlias,
        int myBidCount,
        BigDecimal myHighestBid,
        OrderSummaryRes order
) {
}
