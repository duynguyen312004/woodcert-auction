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
import com.woodcert.auction.feature.finance.support.FinanceOperationKey;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.EnumMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PlatformRevenueServiceImpl implements PlatformRevenueService {

    private static final int MONEY_SCALE = 2;
    private static final RoundingMode MONEY_ROUNDING = RoundingMode.HALF_UP;
    private static final int EXPORT_BATCH_SIZE = 500;

    private final PlatformRevenueTransactionRepository repository;

    @Override
    @Transactional
    public void recordRevenue(
            PlatformRevenueType type,
            BigDecimal amount,
            String sourceUserId,
            WalletReferenceType referenceType,
            Long referenceId,
            FinanceOperationKey operationKey) {
        if (type == null || referenceType == null || operationKey == null) {
            throw new AppException(ErrorCode.INVALID_REQUEST);
        }

        BigDecimal normalizedAmount = normalizePositiveMoney(amount);
        String normalizedOperationKey = operationKey.value();
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
    public PaginationResponse<PlatformRevenueTransactionRes> getTransactions(
            int page,
            int size,
            PlatformRevenueType type,
            Instant from,
            Instant to,
            String query) {
        var pageable = PageRequest.of(Math.max(0, page - 1), Math.min(Math.max(size, 1), 100));
        return PaginationResponse.of(repository.search(type, from, to, trimToNull(query), pageable)
                .map(PlatformRevenueTransactionRes::fromEntity));
    }

    @Override
    @Transactional(readOnly = true)
    public PlatformRevenueStatsRes getStats(PlatformRevenueType type, Instant from, Instant to, String query) {
        Map<PlatformRevenueType, PlatformRevenueStatsRes.RevenueTypeStats> byType =
                new EnumMap<>(PlatformRevenueType.class);
        BigDecimal total = BigDecimal.ZERO.setScale(MONEY_SCALE, MONEY_ROUNDING);

        for (Object[] row : repository.sumAmountAndCountByTypeFiltered(type, from, to, trimToNull(query))) {
            PlatformRevenueType rowType = (PlatformRevenueType) row[0];
            BigDecimal amount = ((BigDecimal) row[1]).setScale(MONEY_SCALE, MONEY_ROUNDING);
            long count = ((Number) row[2]).longValue();
            byType.put(rowType, new PlatformRevenueStatsRes.RevenueTypeStats(amount, count));
            total = total.add(amount);
        }

        return new PlatformRevenueStatsRes(total, byType);
    }

    @Override
    @Transactional(readOnly = true)
    public void writeTransactionsCsv(
            OutputStream outputStream,
            PlatformRevenueType type,
            Instant from,
            Instant to,
            String query) {
        PrintWriter writer = new PrintWriter(new OutputStreamWriter(outputStream, StandardCharsets.UTF_8));
        writer.println("id,type,amount,sourceUserId,referenceType,referenceId,operationKey,createdAt");

        int page = 0;
        Page<PlatformRevenueTransaction> batch;
        do {
            batch = repository.search(type, from, to, trimToNull(query), PageRequest.of(page, EXPORT_BATCH_SIZE));
            for (PlatformRevenueTransaction transaction : batch.getContent()) {
                writer.println(toCsvRow(transaction));
            }
            writer.flush();
            page++;
        } while (batch.hasNext());
    }

    private String toCsvRow(PlatformRevenueTransaction transaction) {
        return String.join(",",
                escapeCsv(transaction.getId()),
                escapeCsv(transaction.getType()),
                escapeCsv(transaction.getAmount()),
                escapeCsv(transaction.getSourceUserId()),
                escapeCsv(transaction.getReferenceType()),
                escapeCsv(transaction.getReferenceId()),
                escapeCsv(transaction.getOperationKey()),
                escapeCsv(transaction.getCreatedAt()));
    }

    private String escapeCsv(Object value) {
        if (value == null) {
            return "";
        }
        String text = String.valueOf(value);
        if (text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r")) {
            return "\"" + text.replace("\"", "\"\"") + "\"";
        }
        return text;
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

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
