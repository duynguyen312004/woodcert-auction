package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueStatsRes;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueTransactionRes;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.support.FinanceOperationKey;

import java.io.OutputStream;
import java.math.BigDecimal;
import java.time.Instant;

public interface PlatformRevenueService {

    void recordRevenue(
            PlatformRevenueType type,
            BigDecimal amount,
            String sourceUserId,
            WalletReferenceType referenceType,
            Long referenceId,
            FinanceOperationKey operationKey);

    PaginationResponse<PlatformRevenueTransactionRes> getTransactions(
            int page,
            int size,
            PlatformRevenueType type,
            Instant from,
            Instant to,
            String query);

    PlatformRevenueStatsRes getStats(PlatformRevenueType type, Instant from, Instant to, String query);

    void writeTransactionsCsv(
            OutputStream outputStream,
            PlatformRevenueType type,
            Instant from,
            Instant to,
            String query);
}
