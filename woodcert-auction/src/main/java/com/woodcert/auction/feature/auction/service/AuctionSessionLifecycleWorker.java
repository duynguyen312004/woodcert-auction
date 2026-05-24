package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.Bid;
import com.woodcert.auction.feature.auction.entity.BidStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.auction.repository.BidRepository;
import com.woodcert.auction.feature.catalog.entity.Product;
import com.woodcert.auction.feature.catalog.entity.ProductSaleStatus;
import com.woodcert.auction.feature.catalog.repository.ProductRepository;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionSessionLifecycleWorker {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionParticipantRepository auctionParticipantRepository;
    private final BidRepository bidRepository;
    private final ProductRepository productRepository;
    private final AuctionRedisService auctionRedisService;
    private final WalletService walletService;

    @Transactional
    public Optional<ActivationResult> activateDueSession(Long sessionId, Instant now) {
        // Bước 1: Lock phiên đấu giá và bỏ qua nếu phiên không còn WAITING hoặc chưa đến giờ bắt đầu.
        AuctionSession session = auctionSessionRepository.findByIdForUpdate(sessionId).orElse(null);
        if (session == null
                || session.getStatus() != AuctionSessionStatus.WAITING
                || session.getStartTime().isAfter(now)) {
            return Optional.empty();
        }

        // Bước 2: Lấy danh sách participant đã đóng băng tiền cọc để nạp vào runtime Redis.
        List<AuctionParticipant> frozenParticipants = auctionParticipantRepository
                .findByAuctionSessionIdAndDepositStatus(sessionId, DepositStatus.FROZEN);
        Set<String> frozenBidderIds = frozenParticipants.stream()
                .map(AuctionParticipant::getUserId)
                .collect(Collectors.toSet());

        try {
            // Bước 3: Load snapshot phiên vào Redis trước, sau đó mới chuyển DB sang ACTIVE.
            auctionRedisService.loadSession(session, frozenBidderIds);
            session.setStatus(AuctionSessionStatus.ACTIVE);
            auctionSessionRepository.saveAndFlush(session);
            return Optional.of(new ActivationResult(sessionId, session.getStartingPrice(), session.getEndTime()));
        } catch (RuntimeException ex) {
            // Bước 4: Nếu cập nhật DB lỗi sau khi load Redis thì dọn runtime để không còn phiên mồ côi.
            auctionRedisService.removeSession(sessionId);
            throw ex;
        }
    }

    @Transactional
    public Optional<CloseResult> finalizeDueSession(Long sessionId, Instant now) {
        // Bước 1: Lock phiên và bỏ qua nếu phiên không ACTIVE hoặc chưa đến endTime trong DB.
        AuctionSession session = auctionSessionRepository.findByIdForUpdate(sessionId).orElse(null);
        if (session == null
                || session.getStatus() != AuctionSessionStatus.ACTIVE
                || session.getEndTime().isAfter(now)) {
            return Optional.empty();
        }

        // Bước 2: Đọc snapshot runtime từ Redis; nếu mất Redis thì fallback sang DB và bid audit.
        Map<Object, Object> redisState = auctionRedisService.getSessionState(sessionId);
        AuctionSnapshot snapshot;

        if (redisState.isEmpty()) {
            log.warn("Session {} Redis state missing; falling back to DB snapshot and bid audit", sessionId);
            snapshot = snapshotFromFallback(session);
        } else {
            snapshot = snapshotFromRedis(session, redisState);
            // Bước 3: Nếu Redis cho biết anti-sniper đã gia hạn phiên thì sync DB và chưa đóng phiên.
            if (snapshot.endTime() != null && snapshot.endTime().isAfter(now)) {
                syncActiveSnapshot(session, snapshot);
                auctionSessionRepository.saveAndFlush(session);
                return Optional.empty();
            }
        }

        // Bước 4: Xác định kết quả phiên dựa trên giá cuối và reserve price.
        AuctionSessionStatus outcome = determineOutcome(session, snapshot);
        Instant terminalEndTime = snapshot.endTime() != null ? snapshot.endTime() : now;

        // Bước 5: Ghi trạng thái kết thúc, giá cuối, người thắng và winner bid vào DB.
        session.setStatus(outcome);
        session.setCurrentPrice(snapshot.finalPrice() != null ? snapshot.finalPrice() : session.getStartingPrice());
        session.setHighestBidderId(snapshot.highestBidderId());
        session.setWinnerBidId(outcome == AuctionSessionStatus.ENDED_SUCCESS ? snapshot.winnerBidId() : null);
        session.setEndTime(terminalEndTime);
        auctionSessionRepository.saveAndFlush(session);

        // Bước 6: Cập nhật trạng thái bán của sản phẩm theo kết quả đóng phiên.
        updateProductSaleStatusAfterClose(session.getProductId(), outcome);

        return Optional.of(new CloseResult(
                sessionId,
                outcome,
                session.getCurrentPrice(),
                terminalEndTime,
                snapshot.highestBidderId()
        ));
    }

    public void settleFinalizedSession(CloseResult closeResult) {
        // Bước 1: Lấy các participant vẫn đang bị đóng băng tiền cọc sau khi phiên đã chốt.
        List<AuctionParticipant> frozenParticipants = auctionParticipantRepository
                .findByAuctionSessionIdAndDepositStatus(closeResult.auctionSessionId(), DepositStatus.FROZEN);

        for (AuctionParticipant participant : frozenParticipants) {
            // Bước 2: Xác định người thắng để trừ cọc, các participant còn lại được hoàn cọc.
            String participantUserId = participant.getUserId();
            boolean isWinner = closeResult.outcome() == AuctionSessionStatus.ENDED_SUCCESS
                    && participantUserId.equals(closeResult.highestBidderId());

            String operationKey = isWinner
                    ? "auction:close:deduct:" + closeResult.auctionSessionId() + ":" + participantUserId
                    : "auction:close:refund:" + closeResult.auctionSessionId() + ":" + participantUserId;
            DepositStatus targetStatus = isWinner ? DepositStatus.DEDUCTED : DepositStatus.REFUNDED;

            try {
                // Bước 3: Gọi wallet service bằng operation key idempotent để settle tiền cọc.
                if (isWinner) {
                    walletService.deductFrozenFunds(
                            participantUserId,
                            operationKey,
                            participant.getDepositAmount(),
                            closeResult.auctionSessionId(),
                            WalletReferenceType.AUCTION
                    );
                } else {
                    walletService.unfreezeFunds(
                            participantUserId,
                            operationKey,
                            participant.getDepositAmount(),
                            closeResult.auctionSessionId(),
                            WalletReferenceType.AUCTION
                    );
                }

                // Bước 4: Cập nhật trạng thái deposit của participant sau khi wallet xử lý thành công.
                participant.setDepositStatus(targetStatus);
                auctionParticipantRepository.save(participant);
            } catch (Exception ex) {
                log.error("Settlement failed for participant {} in session {} ({}): {}",
                        participantUserId, closeResult.auctionSessionId(), operationKey, ex.getMessage());
            }
        }

        // Bước 5: Dọn runtime Redis khi đã hoàn tất settlement best-effort.
        auctionRedisService.removeSession(closeResult.auctionSessionId());
    }

    private AuctionSnapshot snapshotFromRedis(AuctionSession session, Map<Object, Object> redisState) {
        // Bước 1: Đọc các field runtime quan trọng từ Redis hash của phiên.
        String highestBidderId = getString(redisState, AuctionRedisService.FIELD_HIGHEST_BIDDER_ID);
        String currentPrice = getString(redisState, AuctionRedisService.FIELD_CURRENT_PRICE);
        String highestBidTraceId = getString(redisState, AuctionRedisService.FIELD_HIGHEST_BID_TRACE_ID);
        String endTimeEpochMs = getString(redisState, AuctionRedisService.FIELD_END_TIME_EPOCH_MS);

        // Bước 2: Map bidTraceId thắng cuộc về bid id trong DB nếu bid đã kịp persist.
        Long winnerBidId = null;
        if (highestBidTraceId != null && !highestBidTraceId.isBlank()) {
            winnerBidId = bidRepository.findByBidTraceId(highestBidTraceId)
                    .map(Bid::getId)
                    .orElse(null);
        }

        // Bước 3: Tạo snapshot chuẩn hóa, fallback về dữ liệu DB khi Redis thiếu field.
        return new AuctionSnapshot(
                currentPrice != null ? new BigDecimal(currentPrice) : session.getCurrentPrice(),
                isBlank(highestBidderId) ? null : highestBidderId,
                winnerBidId,
                parseInstant(endTimeEpochMs, session.getEndTime())
        );
    }

    private AuctionSnapshot snapshotFromFallback(AuctionSession session) {
        // Bước 1: Khi Redis mất state, lấy bid VALID cao nhất từ audit table làm nguồn phục hồi.
        Optional<Bid> latestValidBid = bidRepository
                .findTopByAuctionSessionIdAndStatusOrderByBidAmountDescBidTimeDescIdDesc(session.getId(), BidStatus.VALID);

        if (latestValidBid.isPresent()) {
            // Bước 2: Nếu có bid hợp lệ thì dùng bid đó làm giá cuối và người thắng tạm thời.
            Bid bid = latestValidBid.get();
            return new AuctionSnapshot(
                    bid.getBidAmount(),
                    bid.getUserId(),
                    bid.getId(),
                    session.getEndTime()
            );
        }

        // Bước 3: Nếu không có bid audit thì dùng snapshot đang lưu trong DB session.
        return new AuctionSnapshot(
                session.getCurrentPrice(),
                session.getHighestBidderId(),
                session.getWinnerBidId(),
                session.getEndTime()
        );
    }

    private void syncActiveSnapshot(AuctionSession session, AuctionSnapshot snapshot) {
        if (snapshot.finalPrice() != null) {
            session.setCurrentPrice(snapshot.finalPrice());
        }
        session.setHighestBidderId(snapshot.highestBidderId());
        if (snapshot.endTime() != null) {
            session.setEndTime(snapshot.endTime());
        }
    }

    private AuctionSessionStatus determineOutcome(AuctionSession session, AuctionSnapshot snapshot) {
        boolean hasValidBid = snapshot.highestBidderId() != null && snapshot.finalPrice() != null;
        boolean meetsReserve = hasValidBid && snapshot.finalPrice().compareTo(session.getReservePrice()) >= 0;
        return meetsReserve ? AuctionSessionStatus.ENDED_SUCCESS : AuctionSessionStatus.ENDED_FAILED;
    }

    private void updateProductSaleStatusAfterClose(Long productId, AuctionSessionStatus outcome) {
        if (productId == null) {
            log.warn("Auction session has no productId while closing");
            return;
        }

        Optional<Product> productOptional = productRepository.findByIdForUpdate(productId);
        if (productOptional == null || productOptional.isEmpty()) {
            log.warn("Product {} missing while closing auction session", productId);
            return;
        }

        Product product = productOptional.get();
        ProductSaleStatus nextSaleStatus = outcome == AuctionSessionStatus.ENDED_SUCCESS
                ? ProductSaleStatus.SOLD
                : ProductSaleStatus.AVAILABLE;
        product.setSaleStatus(nextSaleStatus);
        productRepository.saveAndFlush(product);
    }

    private Instant parseInstant(String epochMillis, Instant fallback) {
        if (epochMillis == null || epochMillis.isBlank()) {
            return fallback;
        }

        try {
            return Instant.ofEpochMilli(Long.parseLong(epochMillis));
        } catch (NumberFormatException ex) {
            return fallback;
        }
    }

    private String getString(Map<Object, Object> state, String key) {
        Object value = state.get(key);
        return value != null ? value.toString() : null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private record AuctionSnapshot(
            BigDecimal finalPrice,
            String highestBidderId,
            Long winnerBidId,
            Instant endTime
    ) {
    }

    public record ActivationResult(
            Long auctionSessionId,
            BigDecimal startingPrice,
            Instant endTime
    ) {
    }

    public record CloseResult(
            Long auctionSessionId,
            AuctionSessionStatus outcome,
            BigDecimal finalPrice,
            Instant endTime,
            String highestBidderId
    ) {
    }
}
