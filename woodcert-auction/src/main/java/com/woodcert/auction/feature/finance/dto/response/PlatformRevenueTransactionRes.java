package com.woodcert.auction.feature.finance.dto.response;

import com.woodcert.auction.feature.finance.entity.PlatformRevenueTransaction;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;

import java.math.BigDecimal;
import java.time.Instant;

public record PlatformRevenueTransactionRes(
        Long id,
        PlatformRevenueType type,
        BigDecimal amount,
        String sourceUserId,
        WalletReferenceType referenceType,
        Long referenceId,
        String operationKey,
        Instant createdAt
) {
    public static PlatformRevenueTransactionRes fromEntity(PlatformRevenueTransaction transaction) {
        return new PlatformRevenueTransactionRes(
                transaction.getId(),
                transaction.getType(),
                transaction.getAmount(),
                transaction.getSourceUserId(),
                transaction.getReferenceType(),
                transaction.getReferenceId(),
                transaction.getOperationKey(),
                transaction.getCreatedAt()
        );
    }
}
