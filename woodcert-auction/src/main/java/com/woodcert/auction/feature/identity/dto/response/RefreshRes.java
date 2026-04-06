package com.woodcert.auction.feature.identity.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Refresh token response DTO — new pair of tokens after refresh.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record RefreshRes(
        String accessToken,
        String refreshToken
) {
}
