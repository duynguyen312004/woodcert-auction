package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Authentication response DTO — returned after login/refresh.
 * Matches API_SPEC.md login response structure.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AuthRes(
        String accessToken,
        String refreshToken,
        List<String> roles
) {
}
