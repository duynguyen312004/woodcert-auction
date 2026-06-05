package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.service.WalletService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuctionParticipantSettlementServiceTest {

    private static final Long SESSION_ID = 10L;

    @Mock private AuctionParticipantRepository auctionParticipantRepository;
    @Mock private WalletService walletService;

    private AuctionParticipantSettlementService service;

    @BeforeEach
    void setUp() {
        service = new AuctionParticipantSettlementService(auctionParticipantRepository, walletService);
    }

    @Test
    void settleOneParticipant_deductsWinnerAndMarksDeducted() {
        AuctionParticipant participant = participant(1L, "winner-1");
        when(auctionParticipantRepository.findByIdAndDepositStatusForUpdate(1L, DepositStatus.FROZEN))
                .thenReturn(Optional.of(participant));

        boolean settled = service.settleOneParticipant(1L, closeResult(AuctionSessionStatus.ENDED_SUCCESS, "winner-1"));

        assertThat(settled).isTrue();
        assertThat(participant.getDepositStatus()).isEqualTo(DepositStatus.DEDUCTED);
        verify(walletService).deductFrozenFunds(
                "winner-1",
                "auction:close:deduct:10:winner-1",
                new BigDecimal("1000.00"),
                SESSION_ID,
                WalletReferenceType.AUCTION
        );
        verify(auctionParticipantRepository).save(participant);
    }

    @Test
    void settleOneParticipant_refundsLoserAndMarksRefunded() {
        AuctionParticipant participant = participant(2L, "loser-1");
        when(auctionParticipantRepository.findByIdAndDepositStatusForUpdate(2L, DepositStatus.FROZEN))
                .thenReturn(Optional.of(participant));

        boolean settled = service.settleOneParticipant(2L, closeResult(AuctionSessionStatus.ENDED_SUCCESS, "winner-1"));

        assertThat(settled).isTrue();
        assertThat(participant.getDepositStatus()).isEqualTo(DepositStatus.REFUNDED);
        verify(walletService).unfreezeFunds(
                "loser-1",
                "auction:close:refund:10:loser-1",
                new BigDecimal("1000.00"),
                SESSION_ID,
                WalletReferenceType.AUCTION
        );
        verify(auctionParticipantRepository).save(participant);
    }

    @Test
    void refundCanceledParticipant_unfreezesDepositAndMarksRefunded() {
        AuctionParticipant participant = participant(3L, "bidder-1");
        when(auctionParticipantRepository.findByIdAndDepositStatusForUpdate(3L, DepositStatus.FROZEN))
                .thenReturn(Optional.of(participant));

        boolean refunded = service.refundCanceledParticipant(3L, SESSION_ID);

        assertThat(refunded).isTrue();
        assertThat(participant.getDepositStatus()).isEqualTo(DepositStatus.REFUNDED);
        verify(walletService).unfreezeFunds(
                "bidder-1",
                "auction:cancel:refund:10:bidder-1",
                new BigDecimal("1000.00"),
                SESSION_ID,
                WalletReferenceType.AUCTION
        );
        verify(auctionParticipantRepository).save(participant);
    }

    private AuctionSessionLifecycleWorker.CloseResult closeResult(AuctionSessionStatus status, String highestBidderId) {
        return new AuctionSessionLifecycleWorker.CloseResult(
                SESSION_ID,
                status,
                new BigDecimal("250.00"),
                Instant.parse("2026-05-01T10:00:00Z"),
                highestBidderId
        );
    }

    private AuctionParticipant participant(Long id, String userId) {
        AuctionParticipant participant = new AuctionParticipant();
        participant.setId(id);
        participant.setAuctionSessionId(SESSION_ID);
        participant.setUserId(userId);
        participant.setDepositAmount(new BigDecimal("1000.00"));
        participant.setDepositStatus(DepositStatus.FROZEN);
        return participant;
    }
}
