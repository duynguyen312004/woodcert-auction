package com.woodcert.auction.feature.finance.dto.response;

import com.woodcert.auction.feature.finance.entity.VnPayDeposit;
import java.math.BigDecimal;
import java.time.Instant;

public record VnPayDepositRes(
    Long id,
    String txnRef,
    BigDecimal amount,
    String status,
    String vnpBankCode,
    Instant createdAt,
    Instant paidAt
) {
    public static VnPayDepositRes fromEntity(VnPayDeposit entity) {
        return new VnPayDepositRes(
            entity.getId(),
            entity.getTxnRef(),
            entity.getAmount(),
            entity.getStatus().name(),
            entity.getVnpBankCode(),
            entity.getCreatedAt(),
            entity.getPaidAt()
        );
    }
}
