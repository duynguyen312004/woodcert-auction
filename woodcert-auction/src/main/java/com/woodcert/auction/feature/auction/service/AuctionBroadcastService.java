package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.dto.response.BidBroadcastPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Broadcasts WebSocket events to auction session subscribers.
 * Clients subscribe to /topic/auctions/{auctionSessionId}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionBroadcastService {

    private static final String TOPIC_PREFIX = "/topic/auctions/";

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastNewBid(Long auctionSessionId, BigDecimal currentPrice,
                                 String highestBidderId, Instant endTime,
                                 String bidTraceId, BigDecimal bidAmount,
                                 Instant bidTime, Long extendedBySeconds) {
        String maskedAlias = maskUserId(highestBidderId);
        BidBroadcastPayload payload = BidBroadcastPayload.newBid(
                auctionSessionId, currentPrice, maskedAlias, endTime,
                bidTraceId, bidAmount, bidTime, extendedBySeconds);
        send(auctionSessionId, payload);
    }

    public void broadcastSessionActivated(Long auctionSessionId, BigDecimal startingPrice, Instant endTime) {
        send(auctionSessionId, BidBroadcastPayload.sessionActivated(auctionSessionId, startingPrice, endTime));
    }

    public void broadcastSessionEnded(Long auctionSessionId, String finalStatus,
                                       BigDecimal finalPrice, Instant endTime) {
        send(auctionSessionId, BidBroadcastPayload.sessionEnded(auctionSessionId, finalStatus, finalPrice, endTime));
    }

    private void send(Long auctionSessionId, BidBroadcastPayload payload) {
        String destination = TOPIC_PREFIX + auctionSessionId;
        try {
            messagingTemplate.convertAndSend(destination, payload);
        } catch (Exception e) {
            log.warn("Failed to broadcast {} to {}: {}", payload.type(), destination, e.getMessage());
        }
    }

    /**
     * Mask user ID for public broadcast: expose first 4 chars + "****".
     * Example: "3fa85f64-5717-..." → "3fa8****"
     */
    private String maskUserId(String userId) {
        if (userId == null || userId.length() < 4) return "****";
        return userId.substring(0, 4) + "****";
    }
}
