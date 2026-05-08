package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.auction.config.AuctionProperties;
import com.woodcert.auction.feature.auction.dto.request.CreateBidReq;
import com.woodcert.auction.feature.auction.dto.response.BidResultRes;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.BidStatus;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.catalog.entity.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Bid flow:
 * 1. Coarse checks in DB (existence, status, seller-block).
 * 2. Generate bidTraceId.
 * 3. Execute Lua script atomically in Redis.
 * 4. On Lua success: broadcast NEW_BID, then best-effort persist bid row + DB snapshot.
 * 5. On Lua rejection: best-effort persist the rejected bid row, return error.
 *
 * Lua success = runtime acceptance. DB persistence is secondary only.
 * Broadcast does NOT wait for DB persistence.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BidServiceImpl implements BidService {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionBroadcastService broadcastService;
    private final BidLuaScript bidLuaScript;
    private final BidPersistenceService bidPersistenceService;
    private final AuctionRedisService auctionRedisService;
    private final AuctionProperties auctionProperties;
    private final StringRedisTemplate redisTemplate;

    @Override
    public BidResultRes placeBid(String bidderId, CreateBidReq request) {
        Long auctionSessionId = request.auctionSessionId();
        BigDecimal bidAmount = request.bidAmount();

        // --- Coarse DB checks (no lock needed — Redis is the realtime authority) ---
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionSessionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));

        if (session.getStatus() != AuctionSessionStatus.ACTIVE) {
            throw new AppException(ErrorCode.AUCTION_NOT_ACTIVE);
        }

        Product product = session.getProduct();
        if (product != null && bidderId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_SELF_BIDDING_NOT_ALLOWED);
        }

        // --- Execute Lua script ---
        String bidTraceId = UUID.randomUUID().toString();
        Instant bidTime = Instant.now();

        long nowMs = bidTime.toEpochMilli();
        long sniperThMs = auctionProperties.getBidding().getAntiSniperThreshold().toMillis();
        long sniperExtMs = auctionProperties.getBidding().getAntiSniperExtension().toMillis();

        List<String> keys = bidLuaScript.buildKeys(auctionSessionId);
        List<Object> result = redisTemplate.execute(
                bidLuaScript.getScript(),
                keys,
                bidderId,
                bidAmount.toPlainString(),
                String.valueOf(nowMs),
                String.valueOf(sniperThMs),
                String.valueOf(sniperExtMs),
                bidTraceId
        );

        String resultCode = result != null && !result.isEmpty() ? result.get(0).toString() : "ERROR";
        String newPriceStr = result != null && result.size() > 1 ? result.get(1).toString() : null;
        String newEndTimeStr = result != null && result.size() > 2 ? result.get(2).toString() : null;

        return switch (resultCode) {
            case "OK" -> handleBidAccepted(auctionSessionId, bidderId, bidTraceId, bidAmount,
                    bidTime, newPriceStr, newEndTimeStr);

            case "ENDED" -> {
                bidPersistenceService.saveBid(bidTraceId, auctionSessionId, bidderId,
                        bidAmount, BidStatus.REJECTED_TIME, bidTime);
                throw new AppException(ErrorCode.BID_AUCTION_ENDED);
            }

            case "LOW" -> {
                bidPersistenceService.saveBid(bidTraceId, auctionSessionId, bidderId,
                        bidAmount, BidStatus.INVALID_PRICE, bidTime);
                throw new AppException(ErrorCode.BID_AMOUNT_TOO_LOW);
            }

            case "NOT_REGISTERED" -> throw new AppException(ErrorCode.AUCTION_BIDDER_NOT_REGISTERED);

            case "SELF_BID" -> throw new AppException(ErrorCode.AUCTION_SELF_BIDDING_NOT_ALLOWED);

            default -> {
                log.error("Unexpected Lua result code '{}' for session {}", resultCode, auctionSessionId);
                throw new AppException(ErrorCode.UNCATEGORIZED);
            }
        };
    }

    private BidResultRes handleBidAccepted(Long auctionSessionId, String bidderId, String bidTraceId,
                                            BigDecimal bidAmount, Instant bidTime,
                                            String newPriceStr, String newEndTimeStr) {
        BigDecimal newPrice = new BigDecimal(newPriceStr);
        long newEndTimeMs = Long.parseLong(newEndTimeStr);
        Instant newEndTime = Instant.ofEpochMilli(newEndTimeMs);

        // If anti-sniper extended end time, update Redis TTL
        if (newEndTimeMs > 0) {
            auctionRedisService.extendTtl(auctionSessionId, newEndTime);
        }

        // Broadcast NEW_BID immediately — does not wait for DB persistence
        broadcastService.broadcastNewBid(auctionSessionId, newPrice, bidderId, newEndTime);

        persistBidBestEffort(bidTraceId, auctionSessionId, bidderId, bidAmount, BidStatus.VALID, bidTime);
        syncSessionSnapshotBestEffort(auctionSessionId, newPrice, bidderId, newEndTime);

        log.info("Bid {} accepted for session {} by {} at {}", bidTraceId, auctionSessionId, bidderId, newPrice);

        return new BidResultRes(bidTraceId, auctionSessionId, newPrice, newEndTime);
    }

    /**
     * Best-effort sync of Redis state back to DB after a successful bid.
     * Failures are logged and swallowed — never affects bid acceptance.
     */
    private void syncSessionSnapshotBestEffort(Long auctionSessionId, BigDecimal newPrice,
                                               String highestBidderId, Instant newEndTime) {
        try {
            auctionSessionRepository.findById(auctionSessionId).ifPresent(session -> {
                session.setCurrentPrice(newPrice);
                session.setHighestBidderId(highestBidderId);
                session.setEndTime(newEndTime);
                auctionSessionRepository.saveAndFlush(session);
            });
        } catch (Exception e) {
            log.warn("Non-critical: failed to sync DB snapshot for session {}: {}",
                    auctionSessionId, e.getMessage());
        }
    }

    private void persistBidBestEffort(String bidTraceId, Long auctionSessionId, String bidderId,
                                      BigDecimal bidAmount, BidStatus status, Instant bidTime) {
        try {
            bidPersistenceService.saveBid(bidTraceId, auctionSessionId, bidderId, bidAmount, status, bidTime);
        } catch (Exception e) {
            log.warn("Non-critical: failed to persist bid {} for session {}: {}",
                    bidTraceId, auctionSessionId, e.getMessage());
        }
    }
}
