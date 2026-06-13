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
                resolveDescription(transaction.getType(), transaction.getReferenceId())
        );
    }

    private static String resolveDescription(WalletTransactionType type, Long referenceId) {
        if (type == null) {
            return "";
        }
        return switch (type) {
            case WALLET_TOP_UP -> "Nạp tiền qua VNPay";
            case APPRAISAL_FEE -> "Phí thẩm định sản phẩm" + suffix(referenceId);
            case AUCTION_DEPOSIT_FREEZE -> "Đóng cọc phiên đấu giá" + suffix(referenceId);
            case AUCTION_DEPOSIT_RELEASE -> "Hoàn cọc phiên đấu giá" + suffix(referenceId);
            case AUCTION_DEPOSIT_CAPTURE -> "Khấu trừ cọc phiên đấu giá thắng" + suffix(referenceId);
            case ORDER_PAYMENT -> "Thanh toán đơn hàng" + suffix(referenceId);
            case ORDER_REFUND -> "Hoàn tiền đơn hàng" + suffix(referenceId);
            case SELLER_PAYOUT -> "Nhận tiền bán hàng" + suffix(referenceId);
            case SELLER_FORFEIT_COMPENSATION -> "Nhận bồi thường cọc quá hạn" + suffix(referenceId);
        };
    }

    private static String suffix(Long referenceId) {
        return referenceId != null ? " #" + referenceId : "";
    }
}
