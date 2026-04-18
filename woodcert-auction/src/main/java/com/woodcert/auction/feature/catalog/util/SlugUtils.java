package com.woodcert.auction.feature.catalog.util;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Utility for generating URL-safe slugs from Vietnamese (Unicode) text.
 * Example: "Tượng Gỗ Phong Thủy" → "tuong-go-phong-thuy"
 */
public final class SlugUtils {

    private SlugUtils() {
    }

    /**
     * Generate a slug from the given text.
     * Steps:
     * 1. Normalize Unicode (NFD) to separate diacritical marks
     * 2. Replace đ/Đ with d/D (special Vietnamese handling before mark removal)
     * 3. Remove combining diacritical marks
     * 4. Lowercase, trim, replace non-alphanumeric with hyphen
     * 5. Collapse multiple hyphens, strip leading/trailing hyphens
     */
    public static String toSlug(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }

        // Handle đ/Đ before NFD normalization (they don't have decomposable forms)
        String result = text.replace('đ', 'd').replace('Đ', 'D');

        // NFD normalization: decompose characters (e.g. ê → e + combining circumflex)
        result = Normalizer.normalize(result, Normalizer.Form.NFD);

        // Remove combining diacritical marks (Unicode block \p{M})
        result = result.replaceAll("\\p{M}", "");

        // Lowercase
        result = result.toLowerCase(Locale.ROOT);

        // Replace non-alphanumeric characters with hyphens
        result = result.replaceAll("[^a-z0-9]+", "-");

        // Collapse multiple hyphens and strip leading/trailing
        result = result.replaceAll("-{2,}", "-");
        result = result.replaceAll("^-|-$", "");

        return result;
    }
}
