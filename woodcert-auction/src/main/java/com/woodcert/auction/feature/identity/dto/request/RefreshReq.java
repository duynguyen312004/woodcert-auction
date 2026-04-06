package com.woodcert.auction.feature.identity.dto.request;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Refresh token request DTO — for mobile clients that send refresh token in body.
 * Web/SPA clients use HttpOnly cookie instead (handled separately in controller).
 */
public record RefreshReq(
        @Size(max = 255, message = "Refresh token must not exceed 255 characters")
        @Pattern(regexp = IdentityRequestPatterns.TOKEN_OR_BLANK, message = "Refresh token has invalid format")
        String refreshToken
) {
}
