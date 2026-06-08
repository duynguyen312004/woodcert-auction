package com.woodcert.auction.feature.order.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record SellerSalesSummaryRes(
        String range,
        BigDecimal grossSales,
        BigDecimal platformCommission,
        BigDecimal sellerPayout,
        BigDecimal forfeitedDepositIncome,
        BigDecimal totalRealizedIncome,
        long completedOrders,
        List<DailySales> daily
) {
    public record DailySales(
            LocalDate date,
            BigDecimal grossSales,
            BigDecimal platformCommission,
            BigDecimal sellerPayout,
            BigDecimal forfeitedDepositIncome,
            BigDecimal totalRealizedIncome
    ) {
    }
}
