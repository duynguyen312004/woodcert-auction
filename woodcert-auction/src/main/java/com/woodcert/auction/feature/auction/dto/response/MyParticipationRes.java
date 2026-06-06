package com.woodcert.auction.feature.auction.dto.response;

import com.woodcert.auction.feature.auction.entity.DepositStatus;

import java.math.BigDecimal;

public record MyParticipationRes(
        boolean sellerOwned,
        boolean registered,
        DepositStatus depositStatus,
        boolean highestBidder,
        boolean canRegister,
        boolean canWithdraw,
        boolean canBid,
        String reasonCode,
        String reasonMessage,
        BigDecimal depositAmount,
        boolean winner,
        String outcomeCode,
        String outcomeMessage
) {
}
