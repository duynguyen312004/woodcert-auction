package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionSettlementService {

    private final AuctionParticipantRepository auctionParticipantRepository;
    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionParticipantSettlementService participantSettlementService;
    private final AuctionRedisService auctionRedisService;
    private final OrderService orderService;

    public void settleFinalizedSession(AuctionSessionLifecycleWorker.CloseResult closeResult) {
        settleFinalizedSession(closeResult, true);
    }

    public void repairFinalizedSession(Long auctionSessionId) {
        Optional<AuctionSession> session = auctionSessionRepository.findById(auctionSessionId);
        if (session.isEmpty() || !isRepairable(session.get().getStatus())) {
            return;
        }

        AuctionSession terminalSession = session.get();
        if (terminalSession.getStatus() == AuctionSessionStatus.CANCELED) {
            refundCanceledSession(auctionSessionId);
            return;
        }

        var closeResult = new AuctionSessionLifecycleWorker.CloseResult(
                terminalSession.getId(),
                terminalSession.getStatus(),
                terminalSession.getCurrentPrice(),
                terminalSession.getEndTime(),
                terminalSession.getHighestBidderId()
        );
        settleFinalizedSession(closeResult, false);
    }

    public void refundCanceledSession(Long auctionSessionId) {
        List<Long> frozenParticipantIds = auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(
                auctionSessionId,
                DepositStatus.FROZEN
        );

        for (Long participantId : frozenParticipantIds) {
            try {
                participantSettlementService.refundCanceledParticipant(participantId, auctionSessionId);
            } catch (Exception ex) {
                log.error("Cancel refund failed for participant id {} in session {}: {}",
                        participantId, auctionSessionId, ex.getMessage());
            }
        }
    }

    public void repairMissingOrder(Long auctionSessionId) {
        Optional<AuctionSession> session = auctionSessionRepository.findById(auctionSessionId);
        if (session.isEmpty() || session.get().getStatus() != AuctionSessionStatus.ENDED_SUCCESS) {
            return;
        }
        if (!auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(
                auctionSessionId, DepositStatus.FROZEN).isEmpty()) {
            return;
        }
        if (orderService.findSummaryBySource(OrderSourceType.AUCTION, auctionSessionId) != null) {
            return;
        }

        try {
            orderService.createFromSource(OrderSourceType.AUCTION, auctionSessionId);
        } catch (Exception ex) {
            log.error("Order repair failed for finalized session {}: {}", auctionSessionId, ex.getMessage());
        }
    }

    private void settleFinalizedSession(AuctionSessionLifecycleWorker.CloseResult closeResult, boolean cleanupRedis) {
        List<Long> frozenParticipantIds = auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(
                closeResult.auctionSessionId(),
                DepositStatus.FROZEN
        );

        for (Long participantId : frozenParticipantIds) {
            try {
                participantSettlementService.settleOneParticipant(participantId, closeResult);
            } catch (Exception ex) {
                log.error("Settlement failed for participant id {} in session {}: {}",
                        participantId, closeResult.auctionSessionId(), ex.getMessage());
            }
        }

        if (closeResult.outcome() == AuctionSessionStatus.ENDED_SUCCESS
                && auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(
                closeResult.auctionSessionId(), DepositStatus.FROZEN).isEmpty()) {
            try {
                orderService.createFromSource(OrderSourceType.AUCTION, closeResult.auctionSessionId());
            } catch (Exception ex) {
                log.error("Order creation failed for finalized session {}: {}",
                        closeResult.auctionSessionId(), ex.getMessage());
            }
        }

        if (cleanupRedis) {
            try {
                auctionRedisService.removeSession(closeResult.auctionSessionId());
            } catch (Exception ex) {
                log.warn("Non-critical: failed to remove Redis state for finalized session {}: {}",
                        closeResult.auctionSessionId(), ex.getMessage());
            }
        }
    }

    private boolean isRepairable(AuctionSessionStatus status) {
        return status == AuctionSessionStatus.ENDED_SUCCESS
                || status == AuctionSessionStatus.ENDED_FAILED
                || status == AuctionSessionStatus.CANCELED;
    }
}
