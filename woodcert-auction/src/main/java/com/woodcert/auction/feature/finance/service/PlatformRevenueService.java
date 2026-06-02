package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueStatsRes;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueTransactionRes;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;

import java.math.BigDecimal;

public interface PlatformRevenueService {

    void recordRevenue(
            PlatformRevenueType type,
            BigDecimal amount,
            String sourceUserId,
            WalletReferenceType referenceType,
            Long referenceId,
            String operationKey);

    PaginationResponse<PlatformRevenueTransactionRes> getTransactions(int page, int size);

    PlatformRevenueStatsRes getStats();
}
