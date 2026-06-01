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
 * Luồng đặt giá:
 * 1. Kiểm tra sơ bộ trong DB: phiên tồn tại, đang ACTIVE và bidder không phải seller.
 * 2. Sinh bidTraceId để truy vết một lần đặt giá.
 * 3. Chạy Lua script trong Redis để xử lý giá realtime theo cơ chế atomic.
 * 4. Nếu Lua chấp nhận: broadcast NEW_BID, sau đó best-effort lưu bid và snapshot DB.
 * 5. Nếu Lua từ chối: best-effort lưu bid bị từ chối rồi trả lỗi nghiệp vụ.
 *
 * Redis là nguồn quyết định tại thời điểm đặt giá; lưu DB là bước phụ trợ sau đó.
 * Broadcast không chờ lưu DB xong để tránh làm chậm realtime.
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

        // Bước 1: Kiểm tra sơ bộ bằng DB; không lock vì Redis mới là nguồn quyết định realtime.
        AuctionSession session = auctionSessionRepository.findByIdWithProduct(auctionSessionId)
                .orElseThrow(() -> new AppException(ErrorCode.AUCTION_SESSION_NOT_FOUND));

        if (session.getStatus() != AuctionSessionStatus.ACTIVE) {
            throw new AppException(ErrorCode.AUCTION_NOT_ACTIVE);
        }

        Product product = session.getProduct();
        if (product != null && bidderId.equals(product.getSellerId())) {
            throw new AppException(ErrorCode.AUCTION_SELF_BIDDING_NOT_ALLOWED);
        }

        // Bước 2: Chuẩn bị dữ liệu truyền vào Lua gồm trace id, thời điểm đặt giá và cấu hình anti-sniper.
        String bidTraceId = UUID.randomUUID().toString();
        Instant bidTime = Instant.now();

        long nowMs = bidTime.toEpochMilli();
        long sniperThMs = auctionProperties.getBidding().getAntiSniperThreshold().toMillis();
        long sniperExtMs = auctionProperties.getBidding().getAntiSniperExtension().toMillis();

        // Bước 3: Chạy Lua script để kiểm tra đăng ký, giá tối thiểu và gia hạn thời gian một cách atomic.
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

        // Bước 4: Tách kết quả Lua thành mã trạng thái, giá mới và thời điểm kết thúc mới.
        String resultCode = result != null && !result.isEmpty() ? result.get(0).toString() : "ERROR";
        String newPriceStr = result != null && result.size() > 1 ? result.get(1).toString() : null;
        String newEndTimeStr = result != null && result.size() > 2 ? result.get(2).toString() : null;
        String extendedByMsStr = result != null && result.size() > 3 ? result.get(3).toString() : "0";

        // Bước 5: Điều hướng kết quả: bid hợp lệ đi tiếp, bid bị từ chối trả lỗi nghiệp vụ tương ứng.
        return switch (resultCode) {
            case "OK" -> handleBidAccepted(auctionSessionId, bidderId, bidTraceId, bidAmount,
                    bidTime, newPriceStr, newEndTimeStr, extendedByMsStr);

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

            case "SELF_BID" -> throw new AppException(ErrorCode.BIDDER_ALREADY_HIGHEST);

            default -> {
                log.error("Unexpected Lua result code '{}' for session {}", resultCode, auctionSessionId);
                throw new AppException(ErrorCode.UNCATEGORIZED);
            }
        };
    }

    private BidResultRes handleBidAccepted(Long auctionSessionId, String bidderId, String bidTraceId,
                                            BigDecimal bidAmount, Instant bidTime,
                                            String newPriceStr, String newEndTimeStr,
                                            String extendedByMsStr) {
        // Bước 1: Chuẩn hóa dữ liệu Redis trả về thành kiểu dữ liệu domain.
        BigDecimal newPrice = new BigDecimal(newPriceStr);
        long newEndTimeMs = Long.parseLong(newEndTimeStr);
        long extendedByMs = Long.parseLong(extendedByMsStr);
        Instant newEndTime = Instant.ofEpochMilli(newEndTimeMs);
        Long extendedBySeconds = extendedByMs > 0 ? extendedByMs / 1000 : null;

        // Bước 2: Nếu anti-sniper kéo dài phiên đấu giá thì cập nhật TTL Redis theo endTime mới.
        if (extendedByMs > 0) {
            auctionRedisService.extendTtl(auctionSessionId, newEndTime);
        }

        // Bước 3: Broadcast giá mới ngay cho client, không chờ các bước lưu DB phía sau.
        broadcastService.broadcastNewBid(auctionSessionId, newPrice, bidderId, newEndTime,
                bidTraceId, bidAmount, bidTime, extendedBySeconds);

        // Bước 4: Best-effort lưu bid và đồng bộ snapshot phiên đấu giá về DB.
        persistBidBestEffort(bidTraceId, auctionSessionId, bidderId, bidAmount, BidStatus.VALID, bidTime);
        syncSessionSnapshotBestEffort(auctionSessionId, newPrice, bidderId, newEndTime);

        log.info("Bid {} accepted for session {} by {} at {}", bidTraceId, auctionSessionId, bidderId, newPrice);

        return new BidResultRes(bidTraceId, auctionSessionId, newPrice, newEndTime);
    }

    /**
     * Đồng bộ best-effort trạng thái Redis về DB sau khi bid thành công.
     * Nếu lỗi thì chỉ log lại, không làm thay đổi kết quả chấp nhận bid.
     */
    private void syncSessionSnapshotBestEffort(Long auctionSessionId, BigDecimal newPrice,
                                               String highestBidderId, Instant newEndTime) {
        try {
            int updated = auctionSessionRepository.updateRuntimeSnapshotIfNotStale(
                    auctionSessionId,
                    newPrice,
                    highestBidderId,
                    newEndTime
            );
            if (updated == 0) {
                log.debug("Skipped stale DB snapshot sync for session {} at price {}", auctionSessionId, newPrice);
            }
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
