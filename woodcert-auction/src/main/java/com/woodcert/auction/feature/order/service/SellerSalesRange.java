package com.woodcert.auction.feature.order.service;

import com.woodcert.auction.core.exception.AppException;
import com.woodcert.auction.core.exception.ErrorCode;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

public enum SellerSalesRange {
    DAYS_7("7D", 7),
    DAYS_30("30D", 30),
    DAYS_90("90D", 90),
    ALL("ALL", null);

    private final String apiValue;
    private final Integer days;

    SellerSalesRange(String apiValue, Integer days) {
        this.apiValue = apiValue;
        this.days = days;
    }

    public String apiValue() {
        return apiValue;
    }

    public Instant from(Instant now) {
        return days == null ? null : now.minus(days, ChronoUnit.DAYS);
    }

    public static SellerSalesRange fromApiValue(String value) {
        String normalized = value == null || value.isBlank() ? "30D" : value.trim().toUpperCase();
        for (SellerSalesRange range : values()) {
            if (range.apiValue.equals(normalized)) {
                return range;
            }
        }
        throw new AppException(ErrorCode.INVALID_REQUEST, "Sales range must be one of 7D, 30D, 90D, ALL");
    }
}
