package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.feature.order.entity.OrderEntity;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class OrderRefundCalculator {

    private final OrderFeeCalculator feeCalculator;

    public OrderRefundCalculator(OrderFeeCalculator feeCalculator) {
        this.feeCalculator = feeCalculator;
    }

    public BigDecimal disputeBuyerRefundAmount(OrderEntity order) {
        BigDecimal deposit = feeCalculator.money(order.getDepositAmount());
        BigDecimal remaining = feeCalculator.money(order.getRemainingAmount());
        return feeCalculator.money(deposit.add(remaining));
    }
}
