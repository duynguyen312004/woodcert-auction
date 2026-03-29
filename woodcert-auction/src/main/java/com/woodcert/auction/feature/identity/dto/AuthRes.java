package com.woodcert.auction.feature.identity.dto;

import java.util.List;

/**
 * Authentication response DTO — returned after login/refresh.
 * Matches API_SPEC.md login response structure.
 */
public record AuthRes(
        String accessToken,
        String refreshToken,
        List<String> roles
) {
}
