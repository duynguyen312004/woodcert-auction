package com.woodcert.auction.feature.finance.dto.response;

import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.entity.WalletTransaction;
import com.woodcert.auction.feature.finance.entity.WalletTransactionStatus;
import com.woodcert.auction.feature.finance.entity.WalletTransactionType;

import java.math.BigDecimal;
import java.time.Instant;

public record WalletTransactionRes(
        Long id,
        BigDecimal amount,
        WalletTransactionType type,
        Long referenceId,
        WalletReferenceType referenceType,
        WalletTransactionStatus status,
        Instant createdAt
) {
    public static WalletTransactionRes fromEntity(WalletTransaction transaction) {
        return new WalletTransactionRes(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getType(),
                transaction.getReferenceId(),
                transaction.getReferenceType(),
                transaction.getStatus(),
                transaction.getCreatedAt()
        );
    }
}
