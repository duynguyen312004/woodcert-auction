package com.woodcert.auction.feature.order.service;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class OrderFeeCalculator {

    private static final BigDecimal FIFTY_MILLION = new BigDecimal("50000000.00");
    private static final BigDecimal TWO_HUNDRED_MILLION = new BigDecimal("200000000.00");
    private static final BigDecimal RATE_FIVE_PERCENT = new BigDecimal("0.0500");
    private static final BigDecimal RATE_FOUR_PERCENT = new BigDecimal("0.0400");
    private static final BigDecimal RATE_THREE_PERCENT = new BigDecimal("0.0300");

    public BigDecimal commissionRate(BigDecimal finalPrice) {
        BigDecimal price = money(finalPrice);
        if (price.compareTo(FIFTY_MILLION) <= 0) {
            return RATE_FIVE_PERCENT;
        }
        if (price.compareTo(TWO_HUNDRED_MILLION) <= 0) {
            return RATE_FOUR_PERCENT;
        }
        return RATE_THREE_PERCENT;
    }

    public BigDecimal commissionAmount(BigDecimal finalPrice, BigDecimal rate) {
        return money(money(finalPrice).multiply(rate));
    }

    public BigDecimal money(BigDecimal amount) {
        if (amount == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return amount.setScale(2, RoundingMode.HALF_UP);
    }
}
