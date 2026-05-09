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
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionSessionLifecycleWorkerTest {

    private static final Long SESSION_ID = 10L;

    @Mock private AuctionSessionRepository auctionSessionRepository;
    @Mock private AuctionParticipantRepository auctionParticipantRepository;
    @Mock private BidRepository bidRepository;
    @Mock private AuctionRedisService auctionRedisService;
    @Mock private WalletService walletService;

    private AuctionSessionLifecycleWorker worker;

    @BeforeEach
    void setUp() {
        worker = new AuctionSessionLifecycleWorker(
                auctionSessionRepository,
                auctionParticipantRepository,
                bidRepository,
                auctionRedisService,
                walletService
        );
    }

    @Test
    @DisplayName("should activate waiting session only after Redis state is loaded")
    void activateDueSession_success() {
        Instant now = Instant.parse("2026-05-01T09:00:00Z");
        AuctionSession session = createSession(AuctionSessionStatus.WAITING, Instant.parse("2026-05-01T08:59:00Z"), Instant.parse("2026-05-01T10:00:00Z"));
        AuctionParticipant participant = createParticipant("bidder-1", new BigDecimal("1000.00"));

        when(auctionSessionRepository.findByIdForUpdate(SESSION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(participant));

        var result = worker.activateDueSession(SESSION_ID, now);

        assertThat(result).isPresent();
        assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.ACTIVE);
        verify(auctionRedisService).loadSession(eq(session), any());
        verify(auctionSessionRepository).saveAndFlush(session);
    }

    @Test
    @DisplayName("should not commit active status when Redis state load fails")
    void activateDueSession_redisFailure() {
        Instant now = Instant.parse("2026-05-01T09:00:00Z");
        AuctionSession session = createSession(AuctionSessionStatus.WAITING, Instant.parse("2026-05-01T08:59:00Z"), Instant.parse("2026-05-01T10:00:00Z"));

        when(auctionSessionRepository.findByIdForUpdate(SESSION_ID)).thenReturn(Optional.of(session));
        when(auctionParticipantRepository.findByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of());
        doThrow(new RuntimeException("redis down")).when(auctionRedisService).loadSession(eq(session), any());

        assertThatThrownBy(() -> worker.activateDueSession(SESSION_ID, now))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("redis down");

        assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.WAITING);
        verify(auctionSessionRepository, never()).saveAndFlush(any());
        verify(auctionRedisService).removeSession(SESSION_ID);
    }

    @Test
    @DisplayName("should keep session active when Redis endTime was extended by anti-sniper")
    void finalizeDueSession_redisEndTimeExtended_keepsActive() {
        Instant now = Instant.parse("2026-05-01T10:00:00Z");
        Instant oldDbEndTime = Instant.parse("2026-05-01T09:59:00Z");
        Instant redisEndTime = Instant.parse("2026-05-01T10:01:00Z");
        AuctionSession session = createSession(AuctionSessionStatus.ACTIVE, Instant.parse("2026-05-01T08:00:00Z"), oldDbEndTime);
        Bid winningBid = new Bid();
        winningBid.setId(501L);

        when(auctionSessionRepository.findByIdForUpdate(SESSION_ID)).thenReturn(Optional.of(session));
        when(auctionRedisService.getSessionState(SESSION_ID)).thenReturn(Map.of(
                AuctionRedisService.FIELD_CURRENT_PRICE, "250.00",
                AuctionRedisService.FIELD_HIGHEST_BIDDER_ID, "bidder-1",
                AuctionRedisService.FIELD_HIGHEST_BID_TRACE_ID, "trace-1",
                AuctionRedisService.FIELD_END_TIME_EPOCH_MS, String.valueOf(redisEndTime.toEpochMilli())
        ));
        when(bidRepository.findByBidTraceId("trace-1")).thenReturn(Optional.of(winningBid));

        var result = worker.finalizeDueSession(SESSION_ID, now);

        assertThat(result).isEmpty();
        assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.ACTIVE);
        assertThat(session.getCurrentPrice()).isEqualByComparingTo("250.00");
        assertThat(session.getHighestBidderId()).isEqualTo("bidder-1");
        assertThat(session.getEndTime()).isEqualTo(redisEndTime);
        verify(auctionSessionRepository).saveAndFlush(session);
    }

    @Test
    @DisplayName("should use latest valid bid when Redis state is missing and DB snapshot is stale")
    void finalizeDueSession_missingRedis_usesLatestValidBid() {
        Instant now = Instant.parse("2026-05-01T10:00:00Z");
        AuctionSession session = createSession(AuctionSessionStatus.ACTIVE, Instant.parse("2026-05-01T08:00:00Z"), Instant.parse("2026-05-01T09:59:00Z"));
        session.setCurrentPrice(new BigDecimal("100.00"));
        session.setHighestBidderId(null);
        session.setReservePrice(new BigDecimal("200.00"));

        Bid latestValidBid = new Bid();
        latestValidBid.setId(700L);
        latestValidBid.setUserId("bidder-2");
        latestValidBid.setBidAmount(new BigDecimal("250.00"));
        latestValidBid.setBidTime(Instant.parse("2026-05-01T09:58:30Z"));

        when(auctionSessionRepository.findByIdForUpdate(SESSION_ID)).thenReturn(Optional.of(session));
        when(auctionRedisService.getSessionState(SESSION_ID)).thenReturn(Map.of());
        when(bidRepository.findTopByAuctionSessionIdAndStatusOrderByBidAmountDescBidTimeDescIdDesc(SESSION_ID, BidStatus.VALID))
                .thenReturn(Optional.of(latestValidBid));

        var result = worker.finalizeDueSession(SESSION_ID, now);

        assertThat(result).isPresent();
        assertThat(result.get().outcome()).isEqualTo(AuctionSessionStatus.ENDED_SUCCESS);
        assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.ENDED_SUCCESS);
        assertThat(session.getCurrentPrice()).isEqualByComparingTo("250.00");
        assertThat(session.getHighestBidderId()).isEqualTo("bidder-2");
        assertThat(session.getWinnerBidId()).isEqualTo(700L);
    }

    @Test
    @DisplayName("should settle winner and loser deposits and cleanup Redis")
    void settleFinalizedSession_successAndCleanup() {
        AuctionParticipant winner = createParticipant("winner-1", new BigDecimal("1000.00"));
        AuctionParticipant loser = createParticipant("loser-1", new BigDecimal("1000.00"));

        when(auctionParticipantRepository.findByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(winner, loser));

        worker.settleFinalizedSession(new AuctionSessionLifecycleWorker.CloseResult(
                SESSION_ID,
                AuctionSessionStatus.ENDED_SUCCESS,
                new BigDecimal("250.00"),
                Instant.parse("2026-05-01T10:00:00Z"),
                "winner-1"
        ));

        verify(walletService).deductFrozenFunds("winner-1", "auction:close:deduct:10:winner-1",
                new BigDecimal("1000.00"), SESSION_ID, WalletReferenceType.AUCTION);
        verify(walletService).unfreezeFunds("loser-1", "auction:close:refund:10:loser-1",
                new BigDecimal("1000.00"), SESSION_ID, WalletReferenceType.AUCTION);
        assertThat(winner.getDepositStatus()).isEqualTo(DepositStatus.DEDUCTED);
        assertThat(loser.getDepositStatus()).isEqualTo(DepositStatus.REFUNDED);
        verify(auctionParticipantRepository).save(winner);
        verify(auctionParticipantRepository).save(loser);
        verify(auctionRedisService).removeSession(SESSION_ID);
    }

    @Test
    @DisplayName("should refund every frozen participant when finalized as failed")
    void settleFinalizedSession_failedRefundsAll() {
        AuctionParticipant bidder1 = createParticipant("bidder-1", new BigDecimal("1000.00"));
        AuctionParticipant bidder2 = createParticipant("bidder-2", new BigDecimal("1000.00"));
        when(auctionParticipantRepository.findByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(bidder1, bidder2));

        worker.settleFinalizedSession(new AuctionSessionLifecycleWorker.CloseResult(
                SESSION_ID,
                AuctionSessionStatus.ENDED_FAILED,
                new BigDecimal("150.00"),
                Instant.parse("2026-05-01T10:00:00Z"),
                "bidder-1"
        ));

        verify(walletService).unfreezeFunds("bidder-1", "auction:close:refund:10:bidder-1",
                new BigDecimal("1000.00"), SESSION_ID, WalletReferenceType.AUCTION);
        verify(walletService).unfreezeFunds("bidder-2", "auction:close:refund:10:bidder-2",
                new BigDecimal("1000.00"), SESSION_ID, WalletReferenceType.AUCTION);
        assertThat(bidder1.getDepositStatus()).isEqualTo(DepositStatus.REFUNDED);
        assertThat(bidder2.getDepositStatus()).isEqualTo(DepositStatus.REFUNDED);
        verify(auctionRedisService).removeSession(SESSION_ID);
    }

    @Test
    @DisplayName("should deduct winner deposit by highest bidder id even when winner bid id is unavailable")
    void settleFinalizedSession_successWithMissingWinnerBidIdStillDeductsWinner() {
        AuctionParticipant winner = createParticipant("winner-1", new BigDecimal("1000.00"));
        when(auctionParticipantRepository.findByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(winner));

        worker.settleFinalizedSession(new AuctionSessionLifecycleWorker.CloseResult(
                SESSION_ID,
                AuctionSessionStatus.ENDED_SUCCESS,
                new BigDecimal("250.00"),
                Instant.parse("2026-05-01T10:00:00Z"),
                "winner-1"
        ));

        verify(walletService).deductFrozenFunds("winner-1", "auction:close:deduct:10:winner-1",
                new BigDecimal("1000.00"), SESSION_ID, WalletReferenceType.AUCTION);
        assertThat(winner.getDepositStatus()).isEqualTo(DepositStatus.DEDUCTED);
    }

    @Test
    @DisplayName("should leave failed participant frozen and continue settling others")
    void settleFinalizedSession_participantFailureContinuesOthers() {
        AuctionParticipant failedWinner = createParticipant("winner-1", new BigDecimal("1000.00"));
        AuctionParticipant loser = createParticipant("loser-1", new BigDecimal("1000.00"));
        when(auctionParticipantRepository.findByAuctionSessionIdAndDepositStatus(SESSION_ID, DepositStatus.FROZEN))
                .thenReturn(List.of(failedWinner, loser));
        doThrow(new RuntimeException("wallet down")).when(walletService).deductFrozenFunds(
                "winner-1",
                "auction:close:deduct:10:winner-1",
                new BigDecimal("1000.00"),
                SESSION_ID,
                WalletReferenceType.AUCTION);

        worker.settleFinalizedSession(new AuctionSessionLifecycleWorker.CloseResult(
                SESSION_ID,
                AuctionSessionStatus.ENDED_SUCCESS,
                new BigDecimal("250.00"),
                Instant.parse("2026-05-01T10:00:00Z"),
                "winner-1"
        ));

        assertThat(failedWinner.getDepositStatus()).isEqualTo(DepositStatus.FROZEN);
        assertThat(loser.getDepositStatus()).isEqualTo(DepositStatus.REFUNDED);
        verify(auctionParticipantRepository, never()).save(failedWinner);
        verify(auctionParticipantRepository).save(loser);
        verify(auctionRedisService).removeSession(SESSION_ID);
    }

    @Test
    @DisplayName("should ignore not-due waiting session activation")
    void activateDueSession_notDueReturnsEmpty() {
        Instant now = Instant.parse("2026-05-01T09:00:00Z");
        AuctionSession session = createSession(AuctionSessionStatus.WAITING, Instant.parse("2026-05-01T09:01:00Z"), Instant.parse("2026-05-01T10:00:00Z"));
        when(auctionSessionRepository.findByIdForUpdate(SESSION_ID)).thenReturn(Optional.of(session));

        var result = worker.activateDueSession(SESSION_ID, now);

        assertThat(result).isEmpty();
        assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.WAITING);
        verify(auctionRedisService, never()).loadSession(any(), any());
        verify(auctionSessionRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("should ignore wrong-status close attempt")
    void finalizeDueSession_wrongStatusReturnsEmpty() {
        Instant now = Instant.parse("2026-05-01T10:00:00Z");
        AuctionSession session = createSession(AuctionSessionStatus.WAITING, Instant.parse("2026-05-01T08:00:00Z"), Instant.parse("2026-05-01T09:59:00Z"));
        when(auctionSessionRepository.findByIdForUpdate(SESSION_ID)).thenReturn(Optional.of(session));

        var result = worker.finalizeDueSession(SESSION_ID, now);

        assertThat(result).isEmpty();
        assertThat(session.getStatus()).isEqualTo(AuctionSessionStatus.WAITING);
        verify(auctionRedisService, never()).getSessionState(any());
        verify(auctionSessionRepository, never()).saveAndFlush(any());
    }

    private AuctionSession createSession(AuctionSessionStatus status, Instant startTime, Instant endTime) {
        AuctionSession session = new AuctionSession();
        session.setId(SESSION_ID);
        session.setStatus(status);
        session.setStartTime(startTime);
        session.setEndTime(endTime);
        session.setStartingPrice(new BigDecimal("100.00"));
        session.setCurrentPrice(new BigDecimal("100.00"));
        session.setReservePrice(new BigDecimal("200.00"));
        session.setStepPrice(new BigDecimal("10.00"));
        session.setDepositAmount(new BigDecimal("1000.00"));
        return session;
    }

    private AuctionParticipant createParticipant(String userId, BigDecimal depositAmount) {
        AuctionParticipant participant = new AuctionParticipant();
        participant.setAuctionSessionId(SESSION_ID);
        participant.setUserId(userId);
        participant.setDepositAmount(depositAmount);
        participant.setDepositStatus(DepositStatus.FROZEN);
        return participant;
    }
}
