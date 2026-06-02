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

    @Transactional
    public Optional<ActivationResult> activateDueSession(Long sessionId, Instant now) {
        AuctionSession session = auctionSessionRepository.findByIdForUpdate(sessionId).orElse(null);
        if (session == null
                || session.getStatus() != AuctionSessionStatus.WAITING
                || session.getStartTime().isAfter(now)) {
            return Optional.empty();
        }

        List<AuctionParticipant> frozenParticipants = auctionParticipantRepository
                .findByAuctionSessionIdAndDepositStatus(sessionId, DepositStatus.FROZEN);
        Set<String> frozenBidderIds = frozenParticipants.stream()
                .map(AuctionParticipant::getUserId)
                .collect(Collectors.toSet());

        try {
            auctionRedisService.loadSession(session, frozenBidderIds);
            session.setStatus(AuctionSessionStatus.ACTIVE);
            auctionSessionRepository.saveAndFlush(session);
            return Optional.of(new ActivationResult(sessionId, session.getStartingPrice(), session.getEndTime()));
        } catch (RuntimeException ex) {
            auctionRedisService.removeSession(sessionId);
            throw ex;
        }
    }

    @Transactional
    public Optional<CloseResult> finalizeDueSession(Long sessionId, Instant now) {
        AuctionSession session = auctionSessionRepository.findByIdForUpdate(sessionId).orElse(null);
        if (session == null
                || session.getStatus() != AuctionSessionStatus.ACTIVE
                || session.getEndTime().isAfter(now)) {
            return Optional.empty();
        }

        Map<Object, Object> redisState = auctionRedisService.getSessionState(sessionId);
        AuctionSnapshot snapshot;

        if (redisState.isEmpty()) {
            log.warn("Session {} Redis state missing; falling back to DB snapshot and bid audit", sessionId);
            snapshot = snapshotFromFallback(session);
        } else {
            snapshot = snapshotFromRedis(session, redisState);
            if (snapshot.endTime() != null && snapshot.endTime().isAfter(now)) {
                syncActiveSnapshot(session, snapshot);
                auctionSessionRepository.saveAndFlush(session);
                return Optional.empty();
            }
        }

        AuctionSessionStatus outcome = determineOutcome(session, snapshot);
        Instant terminalEndTime = snapshot.endTime() != null ? snapshot.endTime() : now;

        session.setStatus(outcome);
        session.setCurrentPrice(snapshot.finalPrice() != null ? snapshot.finalPrice() : session.getStartingPrice());
        session.setHighestBidderId(snapshot.highestBidderId());
        session.setWinnerBidId(outcome == AuctionSessionStatus.ENDED_SUCCESS ? snapshot.winnerBidId() : null);
        session.setEndTime(terminalEndTime);
        auctionSessionRepository.saveAndFlush(session);

        updateProductSaleStatusAfterClose(session.getProductId(), outcome);

        return Optional.of(new CloseResult(
                sessionId,
                outcome,
                session.getCurrentPrice(),
                terminalEndTime,
                snapshot.highestBidderId()
        ));
    }

    private AuctionSnapshot snapshotFromRedis(AuctionSession session, Map<Object, Object> redisState) {
        String highestBidderId = getString(redisState, AuctionRedisService.FIELD_HIGHEST_BIDDER_ID);
        String currentPrice = getString(redisState, AuctionRedisService.FIELD_CURRENT_PRICE);
        String highestBidTraceId = getString(redisState, AuctionRedisService.FIELD_HIGHEST_BID_TRACE_ID);
        String endTimeEpochMs = getString(redisState, AuctionRedisService.FIELD_END_TIME_EPOCH_MS);

        Long winnerBidId = null;
        if (highestBidTraceId != null && !highestBidTraceId.isBlank()) {
            winnerBidId = bidRepository.findByBidTraceId(highestBidTraceId)
                    .map(Bid::getId)
                    .orElse(null);
        }

        return new AuctionSnapshot(
                currentPrice != null ? new BigDecimal(currentPrice) : session.getCurrentPrice(),
                isBlank(highestBidderId) ? null : highestBidderId,
                winnerBidId,
                parseInstant(endTimeEpochMs, session.getEndTime())
        );
    }

    private AuctionSnapshot snapshotFromFallback(AuctionSession session) {
        Optional<Bid> latestValidBid = bidRepository
                .findTopByAuctionSessionIdAndStatusOrderByBidAmountDescBidTimeDescIdDesc(session.getId(), BidStatus.VALID);

        if (latestValidBid.isPresent()) {
            Bid bid = latestValidBid.get();
            return new AuctionSnapshot(
                    bid.getBidAmount(),
                    bid.getUserId(),
                    bid.getId(),
                    session.getEndTime()
            );
        }

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
                ? ProductSaleStatus.PENDING_ORDER
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
