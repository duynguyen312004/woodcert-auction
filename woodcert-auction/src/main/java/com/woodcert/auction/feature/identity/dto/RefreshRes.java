package com.woodcert.auction.feature.identity.dto;

/**
 * Refresh token response DTO — new pair of tokens after refresh.
 */
public record RefreshRes(
        String accessToken,
        String refreshToken
) {
}
