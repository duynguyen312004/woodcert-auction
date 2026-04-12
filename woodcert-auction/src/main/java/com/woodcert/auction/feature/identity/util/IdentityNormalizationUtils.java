package com.woodcert.auction.feature.identity.util;

import java.util.Locale;

public final class IdentityNormalizationUtils {

    private IdentityNormalizationUtils() {
    }

    public static String normalizeNullable(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    public static String normalizeEmail(String value) {
        String normalized = normalizeNullable(value);
        return normalized == null ? null : normalized.toLowerCase(Locale.ROOT);
    }

    public static String normalizeVietnamesePhoneNullable(String value) {
        String normalized = normalizeNullable(value);
        if (normalized == null) {
            return null;
        }

        if (normalized.startsWith("+84")) {
            return "0" + normalized.substring(3);
        }

        return normalized;
    }

    public static String normalizeProvinceCode(String value) {
        return leftPadDigits(value, 2);
    }

    public static String normalizeDistrictCode(String value) {
        return leftPadDigits(value, 3);
    }

    public static String normalizeWardCode(String value) {
        return leftPadDigits(value, 5);
    }

    private static String leftPadDigits(String value, int targetLength) {
        String normalized = normalizeNullable(value);
        if (normalized == null || normalized.length() >= targetLength) {
            return normalized;
        }

        return "0".repeat(targetLength - normalized.length()) + normalized;
    }
}
