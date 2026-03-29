package com.woodcert.auction.feature.identity.dto;

/**
 * Refresh token request DTO — for mobile clients that send refresh token in body.
 * Web/SPA clients use HttpOnly cookie instead (handled separately in controller).
 */
public record RefreshReq(
        String refreshToken
) {
}
