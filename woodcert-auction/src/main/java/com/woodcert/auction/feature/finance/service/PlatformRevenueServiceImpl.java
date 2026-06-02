package com.woodcert.auction.feature.finance.service;

import com.woodcert.auction.core.dto.PaginationResponse;
import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueStatsRes;
import com.woodcert.auction.feature.finance.dto.response.PlatformRevenueTransactionRes;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueTransaction;
import com.woodcert.auction.feature.finance.entity.PlatformRevenueType;
import com.woodcert.auction.feature.finance.entity.WalletReferenceType;
import com.woodcert.auction.feature.finance.repository.PlatformRevenueTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.EnumMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlatformRevenueServiceImpl implements PlatformRevenueService {

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode MONEY_ROUNDING = RoundingMode.HALF_UP;

    private final PlatformRevenueTransactionRepository repository;

    @Override
    @Transactional
    public void recordRevenue(
            PlatformRevenueType type,
            BigDecimal amount,
            String sourceUserId,
            WalletReferenceType referenceType,
            Long referenceId,
            String operationKey) {
        if (type == null || referenceType == null || operationKey == null || operationKey.isBlank()) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        BigDecimal normalizedAmount = normalizePositiveMoney(amount);
        String normalizedOperationKey = operationKey.trim();
        if (repository.existsByOperationKey(normalizedOperationKey)) {
            return;
        }

        PlatformRevenueTransaction transaction = new PlatformRevenueTransaction();
        transaction.setType(type);
        transaction.setAmount(normalizedAmount);
        transaction.setSourceUserId(sourceUserId);
        transaction.setReferenceType(referenceType);
        transaction.setReferenceId(referenceId);
        transaction.setOperationKey(normalizedOperationKey);
        repository.save(transaction);
    }

    @Override
    @Transactional(readOnly = true)
    public PaginationResponse<PlatformRevenueTransactionRes> getTransactions(int page, int size) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 50));
        return PaginationResponse.of(repository.findAllByOrderByCreatedAtDescIdDesc(pageable)
                .map(PlatformRevenueTransactionRes::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformRevenueStatsRes getStats() {
        Map<PlatformRevenueType, PlatformRevenueStatsRes.RevenueTypeStats> byType =
                new EnumMap<>(PlatformRevenueType.class);
        BigDecimal total = BigDecimal.ZERO.setScale(MONEY_SCALE, MONEY_ROUNDING);

        for (Object[] row : repository.sumAmountAndCountByType()) {
            PlatformRevenueType type = (PlatformRevenueType) row[0];
            BigDecimal amount = ((BigDecimal) row[1]).setScale(MONEY_SCALE, MONEY_ROUNDING);
            long count = ((Number) row[2]).longValue();
            byType.put(type, new PlatformRevenueStatsRes.RevenueTypeStats(amount, count));
            total = total.add(amount);
        }

        return new PlatformRevenueStatsRes(total, byType);
    }

    private BigDecimal normalizePositiveMoney(BigDecimal amount) {
        if (amount == null) {
            throw new AppException(ErrorCode.WALLET_AMOUNT_INVALID);
        }
        BigDecimal normalized = amount.setScale(MONEY_SCALE, MONEY_ROUNDING);
        if (normalized.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.WALLET_AMOUNT_INVALID);
        }
        return normalized;
    }
}
