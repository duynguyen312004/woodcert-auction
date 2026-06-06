package com.woodcert.auction.feature.finance.support;

import java.util.Objects;

/**
 * Validated idempotency key for wallet and platform-revenue mutations.
 */
public record FinanceOperationKey(String value) {

    public static final int MAX_LENGTH = 160;

    public FinanceOperationKey {
        value = normalize(value);
    }

    public static FinanceOperationKey of(String value) {
        return new FinanceOperationKey(value);
    }

    private static String normalize(String value) {
        String normalized = Objects.requireNonNull(value, "Finance operation key is required").trim();
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("Finance operation key is required");
        }
        if (normalized.length() > MAX_LENGTH) {
            throw new IllegalArgumentException(
                    "Finance operation key must not exceed " + MAX_LENGTH + " characters");
        }
        return normalized;
    }
}
