package com.woodcert.auction.feature.auction.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * WebSocket broadcast payload for auction events.
 * Sent to /topic/auctions/{auctionSessionId} after each significant state change.
 *
 * highestBidderMaskedAlias is a masked representation of userId to avoid
 * exposing full user identity over public WebSocket channels.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BidBroadcastPayload(
        String type,
        Long auctionSessionId,
        String status,
        BigDecimal currentPrice,
        String highestBidderMaskedAlias,
        Instant endTime,
        String bidTraceId,
        BigDecimal bidAmount,
        Instant bidTime,
        Long extendedBySeconds
) {
    public static final String TYPE_SESSION_ACTIVATED = "SESSION_ACTIVATED";
    public static final String TYPE_NEW_BID = "NEW_BID";
    public static final String TYPE_SESSION_ENDED = "SESSION_ENDED";

    public static BidBroadcastPayload newBid(
            Long auctionSessionId,
            BigDecimal currentPrice,
            String highestBidderMaskedAlias,
            Instant endTime,
            String bidTraceId,
            BigDecimal bidAmount,
            Instant bidTime,
            Long extendedBySeconds) {
        return new BidBroadcastPayload(
                TYPE_NEW_BID, auctionSessionId, "ACTIVE",
                currentPrice, highestBidderMaskedAlias, endTime,
                bidTraceId, bidAmount, bidTime, extendedBySeconds);
    }

    public static BidBroadcastPayload sessionActivated(Long auctionSessionId, BigDecimal startingPrice, Instant endTime) {
        return new BidBroadcastPayload(
                TYPE_SESSION_ACTIVATED, auctionSessionId, "ACTIVE",
                startingPrice, null, endTime,
                null, null, null, null);
    }

    public static BidBroadcastPayload sessionEnded(Long auctionSessionId, String finalStatus,
                                                    BigDecimal finalPrice, Instant endTime) {
        return new BidBroadcastPayload(
                TYPE_SESSION_ENDED, auctionSessionId, finalStatus,
                finalPrice, null, endTime,
                null, null, null, null);
    }
}
