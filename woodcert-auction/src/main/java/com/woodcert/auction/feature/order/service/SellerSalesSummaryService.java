package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.feature.order.dto.response.SellerSalesSummaryRes;
import com.woodcert.auction.feature.order.entity.OrderEntity;
import com.woodcert.auction.feature.order.entity.OrderStatus;
import com.woodcert.auction.feature.order.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class SellerSalesSummaryService {

    private final OrderRepository orderRepository;
    private final OrderFeeCalculator feeCalculator;

    public SellerSalesSummaryService(OrderRepository orderRepository, OrderFeeCalculator feeCalculator) {
        this.orderRepository = orderRepository;
        this.feeCalculator = feeCalculator;
    }

    @Transactional(readOnly = true)
    public SellerSalesSummaryRes getSellerSalesSummary(String sellerId, String rangeValue) {
        SellerSalesRange range = SellerSalesRange.fromApiValue(rangeValue);
        Instant now = Instant.now();
        List<OrderEntity> orders = new ArrayList<>(range == SellerSalesRange.ALL
                ? orderRepository.findAllSellerRealizedOrders(sellerId, OrderStatus.COMPLETED)
                : orderRepository.findSellerRealizedOrders(
                        sellerId,
                        OrderStatus.COMPLETED,
                        range.from(now)));

        BigDecimal grossSales = moneyZero();
        BigDecimal platformCommission = moneyZero();
        BigDecimal sellerPayout = moneyZero();
        BigDecimal forfeitedIncome = moneyZero();
        long completedOrders = 0L;
        Map<LocalDate, DailyAccumulator> daily = new LinkedHashMap<>();
        ZoneId businessZone = ZoneId.of("Asia/Ho_Chi_Minh");

        orders.sort((left, right) -> realizedAt(left).compareTo(realizedAt(right)));
        for (OrderEntity order : orders) {
            LocalDate date = realizedAt(order).atZone(businessZone).toLocalDate();
            DailyAccumulator accumulator = daily.computeIfAbsent(date, ignored -> new DailyAccumulator());
            if (order.getStatus() == OrderStatus.COMPLETED) {
                completedOrders++;
                grossSales = grossSales.add(money(order.getFinalPrice()));
                platformCommission = platformCommission.add(money(order.getPlatformCommissionAmount()));
                sellerPayout = sellerPayout.add(money(order.getSellerPayoutAmount()));
                accumulator.grossSales = accumulator.grossSales.add(money(order.getFinalPrice()));
                accumulator.platformCommission =
                        accumulator.platformCommission.add(money(order.getPlatformCommissionAmount()));
                accumulator.sellerPayout = accumulator.sellerPayout.add(money(order.getSellerPayoutAmount()));
            }
            BigDecimal forfeited = money(order.getForfeitedDepositSellerAmount());
            forfeitedIncome = forfeitedIncome.add(forfeited);
            accumulator.forfeitedIncome = accumulator.forfeitedIncome.add(forfeited);
        }

        List<SellerSalesSummaryRes.DailySales> dailySales = daily.entrySet().stream()
                .map(entry -> {
                    DailyAccumulator value = entry.getValue();
                    return new SellerSalesSummaryRes.DailySales(
                            entry.getKey(),
                            value.grossSales,
                            value.platformCommission,
                            value.sellerPayout,
                            value.forfeitedIncome,
                            value.sellerPayout.add(value.forfeitedIncome));
                })
                .toList();

        return new SellerSalesSummaryRes(
                range.apiValue(),
                grossSales,
                platformCommission,
                sellerPayout,
                forfeitedIncome,
                sellerPayout.add(forfeitedIncome),
                completedOrders,
                dailySales
        );
    }

    private Instant realizedAt(OrderEntity order) {
        if (order.getStatus() == OrderStatus.COMPLETED && order.getCompletedAt() != null) {
            return order.getCompletedAt();
        }
        if (order.getCanceledAt() != null) {
            return order.getCanceledAt();
        }
        return order.getUpdatedAt() != null ? order.getUpdatedAt() : order.getCreatedAt();
    }

    private BigDecimal money(BigDecimal value) {
        return feeCalculator.money(value);
    }

    private BigDecimal moneyZero() {
        return feeCalculator.money(BigDecimal.ZERO);
    }

    private static class DailyAccumulator {
        private BigDecimal grossSales = BigDecimal.ZERO.setScale(2);
        private BigDecimal platformCommission = BigDecimal.ZERO.setScale(2);
        private BigDecimal sellerPayout = BigDecimal.ZERO.setScale(2);
        private BigDecimal forfeitedIncome = BigDecimal.ZERO.setScale(2);
    }
}
