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
        if (session.isEmpty() || !isTerminal(session.get().getStatus())) {
            return;
        }

        AuctionSession terminalSession = session.get();
        var closeResult = new AuctionSessionLifecycleWorker.CloseResult(
                terminalSession.getId(),
                terminalSession.getStatus(),
                terminalSession.getCurrentPrice(),
                terminalSession.getEndTime(),
                terminalSession.getHighestBidderId()
        );
        settleFinalizedSession(closeResult, false);
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

    private boolean isTerminal(AuctionSessionStatus status) {
        return status == AuctionSessionStatus.ENDED_SUCCESS
                || status == AuctionSessionStatus.ENDED_FAILED;
    }
}
