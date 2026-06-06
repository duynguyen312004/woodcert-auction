package com.woodcert.auction.feature.finance.dto.response;

import com.woodcert.auction.feature.finance.entity.Wallet;

import java.math.BigDecimal;

public record WalletRes(
        Long id,
        String userId,
        BigDecimal availableBalance,
        BigDecimal frozenBalance,
        BigDecimal appraisalFee
) {
    public static WalletRes fromEntity(Wallet wallet, BigDecimal appraisalFee) {
        return new WalletRes(
                wallet.getId(),
                wallet.getUserId(),
                wallet.getAvailableBalance(),
                wallet.getFrozenBalance(),
                appraisalFee
        );
    }
}
