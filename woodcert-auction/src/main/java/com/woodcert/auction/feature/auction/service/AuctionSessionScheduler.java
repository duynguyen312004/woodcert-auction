package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.config.AuctionProperties;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuctionSessionScheduler {

    private final AuctionSessionRepository auctionSessionRepository;
    private final AuctionSessionLifecycleWorker lifecycleWorker;
    private final AuctionSettlementService settlementService;
    private final AuctionBroadcastService broadcastService;
    private final AuctionProperties auctionProperties;

    @Scheduled(cron = "${auction.scheduler.activate-cron:*/5 * * * * *}")
    public void activateDueSessions() {
        if (!auctionProperties.getScheduler().isEnabled()) {
            return;
        }

        Instant now = Instant.now();
        for (Long sessionId : auctionSessionRepository.findDueWaitingSessionIds(now)) {
            try {
                lifecycleWorker.activateDueSession(sessionId, now).ifPresent(result ->
                        broadcastService.broadcastSessionActivated(
                                result.auctionSessionId(),
                                result.startingPrice(),
                                result.endTime()
                        ));
            } catch (Exception ex) {
                log.warn("Failed to activate session {}: {}", sessionId, ex.getMessage());
            }
        }
    }

    @Scheduled(cron = "${auction.scheduler.close-cron:*/5 * * * * *}")
    public void closeDueSessions() {
        if (!auctionProperties.getScheduler().isEnabled()) {
            return;
        }

        Instant now = Instant.now();
        for (Long sessionId : auctionSessionRepository.findDueActiveSessionIds(now)) {
            try {
                var closeResult = lifecycleWorker.finalizeDueSession(sessionId, now);
                if (closeResult.isEmpty()) {
                    continue;
                }

                settlementService.settleFinalizedSession(closeResult.get());
                broadcastService.broadcastSessionEnded(
                        closeResult.get().auctionSessionId(),
                        closeResult.get().outcome().name(),
                        closeResult.get().finalPrice(),
                        closeResult.get().endTime()
                );
            } catch (Exception ex) {
                log.warn("Failed to close session {}: {}", sessionId, ex.getMessage());
            }
        }
    }

    @Scheduled(cron = "${auction.scheduler.repair-cron:*/30 * * * * *}")
    public void repairFinalizedSessionsWithFrozenDeposits() {
        if (!auctionProperties.getScheduler().isEnabled()) {
            return;
        }

        int batchSize = Math.max(1, auctionProperties.getScheduler().getRepairBatchSize());
        List<Long> sessionIds = auctionSessionRepository.findTerminalSessionIdsWithFrozenDeposits(
                List.of(AuctionSessionStatus.ENDED_SUCCESS, AuctionSessionStatus.ENDED_FAILED),
                PageRequest.of(0, batchSize)
        );

        for (Long sessionId : sessionIds) {
            try {
                settlementService.repairFinalizedSession(sessionId);
            } catch (Exception ex) {
                log.warn("Failed to repair settlement for session {}: {}", sessionId, ex.getMessage());
            }
        }
    }
}
