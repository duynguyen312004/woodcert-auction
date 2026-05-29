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
        Instant createdAt,
        String description
) {
    public static WalletTransactionRes fromEntity(WalletTransaction transaction) {
        return new WalletTransactionRes(
                transaction.getId(),
                transaction.getAmount(),
                transaction.getType(),
                transaction.getReferenceId(),
                transaction.getReferenceType(),
                transaction.getStatus(),
                transaction.getCreatedAt(),
                resolveDescription(transaction.getType(), transaction.getReferenceType())
        );
    }

    private static String resolveDescription(WalletTransactionType type, WalletReferenceType ref) {
        if (type == null) return "";
        return switch (type) {
            case DEPOSIT -> ref == WalletReferenceType.VNPAY_DEPOSIT
                    ? "Nạp tiền qua VNPay"
                    : "Nạp tiền vào ví";
            case FREEZE -> "Đóng cọc phiên đấu giá";
            case UNFREEZE -> "Hoàn cọc phiên đấu giá";
            case PAYMENT -> "Thanh toán đấu giá";
            case WITHDRAW -> "Rút tiền";
        };
    }
}
