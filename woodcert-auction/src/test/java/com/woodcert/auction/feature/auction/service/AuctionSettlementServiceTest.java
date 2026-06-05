package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.entity.AuctionSession;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.auction.repository.AuctionSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.woodcert.auction.feature.order.entity.OrderSourceType;
import com.woodcert.auction.feature.order.service.OrderService;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionSettlementServiceTest {

    private static final Long SESSION_ID = 10L;

    @Mock
    private AuctionParticipantRepository auctionParticipantRepository;
    @Mock
    private AuctionSessionRepository auctionSessionRepository;
    @Mock
    private AuctionParticipantSettlementService participantSettlementService;
    @Mock
    private AuctionRedisService auctionRedisService;
    @Mock
    private OrderService orderService;

    private AuctionSettlementService service;

    @BeforeEach
    void setUp() {
        service = new AuctionSettlementService(
                auctionParticipantRepository,
                auctionSessionRepository,
                participantSettlementService,
                auctionRedisService,
                orderService);
    }

    @Test
    void settleFinalizedSession_continuesAfterParticipantFailureAndCleansRedis() {
        AuctionSessionLifecycleWorker.CloseResult closeResult = closeResult();
        when(auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(1L, 2L));
        doThrow(new RuntimeException("wallet down"))
                .when(participantSettlementService)
                .settleOneParticipant(1L, closeResult);

        service.settleFinalizedSession(closeResult);

        verify(participantSettlementService).settleOneParticipant(1L, closeResult);
        verify(participantSettlementService).settleOneParticipant(2L, closeResult);
        verify(auctionRedisService).removeSession(SESSION_ID);
    }

    @Test
    void repairFinalizedSession_usesDbSnapshotAndDoesNotCleanRedis() {
        AuctionSession session = new AuctionSession();
        session.setId(SESSION_ID);
        session.setStatus(AuctionSessionStatus.ENDED_SUCCESS);
        session.setCurrentPrice(new BigDecimal("250.00"));
        session.setEndTime(Instant.parse("2026-05-01T10:00:00Z"));
        session.setHighestBidderId("winner-1");

        when(auctionSessionRepository.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(1L));

        service.repairFinalizedSession(SESSION_ID);

        verify(participantSettlementService).settleOneParticipant(1L, closeResult());
        verify(auctionRedisService, never()).removeSession(SESSION_ID);
    }

    @Test
    void repairFinalizedSession_refundsCanceledSessionDeposits() {
        AuctionSession session = new AuctionSession();
        session.setId(SESSION_ID);
        session.setStatus(AuctionSessionStatus.CANCELED);

        when(auctionSessionRepository.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(3L));

        service.repairFinalizedSession(SESSION_ID);

        verify(participantSettlementService).refundCanceledParticipant(3L, SESSION_ID);
        verify(auctionRedisService, never()).removeSession(SESSION_ID);
    }

    @Test
    void repairMissingOrder_retriesOrderCreationWhenSuccessSessionHasNoOrder() {
        AuctionSession session = new AuctionSession();
        session.setId(SESSION_ID);
        session.setStatus(AuctionSessionStatus.ENDED_SUCCESS);
        when(auctionSessionRepository.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of());
        when(orderService.findSummaryBySource(OrderSourceType.AUCTION, SESSION_ID)).thenReturn(null);

        service.repairMissingOrder(SESSION_ID);

        verify(orderService).createFromSource(OrderSourceType.AUCTION, SESSION_ID);
    }

    @Test
    void repairMissingOrder_skipsWhenDepositsAreStillFrozen() {
        AuctionSession session = new AuctionSession();
        session.setId(SESSION_ID);
        session.setStatus(AuctionSessionStatus.ENDED_SUCCESS);
        when(auctionSessionRepository.findById(SESSION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findIdsByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(7L));

        service.repairMissingOrder(SESSION_ID);

        verify(orderService, never()).createFromSource(OrderSourceType.AUCTION, SESSION_ID);
    }

    private AuctionSessionLifecycleWorker.CloseResult closeResult() {
        return new AuctionSessionLifecycleWorker.CloseResult(
                SESSION_ID,
                AuctionSessionStatus.ENDED_SUCCESS,
                new BigDecimal("250.00"),
                Instant.parse("2026-05-01T10:00:00Z"),
                "winner-1");
    }
}
