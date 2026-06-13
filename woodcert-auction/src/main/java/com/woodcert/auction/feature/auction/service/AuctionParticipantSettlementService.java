package com.woodcert.auction.feature.auction.service;

import com.woodcert.auction.feature.auction.entity.AuctionParticipant;
import com.woodcert.auction.feature.auction.entity.AuctionSessionStatus;
import com.woodcert.auction.feature.auction.entity.DepositStatus;
import com.woodcert.auction.feature.auction.repository.AuctionParticipantRepository;

import com.woodcert.auction.feature.finance.service.WalletService;
import com.woodcert.auction.feature.finance.support.FinanceOperationKey;
import com.woodcert.auction.feature.finance.support.FinanceOperationKeys;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuctionParticipantSettlementService {

        private final AuctionParticipantRepository auctionParticipantRepository;
        private final WalletService walletService;

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public boolean settleOneParticipant(Long participantId, AuctionSessionLifecycleWorker.CloseResult closeResult) {
                AuctionParticipant participant = auctionParticipantRepository
                                .findByIdAndDepositStatusForUpdate(participantId, DepositStatus.FROZEN)
                                .orElse(null);
                if (participant == null) {
                        return false;
                }

                String participantUserId = participant.getUserId();
                boolean isWinner = closeResult.outcome() == AuctionSessionStatus.ENDED_SUCCESS
                                && participantUserId.equals(closeResult.highestBidderId());

                FinanceOperationKey operationKey = isWinner
                                ? FinanceOperationKeys.auctionCloseDeduct(
                                                closeResult.auctionSessionId(), participantUserId)
                                : FinanceOperationKeys.auctionCloseRefund(
                                                closeResult.auctionSessionId(), participantUserId);
                DepositStatus targetStatus = isWinner ? DepositStatus.DEDUCTED : DepositStatus.REFUNDED;

                if (isWinner) {
                        walletService.captureAuctionDeposit(
                                        participantUserId,
                                        operationKey,
                                        participant.getDepositAmount(),
                                        closeResult.auctionSessionId());
                } else {
                        walletService.releaseAuctionDeposit(
                                        participantUserId,
                                        operationKey,
                                        participant.getDepositAmount(),
                                        closeResult.auctionSessionId());
                }

                participant.setDepositStatus(targetStatus);
                auctionParticipantRepository.save(participant);
                return true;
        }

        @Transactional(propagation = Propagation.REQUIRES_NEW)
        public boolean refundCanceledParticipant(Long participantId, Long auctionSessionId) {
                AuctionParticipant participant = auctionParticipantRepository
                                .findByIdAndDepositStatusForUpdate(participantId, DepositStatus.FROZEN)
                                .orElse(null);
                if (participant == null || !auctionSessionId.equals(participant.getAuctionSessionId())) {
                        return false;
                }

                walletService.releaseAuctionDeposit(
                                participant.getUserId(),
                                FinanceOperationKeys.auctionCancelRefund(auctionSessionId, participant.getUserId()),
                                participant.getDepositAmount(),
                                auctionSessionId);

                participant.setDepositStatus(DepositStatus.REFUNDED);
                auctionParticipantRepository.save(participant);
                return true;
        }
}
